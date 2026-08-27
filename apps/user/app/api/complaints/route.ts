import {
  createAdminSupabaseClient,
  createComplaint,
  createComplaintAttachments,
  getFileInfo,
  STORAGE_BUCKETS,
} from "@repo/supabase";
import { NextResponse } from "next/server";

import {
  parseComplaintSubmission,
  toComplaintInput,
} from "../../(site)/report/complaintSubmission";
import { sendComplaintAlimtalk } from "../../../lib/complaintAlimtalk";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "접수 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const submission = parseComplaintSubmission(input);

  if (!submission.ok) {
    return NextResponse.json({ error: submission.error }, { status: 400 });
  }

  const uploadedPaths = submission.attachments.map(({ path }) => path);
  let complaintId: string | null = null;
  let failureMessage =
    "접수 저장에 실패했습니다. 잠시 후 다시 시도해주세요.";
  let failureStatus = 500;

  try {
    const client = createAdminSupabaseClient();
    const storedAttachments = await Promise.all(
      submission.attachments.map(async (attachment) => ({
        attachment,
        info: await getFileInfo(
          client,
          STORAGE_BUCKETS.privateAttachments,
          attachment.path,
        ),
      })),
    );
    const hasInvalidObject = storedAttachments.some(
      ({ attachment, info }) =>
        info.size !== attachment.size ||
        info.contentType !== attachment.type,
    );

    if (hasInvalidObject) {
      failureMessage = "업로드된 첨부 파일 정보가 올바르지 않습니다.";
      failureStatus = 400;
      throw new Error(failureMessage);
    }

    const complaint = await createComplaint(client, {
      ...toComplaintInput(submission.values, new Date().toISOString()),
      id: submission.submissionId,
    });
    complaintId = complaint.id;

    await createComplaintAttachments(
      client,
      submission.attachments.map((attachment) => ({
        bucket_id: STORAGE_BUCKETS.privateAttachments,
        complaint_id: complaint.id,
        content_type: attachment.type,
        file_size: attachment.size,
        object_path: attachment.path,
        original_file_name: attachment.name,
      })),
    );

    try {
      const receiptNumber = await sendComplaintAlimtalk({
        complaintType: complaint.complaint_type,
        createdAt: complaint.created_at,
        email: complaint.email ?? "",
        id: complaint.id,
        name: complaint.name,
        phone: complaint.phone,
        service: complaint.service,
      });

      console.info("[complaint-alimtalk] accepted", {
        complaintId: complaint.id,
        receiptNumber,
      });
    } catch (error) {
      console.error("[complaint-alimtalk] failed", {
        complaintId: complaint.id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return NextResponse.json({ id: complaint.id }, { status: 201 });
  } catch {
    try {
      const cleanupClient = createAdminSupabaseClient();

      if (complaintId) {
        const { error: deleteError } = await cleanupClient
          .from("complaints")
          .delete()
          .eq("id", complaintId);

        if (deleteError) throw deleteError;
      }

      if (uploadedPaths.length > 0) {
        const { error: removeError } = await cleanupClient.storage
          .from(STORAGE_BUCKETS.privateAttachments)
          .remove(uploadedPaths);

        if (removeError) throw removeError;
      }
    } catch {
      // Best-effort cleanup; the original persistence error is returned below.
    }

    return NextResponse.json(
      { error: failureMessage },
      { status: failureStatus },
    );
  }
}
