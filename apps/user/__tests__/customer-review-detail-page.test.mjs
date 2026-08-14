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
  assert.doesNotMatch(source, /generateStaticParams/);
  assert.match(source, /export async function generateMetadata/);
  assert.match(source, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(
    source,
    /alternates: canonicalUrl \? \{ canonical: canonicalUrl \} : undefined/,
  );
  assert.match(source, /publishedTime: detail\.publishedAt/);
  assert.match(
    source,
    /return siteUrl \? new URL\(path, siteUrl\)\.toString\(\) : undefined/,
  );
  assert.match(source, /JsonLdScript/);
  assert.match(source, /createArticleStructuredData/);
  assert.match(source, /datePublished: detail\.publishedAt/);
  assert.match(source, /dateModified: detail\.publishedAt/);
  assert.match(source, /contentUrl: absoluteVideoUrl/);
  assert.match(source, /embedUrl: detail\.youtubeEmbedUrl/);
  assert.match(source, /thumbnailUrl: imageUrl/);
  assert.match(source, /type: "article"/);
  assert.match(source, /getPublishedCustomerInterviewDetailBySlug/);
  assert.equal(
    source.match(/await getPublishedCustomerInterviewDetailBySlug\(slug\)/g)
      ?.length,
    2,
  );
  assert.match(source, /getCustomerInterviewDetailSeo/);
  assert.doesNotMatch(source, /customerInterviewDetails\.map/);
  assert.doesNotMatch(source, /type="application\/ld\+json"/);
  assert.doesNotMatch(source, /getReviewDetailStructuredData/);
  assert.doesNotMatch(source, /stringifyJsonLd/);
});

test("customer review detail page keeps semantic article markup and admin video alt text", async () => {
  const source = await readFile(detailPagePath, "utf8");

  assert.match(
    source,
    /<article[\s\S]*className=\{styles\.reviewDetailPage\}[\s\S]*itemScope[\s\S]*itemType="https:\/\/schema\.org\/Article"/,
  );
  assert.match(source, /itemProp="description"/);
  assert.match(
    source,
    /<meta content=\{detail\.publishedAt\} itemProp="datePublished" \/>/,
  );
  assert.match(
    source,
    /<meta content=\{detail\.publishedAt\} itemProp="dateModified" \/>/,
  );
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
  assert.match(
    source,
    /<span>작성자<\/span>[\s\S]*<span className=\{styles\.reviewDetailAuthorIdentity\}>[\s\S]*reviewDetailAuthorIcon[\s\S]*itemProp="name"/,
  );
  assert.match(source, /itemProp="name"/);
  assert.match(
    source,
    /<section[\s\S]*aria-labelledby="customer-review-detail-title"[\s\S]*className=\{styles\.reviewDetailContent\}/,
  );
  assert.match(source, /itemProp="articleBody"/);
  assert.match(source, /const videoUrl = detail\.videoUrl/);
  assert.match(
    source,
    /detail\.videoUrl \? \([\s\S]*href=\{detail\.videoUrl\}[\s\S]*reviewDetailPlayButton/,
  );
  assert.match(source, /detail\.youtubeEmbedUrl \? \(/);
  assert.match(source, /<iframe/);
  assert.match(source, /src=\{detail\.youtubeEmbedUrl\}/);
  assert.match(source, /allowFullScreen/);
  assert.match(source, /loading="lazy"/);
  assert.match(source, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.doesNotMatch(source, /itemType="https:\/\/schema\.org\/VideoObject"/);
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

test("customer review detail page uses stable admin ids for dynamic keys", async () => {
  const content = await readFile(contentPath, "utf8");
  const source = await readFile(detailPagePath, "utf8");

  assert.match(content, /export type CustomerInterviewContentBlock/);
  assert.match(
    content,
    /export type CustomerInterviewContentBlock =[\s\S]*id: string;/,
  );
  assert.match(
    content,
    /export type CustomerInterviewProjectInfo = \{\s*id: CustomerInterviewProjectInfoId;/,
  );
  assert.match(content, /`\$\{row\.id\}-\$\{type\}-\$\{blocks\.length\}`/);
  assert.match(content, /id: "client"/);
  assert.match(source, /key=\{block\.id\}/);
  assert.match(source, /key=\{item\.id\}/);
  assert.doesNotMatch(source, /key=\{block\.text\}/);
  assert.doesNotMatch(source, /key=\{item\.label\}/);
});

test("customer review detail content preserves local presentation metadata", async () => {
  const content = await readFile(contentPath, "utf8");

  await stat(thumbnailPath);
  await stat(authorIconPath);
  await stat(playIconPath);

  assert.match(content, /export type CustomerInterviewDetail/);
  assert.match(content, /publishedAt: string/);
  assert.match(content, /videoUrl\?: string/);
  assert.match(content, /youtubeEmbedUrl\?: string/);
  assert.match(content, /youtubeUrl\?: string/);
  assert.doesNotMatch(content, /export const customerInterviewDetails/);
  assert.match(content, /export const getPublishedCustomerInterviewDetailBySlug/);
  assert.match(content, /export function getCustomerInterviewDetailSeo/);
  assert.match(content, /slug: "seojin-instech"/);
  assert.match(content, /slug: "ninebell-healthcare"/);
  assert.match(content, /slug: "chungkang-college"/);
  assert.match(content, /videoAlt: row\.video_alt/);
  assert.match(content, /const content = toCustomerInterviewContentBlocks\(row\)/);
  assert.match(content, /\n {4}content,/);
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
    ".reviewDetailVideo",
    ".reviewDetailPlayButton",
    ".reviewDetailYouTubeEmbed",
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
  assert.match(styles, /padding: 32px 0 52px;/);
  assert.match(
    styles,
    /@media \(min-width: 1080px\)[\s\S]*?\.reviewDetailInner\s*\{[^}]*padding-top:\s*52px;/,
  );
  assert.match(styles, /\.reviewDetailAuthorLine\s*\{[\s\S]*gap: 8px;/);
  assert.match(styles, /\.reviewDetailAuthorIdentity\s*\{[\s\S]*gap: 4px;/);
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
});
