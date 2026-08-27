import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/(ebook)/[slug]/page.tsx", import.meta.url);
const previewPath = new URL(
  "../app/(ebook)/ebook-preview/[slug]/page.tsx",
  import.meta.url,
);
const helperPath = new URL("../lib/publicEbooks.ts", import.meta.url);

test("the public E-book slug renders the stored HTTPS embed without the site shell", async () => {
  const [page, helper] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(helperPath, "utf8"),
  ]);

  assert.match(page, /process\.env\.NEXT_PUBLIC_EBOOK_URL/);
  assert.match(page, /https:\/\/ebook\.cbrain\.kr/);
  assert.match(page, /src=\{ebook\.embed_url\}/);
  assert.match(page, /<iframe/);
  assert.match(page, /allowFullScreen/);
  assert.match(page, /notFound\(\)/);
  assert.doesNotMatch(page, /<Header|<Footer/);
  assert.match(helper, /getPublishedEbook\(client, slug\)/);
});

test("the public E-book page uses dynamic copy and the fixed C-Brain social image", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /generateMetadata/);
  assert.match(page, /alternates: \{ canonical: pageUrl \}/);
  assert.match(page, /description: ebook\.seo_description/);
  assert.match(page, /title: ebook\.title/);
  assert.match(page, /openGraph:/);
  assert.match(page, /twitter:/);
  assert.match(page, /url: pageUrl/);
  assert.match(page, /\/opengraph-image\.png/);
  assert.doesNotMatch(page, /cover_url|cover_path|cover_alt/);
});

test("the E-book preview uses the stored embed without public canonical metadata", async () => {
  const preview = await readFile(previewPath, "utf8");

  assert.match(preview, /getPublicEbook\(slug\)/);
  assert.match(preview, /src=\{ebook\.embed_url\}/);
  assert.match(preview, /robots: \{ follow: false, index: false \}/);
  assert.doesNotMatch(preview, /canonical/);
});
