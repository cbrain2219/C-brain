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
const reviewsPagePath = new URL(
  "../app/(site)/reviews/page.tsx",
  import.meta.url,
);
const stylesPath = new URL(
  "../app/_components/CtaSection.module.css",
  import.meta.url,
);
const actionsPath = new URL(
  "../app/_components/ContactActionButtons.tsx",
  import.meta.url,
);
const actionsStylesPath = new URL(
  "../app/_components/ContactActionButtons.module.css",
  import.meta.url,
);

test("CTA section exposes only confirmed content variations", async () => {
  const source = await readFile(ctaPath, "utf8");

  assert.match(source, /badge\?: string/);
  assert.match(source, /description\?: string/);
  assert.match(source, /descriptionSize\?: "sm" \| "md"/);
  assert.match(source, /titleLines: readonly ReactNode\[\]/);
  assert.match(source, /secondaryAction\?: ContactSecondaryAction/);
  assert.doesNotMatch(source, /backgroundImage\?:/);
});

test("CTA section delegates its actions to the shared contact button group", async () => {
  const source = await readFile(ctaPath, "utf8");
  const styles = await readFile(stylesPath, "utf8").catch(() => "");
  const actionsSource = await readFile(actionsPath, "utf8");
  const actionsStyles = await readFile(actionsStylesPath, "utf8");

  assert.match(source, /CtaSection\.module\.css/);
  assert.match(source, /className=\{styles\.copyGroup\}/);
  assert.match(
    source,
    /<ContactActionButtons secondaryAction=\{secondaryAction\} \/>/,
  );
  assert.match(actionsSource, /secondaryAction \?/);
  assert.match(actionsSource, /<Link/);
  assert.match(actionsSource, /createGradientBorderButtonStyle/);
  assert.match(actionsSource, /includeBorder: false/);
  assert.match(styles, /\.descriptionSm/);
  assert.match(styles, /\.descriptionMd/);
  assert.match(styles, /\.badge::before/);
  assert.match(actionsStyles, /\.actionButton::before/);
  assert.match(actionsStyles, /\.actionButton::before\s*\{[\s\S]*?inset: 0;/);
  assert.match(
    actionsStyles,
    /\.actionButton::before\s*\{[\s\S]*?border: 1px solid transparent;/,
  );
  assert.match(
    actionsStyles,
    /\.actionButton::before\s*\{[\s\S]*?linear-gradient\(#ffffff 0 0\) padding-box,/,
  );
  assert.match(actionsStyles, /var\(--landing-button-border-end\)/);
  assert.match(styles, /\.copyGroup\s*\{[\s\S]*?gap: 20px;/);
  assert.match(styles, /\.content\s*\{[\s\S]*?gap: 52px;/);
  assert.match(
    styles,
    /@media \(max-width: 1080px\)\s*\{[\s\S]*?\.content\s*\{[\s\S]*?gap: 32px;/,
  );
  assert.doesNotMatch(actionsStyles, /\.actions\s*\{[\s\S]*?margin-top:/);
  assert.match(
    actionsStyles,
    /\.actions\s*\{[\s\S]*?--contact-action-width: 164px;/,
  );
  assert.match(actionsStyles, /\.actions\s*\{[\s\S]*?align-items: center;/);
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
  assert.match(source, /secondaryAction=\{FIXED_PRICE_ACTION\}/);
  assert.match(source, /실패 없는 홍보물 디자인 제작,/);
});

test("FAQ page reuses the shared CTA with its own copy", async () => {
  const source = await readFile(faqPagePath, "utf8");

  assert.match(source, /<CtaSection/);
  assert.match(source, /id="faq-contact"/);
  assert.match(source, /badge="상담 시간 : 월-목\) 08시~17시 \/ 금\) 08시~16시"/);
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
  assert.match(
    source,
    /titleLines=\{\["궁금하신 점, 지금 바로 문의하세요"\]\}/,
  );
  assert.match(
    source,
    /description="견적부터 납기까지 빠르고 명확하게 안내드립니다\."/,
  );
  assert.match(source, /descriptionSize="md"/);
  assert.match(source, /secondaryAction=\{FIXED_PRICE_ACTION\}/);
  assert.doesNotMatch(source, /styles\.cta/);
});

test("customer reviews page uses the fixed price action", async () => {
  const source = await readFile(reviewsPagePath, "utf8");

  assert.match(source, /<CtaSection/);
  assert.match(source, /secondaryAction=\{FIXED_PRICE_ACTION\}/);
});
