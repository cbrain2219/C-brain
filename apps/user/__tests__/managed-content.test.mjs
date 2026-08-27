import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { register } from "node:module";
import test from "node:test";

const serverOnlyModule = `data:text/javascript,${encodeURIComponent("export {};")}`;
register(
  `data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: ${JSON.stringify(serverOnlyModule)}, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts")) {
    const { readFile } = await import("node:fs/promises");
    const { stripTypeScriptTypes } = await import("node:module");
    return {
      format: "module",
      shortCircuit: true,
      source: stripTypeScriptTypes(await readFile(new URL(url), "utf8"), { mode: "transform" }),
    };
  }
  return nextLoad(url, context);
}`)}`,
  import.meta.url,
);

const { getManagedContentRenderDecision } = await import(
  "../lib/managedContentRendering.ts"
);
const { sanitizeRichContent } = await import("../lib/sanitizeRichContent.ts");

const componentUrl = new URL("../components/ManagedContent.tsx", import.meta.url);
const publicContentUrl = new URL("../lib/publicContent.ts", import.meta.url);
const blogUrl = new URL("../app/(site)/blog/[slug]/page.tsx", import.meta.url);
const portfolioUrl = new URL(
  "../app/(site)/portfolio/[category]/[slug]/page.tsx",
  import.meta.url,
);
const noticeUrl = new URL(
  "../app/(site)/notice/[id]/_components/NoticeDetailArticle.tsx",
  import.meta.url,
);
const reviewUrl = new URL(
  "../app/(site)/customer-review/[slug]/page.tsx",
  import.meta.url,
);

test("managed content gates generated HTML by authoring mode and content mode", async () => {
  const source = await readFile(componentUrl, "utf8");

  assert.match(source, /type PublicManagedContent/);
  assert.match(source, /getManagedContentAssetBaseUrl/);
  assert.match(source, /getManagedContentRenderDecision/);
  assert.match(source, /sanitizeRichContent\(value\.content/);
  assert.match(source, /dangerouslySetInnerHTML/);
});

test("managed rendering decision keeps raw and markdown legacy-safe, then sanitizes WYSIWYG", () => {
  const base = {
    content: `<p>safe <img src="https://example.supabase.co/storage/v1/object/public/public-assets/content/blog/123e4567-e89b-42d3-a456-426614174000/images/f47ac10b-58cc-4372-a567-0e02b2c3d479.png" onerror="bad()" /></p>`,
    contentAssetScope: "123e4567-e89b-42d3-a456-426614174000",
    contentAuthoringMode: "wysiwyg",
    contentMode: "html",
    entity: "blog",
    title: "Title",
  };
  const supabaseUrl = "https://example.supabase.co";

  assert.deepEqual(getManagedContentRenderDecision(undefined, supabaseUrl), {
    kind: "legacy",
  });
  assert.deepEqual(
    getManagedContentRenderDecision(
      { ...base, contentAuthoringMode: "raw_html" },
      supabaseUrl,
    ),
    { kind: "legacy" },
  );
  assert.deepEqual(
    getManagedContentRenderDecision(
      { ...base, contentMode: "markdown" },
      supabaseUrl,
    ),
    { kind: "legacy" },
  );
  assert.deepEqual(
    getManagedContentRenderDecision(
      { ...base, contentAssetScope: "not-a-uuid" },
      supabaseUrl,
    ),
    { kind: "legacy" },
  );

  const decision = getManagedContentRenderDecision(base, supabaseUrl);
  assert.equal(decision.kind, "wysiwyg");
  if (decision.kind === "wysiwyg") {
    const result = sanitizeRichContent(base.content, {
      allowedImageBaseUrl: decision.allowedImageBaseUrl,
    });
    assert.match(result, /<p>safe <img/);
    assert.doesNotMatch(result, /onerror/);
  }
});

test("all public detail surfaces use the managed-content boundary", async () => {
  const [publicContent, blog, portfolio, notice, review] = await Promise.all([
    readFile(publicContentUrl, "utf8"),
    readFile(blogUrl, "utf8"),
    readFile(portfolioUrl, "utf8"),
    readFile(noticeUrl, "utf8"),
    readFile(reviewUrl, "utf8"),
  ]);

  assert.match(publicContent, /contentAssetScope: row\.content_asset_scope/);
  assert.match(publicContent, /contentAuthoringMode: row\.content_authoring_mode/);
  assert.match(publicContent, /contentMode: row\.content_mode/);
  assert.match(blog, /<ManagedContent/);
  assert.match(blog, /source\.contentAuthoringMode === "raw_html"/);
  assert.match(portfolio, /<ManagedContent/);
  assert.match(portfolio, /<RawHtmlDocumentFrame/);
  assert.match(notice, /<ManagedContent/);
  assert.match(review, /<ManagedContent/);
  assert.doesNotMatch(portfolio, /dangerouslySetInnerHTML/);
});
