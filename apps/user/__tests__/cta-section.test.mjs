import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ctaPath = new URL("../app/_components/CtaSection.tsx", import.meta.url);
const landingPagePath = new URL("../app/(site)/page.tsx", import.meta.url);
const faqPagePath = new URL("../app/(site)/faq/page.tsx", import.meta.url);
const portfolioPagePath = new URL(
  "../app/(site)/portfolio/page.tsx",
  import.meta.url,
);
const stylesPath = new URL(
  "../app/_components/CtaSection.module.css",
  import.meta.url,
);

test("CTA section exposes only confirmed content variations", async () => {
  const source = await readFile(ctaPath, "utf8");

  assert.match(source, /badge\?: string/);
  assert.match(source, /description\?: string/);
  assert.match(source, /descriptionSize\?: "sm" \| "md"/);
  assert.match(source, /titleLines: readonly ReactNode\[\]/);
  assert.match(source, /secondaryAction\?: \{/);
  assert.match(source, /label: string/);
  assert.match(source, /href: string/);
  assert.doesNotMatch(source, /backgroundImage\?:/);
});

test("CTA section owns its styles and conditionally renders the second action", async () => {
  const source = await readFile(ctaPath, "utf8");
  const styles = await readFile(stylesPath, "utf8").catch(() => "");

  assert.match(source, /CtaSection\.module\.css/);
  assert.match(source, /secondaryAction \?/);
  assert.match(source, /<Link/);
  assert.match(source, /createGradientBorderButtonStyle/);
  assert.match(styles, /\.descriptionSm/);
  assert.match(styles, /\.descriptionMd/);
  assert.match(styles, /\.badge::before/);
  assert.match(styles, /var\(--landing-button-border-end\)/);
  assert.doesNotMatch(styles, /\.section\s*\{[^}]*min-height/s);
});

test("landing page passes the landing CTA configuration explicitly", async () => {
  const source = await readFile(landingPagePath, "utf8");

  assert.match(source, /<CtaSection/);
  assert.match(source, /badge="지금 바로 시작하세요"/);
  assert.match(
    source,
    /description="빠른 상담 · 전국 납품 · 소량부터 대량까지"/,
  );
  assert.match(source, /descriptionSize="md"/);
  assert.match(source, /id="contact"/);
  assert.match(source, /label: "정찰제 가격 보기"/);
  assert.match(source, /href: "\/#services"/);
  assert.match(source, /실패 없는 홍보물 디자인 제작,/);
});

test("FAQ page reuses the shared CTA with its own copy", async () => {
  const source = await readFile(faqPagePath, "utf8");

  assert.match(source, /<CtaSection/);
  assert.match(source, /id="faq-contact"/);
  assert.match(source, /badge="상담 가능 시간 : 평일 오전 9시 ~ 오후 6시"/);
  assert.match(source, /titleLines=\{\["찾으시는 답변이 없으신가요\?"\]\}/);
  assert.match(
    source,
    /description="씨브레인에 직접 물어보세요\. 빠르게 답변드립니다\."/,
  );
  assert.doesNotMatch(source, /contactSection/);
});

test("portfolio page reuses the shared CTA with its own copy", async () => {
  const source = await readFile(portfolioPagePath, "utf8");

  assert.match(source, /<CtaSection/);
  assert.match(source, /id="contact"/);
  assert.match(source, /titleLines=\{\["궁금하신 점, 지금 바로 문의하세요"\]\}/);
  assert.match(
    source,
    /description="견적부터 납기까지 빠르고 명확하게 안내드립니다\."/,
  );
  assert.match(source, /descriptionSize="md"/);
  assert.match(source, /label: "정찰제 가격 보기"/);
  assert.match(source, /href: "\/#services"/);
  assert.doesNotMatch(source, /styles\.cta/);
});
