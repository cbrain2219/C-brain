import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const canonicalPagePaths = [
  "../app/(site)/page.tsx",
  "../app/(site)/about/page.tsx",
  "../app/(site)/portfolio/page.tsx",
  "../app/(site)/portfolio/[category]/[slug]/page.tsx",
  "../app/(site)/customer-review/page.tsx",
  "../app/(site)/customer-review/[slug]/page.tsx",
  "../app/(site)/order/page.tsx",
  "../app/(site)/order/[category]/page.tsx",
  "../app/(site)/faq-guide/page.tsx",
  "../app/(site)/blog/page.tsx",
  "../app/(site)/blog/[slug]/page.tsx",
  "../app/(site)/report/page.tsx",
  "../app/(site)/notice/page.tsx",
  "../app/(site)/notice/[id]/page.tsx",
];

const retiredPagePaths = [
  "../app/(site)/reviews/page.tsx",
  "../app/(site)/faq/page.tsx",
  "../app/(site)/complaint/page.tsx",
  "../app/(site)/portfolio/[slug]/page.tsx",
];

test("public pages use the requested canonical URL segments without redirects", async () => {
  for (const path of canonicalPagePaths) {
    assert.equal(existsSync(new URL(path, import.meta.url)), true, path);
  }

  for (const path of retiredPagePaths) {
    assert.equal(existsSync(new URL(path, import.meta.url)), false, path);
  }

  const nextConfig = await readFile(
    new URL("../next.config.js", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(nextConfig, /\bredirects\s*[:(]/);
});
