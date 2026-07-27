import assert from "node:assert/strict";
import { stat, readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/(site)/reviews/page.tsx", import.meta.url);
const testimonialListPath = new URL(
  "../app/(site)/reviews/CustomerTestimonialList.tsx",
  import.meta.url,
);
const contentPath = new URL(
  "../app/_content/customerReviews.ts",
  import.meta.url,
);
const headerPath = new URL("../app/_components/Header.tsx", import.meta.url);
const landingSectionPath = new URL(
  "../app/_components/CustomerReviewSection.tsx",
  import.meta.url,
);
const packagePath = new URL("../package.json", import.meta.url);
const rootPackagePath = new URL("../../../package.json", import.meta.url);
const stylesPath = new URL("../app/page.module.css", import.meta.url);
const turboConfigPath = new URL("../../../turbo.json", import.meta.url);
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

function extractConstArray(source, constName) {
  const startMarker = `export const ${constName} = [`;
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `${constName} array should exist`);

  const end = source.indexOf("] as const", start);
  assert.notEqual(end, -1, `${constName} array should end with as const`);

  return source.slice(start, end);
}

function extractCssBlock(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} block should exist`);

  const openBrace = source.indexOf("{", start);
  assert.notEqual(openBrace, -1, `${marker} block should open`);

  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    } else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBrace + 1, index);
      }
    }
  }

  assert.fail(`${marker} block should close`);
}

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

test("customer review content is shared by the reviews page", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const pageSource = await readFile(pagePath, "utf8");

  assert.match(contentSource, /export const customerTestimonials/);
  assert.match(contentSource, /export const customerInterviewRecords/);
  assert.match(contentSource, /export const customerInterviews/);
  assert.match(contentSource, /export const featuredCustomerInterview/);
  assert.match(pageSource, /customerTestimonials/);
  assert.match(pageSource, /customerInterviews/);
  assert.match(pageSource, /featuredCustomerInterview/);
});

test("review list, detail, and landing stay fixture-only", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const pageSource = await readFile(pagePath, "utf8");
  const landingSource = await readFile(landingSectionPath, "utf8");
  const detailSource = await readFile(
    new URL("../app/(site)/reviews/[slug]/page.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(contentSource, /@repo\/supabase/);
  assert.doesNotMatch(contentSource, /createUserSupabaseClient/);
  assert.doesNotMatch(contentSource, /listPublishedReviews/);
  assert.doesNotMatch(contentSource, /getPublishedReview/);
  assert.doesNotMatch(contentSource, /getPublicAssetUrl/);
  assert.match(contentSource, /export function getCustomerReviewPageData/);
  assert.match(contentSource, /customerInterviews: \[\.\.\.customerInterviews\]/);
  assert.match(
    contentSource,
    /customerTestimonials: \[\.\.\.customerTestimonials\]/,
  );
  assert.match(contentSource, /return customerTestimonials\.slice\(0, 3\)/);
  assert.doesNotMatch(contentSource, /getPublishedCustomerInterviewDetailBySlug/);
  assert.match(pageSource, /await getCustomerReviewPageData\(\)/);
  assert.match(landingSource, /await getLandingCustomerTestimonials\(\)/);
  assert.match(detailSource, /getCustomerInterviewDetailBySlug/);
  assert.doesNotMatch(detailSource, /getPublishedCustomerInterviewDetailBySlug/);
});

test("review list and landing render clear empty states", async () => {
  const [pageSource, landingSource, stylesSource] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(landingSectionPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(pageSource, /customerInterviews\.length > 0/);
  assert.match(pageSource, /customerTestimonials\.length > 0/);
  assert.match(pageSource, /등록된 고객 인터뷰가 없습니다\./);
  assert.match(pageSource, /등록된 고객 후기가 없습니다\./);
  assert.match(landingSource, /reviews\.length > 0/);
  assert.match(landingSource, /등록된 고객 후기가 없습니다\./);
  assert.match(stylesSource, /\.contentEmptyState/);
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

test("customer reviews hero image exposes descriptive alternative text", async () => {
  const pageSource = await readFile(pagePath, "utf8");

  assert.match(
    pageSource,
    /alt="씨브레인 편집디자인 팀이 고객 브로슈어 시안을 함께 검토하는 사무실 장면"/,
  );
});

test("customer reviews page uses shared navigation and CTA", async () => {
  const headerSource = await readFile(headerPath, "utf8");
  const pageSource = await readFile(pagePath, "utf8");

  assert.match(pageSource, /import Link from "next\/link"/);
  assert.match(
    pageSource,
    /import \{ createPageMetadata \} from "..\/..\/_content\/seo"/,
  );
  assert.match(
    pageSource,
    /export const metadata = createPageMetadata\("reviews"\)/,
  );
  assert.doesNotMatch(pageSource, /siteName: "C-Brain"/);
  assert.match(headerSource, /label: "고객 후기", href: "\/reviews"/);
  assert.match(
    headerSource,
    /if \(href === "\/reviews"\) return pathname\.startsWith\("\/reviews"\);/,
  );
  assert.match(pageSource, /import \{ CtaSection \}/);
  assert.match(pageSource, /<CtaSection/);
  assert.match(pageSource, /secondaryAction=\{\{/);
  assert.doesNotMatch(pageSource, /reviewsCta/);
});

test("shared header switches to 64px when the mobile menu button is visible", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(
    stylesSource,
    /@media \(max-width: 1099px\)[\s\S]*?\.header\s*\{[\s\S]*?height: 64px;[\s\S]*?\}[\s\S]*?\.headerNoticePage\s*\{/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1100px\)[\s\S]*?\.mobileMenuButton\s*\{[\s\S]*?display: none;/,
  );
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

  const interviewSlugs = contentSource.match(/slug: "/g) ?? [];

  assert.ok(interviewSlugs.length >= 3);
  assert.equal(pageSource.match(/<FeaturedInterview/g)?.length, 1);
  assert.doesNotMatch(pageSource, /reviewsFeaturedStandalone/);
  assert.doesNotMatch(pageSource, /reviewsFeaturedInline/);
  assert.doesNotMatch(pageSource, /variant: "inline" \| "standalone"/);
  assert.match(pageSource, /reviewsSectionDescription/);
  assert.match(pageSource, /reviewsFeaturedCompactTitle/);
  assert.match(pageSource, /reviewsFeaturedDesktopTitle/);
  assert.match(
    pageSource,
    /featuredCustomerInterview\.headlineLines\.map\(\(line, index\) =>/,
  );
  assert.match(
    pageSource,
    /key=\{`\$\{featuredCustomerInterview\.id\}-headline-\$\{index\}`\}/,
  );
  assert.doesNotMatch(pageSource, /<span key=\{line\}>/);
  assert.match(pageSource, /reviewsQuoteMark/);
  assert.match(pageSource, /reviewsMediaOverlay/);

  assert.doesNotMatch(stylesSource, /\.reviewsFeaturedInline/);
  assert.doesNotMatch(stylesSource, /\.reviewsFeaturedStandalone/);
  assert.doesNotMatch(stylesSource, /\.reviewsInterviewCard:nth-child/);
  assert.match(
    stylesSource,
    /@media \(min-width: 1080px\)[\s\S]*\.reviewsFeatured\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) 530px;/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1080px\)[\s\S]*\.reviewsInterviewGrid\s*\{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1440px\)[\s\S]*\.reviewsFeatured\s*\{[\s\S]*grid-template-columns: minmax\(0, 530px\) minmax\(0, 1fr\);/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1440px\)[\s\S]*\.reviewsFeaturedMedia\s*\{[\s\S]*order: 1;/,
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

  assert.match(contentSource, /detailSlug: record\.slug/);
  assert.match(contentSource, /publishedAt: string/);
  assert.match(contentSource, /publishedAt: record\.publishedAt/);
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

test("customer interview data stays consistent for dynamic admin content", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const recordsBlock = extractConstArray(
    contentSource,
    "customerInterviewRecords",
  );
  const chungkangQuoteMatches = contentSource.match(
    /완료보고서를 선보이면서 긍정적인 피드백을 받을 정도로 퀄리티가 좋았습니다\./g,
  );

  assert.match(
    contentSource,
    /export const customerInterviews = customerInterviewRecords\.map/,
  );
  assert.match(
    contentSource,
    /export const customerInterviewDetails = customerInterviewRecords\.map/,
  );
  assert.match(contentSource, /function getLatestCustomerInterviewRecord\(/);
  assert.match(contentSource, /Date\.parse\(latestRecord\.publishedAt\)/);
  assert.match(
    contentSource,
    /const customerInterviewRecordList: readonly CustomerInterviewRecord\[\] =\s*customerInterviewRecords;/,
  );
  assert.match(
    contentSource,
    /const featuredCustomerInterviewRecord =[\s\S]*customerInterviewRecordList\.find[\s\S]*\?\?[\s\S]*getLatestCustomerInterviewRecord\(\);/,
  );
  assert.doesNotMatch(recordsBlock, /featured:/);
  assert.doesNotMatch(contentSource, /대표 고객 인터뷰 데이터가 필요합니다/);
  assert.match(contentSource, /publishedAt: record\.publishedAt/);
  assert.match(contentSource, /id: record\.slug/);
  assert.match(contentSource, /detailSlug: record\.slug/);
  assert.match(contentSource, /title: record\.title/);
  assert.match(contentSource, /quote: getCustomerInterviewQuote\(record\)/);
  assert.match(contentSource, /thumbnail: record\.thumbnail/);
  assert.match(contentSource, /videoAlt: record\.videoAlt/);
  assert.match(
    contentSource,
    /export type CustomerInterviewProjectInfoId = "client" \| "deliverable" \| "usage";/,
  );
  assert.match(
    contentSource,
    /function getCustomerInterviewProjectValue\(\s*record: CustomerInterviewRecord,\s*id: CustomerInterviewProjectInfoId,/,
  );
  assert.match(contentSource, /item\.id === id/);
  assert.match(
    contentSource,
    /getCustomerInterviewProjectValue\(record, "deliverable"\)/,
  );
  assert.doesNotMatch(contentSource, /function getCustomerInterviewCardTitle/);
  assert.doesNotMatch(
    contentSource,
    /getCustomerInterviewProjectValue\(record, "제작물"\)/,
  );
  assert.match(
    contentSource,
    /const featuredCustomerInterviewRecord =[\s\S]*customerInterviewRecordList\.find/,
  );
  assert.equal(
    chungkangQuoteMatches?.length,
    1,
    "card and detail should not keep separate 청강 quote copies",
  );
  assert.doesNotMatch(
    recordsBlock,
    /완료 보고서를 선보이면 긍정의 피드백을 받을 정도로 퀄리티가 좋았습니다\./,
  );
  assert.match(
    contentSource,
    /slug: "chungkang-college"[\s\S]*thumbnail: reviewInterviewEducationImage/,
  );
});

test("customer reviews page progressively reveals testimonials after the first six", async () => {
  const [pageSource, testimonialListSource] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(testimonialListPath, "utf8"),
  ]);
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(pageSource, /customerInterviews\.map/);
  assert.match(pageSource, /<CustomerTestimonialList testimonials=\{customerTestimonials\}/);
  assert.doesNotMatch(pageSource, /customerInterviews\.slice/);
  assert.doesNotMatch(pageSource, /customerInterviews\.filter/);
  assert.match(testimonialListSource, /const TESTIMONIALS_PER_PAGE = 6/);
  assert.match(
    testimonialListSource,
    /testimonials\.slice\(0, visibleCount\)/,
  );
  assert.match(testimonialListSource, /visibleTestimonials\.map/);
  assert.match(
    testimonialListSource,
    /visibleCount < testimonials\.length/,
  );
  assert.match(testimonialListSource, />\s*더보기\s*<\/TextButton>/);
  assert.match(testimonialListSource, /name="arrow-down" size=\{16\}/);
  assert.match(
    stylesSource,
    /\.reviewsTestimonialList\s*\{[^}]*gap: 52px;/s,
  );
  assert.doesNotMatch(stylesSource, /\.reviewsInterviewCard:nth-child/);
  assert.doesNotMatch(stylesSource, /\.reviewsTestimonialCard:nth-child/);
});

test("customer review cards use an 8px gap until the PC breakpoint", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");
  const baseTestimonialGrid = extractCssBlock(
    stylesSource,
    ".reviewsTestimonialGrid",
  );
  const desktopMedia = extractCssBlock(
    stylesSource,
    "@media (min-width: 1080px)",
  );
  const pcMedia = extractCssBlock(
    stylesSource,
    "@media (min-width: 1440px)",
  );

  assert.match(baseTestimonialGrid, /gap: 8px;/);
  assert.doesNotMatch(baseTestimonialGrid, /gap: 20px;/);
  assert.doesNotMatch(
    desktopMedia,
    /\.reviewsTestimonialGrid\s*\{[^}]*gap: 20px;/s,
  );
  assert.match(
    pcMedia,
    /\.reviewsTestimonialGrid\s*\{[^}]*gap: 20px;/s,
  );
});

test("customer testimonials are ready for dynamic admin data", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const testimonialListSource = await readFile(testimonialListPath, "utf8");
  const testimonialsBlock = extractConstArray(
    contentSource,
    "customerTestimonials",
  );

  assert.match(contentSource, /export type CustomerTestimonial/);
  assert.equal(testimonialsBlock.match(/id: "/g)?.length, 12);
  assert.match(testimonialsBlock, /id: "/);
  assert.match(testimonialsBlock, /publishedAt: "/);
  assert.match(testimonialsBlock, /title: "/);
  assert.match(testimonialListSource, /key=\{review\.id\}/);
  assert.match(
    testimonialListSource,
    /aria-label=\{`\$\{review\.title\} 고객 후기`\}/,
  );
  assert.doesNotMatch(
    testimonialListSource,
    /key=\{`\$\{review\.name\}-\$\{review\.company\}`\}/,
  );
});

test("customer reviews hero content styles stay consolidated", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.doesNotMatch(
    stylesSource,
    /\.reviewsHeroContent\s*\{\s*width: min\(100%, 390px\);\s*margin: 0 auto;\s*\}\s*\.reviewsHeroContent\s*\{/,
  );
  assert.match(
    stylesSource,
    /\.reviewsHeroContent\s*\{[\s\S]*width: min\(100%, 390px\);[\s\S]*padding: 144px 20px 72px;[\s\S]*position: relative;[\s\S]*display: flex;[\s\S]*flex-direction: column;[\s\S]*gap: 20px;/,
  );
  assert.doesNotMatch(
    extractCssBlock(stylesSource, ".reviewsHeroContent"),
    /margin:\s*0 auto;/,
  );
});

test("customer reviews hero content follows the shared hero width scale", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");
  const tabletStyles = extractCssBlock(stylesSource, "@media (min-width: 640px)");
  const desktopStyles = extractCssBlock(
    stylesSource,
    "@media (min-width: 1080px)",
  );
  const pcStyles = extractCssBlock(stylesSource, "@media (min-width: 1440px)");

  assert.match(
    stylesSource,
    /\.reviewsHeroContent\s*\{[\s\S]*width: min\(100%, 390px\);/,
  );
  assert.match(
    stylesSource,
    /\.reviewsHeroContent\s*\{[\s\S]*padding: 144px 20px 72px;/,
  );
  assert.match(
    tabletStyles,
    /\.reviewsHeroContent\s*\{[\s\S]*?width: min\(100%, 640px\);/,
  );
  assert.match(
    desktopStyles,
    /\.reviewsHeroContent,\s*\.reviewsContent\s*\{[\s\S]*?width: min\(100%, 1080px\);/,
  );
  assert.match(
    desktopStyles,
    /\.reviewsHeroContent\s*\{[\s\S]*?padding: 160px 80px 104px;/,
  );
  assert.match(
    pcStyles,
    /\.reviewsHeroContent\s*\{[\s\S]*?width: 1360px;/,
  );
  assert.match(
    pcStyles,
    /\.reviewsHeroContent\s*\{[\s\S]*?margin: 0 auto;/,
  );
  assert.match(
    pcStyles,
    /\.reviewsHeroContent\s*\{[\s\S]*?padding: 160px 0 104px;/,
  );
});

test("customer review tests are connected to workspace scripts", async () => {
  const packageSource = await readFile(packagePath, "utf8");
  const rootPackageSource = await readFile(rootPackagePath, "utf8");
  const turboSource = await readFile(turboConfigPath, "utf8");

  assert.match(rootPackageSource, /"test": "turbo run test"/);
  assert.match(packageSource, /"test": "node --test __tests__\/\*\.test\.mjs"/);
  assert.match(turboSource, /"test": \{[\s\S]*"dependsOn": \["\^test"\]/);
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
