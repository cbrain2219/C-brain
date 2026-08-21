import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import test from "node:test";

const submissionPath = new URL(
  "../app/reviews/request/reviewSubmission.ts",
  import.meta.url,
);
const categoriesPath = new URL(
  "../../../packages/supabase/src/categories.ts",
  import.meta.url,
);

async function importSubmissionModule() {
  const [categoriesSource, submissionSource] = await Promise.all([
    readFile(categoriesPath, "utf8"),
    readFile(submissionPath, "utf8"),
  ]);
  const source = `${categoriesSource}\n${submissionSource.replace(
    /import(?: type)? \{[\s\S]*?\} from "(?:@repo\/supabase\/categories|@repo\/supabase\/types)";\n/g,
    "",
  )}`;
  const ts = await import("typescript");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}

function validValues() {
  return {
    companyName: "씨브레인 고객사",
    content: "빠르고 정확한 제작이었습니다.",
    managerName: "김담당 팀장",
    productType: "브로슈어 · 카탈로그",
    rating: 5,
  };
}

test("review submission accepts only canonical customer fields and trims text", async () => {
  const { parseReviewSubmission, reviewProductTypeOptions } =
    await importSubmissionModule();
  const parsed = parseReviewSubmission({
    ...validValues(),
    companyName: "  씨브레인 고객사  ",
    content: "  빠르고 정확한 제작이었습니다.  ",
    kind: "interview",
    managerName: "  김담당 팀장  ",
    showOnLanding: true,
    status: "published",
  });

  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.values, validValues());
  assert.deepEqual(reviewProductTypeOptions.slice(-2), ["기타", "없음"]);
});

test("review submission rejects unknown categories, invalid ratings, and bad text bounds", async () => {
  const { parseReviewSubmission, validateReviewSubmission } =
    await importSubmissionModule();

  for (const value of [
    { ...validValues(), productType: "서버에만 있는 분류" },
    { ...validValues(), rating: 0 },
    { ...validValues(), rating: 6 },
    { ...validValues(), rating: 4.5 },
    { ...validValues(), companyName: "" },
    { ...validValues(), managerName: "" },
    { ...validValues(), content: "" },
    { ...validValues(), companyName: "가".repeat(101) },
    { ...validValues(), managerName: "가".repeat(101) },
    { ...validValues(), content: "가".repeat(20_001) },
  ]) {
    assert.equal(parseReviewSubmission(value).ok, false);
  }

  assert.match(
    validateReviewSubmission({ ...validValues(), rating: 0 }),
    /필수 항목/,
  );
  assert.equal(parseReviewSubmission(null).ok, false);
  assert.equal(parseReviewSubmission([]).ok, false);
});

test("review submission converts plain text into escaped WYSIWYG content", async () => {
  const { parseReviewSubmission, toReviewSubmissionDraftInput } =
    await importSubmissionModule();
  const parsed = parseReviewSubmission({
    ...validValues(),
    content: "<좋았어요>\n빠른 & 정확한 제작",
  });

  assert.equal(parsed.ok, true);

  const input = toReviewSubmissionDraftInput(parsed.values);

  assert.equal(
    input.content,
    "<p>&lt;좋았어요&gt;</p><p>빠른 &amp; 정확한 제작</p>",
  );
  assert.deepEqual(input.content_json, {
    content: [
      {
        content: [{ text: "<좋았어요>", type: "text" }],
        type: "paragraph",
      },
      {
        content: [{ text: "빠른 & 정확한 제작", type: "text" }],
        type: "paragraph",
      },
    ],
    type: "doc",
  });
  assert.equal(input.content_authoring_mode, "wysiwyg");
  assert.equal(input.content_mode, "html");
  assert.equal(input.content_schema_version, 1);
  assert.equal(input.rating, 5);
  assert.equal("kind" in input, false);
  assert.equal("status" in input, false);
  assert.equal("show_on_landing" in input, false);
});
