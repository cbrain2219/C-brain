import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const contentViewsModuleUrl = new URL("../lib/contentViews.ts", import.meta.url)
  .href;
const trackerPath = new URL(
  "../app/_components/ContentViewTracker.tsx",
  import.meta.url,
);
const routePath = new URL("../app/api/views/route.ts", import.meta.url);

test("content view requests accept only tracked detail types and UUID ids", async () => {
  const check = `
    import assert from "node:assert/strict";
    const { parseContentViewRequest } = await import(${JSON.stringify(contentViewsModuleUrl)});
    const contentId = "00000000-0000-4000-8000-000000000123";

    for (const contentType of ["blog", "portfolio", "interview"]) {
      assert.deepEqual(parseContentViewRequest({ contentId, contentType }), {
        contentId,
        contentType,
      });
    }

    assert.equal(parseContentViewRequest({ contentId, contentType: "testimonial" }), null);
    assert.equal(parseContentViewRequest({ contentId: "not-a-uuid", contentType: "blog" }), null);
    assert.equal(parseContentViewRequest(null), null);
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    { env: { ...process.env, NODE_NO_WARNINGS: "1" } },
  );
});

test("the client tracker records one best-effort view per tab session", async () => {
  const source = await readFile(trackerPath, "utf8");

  assert.match(source, /^"use client";/);
  assert.match(source, /window\.sessionStorage\.getItem\(key\)/);
  assert.match(source, /window\.sessionStorage\.setItem\(key, "pending"\)/);
  assert.match(source, /trackedContentViews\.has\(key\)/);
  assert.match(source, /fetch\("\/api\/views"/);
  assert.match(source, /keepalive: true/);
  assert.match(source, /removeSessionView\(key\)/);
  assert.match(source, /return null;/);
});

test("the server route validates input and records views with the server-only client", async () => {
  const source = await readFile(routePath, "utf8");

  assert.match(source, /parseContentViewRequest\(payload\)/);
  assert.match(source, /createAdminSupabaseClient\(\)/);
  assert.match(source, /client\.rpc\("increment_content_view"/);
  assert.match(source, /p_content_id: view\.contentId/);
  assert.match(source, /p_content_type: view\.contentType/);
  assert.match(source, /status: 204/);
  assert.match(source, /status: 400/);
  assert.match(source, /"Cache-Control": "no-store"/);
  assert.doesNotMatch(source, /SUPABASE_(?:SECRET|SERVICE_ROLE)/);
});

test("all viewable public detail pages mount the shared tracker", async () => {
  const detailPages = [
    ["../app/(site)/blog/[slug]/page.tsx", "post.id", "blog"],
    [
      "../app/(site)/portfolio/[category]/[slug]/page.tsx",
      "item.id",
      "portfolio",
    ],
    [
      "../app/(site)/customer-review/[slug]/page.tsx",
      "detail.id",
      "interview",
    ],
  ];

  for (const [path, idExpression, contentType] of detailPages) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    const escapedId = idExpression.replace(".", "\\.");

    assert.match(source, /import \{ ContentViewTracker \}/);
    assert.match(
      source,
      new RegExp(
        `<ContentViewTracker contentId=\\{${escapedId}\\} contentType="${contentType}" \\/>`,
      ),
    );
  }
});
