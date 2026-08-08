import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/not-found.tsx", import.meta.url);
const contentPath = new URL(
  "../app/_components/NotFoundContent.tsx",
  import.meta.url,
);
const sitePagePath = new URL(
  "../app/(site)/not-found.tsx",
  import.meta.url,
);
const stylesPath = new URL("../app/not-found.module.css", import.meta.url);

test("unknown public routes use the branded site 404 page", async () => {
  const [contentSource, pageSource, sitePageSource, stylesSource] =
    await Promise.all([
      readFile(contentPath, "utf8"),
      readFile(pagePath, "utf8"),
      readFile(sitePagePath, "utf8"),
      readFile(stylesPath, "utf8"),
    ]);

  assert.match(pageSource, /export default function NotFound\(\)/);
  assert.match(pageSource, /<Header \/>/);
  assert.match(pageSource, /<NotFoundContent \/>/);
  assert.match(pageSource, /<Footer \/>/);
  assert.match(sitePageSource, /export default function SiteNotFound\(\)/);
  assert.match(sitePageSource, /<NotFoundContent \/>/);
  assert.doesNotMatch(sitePageSource, /<Header \/>|<Footer \/>/);
  assert.match(contentSource, /페이지를 찾을 수 없습니다\./);
  assert.match(contentSource, /href="\/"/);
  assert.match(contentSource, /홈으로 돌아가기/);
  assert.match(stylesSource, /var\(--site-header-height\)/);
  assert.match(stylesSource, /var\(--landing-button-brand-fill\)/);
  assert.match(stylesSource, /font-size:\s*clamp\(112px, 24vw, 224px\)/);
  assert.match(stylesSource, /text-shadow:/);
});
