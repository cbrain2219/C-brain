import assert from "node:assert/strict";
import { stat, readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/(site)/reviews/page.tsx", import.meta.url);
const contentPath = new URL(
  "../app/_content/customerReviews.ts",
  import.meta.url,
);
const headerPath = new URL("../app/_components/Header.tsx", import.meta.url);
const landingReviewPath = new URL(
  "../app/_components/CustomerReviewSection.tsx",
  import.meta.url,
);
const stylesPath = new URL("../app/page.module.css", import.meta.url);
const heroImagePath = new URL(
  "../public/figma-assets/review-hero-office.png",
  import.meta.url,
);
const interviewImagePath = new URL(
  "../public/figma-assets/review-interview-brochure.png",
  import.meta.url,
);
const healthcareInterviewImagePath = new URL(
  "../public/figma-assets/review-interview-healthcare.png",
  import.meta.url,
);
const educationInterviewImagePath = new URL(
  "../public/figma-assets/review-interview-education.png",
  import.meta.url,
);
const largePlayIconPath = new URL(
  "../public/figma-assets/review-play-large.svg",
  import.meta.url,
);
const smallPlayIconPath = new URL(
  "../public/figma-assets/review-play-small.svg",
  import.meta.url,
);
const quoteMarkIconPath = new URL(
  "../public/figma-assets/review-quote-mark.svg",
  import.meta.url,
);

test("customer reviews page exposes the Figma review page sections", async () => {
  const source = await readFile(pagePath, "utf8");

  const requiredTexts = [
    "Interview · Review",
    "홍보물 디자인 제작,",
    "고객이 직접 말하는 씨브레인",
    "실제 인터뷰 영상으로 확인하세요",
    "실제 고객의 생생한 후기",
    "많은 기업들이 씨브레인을 선택한 이유,",
    "이제 직접 경험해 보세요.",
  ];

  for (const text of requiredTexts) {
    assert.match(
      source,
      new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});

test("customer review content is shared between landing and reviews page", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const pageSource = await readFile(pagePath, "utf8");
  const landingReviewSource = await readFile(landingReviewPath, "utf8");

  assert.match(contentSource, /export const customerTestimonials/);
  assert.match(contentSource, /export const customerInterviews/);
  assert.match(contentSource, /export const featuredCustomerInterview/);
  assert.match(pageSource, /customerTestimonials/);
  assert.match(pageSource, /customerInterviews/);
  assert.match(pageSource, /featuredCustomerInterview/);
  assert.match(landingReviewSource, /customerTestimonials/);
});

test("customer reviews page keeps Figma image assets local", async () => {
  const contentSource = await readFile(contentPath, "utf8");

  await stat(heroImagePath);
  await stat(interviewImagePath);
  await stat(healthcareInterviewImagePath);
  await stat(educationInterviewImagePath);
  await stat(largePlayIconPath);
  await stat(smallPlayIconPath);
  await stat(quoteMarkIconPath);
  assert.match(contentSource, /review-hero-office\.png/);
  assert.match(contentSource, /review-interview-brochure\.png/);
  assert.match(contentSource, /review-interview-healthcare\.png/);
  assert.match(contentSource, /review-interview-education\.png/);
  assert.match(contentSource, /review-play-large\.svg/);
  assert.match(contentSource, /review-play-small\.svg/);
  assert.match(contentSource, /review-quote-mark\.svg/);
  assert.doesNotMatch(contentSource, /figma\.com\/api\/mcp\/asset/);
});

test("customer reviews page uses shared navigation and CTA", async () => {
  const headerSource = await readFile(headerPath, "utf8");
  const pageSource = await readFile(pagePath, "utf8");

  assert.match(pageSource, /import Link from "next\/link"/);
  assert.match(headerSource, /label: "고객 후기", href: "\/reviews"/);
  assert.match(pageSource, /import \{ CtaSection \}/);
  assert.match(pageSource, /<CtaSection/);
  assert.match(pageSource, /secondaryAction=\{\{/);
  assert.doesNotMatch(pageSource, /reviewsCta/);
});

test("customer reviews page includes responsive layout styles", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");

  const requiredClasses = [
    ".reviewsPageHero",
    ".reviewsBadge",
    ".reviewsFeatured",
    ".reviewsFeaturedMediaLink",
    ".reviewsInterviewLink",
    ".reviewsInterviewGrid",
    ".reviewsTestimonialGrid",
  ];

  for (const className of requiredClasses) {
    assert.match(stylesSource, new RegExp(className.replace(".", "\\.")));
  }

  assert.match(
    stylesSource,
    /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    stylesSource,
    /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/,
  );
});

test("customer interviews follow the P/T/F/M responsive section variants", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const pageSource = await readFile(pagePath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");

  const interviewIds = contentSource.match(/id: "/g) ?? [];

  assert.equal(interviewIds.length, 6);
  assert.match(pageSource, /reviewsFeaturedStandalone/);
  assert.match(pageSource, /reviewsFeaturedInline/);
  assert.match(pageSource, /reviewsSectionDescription/);
  assert.match(pageSource, /reviewsFeaturedCompactTitle/);
  assert.match(pageSource, /reviewsFeaturedDesktopTitle/);
  assert.match(pageSource, /reviewsQuoteMark/);
  assert.match(pageSource, /reviewsMediaOverlay/);

  assert.match(stylesSource, /\.reviewsFeaturedInline\s*\{\s*display: none;/);
  assert.match(
    stylesSource,
    /\.reviewsInterviewCard:nth-child\(n \+ 5\)\s*\{\s*display: none;/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1080px\)[\s\S]*\.reviewsFeaturedStandalone\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) 530px;/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1080px\)[\s\S]*\.reviewsInterviewGrid\s*\{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1440px\)[\s\S]*\.reviewsFeaturedStandalone\s*\{\s*display: none;/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1440px\)[\s\S]*\.reviewsFeaturedInline\s*\{[\s\S]*display: grid;/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1440px\)[\s\S]*\.reviewsInterviewGrid\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1440px\)[\s\S]*\.reviewsCategory\s*\{\s*display: none;/,
  );
});

test("customer interview markup stays semantic and uses admin video alt text", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const pageSource = await readFile(pagePath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.equal(contentSource.match(/detailSlug: "/g)?.length, 7);
  assert.match(contentSource, /detailSlug: "seojin-instech"/);
  assert.match(contentSource, /detailSlug: "ninebell-healthcare"/);
  assert.match(contentSource, /detailSlug: "chungkang-college"/);
  assert.match(contentSource, /videoAlt:/);
  assert.match(pageSource, /alt=\{featuredCustomerInterview\.videoAlt\}/);
  assert.match(pageSource, /alt=\{interview\.videoAlt\}/);
  assert.match(
    pageSource,
    /href=\{`\/reviews\/\$\{featuredCustomerInterview\.detailSlug\}`\}/,
  );
  assert.match(
    pageSource,
    /aria-label=\{`\$\{featuredCustomerInterview\.title\} 상세 보기`\}/,
  );
  assert.doesNotMatch(pageSource, /고객 인터뷰 영상`\}/);
  assert.match(
    pageSource,
    /<figure className=\{styles\.reviewsFeaturedMedia\}>/,
  );
  assert.match(pageSource, /className=\{styles\.reviewsFeaturedMediaLink\}/);
  assert.match(pageSource, /href=\{`\/reviews\/\$\{interview\.detailSlug\}`\}/);
  assert.match(pageSource, /aria-label=\{`\$\{interview\.title\} 상세 보기`\}/);
  assert.match(pageSource, /className=\{styles\.reviewsInterviewLink\}/);
  assert.match(
    pageSource,
    /<figure className=\{styles\.reviewsInterviewMedia\}>/,
  );
  assert.match(pageSource, /<ul className=\{styles\.reviewsInterviewGrid\}>/);
  assert.match(
    pageSource,
    /<li[\s\S]*className=\{styles\.reviewsInterviewCard\}/,
  );
  assert.match(pageSource, /<blockquote>/);
  assert.match(pageSource, /<footer className=\{styles\.reviewsCardMeta\}>/);
  assert.match(stylesSource, /list-style: none;/);
  assert.match(stylesSource, /\.reviewsFeaturedBody blockquote/);
  assert.match(stylesSource, /\.reviewsInterviewCopy blockquote/);
  assert.match(stylesSource, /\.reviewsTestimonialContent blockquote/);
});

test("customer reviews content spans the tablet breakpoint", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(
    stylesSource,
    /@media \(min-width: 640px\)[\s\S]*\.reviewsContent\s*\{\s*width: 100%;/,
  );
  assert.doesNotMatch(
    stylesSource,
    /\.reviewsHeroContent,\s*\.reviewsContent\s*\{\s*width: min\(100%, 600px\);/,
  );
});

test("customer reviews content spans the mobile breakpoint", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(
    stylesSource,
    /\.reviewsContent\s*\{\s*width: 100%;[\s\S]*padding: 72px 20px;/,
  );
  assert.doesNotMatch(
    stylesSource,
    /\.reviewsHeroContent,\s*\.reviewsContent\s*\{\s*width: min\(100%, 390px\);/,
  );
});
