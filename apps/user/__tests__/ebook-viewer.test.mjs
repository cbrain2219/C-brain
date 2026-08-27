import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/(ebook)/[slug]/page.tsx", import.meta.url);
const previewPath = new URL(
  "../app/(ebook)/ebook-preview/[slug]/page.tsx",
  import.meta.url,
);
const helperPath = new URL("../lib/publicEbooks.ts", import.meta.url);
const metadataPath = new URL("../lib/ebookMetadata.ts", import.meta.url);

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

test("the public E-book page uses entered title, SEO copy, and an optional custom OG image", async () => {
  const [page, helper, metadata] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(helperPath, "utf8"),
    readFile(metadataPath, "utf8"),
  ]);

  assert.match(page, /generateMetadata/);
  assert.match(page, /alternates: \{ canonical: pageUrl \}/);
  assert.match(page, /url: pageUrl/);
  assert.match(page, /createEbookMetadata\(ebook/);
  assert.match(metadata, /description: ebook\.seo_description/);
  assert.match(metadata, /title: \{ absolute:/);
  assert.match(metadata, /openGraph:/);
  assert.match(metadata, /twitter:/);
  assert.match(
    metadata,
    /openGraph: \{[\s\S]*description: ebook\.seo_description,[\s\S]*title: ebook\.title/,
  );
  assert.match(
    metadata,
    /twitter: \{[\s\S]*description: ebook\.seo_description,[\s\S]*title: ebook\.title/,
  );
  assert.match(metadata, /ebook\.og_image_url/);
  assert.match(metadata, /ebook\.og_image_alt/);
  assert.match(metadata, /\/opengraph-image\.png/);
  assert.match(helper, /getPublicAssetUrl\(client, ebook\.og_image_path\)/);
});

test("the E-book preview shares the same OG card while remaining noindex", async () => {
  const [preview, metadata] = await Promise.all([
    readFile(previewPath, "utf8"),
    readFile(metadataPath, "utf8"),
  ]);

  assert.match(preview, /getPublicEbook\(slug\)/);
  assert.match(preview, /src=\{ebook\.embed_url\}/);
  assert.match(preview, /createEbookMetadata\(ebook/);
  assert.match(preview, /pageTitle: `\$\{ebook\.title\} 미리보기`/);
  assert.match(preview, /robots: \{ follow: false, index: false \}/);
  assert.doesNotMatch(preview, /canonical/);
  assert.match(metadata, /openGraph:/);
  assert.match(metadata, /twitter:/);
});
