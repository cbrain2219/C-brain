import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ctaPath = new URL("../app/_components/CtaSection.tsx", import.meta.url);
const landingPagePath = new URL("../app/(site)/page.tsx", import.meta.url);
const stylesPath = new URL("../app/page.module.css", import.meta.url);

test("CTA section exposes reusable page-level content props", async () => {
  const ctaSource = await readFile(ctaPath, "utf8");

  assert.match(ctaSource, /type CtaSectionProps/);
  assert.match(ctaSource, /backgroundImage\?: string/);
  assert.match(ctaSource, /badge\?: ReactNode \| null/);
  assert.match(ctaSource, /description\?: ReactNode \| null/);
  assert.match(ctaSource, /id\?: string/);
  assert.match(ctaSource, /titleLines: readonly ReactNode\[\]/);
});

test("landing page passes the landing CTA content explicitly", async () => {
  const landingSource = await readFile(landingPagePath, "utf8");

  assert.match(landingSource, /<CtaSection/);
  assert.match(landingSource, /badge="지금 바로 시작하세요"/);
  assert.match(
    landingSource,
    /description="빠른 상담 · 전국 납품 · 소량부터 대량까지"/,
  );
  assert.match(landingSource, /id="contact"/);
  assert.match(landingSource, /실패 없는 홍보물 디자인 제작,/);
});

test("CTA background image can be overridden without changing shared styles", async () => {
  const ctaSource = await readFile(ctaPath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(ctaSource, /"--cta-background-image": `url\("\$\{backgroundImage\}"\)`/);
  assert.match(
    stylesSource,
    /\.ctaBackground\s*\{[\s\S]*background-image: var\(--cta-background-image\);/,
  );
});
