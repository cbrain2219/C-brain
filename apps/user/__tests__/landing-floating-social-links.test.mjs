import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL(
  "../app/_components/FloatingSocialLinks.tsx",
  import.meta.url,
);
const pageUrl = new URL("../app/(site)/page.tsx", import.meta.url);
const stylesUrl = new URL(
  "../app/_components/FloatingSocialLinks.module.css",
  import.meta.url,
);
const listingPageUrls = [
  "../app/(site)/about/page.tsx",
  "../app/(site)/portfolio/page.tsx",
  "../app/(site)/customer-review/page.tsx",
  "../app/(site)/faq-guide/page.tsx",
  "../app/(site)/blog/page.tsx",
  "../app/(site)/notice/page.tsx",
].map((path) => new URL(path, import.meta.url));
const detailPageUrls = [
  "../app/(site)/portfolio/[category]/[slug]/page.tsx",
  "../app/(site)/customer-review/[slug]/page.tsx",
  "../app/(site)/blog/[slug]/page.tsx",
  "../app/(site)/notice/[id]/page.tsx",
].map((path) => new URL(path, import.meta.url));

test("landing reuses footer social links in the fixed Figma rail", async () => {
  const [component, page, styles] = await Promise.all([
    readFile(componentUrl, "utf8"),
    readFile(pageUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
  ]);

  assert.match(page, /<FloatingSocialLinks \/>/);
  assert.match(component, /companySocialLinks/);
  assert.match(component, /"instagram",\s*"naverBlog",\s*"youtube"/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /target="_blank"/);
  assert.match(styles, /position:\s*fixed/);
  assert.match(styles, /top:\s*66\.6667dvh/);
  assert.match(styles, /right:\s*0/);
  assert.match(styles, /width:\s*52px/);
  assert.match(styles, /height:\s*52px/);
  assert.match(styles, /gap:\s*4px/);
  assert.match(styles, /transform:\s*translateY\(-50%\)/);
});

test("floating social links appear on requested listings only", async () => {
  const [listingPages, detailPages] = await Promise.all([
    Promise.all(listingPageUrls.map((url) => readFile(url, "utf8"))),
    Promise.all(detailPageUrls.map((url) => readFile(url, "utf8"))),
  ]);

  listingPages.forEach((page) =>
    assert.match(page, /<FloatingSocialLinks \/>/),
  );
  detailPages.forEach((page) =>
    assert.doesNotMatch(page, /<FloatingSocialLinks \/>/),
  );
});
