import {
  createAdminSupabaseClient,
  createInquiry,
  createInquiryAttachments,
  getFileInfo,
  STORAGE_BUCKETS,
} from "@repo/supabase";
import { NextResponse } from "next/server";

import {
  parseComplaintSubmission,
  toComplaintInquiryInput,
} from "../../(site)/complaint/complaintSubmission";

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
  let inquiryId: string | null = null;
  let failureMessage =
    "접수 저장에 실패했습니다. 잠시 후 다시 시도해주세요.";
  let failureStatus = 500;

  try {
    const client = createAdminSupabaseClient();
    const inquiry = await createInquiry(client, {
      ...toComplaintInquiryInput(
        submission.values,
        new Date().toISOString(),
      ),
      id: submission.submissionId,
    });
    inquiryId = inquiry.id;
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

    await createInquiryAttachments(
      client,
      submission.attachments.map((attachment) => ({
        bucket: STORAGE_BUCKETS.privateAttachments,
        content_type: attachment.type,
        file_name: attachment.name,
        file_size: attachment.size,
        inquiry_id: inquiry.id,
        path: attachment.path,
      })),
    );

    return NextResponse.json({ id: inquiry.id }, { status: 201 });
  } catch {
    try {
      const cleanupClient = createAdminSupabaseClient();

      if (inquiryId) {
        const { error: deleteError } = await cleanupClient
          .from("inquiries")
          .delete()
          .eq("id", inquiryId);

        if (deleteError) throw deleteError;

        if (uploadedPaths.length > 0) {
          const { error: removeError } = await cleanupClient.storage
            .from(STORAGE_BUCKETS.privateAttachments)
            .remove(uploadedPaths);

          if (removeError) throw removeError;
        }
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
