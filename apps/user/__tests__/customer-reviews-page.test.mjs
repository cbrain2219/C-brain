import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { stat, readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/(site)/reviews/page.tsx", import.meta.url);
const detailPagePath = new URL(
  "../app/(site)/reviews/[slug]/page.tsx",
  import.meta.url,
);
const homePagePath = new URL("../app/(site)/page.tsx", import.meta.url);
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
const testimonialCardPath = new URL(
  "../app/_components/CustomerTestimonialCard.tsx",
  import.meta.url,
);
const packagePath = new URL("../package.json", import.meta.url);
const nextConfigPath = new URL("../next.config.js", import.meta.url);
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
const quoteMarkIconPath = new URL(
  "../public/figma-assets/review-quote-mark.svg",
  import.meta.url,
);

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

async function importCustomerReviewMappers() {
  const source = await readFile(contentPath, "utf8");
  const runnableSource = `
const cache = (loader) => loader;
const connection = async () => {};
const createPublicUserSupabaseClient = () => null;
const getPublicAssetUrl = (_client, path) => \`https://assets.test/\${path}\`;
const getPublishedReview = async () => null;
const listPublishedReviews = async () => [];
const getYouTubeEmbedUrl = (videoId) => /^[A-Za-z0-9_-]{11}$/.test(videoId)
  ? "https://www.youtube-nocookie.com/embed/" + videoId
  : null;
const getYouTubeThumbnailUrl = (videoId) => /^[A-Za-z0-9_-]{11}$/.test(videoId)
  ? "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg"
  : null;
const getYouTubeWatchUrl = (videoId) => /^[A-Za-z0-9_-]{11}$/.test(videoId)
  ? "https://www.youtube.com/watch?v=" + videoId
  : null;
${source.replace(/import[\s\S]*?from "[^"]+";\n/g, "")}
`;
  const ts = await import("typescript");
  const { outputText } = ts.transpileModule(runnableSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}

function reviewRow(overrides = {}) {
  return {
    company_name: "새 고객사",
    content: "새 고객 후기입니다.",
    content_mode: "markdown",
    created_at: "2026-08-01T00:00:00.000Z",
    id: "review-id",
    kind: "testimonial",
    manager_name: "김담당님",
    project_deliverable: null,
    project_usage: null,
    published_at: "2026-08-02T00:00:00.000Z",
    seo_description: null,
    show_on_landing: false,
    slug: null,
    sort_order: 1,
    status: "published",
    title: null,
    video_alt: null,
    video_path: null,
    view_count: 0,
    youtube_video_id: null,
    ...overrides,
  };
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

  assert.match(contentSource, /export function mapCustomerReviewRows/);
  assert.match(contentSource, /export function mapCustomerInterviewDetail/);
  assert.match(contentSource, /export const getCustomerReviewPageData/);
  assert.match(contentSource, /export const getLandingCustomerTestimonials/);
  assert.match(pageSource, /customerTestimonials/);
  assert.match(pageSource, /customerInterviews/);
  assert.match(pageSource, /featuredCustomerInterview/);
});

test("featured customer interview is not repeated in the interview grid", async () => {
  const pageSource = await readFile(pagePath, "utf8");

  assert.match(
    pageSource,
    /const additionalCustomerInterviews = customerInterviews\.filter\(/,
  );
  assert.match(
    pageSource,
    /interview\.id !== featuredCustomerInterview\?\.id/,
  );
  assert.match(pageSource, /additionalCustomerInterviews\.map/);
  assert.doesNotMatch(pageSource, /customerInterviews\.map/);
  assert.match(pageSource, /: featuredCustomerInterview \? null : \(/);
});

test("landing and reviews pages share the testimonial card component", async () => {
  const [landingSource, testimonialListSource] = await Promise.all([
    readFile(landingSectionPath, "utf8"),
    readFile(testimonialListPath, "utf8"),
  ]);

  assert.match(landingSource, /CustomerTestimonialCard/);
  assert.match(testimonialListSource, /CustomerTestimonialCard/);
  assert.doesNotMatch(landingSource, /styles\.reviewCard/);
  assert.doesNotMatch(testimonialListSource, /styles\.reviewsTestimonialCard/);
  assert.doesNotMatch(testimonialListSource, /styles\.reviewsTestimonialArticle/);
  assert.doesNotMatch(landingSource, /★★★★★/);
  assert.doesNotMatch(testimonialListSource, /★★★★★/);
});

test("shared testimonial cards use compact 20px padding", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");
  const landingCard = extractCssBlock(stylesSource, ".reviewCard");
  const pcMedia = extractCssBlock(stylesSource, "@media (min-width: 1440px)");

  assert.match(landingCard, /padding:\s*20px;/);
  assert.match(
    stylesSource,
    /\.reviewsTestimonialCard\s*\{\s*padding:\s*20px;/,
  );
  assert.doesNotMatch(
    pcMedia,
    /\.reviewsTestimonialCard\s*\{[\s\S]*?padding:\s*32px;/,
  );
});

test("review list, detail, and landing load published Supabase rows", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const pageSource = await readFile(pagePath, "utf8");
  const homePageSource = await readFile(homePagePath, "utf8");
  const landingSource = await readFile(landingSectionPath, "utf8");
  const detailSource = await readFile(detailPagePath, "utf8");

  assert.match(contentSource, /@repo\/supabase/);
  assert.match(contentSource, /createPublicUserSupabaseClient/);
  assert.match(contentSource, /listPublishedReviews/);
  assert.match(contentSource, /getPublishedReview/);
  assert.match(contentSource, /getPublicAssetUrl/);
  assert.match(contentSource, /await connection\(\)/);
  assert.match(contentSource, /getPublishedCustomerInterviewDetailBySlug/);
  assert.doesNotMatch(contentSource, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(contentSource, /export const customerTestimonials\s*=\s*\[/);
  assert.doesNotMatch(contentSource, /export const customerInterviewRecords\s*=\s*\[/);
  assert.match(pageSource, /await getCustomerReviewPageData\(\)/);
  assert.match(
    homePageSource,
    /Promise\.all\(\[\s*searchParams,\s*getPublishedBlogPosts\(\),\s*getPublishedPortfolioItems\(\),\s*getLandingCustomerTestimonials\(\),\s*getPublishedOrderProducts\(\),\s*\]\)/,
  );
  assert.match(
    homePageSource,
    /<CustomerReviewSection reviews=\{landingCustomerTestimonials\} \/>/,
  );
  assert.match(landingSource, /reviews: readonly CustomerTestimonial\[\]/);
  assert.doesNotMatch(landingSource, /getLandingCustomerTestimonials\(\)/);
  assert.match(detailSource, /getPublishedCustomerInterviewDetailBySlug/);
  assert.match(detailSource, /await getPublishedCustomerInterviewDetailBySlug\(slug\)/);
  assert.doesNotMatch(detailSource, /getCustomerInterviewDetailBySlug/);
});

test("customer interview detail renders raw HTML in the shared document frame", async () => {
  const detailSource = await readFile(detailPagePath, "utf8");

  assert.match(detailSource, /detail\.managedContent\.contentMode === "html"/);
  assert.match(
    detailSource,
    /detail\.managedContent\.contentAuthoringMode === "raw_html"/,
  );
  assert.match(
    detailSource,
    /<RawHtmlDocumentFrame html=\{rawHtmlSource\} title=\{detail\.title\} \/>/,
  );
  assert.doesNotMatch(detailSource, /dangerouslySetInnerHTML/);
});

test("review mappers separate kinds, sanitize content, and keep presentation metadata", async () => {
  const {
    getCustomerReviewPageData,
    getLandingCustomerTestimonials,
    getPublishedCustomerInterviewDetailBySlug,
    mapCustomerInterviewDetail,
    mapLandingCustomerTestimonials,
    mapCustomerReviewRows,
    reviewInterviewEducationImage,
    reviewInterviewImage,
  } = await importCustomerReviewMappers();
  const rows = [
    reviewRow({
      content:
        "<p>좋은 결과였습니다.</p><script>window.stolen = true</script><style>body{display:none}</style>&lt;script&gt;encodedStolen=true&lt;/script&gt;",
      content_mode: "html",
      id: "testimonial-1",
      show_on_landing: true,
    }),
    reviewRow({
      content: "## 어떤 상황이었나요?\n\n본문입니다.\n\n> 만족합니다.",
      id: "interview-1",
      kind: "interview",
      manager_name: null,
      project_deliverable: "브랜드 소개 브로슈어",
      project_usage: "전시회 배포 · 영업 자료 활용",
      seo_description: "새 인터뷰 설명",
      show_on_landing: false,
      slug: "new-interview",
      title: "새 고객 인터뷰",
      video_alt: "새 고객 인터뷰 영상",
      video_path: "reviews/new-interview.mp4",
    }),
    reviewRow({
      id: "testimonial-2",
      show_on_landing: true,
    }),
    reviewRow({
      id: "testimonial-3",
      show_on_landing: true,
    }),
    reviewRow({
      id: "testimonial-4",
      show_on_landing: true,
    }),
  ];
  const mapped = mapCustomerReviewRows(
    rows,
    (path) => `https://assets.test/${path}`,
  );
  const detail = mapCustomerInterviewDetail(
    rows[1],
    (path) => `https://assets.test/${path}`,
  );

  assert.equal(mapped.customerInterviews.length, 1);
  assert.equal(mapped.customerTestimonials.length, 4);
  assert.deepEqual(
    mapLandingCustomerTestimonials(rows).map(({ id }) => id),
    ["testimonial-1", "testimonial-2", "testimonial-3"],
  );
  assert.equal(mapped.customerTestimonials[0].body, "좋은 결과였습니다.");
  assert.doesNotMatch(
    mapped.customerTestimonials[0].body,
    /script|style|stolen|display|encoded|<|>/i,
  );
  assert.deepEqual(
    detail.content.map(({ id, type }) => ({ id, type })),
    [
      { id: "interview-1-heading-0", type: "heading" },
      { id: "interview-1-paragraph-1", type: "paragraph" },
      { id: "interview-1-quote-2", type: "quote" },
    ],
  );
  assert.equal(detail.thumbnail, reviewInterviewImage);
  assert.equal(detail.projectInfo[0].value, "새 고객사");
  assert.deepEqual(
    detail.projectInfo.map(({ value }) => value),
    [
      "새 고객사",
      "브랜드 소개 브로슈어",
      "전시회 배포 · 영업 자료 활용",
    ],
  );
  assert.equal(
    mapped.customerInterviews[0].meta,
    "브랜드 소개 브로슈어",
  );
  assert.equal(
    mapped.featuredCustomerInterview.projectName,
    "브랜드 소개 브로슈어",
  );
  assert.equal(detail.videoUrl, "https://assets.test/reviews/new-interview.mp4");
  assert.equal(
    mapped.customerInterviews[0].videoUrl,
    "https://assets.test/reviews/new-interview.mp4",
  );

  const youtubeDetail = mapCustomerInterviewDetail(
    reviewRow({
      id: "youtube-interview",
      kind: "interview",
      manager_name: null,
      slug: "youtube-interview",
      title: "YouTube 고객 인터뷰",
      video_path: "reviews/must-not-resolve.mp4",
      youtube_video_id: "dQw4w9WgXcQ",
    }),
    () => {
      throw new Error("YouTube videos must not be resolved through Storage");
    },
  );

  assert.equal(
    youtubeDetail.youtubeUrl,
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
  assert.equal(
    youtubeDetail.youtubeEmbedUrl,
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
  assert.equal(
    youtubeDetail.thumbnail,
    "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  );
  assert.equal(youtubeDetail.videoUrl, undefined);

  const legacy = mapCustomerReviewRows([
    reviewRow({
      company_name: "청강문화산업대학교 게임콘텐츠스쿨",
      id: "legacy-interview",
      kind: "interview",
      manager_name: null,
      project_deliverable: "새 졸업 프로젝트 완료보고서",
      project_usage: "성과 공유",
      slug: "chungkang-college",
      title: "청강 인터뷰",
      video_path: "reviews/chungkang.mp4",
    }),
  ]);

  assert.equal(legacy.customerInterviews[0].category, "교육");
  assert.equal(legacy.customerInterviews[0].thumbnail, reviewInterviewEducationImage);
  assert.deepEqual(legacy.featuredCustomerInterview.headlineLines, [
    "처음 맡겼는데",
    "결과물이 기대 이상이였어요.",
  ]);
  assert.equal(
    legacy.featuredCustomerInterview.projectName,
    "새 졸업 프로젝트 완료보고서",
  );
  assert.equal((await getCustomerReviewPageData()).customerInterviews.length, 0);
  assert.deepEqual(await getLandingCustomerTestimonials(), []);
  assert.equal(
    await getPublishedCustomerInterviewDetailBySlug("new-interview"),
    undefined,
  );
});

test("review list and landing render clear empty states", async () => {
  const [pageSource, landingSource, stylesSource] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(landingSectionPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(pageSource, /additionalCustomerInterviews\.length > 0/);
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
  await stat(quoteMarkIconPath);
  assert.match(contentSource, /review-hero-office\.png/);
  assert.match(contentSource, /review-interview-brochure\.png/);
  assert.match(contentSource, /review-interview-healthcare\.png/);
  assert.match(contentSource, /review-interview-education\.png/);
  assert.match(contentSource, /review-quote-mark\.svg/);
  assert.doesNotMatch(contentSource, /figma\.com\/api\/mcp\/asset/);
});

test("customer interview thumbnails do not render play button overlays", async () => {
  const [pageSource, stylesSource, contentSource] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(stylesPath, "utf8"),
    readFile(contentPath, "utf8"),
  ]);

  assert.doesNotMatch(pageSource, /PlayButton|reviewsPlayButton|reviewPlay/);
  assert.doesNotMatch(
    stylesSource,
    /\.reviewsPlayButton|\.reviewsPlayIconImage/,
  );
  assert.doesNotMatch(contentSource, /reviewPlay(?:Large|Small)Icon/);
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
  assert.match(pageSource, /secondaryAction=\{FIXED_PRICE_ACTION\}/);
  assert.doesNotMatch(pageSource, /reviewsCta/);
});

test("page spacing switches above 1080px and header navigation above 1200px", async () => {
  const [headerSource, stylesSource] = await Promise.all([
    readFile(headerPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(
    stylesSource,
    /\.page\s*\{[\s\S]*?--site-header-height: 52px;[\s\S]*?--site-page-top-gap: 72px;[\s\S]*?--site-page-top-offset: calc\(/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1081px\)[\s\S]*?\.page\s*\{[\s\S]*?--site-header-height: 80px;[\s\S]*?--site-page-top-gap: 104px;/,
  );
  assert.match(
    stylesSource,
    /\.header\s*\{[\s\S]*?height: var\(--site-header-height\);/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width: 1201px\)[\s\S]*?\.mobileMenuButton\s*\{[\s\S]*?display: none;/,
  );
  assert.match(headerSource, /window\.matchMedia\("\(min-width: 1201px\)"\)/);
});

test("customer reviews page includes responsive layout styles", async () => {
  const [pageSource, stylesSource] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  const requiredClasses = [
    ".reviewsPageHero",
    ".reviewsBadge",
    ".reviewsFeatured",
    ".reviewsFeaturedMediaLink",
    ".reviewsInterviewLink",
    ".reviewsInterviewGrid",
    ".reviewsMediaVideo",
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
  assert.match(
    stylesSource,
    /@media \(max-width: 640px\)\s*\{\s*\.reviewsInterviewSection\s*\{\s*gap: 32px;/,
  );
  assert.match(pageSource, /function InterviewThumbnail/);
  assert.match(pageSource, /src=\{`\$\{videoUrl\}#t=0\.001`\}/);
  assert.match(pageSource, /preload="metadata"/);
});

test("YouTube interview thumbnails are allowed by the Next image config", async () => {
  const configSource = await readFile(nextConfigPath, "utf8");

  assert.match(configSource, /hostname: "i\.ytimg\.com"/);
  assert.match(configSource, /pathname: "\/vi\/\*\*"/);
});

test("customer interview heading moves below the featured interview through 640px", async () => {
  const [pageSource, stylesSource] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);
  const reviewsSectionStart = stylesSource.indexOf(
    ".reviewsInterviewSection",
  );
  const mobileReviewMedia = extractCssBlock(
    stylesSource.slice(reviewsSectionStart),
    "@media (max-width: 640px)",
  );
  const interviewLead = extractCssBlock(
    stylesSource,
    ".reviewsInterviewLead",
  );

  assert.equal(
    pageSource.match(/id="customer-interview-heading"/g)?.length,
    1,
  );
  assert.match(pageSource, /className=\{styles\.reviewsInterviewLead\}/);
  assert.match(interviewLead, /display: flex;/);
  assert.match(interviewLead, /flex-direction: column;/);
  assert.match(interviewLead, /gap: inherit;/);
  assert.match(
    mobileReviewMedia,
    /\.reviewsInterviewLead\s*\{[^}]*gap: 72px;/s,
  );
  assert.match(
    mobileReviewMedia,
    /\.reviewsInterviewLead > \.reviewsFeatured\s*\{[^}]*order: 1;/s,
  );
  assert.match(
    mobileReviewMedia,
    /\.reviewsInterviewLead > \.reviewsSectionHeading\s*\{[^}]*display: flex;[^}]*order: 2;/s,
  );
  assert.doesNotMatch(
    mobileReviewMedia,
    /\.reviewsInterviewLead > \.reviewsSectionHeading\s*\{[^}]*display: none;/s,
  );
});

test("featured customer interview keeps the redesigned quote layout at 640px and 390px", async () => {
  const [pageSource, stylesSource] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);
  const foldMedia = extractCssBlock(
    stylesSource,
    "@media (min-width: 640px)",
  );

  assert.doesNotMatch(pageSource, /reviewsFeaturedCompactTitle/);
  assert.match(
    pageSource,
    /<h3 className=\{styles\.reviewsFeaturedTitle\}>/,
  );
  assert.match(
    stylesSource,
    /\.reviewsFeaturedText\s*\{[^}]*gap: 20px;/s,
  );
  assert.match(
    stylesSource,
    /\.reviewsFeaturedSummary\s*\{[^}]*gap: 32px;/s,
  );
  assert.match(
    stylesSource,
    /\.reviewsFeaturedQuoteGroup\s*\{[^}]*gap: 24px;/s,
  );
  assert.match(
    stylesSource,
    /\.reviewsQuoteMark\s*\{[^}]*width: 18px;[^}]*height: 16px;/s,
  );
  assert.match(
    stylesSource,
    /\.reviewsFeaturedTitle\s*\{[^}]*font-size: 20px;[^}]*line-height: 30px;[^}]*letter-spacing: -0\.3px;/s,
  );
  assert.match(
    stylesSource,
    /\.reviewsQuoteMark,\s*\.reviewsFeaturedDivider\s*\{\s*display: block;/,
  );
  assert.match(
    foldMedia,
    /\.reviewsFeaturedMedia\s*\{[^}]*aspect-ratio: 600 \/ 338;/s,
  );
});

test("customer interviews keep the desktop section layout from 1080px upward", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const pageSource = await readFile(pagePath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");
  const desktopMedia = extractCssBlock(
    stylesSource,
    "@media (min-width: 1080px)",
  );
  const pcMedia = extractCssBlock(stylesSource, "@media (min-width: 1440px)");

  const interviewSlugs = contentSource.match(/slug: "/g) ?? [];

  assert.ok(interviewSlugs.length >= 3);
  assert.equal(pageSource.match(/<FeaturedInterview/g)?.length, 1);
  assert.doesNotMatch(pageSource, /reviewsFeaturedStandalone/);
  assert.doesNotMatch(pageSource, /reviewsFeaturedInline/);
  assert.doesNotMatch(pageSource, /variant: "inline" \| "standalone"/);
  assert.match(pageSource, /reviewsSectionDescription/);
  assert.match(pageSource, /reviewsSectionCopy/);
  assert.doesNotMatch(pageSource, /reviewsFeaturedCompactTitle/);
  assert.doesNotMatch(pageSource, /reviewsFeaturedDesktopTitle/);
  assert.match(
    pageSource,
    /<h3 className=\{styles\.reviewsFeaturedTitle\}>/,
  );
  assert.match(pageSource, /reviewsFeaturedSummary/);
  assert.match(pageSource, /reviewsFeaturedDivider/);
  assert.match(pageSource, /reviewsFeaturedMeta/);
  assert.match(
    pageSource,
    /\{featuredCustomerInterview\.title\}/,
  );
  assert.doesNotMatch(pageSource, /featuredCustomerInterview\.headlineLines/);
  assert.match(pageSource, /reviewsQuoteMark/);
  assert.match(pageSource, /reviewsMediaOverlay/);

  assert.match(
    stylesSource,
    /\.reviewsFeaturedDescription\s*\{[^}]*display: -webkit-box;[^}]*overflow: hidden;[^}]*-webkit-box-orient: vertical;[^}]*-webkit-line-clamp: 2;/s,
  );

  assert.doesNotMatch(stylesSource, /\.reviewsFeaturedInline/);
  assert.doesNotMatch(stylesSource, /\.reviewsFeaturedStandalone/);
  assert.doesNotMatch(stylesSource, /\.reviewsInterviewCard:nth-child/);
  assert.match(
    desktopMedia,
    /\.reviewsFeatured\s*\{[^}]*grid-template-columns: minmax\(0, 530px\) minmax\(0, 1fr\);/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsFeaturedMedia\s*\{[^}]*order: 1;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsFeaturedText\s*\{[^}]*gap: 20px;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsFeaturedSummary\s*\{[^}]*gap: 32px;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsFeaturedQuoteGroup\s*\{[^}]*gap: 24px;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsQuoteMark\s*\{[^}]*width: 27px;[^}]*height: 24px;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsFeaturedTitle\s*\{[^}]*font-size: 24px;[^}]*line-height: 32px;[^}]*letter-spacing: -0\.36px;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsInterviewGrid\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[^}]*gap: 20px;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsInterviewBody\s*\{[^}]*padding: 16px 20px;[^}]*gap: 20px;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsInterviewSection\s*\{[^}]*gap: 32px;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsInterviewLead\s*\{[^}]*gap: 52px;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsSectionDescription\s*\{[^}]*display: block;/s,
  );
  assert.match(
    stylesSource,
    /\.reviewsSectionHeading\s*\{[^}]*gap: 16px;/s,
  );
  assert.match(
    stylesSource,
    /\.reviewsSectionCopy\s*\{[^}]*gap: 4px;/s,
  );
  assert.match(
    desktopMedia,
    /\.reviewsCategory\s*\{\s*display: none;/,
  );
  assert.doesNotMatch(
    pcMedia,
    /\.reviews(?:InterviewSection|SectionHeading|SectionDescription|Featured|QuoteMark|InterviewGrid|TestimonialGrid|InterviewMedia|Category)\b/,
  );
});

test("customer interview markup stays semantic and uses admin video alt text", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const pageSource = await readFile(pagePath, "utf8");
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(contentSource, /detailSlug: detail\.slug/);
  assert.match(contentSource, /publishedAt: string/);
  assert.match(contentSource, /publishedAt: detail\.publishedAt/);
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
  assert.match(
    pageSource,
    /<h3 id=\{titleId\}>\{interview\.title\}<\/h3>/,
  );
  assert.doesNotMatch(
    pageSource,
    /\{interview\.company\} — 씨브레인 고객 인터뷰/,
  );
  assert.match(pageSource, /<footer className=\{styles\.reviewsCardMeta\}>/);
  assert.match(stylesSource, /list-style: none;/);
  assert.match(stylesSource, /\.reviewsFeaturedDivider::before/);
  assert.match(stylesSource, /\.reviewsFeaturedMeta p:first-child/);
  assert.match(stylesSource, /\.reviewsInterviewCopy blockquote/);
  assert.match(stylesSource, /\.reviewsTestimonialContent blockquote/);
});

test("customer interview data stays consistent for dynamic admin content", async () => {
  const contentSource = await readFile(contentPath, "utf8");

  assert.match(contentSource, /const customerInterviewPresentation[^=]*= \[/);
  assert.match(contentSource, /slug: "seojin-instech"/);
  assert.match(contentSource, /slug: "ninebell-healthcare"/);
  assert.match(contentSource, /slug: "chungkang-college"/);
  assert.match(contentSource, /thumbnail: reviewInterviewImage/);
  assert.match(contentSource, /thumbnail: reviewInterviewHealthcareImage/);
  assert.match(contentSource, /thumbnail: reviewInterviewEducationImage/);
  assert.match(
    contentSource,
    /headlineLines: \["처음 맡겼는데", "결과물이 기대 이상이였어요\."\]/,
  );
  assert.match(contentSource, /projectName: "게임 졸업 프로젝트 완료 보고서"/);
  assert.match(contentSource, /row\.kind === "interview"/);
  assert.match(contentSource, /row\.kind === "testimonial"/);
  assert.match(contentSource, /row\.show_on_landing/);
  assert.match(contentSource, /\.slice\(0, 3\)/);
  assert.match(
    contentSource,
    /export type CustomerInterviewProjectInfoId = "client" \| "deliverable" \| "usage";/,
  );
  assert.doesNotMatch(contentSource, /완료보고서를 선보이면서 긍정적인 피드백/);
  assert.doesNotMatch(contentSource, /export const customerInterviewDetails/);
});

test("customer reviews page reveals testimonials in responsive batches", async () => {
  const [pageSource, testimonialListSource] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(testimonialListPath, "utf8"),
  ]);
  const stylesSource = await readFile(stylesPath, "utf8");

  assert.match(pageSource, /additionalCustomerInterviews\.map/);
  assert.match(pageSource, /<CustomerTestimonialList testimonials=\{customerTestimonials\}/);
  assert.doesNotMatch(pageSource, /additionalCustomerInterviews\.slice/);
  assert.match(
    testimonialListSource,
    /const MOBILE_TESTIMONIALS_PER_PAGE = 4/,
  );
  assert.match(
    testimonialListSource,
    /const DESKTOP_TESTIMONIALS_PER_PAGE = 6/,
  );
  assert.match(
    testimonialListSource,
    /const MOBILE_TESTIMONIALS_MEDIA_QUERY = "\(max-width: 640px\)"/,
  );
  assert.match(
    testimonialListSource,
    /setVisibleCount\(getTestimonialsPerPage\(mediaQuery\)\)/,
  );
  assert.match(
    testimonialListSource,
    /currentCount\s*\+\s*getTestimonialsPerPage\(\s*window\.matchMedia\(MOBILE_TESTIMONIALS_MEDIA_QUERY\)/,
  );
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

test("customer reviews keep compact spacing through the 1080px breakpoint", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");
  const baseContent = extractCssBlock(stylesSource, ".reviewsContent");
  const baseSection = extractCssBlock(stylesSource, ".reviewsSectionBlock");
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
  const above1080Source = stylesSource.slice(
    stylesSource.lastIndexOf("@media (min-width: 1081px)"),
  );
  const above1080Media = extractCssBlock(
    above1080Source,
    "@media (min-width: 1081px)",
  );

  assert.match(baseContent, /padding: 72px 20px;/);
  assert.match(baseSection, /gap: 32px;/);
  assert.match(baseTestimonialGrid, /width: 100%;/);
  assert.match(baseTestimonialGrid, /gap: 8px;/);
  assert.doesNotMatch(baseTestimonialGrid, /gap: 20px;/);
  assert.doesNotMatch(
    desktopMedia,
    /\.reviewsTestimonialGrid\s*\{[^}]*gap: 20px;/s,
  );
  assert.doesNotMatch(
    desktopMedia,
    /\.reviewsTestimonialSection\s*\{[^}]*gap: 52px;/s,
  );
  assert.doesNotMatch(
    desktopMedia,
    /\.reviewsContent\s*\{[^}]*padding(?:-block)?: 104px/s,
  );
  assert.match(
    above1080Media,
    /\.reviewsContent\s*\{[^}]*padding-block: 104px;/s,
  );
  assert.match(
    above1080Media,
    /\.reviewsTestimonialSection\s*\{[^}]*gap: 52px;/s,
  );
  assert.match(
    above1080Media,
    /\.reviewsTestimonialGrid\s*\{[^}]*gap: 20px;/s,
  );
  assert.doesNotMatch(
    pcMedia,
    /\.reviewsTestimonialGrid\s*\{[^}]*gap: 20px;/s,
  );
});

test("customer testimonials are ready for dynamic admin data", async () => {
  const contentSource = await readFile(contentPath, "utf8");
  const testimonialListSource = await readFile(testimonialListPath, "utf8");
  const testimonialCardSource = await readFile(testimonialCardPath, "utf8");

  assert.match(contentSource, /export type CustomerTestimonial/);
  assert.match(contentSource, /id: row\.id/);
  assert.match(contentSource, /publishedAt: getPublishedAt\(row\)/);
  assert.match(contentSource, /title:/);
  assert.doesNotMatch(contentSource, /export const customerTestimonials\s*=\s*\[/);
  assert.match(testimonialListSource, /key=\{review\.id\}/);
  assert.match(
    testimonialCardSource,
    /aria-label=\{`\$\{props\.testimonial\.title\} 고객 후기`\}/,
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
    /\.reviewsHeroContent\s*\{[\s\S]*width: min\(100%, 390px\);[\s\S]*padding: var\(--site-page-top-offset\) 20px 72px;[\s\S]*position: relative;[\s\S]*display: flex;[\s\S]*flex-direction: column;[\s\S]*gap: 20px;/,
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
    /\.reviewsHeroContent\s*\{[\s\S]*padding: var\(--site-page-top-offset\) 20px 72px;/,
  );
  assert.match(
    tabletStyles,
    /\.reviewsHeroContent\s*\{[\s\S]*?width: min\(100%, 640px\);/,
  );
  assert.match(
    tabletStyles,
    /\.reviewsHeroContent\s*\{[\s\S]*?padding: var\(--site-page-top-offset\) 20px 72px;/,
  );
  assert.match(
    desktopStyles,
    /\.reviewsHeroContent\s*\{[\s\S]*?width: min\(100%, 1080px\);/,
  );
  assert.match(
    desktopStyles,
    /\.reviewsContent\s*\{[\s\S]*?width: min\(100%, 1120px\);/,
  );
  assert.doesNotMatch(
    extractCssBlock(stylesSource, ".reviewsPageHero"),
    /min-height:/,
  );
  assert.match(
    desktopStyles,
    /\.reviewsHeroContent\s*\{[\s\S]*?margin: 0 auto;[\s\S]*?padding: var\(--site-page-top-offset\) 80px 72px;/,
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
    /\.reviewsHeroContent\s*\{[\s\S]*?padding: var\(--site-page-top-offset\) 0 104px;/,
  );
  assert.match(
    pcStyles,
    /\.reviewsContent\s*\{[\s\S]*?width: min\(100%, 1120px\);/,
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
