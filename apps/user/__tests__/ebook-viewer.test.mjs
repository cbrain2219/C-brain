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

test("the public E-book page uses fixed C-Brain copy and an optional custom OG image", async () => {
  const [page, helper] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(helperPath, "utf8"),
  ]);

  assert.match(page, /generateMetadata/);
  assert.match(page, /alternates: \{ canonical: pageUrl \}/);
  assert.match(page, /description: ebook\.seo_description/);
  assert.match(page, /absolute: ebook\.title/);
  assert.match(page, /openGraph:/);
  assert.match(page, /twitter:/);
  assert.match(page, /url: pageUrl/);
  assert.match(page, /siteSeo\.defaultTitle/);
  assert.match(page, /siteSeo\.defaultDescription/);
  assert.match(page, /ebook\.og_image_url/);
  assert.match(page, /ebook\.og_image_alt/);
  assert.match(page, /\/opengraph-image\.png/);
  assert.match(helper, /getPublicAssetUrl\(client, ebook\.og_image_path\)/);
});

test("the E-book preview uses the stored embed without public canonical metadata", async () => {
  const preview = await readFile(previewPath, "utf8");

  assert.match(preview, /getPublicEbook\(slug\)/);
  assert.match(preview, /src=\{ebook\.embed_url\}/);
  assert.match(preview, /robots: \{ follow: false, index: false \}/);
  assert.doesNotMatch(preview, /canonical/);
});
