import {
  createAdminSupabaseClient,
  createReviewSubmissionDraft,
} from "@repo/supabase";
import { NextResponse } from "next/server";

import {
  parseReviewSubmission,
  toReviewSubmissionDraftInput,
} from "../../reviews/request/reviewSubmission";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "후기 제출 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const submission = parseReviewSubmission(input);

  if (!submission.ok) {
    return NextResponse.json({ error: submission.error }, { status: 400 });
  }

  try {
    const client = createAdminSupabaseClient();
    const review = await createReviewSubmissionDraft(
      client,
      toReviewSubmissionDraftInput(submission.values),
    );

    return NextResponse.json({ id: review.id }, { status: 201 });
  } catch (error) {
    console.error("[review-submission] failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "후기를 저장하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
