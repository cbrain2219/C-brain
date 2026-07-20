import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const contentPath = new URL(
  "../app/_content/customerReviews.ts",
  import.meta.url,
);
const detailPagePath = new URL(
  "../app/(site)/reviews/[slug]/page.tsx",
  import.meta.url,
);
const detailStylesPath = new URL(
  "../app/(site)/reviews/[slug]/page.module.css",
  import.meta.url,
);
const thumbnailPath = new URL(
  "../public/figma-assets/review-interview-brochure.png",
  import.meta.url,
);
const authorIconPath = new URL(
  "../public/figma-assets/cbrain-author.svg",
  import.meta.url,
);
const playIconPath = new URL(
  "../public/figma-assets/review-play-large.svg",
  import.meta.url,
);

test("customer review detail page follows portfolio detail route conventions", async () => {
  await stat(detailPagePath);

  const source = await readFile(detailPagePath, "utf8");

  assert.match(source, /import type \{ Metadata \} from "next"/);
  assert.match(source, /import Image from "next\/image"/);
  assert.match(source, /import Link from "next\/link"/);
  assert.match(source, /import \{ notFound \} from "next\/navigation"/);
  assert.match(source, /export function generateStaticParams\(\)/);
  assert.match(source, /export async function generateMetadata/);
  assert.match(source, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(
    source,
    /alternates: canonicalUrl \? \{ canonical: canonicalUrl \} : undefined/,
  );
  assert.match(source, /type: "article"/);
  assert.match(source, /getCustomerInterviewDetailBySlug/);
  assert.match(source, /getCustomerInterviewDetailSeo/);
  assert.match(source, /customerInterviewDetails\.map/);
  assert.match(source, /type="application\/ld\+json"/);
  assert.match(source, /getReviewDetailStructuredData/);
  assert.match(source, /stringifyJsonLd/);
});

test("customer review detail page keeps semantic article markup and admin video alt text", async () => {
  const source = await readFile(detailPagePath, "utf8");

  assert.match(
    source,
    /<article[\s\S]*className=\{styles\.reviewDetailPage\}[\s\S]*itemScope[\s\S]*itemType="https:\/\/schema\.org\/Article"/,
  );
  assert.match(source, /itemProp="description"/);
  assert.match(source, /itemProp="image"/);
  assert.match(source, /<header className=\{styles\.reviewDetailHeader\}>/);
  assert.match(source, /itemProp="articleSection"/);
  assert.match(
    source,
    /<h1[\s\S]*id="customer-review-detail-title"[\s\S]*itemProp="headline"/,
  );
  assert.match(
    source,
    /<address[\s\S]*className=\{styles\.reviewDetailAuthorLine\}[\s\S]*itemProp="author"[\s\S]*itemScope[\s\S]*itemType="https:\/\/schema\.org\/Organization"/,
  );
  assert.match(source, /itemProp="name"/);
  assert.match(
    source,
    /<section[\s\S]*aria-labelledby="customer-review-detail-title"[\s\S]*className=\{styles\.reviewDetailContent\}/,
  );
  assert.match(source, /itemProp="articleBody"/);
  assert.match(
    source,
    /<figure[\s\S]*className=\{styles\.reviewDetailVideo\}[\s\S]*itemProp="video"[\s\S]*itemScope[\s\S]*itemType="https:\/\/schema\.org\/VideoObject"/,
  );
  assert.match(source, /itemProp="thumbnailUrl"/);
  assert.match(source, /<figcaption className=\{styles\.visuallyHidden\}>/);
  assert.match(source, /alt=\{detail\.videoAlt\}/);
  assert.match(source, /src=\{detail\.thumbnail\}/);
  assert.match(
    source,
    /<blockquote[\s\S]*className=\{styles\.reviewDetailQuote\}/,
  );
  assert.match(source, /<dl className=\{styles\.projectInfoList\}>/);
  assert.match(source, /<dt>\{item\.label\}<\/dt>/);
  assert.match(source, /<dd>\{item\.value\}<\/dd>/);
  assert.match(
    source,
    /<nav[\s\S]*aria-label="고객후기 상세 페이지 이동"[\s\S]*className=\{styles\.reviewDetailNavigation\}/,
  );
  assert.match(
    source,
    /<Link className=\{styles\.backLink\} href="\/reviews">/,
  );
});

test("customer review detail content captures the Figma interview detail copy", async () => {
  const content = await readFile(contentPath, "utf8");

  await stat(thumbnailPath);
  await stat(authorIconPath);
  await stat(playIconPath);

  assert.match(content, /export type CustomerInterviewDetail/);
  assert.match(content, /export const customerInterviewDetails/);
  assert.match(content, /export function getCustomerInterviewDetailBySlug/);
  assert.match(content, /export function getCustomerInterviewDetailSeo/);
  assert.match(content, /slug: "seojin-instech"/);
  assert.match(content, /slug: "ninebell-healthcare"/);
  assert.match(content, /slug: "chungkang-college"/);
  assert.match(
    content,
    /게임 졸업작품 완료보고서\] 청강문화산업대학교가 씨브레인을 선택한 이유/,
  );
  assert.match(content, /videoAlt:/);
  assert.match(content, /어떤 상황이었나요\?/);
  assert.match(content, /씨브레인은 어떻게 해결했나요\?/);
  assert.match(content, /고객이 직접 말하는 결과/);
  assert.match(content, /프로젝트 정보/);
  assert.match(content, /의뢰처/);
  assert.match(content, /제작물/);
  assert.match(content, /활용/);
  assert.doesNotMatch(content, /figma\.com\/api\/mcp\/asset/);
});

test("customer review detail styles match the P/T/F/M responsive detail frame", async () => {
  const styles = await readFile(detailStylesPath, "utf8");

  const requiredClasses = [
    ".reviewDetailPage",
    ".reviewDetailInner",
    ".reviewDetailBadge",
    ".reviewDetailVideo",
    ".reviewDetailPlayButton",
    ".reviewDetailBody",
    ".projectInfoList",
    ".reviewDetailNavigation",
    ".backLink",
    ".visuallyHidden",
  ];

  for (const className of requiredClasses) {
    assert.match(styles, new RegExp(className.replace(".", "\\.")));
  }

  assert.match(styles, /width: min\(calc\(100% - 40px\), 640px\);/);
  assert.match(styles, /padding: 52px 0 72px;/);
  assert.match(styles, /\.reviewDetailVideo\s*\{[\s\S]*height: 233px;/);
  assert.match(
    styles,
    /\.projectInfoItem \+ \.projectInfoItem\s*\{[\s\S]*border-top: 1px dotted var\(--landing-gray-100\);/,
  );
  assert.match(
    styles,
    /\.reviewDetailPlayButton\s*\{[\s\S]*width: 48px;[\s\S]*height: 48px;/,
  );
  assert.match(
    styles,
    /@media \(min-width: 640px\)[\s\S]*\.reviewDetailVideo\s*\{[\s\S]*height: 369px;/,
  );
  assert.match(
    styles,
    /@media \(min-width: 1080px\)[\s\S]*\.reviewDetailInner\s*\{[\s\S]*padding-top: 52px;/,
  );
});
