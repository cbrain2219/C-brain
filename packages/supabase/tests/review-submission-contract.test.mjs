import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

import { createReviewSubmissionDraft } from "../src/reviews.ts";

const migrationUrl = new URL(
  "../../../supabase/migrations/20260821025443_add_review_rating.sql",
  import.meta.url,
);
const initialSchemaUrl = new URL(
  "../../../supabase/initial_admin_content.sql",
  import.meta.url,
);
const typesUrl = new URL("../src/types.ts", import.meta.url);

test("review rating schema is nullable, constrained to 1-5, and readable after publication", async () => {
  const [migration, initialSchema, types] = await Promise.all([
    readFile(migrationUrl, "utf8"),
    readFile(initialSchemaUrl, "utf8"),
    readFile(typesUrl, "utf8"),
  ]);

  assert.match(migration, /add column if not exists rating smallint/);
  assert.match(migration, /rating is null\s+or rating between 1 and 5/);
  assert.match(migration, /grant select \(rating\) on table public\.reviews to anon/);
  assert.match(initialSchema, /rating smallint/);
  assert.match(initialSchema, /reviews_rating_range_check/);
  assert.match(types, /Row:\s*\{[\s\S]*?rating: number \| null;/);
  assert.match(types, /Insert:\s*\{[\s\S]*?rating\?: number \| null;/);
  assert.match(types, /Update:\s*\{[\s\S]*?rating\?: number \| null;/);
});

test("public review persistence overrides client-controlled publication fields", async () => {
  const startedAt = Date.now();
  let insertedTable = "";
  let insertedValue;
  let selectedColumns = "";
  const client = {
    from(table) {
      insertedTable = table;

      return {
        insert(value) {
          insertedValue = value;

          return {
            select(columns) {
              selectedColumns = columns;

              return {
                async single() {
                  return {
                    data: { id: "review-id", status: "draft" },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const result = await createReviewSubmissionDraft(client, {
    company_name: "씨브레인 고객사",
    content: "<p>좋은 경험이었습니다.</p>",
    content_authoring_mode: "wysiwyg",
    content_json: {
      content: [
        {
          content: [{ text: "좋은 경험이었습니다.", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    },
    content_mode: "html",
    content_schema_version: 1,
    created_at: "2000-01-01T00:00:00.000Z",
    kind: "interview",
    manager_name: "김담당 팀장",
    product_type: "브로슈어 · 카탈로그",
    published_at: "2000-01-01T00:00:00.000Z",
    rating: 5,
    show_on_landing: true,
    status: "published",
  });
  const finishedAt = Date.now();

  assert.equal(insertedTable, "reviews");
  assert.equal(selectedColumns, "id, status");
  assert.deepEqual(
    {
      kind: insertedValue.kind,
      show_on_landing: insertedValue.show_on_landing,
      status: insertedValue.status,
    },
    {
      kind: "testimonial",
      show_on_landing: false,
      status: "draft",
    },
  );
  const createdAt = Date.parse(insertedValue.created_at);
  assert.ok(createdAt >= startedAt && createdAt <= finishedAt);
  assert.equal(insertedValue.published_at, insertedValue.created_at);
  assert.deepEqual(result, { id: "review-id", status: "draft" });
});
