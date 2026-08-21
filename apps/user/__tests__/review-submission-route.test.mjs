import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routePath = new URL(
  "../app/api/review-submissions/route.ts",
  import.meta.url,
);

test("public review route validates unknown JSON and stores through the server-only draft helper", async () => {
  const source = await readFile(routePath, "utf8");

  assert.match(source, /export const runtime = "nodejs"/);
  assert.match(source, /await request\.json\(\)/);
  assert.match(source, /parseReviewSubmission\(input\)/);
  assert.match(source, /createAdminSupabaseClient\(\)/);
  assert.match(source, /createReviewSubmissionDraft\(/);
  assert.match(source, /toReviewSubmissionDraftInput\(submission\.values\)/);
  assert.match(source, /\{ id: review\.id \},\s*\{ status: 201 \}/);
  assert.match(source, /\{ status: 400 \}/);
  assert.match(source, /\{ status: 500 \}/);
  assert.doesNotMatch(
    source,
    /submission\.values\.(?:kind|status|showOnLanding|show_on_landing)/,
  );
  assert.doesNotMatch(source, /SUPABASE_SECRET_KEY/);
});
