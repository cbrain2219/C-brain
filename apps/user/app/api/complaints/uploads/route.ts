import {
  createAdminSupabaseClient,
  createSignedFileUpload,
  createStoragePath,
  STORAGE_BUCKETS,
} from "@repo/supabase";
import { NextResponse } from "next/server";

import {
  getComplaintUploadPrefix,
  parseComplaintCleanupRequest,
  parseComplaintUploadRequest,
} from "../../../(site)/complaint/complaintSubmission";

export const runtime = "nodejs";

const extensionByMimeType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export async function POST(request: Request) {
  const input = await readJson(request);
  const submission = parseComplaintUploadRequest(input);

  if (!submission.ok) {
    return NextResponse.json({ error: submission.error }, { status: 400 });
  }

  try {
    const client = createAdminSupabaseClient();
    const uploads = await Promise.all(
      submission.attachments.map(async (attachment) => {
        const extension =
          extensionByMimeType[
            attachment.type as keyof typeof extensionByMimeType
          ];
        const path = createStoragePath(
          getComplaintUploadPrefix(submission.submissionId),
          `attachment.${extension}`,
        );
        const { token } = await createSignedFileUpload(
          client,
          STORAGE_BUCKETS.privateAttachments,
          path,
        );

        return { path, token };
      }),
    );

    return NextResponse.json({ uploads });
  } catch {
    return NextResponse.json(
      { error: "첨부 파일 업로드 준비에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const input = await readJson(request);
  const cleanup = parseComplaintCleanupRequest(input);

  if (!cleanup.ok) {
    return NextResponse.json({ error: cleanup.error }, { status: 400 });
  }

  if (cleanup.paths.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const client = createAdminSupabaseClient();
    const { data: activeInquiry, error: inquiryError } = await client
      .from("inquiries")
      .select("id")
      .eq("id", cleanup.submissionId)
      .maybeSingle();

    if (inquiryError) throw inquiryError;
    if (activeInquiry) return new NextResponse(null, { status: 204 });

    const { data, error } = await client
      .from("inquiry_attachments")
      .select("path")
      .in("path", cleanup.paths);

    if (error) throw error;

    const referencedPaths = new Set(data.map(({ path }) => path));
    const orphanPaths = cleanup.paths.filter(
      (path) => !referencedPaths.has(path),
    );

    if (orphanPaths.length > 0) {
      const { error: removeError } = await client.storage
        .from(STORAGE_BUCKETS.privateAttachments)
        .remove(orphanPaths);

      if (removeError) throw removeError;
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "첨부 파일 정리에 실패했습니다." }, { status: 500 });
  }
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
