import {
  getYouTubeEmbedUrl,
  getPublicAssetUrl,
  getPublishedReview,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
  listPublishedReviews,
  type TableRow,
} from "@repo/supabase";
import { connection } from "next/server";
import { cache } from "react";

import { createPublicUserSupabaseClient } from "../../lib/supabase";

export const reviewHeroImage = "/figma-assets/review-hero-office.png";

export const reviewInterviewImage =
  "/figma-assets/review-interview-brochure.png";
export const reviewInterviewHealthcareImage =
  "/figma-assets/review-interview-healthcare.png";
export const reviewInterviewEducationImage =
  "/figma-assets/review-interview-education.png";
export const reviewPlayLargeIcon = "/figma-assets/review-play-large.svg";
export const reviewPlaySmallIcon = "/figma-assets/review-play-small.svg";
export const reviewQuoteMarkIcon = "/figma-assets/review-quote-mark.svg";

export type CustomerInterviewContentBlock =
  | {
      id: string;
      text: string;
      type: "paragraph";
    }
  | {
      id: string;
      text: string;
      type: "heading";
    }
  | {
      cite: string;
      id: string;
      text: string;
      type: "quote";
    };

export type CustomerInterviewProjectInfoId = "client" | "deliverable" | "usage";

export type CustomerInterviewProjectInfo = {
  id: CustomerInterviewProjectInfoId;
  label: string;
  value: string;
};

export type CustomerInterviewDetail = {
  author: string;
  category: string;
  company: string;
  content: readonly CustomerInterviewContentBlock[];
  keywords: readonly string[];
  projectInfo: readonly CustomerInterviewProjectInfo[];
  projectInfoTitle: string;
  publishedAt: string;
  seoDescription: string;
  slug: string;
  thumbnail: string;
  title: string;
  videoAlt: string;
  videoUrl?: string;
  youtubeEmbedUrl?: string;
  youtubeUrl?: string;
};

export type CustomerInterviewDetailSeo = {
  description: string;
  keywords: string[];
  title: string;
};

type CustomerInterviewFeaturedConfig = {
  headlineLines: readonly string[];
  projectName: string;
};

type CustomerInterviewPresentation = {
  featured?: CustomerInterviewFeaturedConfig;
  industry: string;
  keywords: readonly string[];
  projectInfo: readonly CustomerInterviewProjectInfo[];
  slug: string;
  thumbnail: string;
};

export type CustomerInterviewCard = {
  category: string;
  company: string;
  detailSlug: string;
  id: string;
  meta: string;
  publishedAt: string;
  quote: string;
  thumbnail: string;
  title: string;
  videoAlt: string;
  videoUrl?: string;
};

export type FeaturedCustomerInterview = CustomerInterviewCard & {
  description: string;
  headlineLines: readonly string[];
  projectName: string;
};

export type CustomerTestimonial = {
  body: string;
  company: string;
  id: string;
  name: string;
  publishedAt: string;
  title: string;
};

export type CustomerReviewPageData = {
  customerInterviews: CustomerInterviewCard[];
  customerTestimonials: CustomerTestimonial[];
  featuredCustomerInterview: FeaturedCustomerInterview | null;
};

type ReviewRow = TableRow<"reviews">;
type AssetUrlResolver = (path: string) => string;

const customerInterviewPresentation: readonly CustomerInterviewPresentation[] = [
  {
    industry: "제조",
    keywords: [
      "씨브레인",
      "고객 인터뷰",
      "서진인스텍",
      "카탈로그 제작",
      "브로슈어 디자인",
    ],
    projectInfo: [
      { id: "client", label: "의뢰처", value: "서진인스텍" },
      {
        id: "deliverable",
        label: "제작물",
        value: "카탈로그 · 브로슈어",
      },
      {
        id: "usage",
        label: "활용",
        value: "전시회 배포 · 영업 자료 활용",
      },
    ],
    slug: "seojin-instech",
    thumbnail: reviewInterviewImage,
  },
  {
    industry: "헬스케어",
    keywords: [
      "씨브레인",
      "고객 인터뷰",
      "나인벨 헬스케어",
      "브로슈어 제작",
      "리플렛 디자인",
    ],
    projectInfo: [
      { id: "client", label: "의뢰처", value: "나인벨 헬스케어" },
      {
        id: "deliverable",
        label: "제작물",
        value: "브로슈어 · 리플렛",
      },
      {
        id: "usage",
        label: "활용",
        value: "제품 소개 · 고객 상담 자료 활용",
      },
    ],
    slug: "ninebell-healthcare",
    thumbnail: reviewInterviewHealthcareImage,
  },
  {
    featured: {
      headlineLines: ["처음 맡겼는데", "결과물이 기대 이상이였어요."],
      projectName: "게임 졸업 프로젝트 완료 보고서",
    },
    industry: "교육",
    keywords: [
      "씨브레인",
      "고객 인터뷰",
      "청강문화산업대학교",
      "게임 졸업작품 완료보고서",
      "보고서 디자인",
    ],
    projectInfo: [
      {
        id: "client",
        label: "의뢰처",
        value: "청강문화산업대학교 게임콘텐츠스쿨",
      },
      {
        id: "deliverable",
        label: "제작물",
        value: "게임 졸업 프로젝트 완료보고서",
      },
      {
        id: "usage",
        label: "활용",
        value: "졸업작품 전시회 배포 · 상용화 피드백 수집",
      },
    ],
    slug: "chungkang-college",
    thumbnail: reviewInterviewEducationImage,
  },
] as const;

function getPresentation(slug: string) {
  return customerInterviewPresentation.find((item) => item.slug === slug);
}

function getPublishedAt(row: ReviewRow) {
  return row.published_at ?? row.created_at;
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#(\d+);/g, (entity, code) => {
      const codePoint = Number(code);
      return Number.isSafeInteger(codePoint) &&
        codePoint >= 0 &&
        codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity;
    })
    .replace(/&#x([\da-f]+);/gi, (entity, code) => {
      const codePoint = Number.parseInt(code, 16);
      return Number.isSafeInteger(codePoint) &&
        codePoint >= 0 &&
        codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity;
    })
    .replace(/&([a-z]+);/gi, (entity, name) => namedEntities[name] ?? entity);
}

function stripUnsafeElements(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?(?:<\/script>|$)/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?(?:<\/style>|$)/gi, " ");
}

function htmlToPlainText(value: string) {
  return stripUnsafeElements(decodeHtmlEntities(value))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:blockquote|div|h[1-6]|li|p)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function markdownLineToPlainText(value: string) {
  return stripUnsafeElements(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toCustomerInterviewContentBlocks(
  row: ReviewRow,
): CustomerInterviewContentBlock[] {
  const blocks: CustomerInterviewContentBlock[] = [];
  const addBlock = (
    type: CustomerInterviewContentBlock["type"],
    text: string,
  ) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const id = `${row.id}-${type}-${blocks.length}`;

    if (type === "quote") {
      blocks.push({ cite: row.company_name, id, text: cleanText, type });
      return;
    }

    blocks.push({ id, text: cleanText, type });
  };

  if (row.content_mode === "html") {
    for (const paragraph of htmlToPlainText(row.content).split(/\n+/)) {
      addBlock("paragraph", paragraph);
    }

    return blocks;
  }

  let paragraphLines: string[] = [];
  const flushParagraph = () => {
    addBlock("paragraph", paragraphLines.join(" "));
    paragraphLines = [];
  };

  const safeContent = stripUnsafeElements(decodeHtmlEntities(row.content));

  for (const rawLine of safeContent.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      addBlock("heading", markdownLineToPlainText(heading[1] ?? ""));
      continue;
    }

    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      flushParagraph();
      addBlock("quote", markdownLineToPlainText(quote[1] ?? ""));
      continue;
    }

    paragraphLines.push(markdownLineToPlainText(line));
  }

  flushParagraph();
  return blocks;
}

function getPlainReviewContent(row: ReviewRow) {
  return toCustomerInterviewContentBlocks(row)
    .map((block) => block.text)
    .join(" ")
    .trim();
}

function getDefaultProjectInfo(row: ReviewRow): CustomerInterviewProjectInfo[] {
  return [
    { id: "client", label: "의뢰처", value: row.company_name },
    { id: "deliverable", label: "제작물", value: "고객 인터뷰" },
    { id: "usage", label: "활용", value: "고객 사례" },
  ];
}

function getProjectValue(
  projectInfo: readonly CustomerInterviewProjectInfo[],
  id: CustomerInterviewProjectInfoId,
) {
  return projectInfo.find((item) => item.id === id)?.value;
}

export function mapCustomerInterviewDetail(
  row: ReviewRow,
  resolveAssetUrl: AssetUrlResolver = (path) => path,
): CustomerInterviewDetail {
  const slug = row.slug ?? row.id;
  const presentation = getPresentation(slug);
  const content = toCustomerInterviewContentBlocks(row);
  const title = row.title?.trim() || `${row.company_name} 고객 인터뷰`;
  const seoDescription =
    row.seo_description?.trim() ||
    content.find((block) => block.type === "paragraph")?.text ||
    title;
  const videoPath = row.video_path?.trim();
  const youtubeVideoId = row.youtube_video_id?.trim();
  const youtubeUrl = youtubeVideoId ? getYouTubeWatchUrl(youtubeVideoId) : null;
  const youtubeEmbedUrl = youtubeVideoId
    ? getYouTubeEmbedUrl(youtubeVideoId)
    : null;
  const youtubeThumbnailUrl = youtubeVideoId
    ? getYouTubeThumbnailUrl(youtubeVideoId)
    : null;

  return {
    author: "씨브레인",
    category: "고객 인터뷰",
    company: row.company_name,
    content,
    keywords: presentation?.keywords ?? [
      "씨브레인",
      "고객 인터뷰",
      row.company_name,
    ],
    projectInfo: presentation?.projectInfo ?? getDefaultProjectInfo(row),
    projectInfoTitle: "프로젝트 정보",
    publishedAt: getPublishedAt(row),
    seoDescription,
    slug,
    thumbnail:
      youtubeThumbnailUrl ?? presentation?.thumbnail ?? reviewInterviewImage,
    title,
    videoAlt: row.video_alt?.trim() || `${row.company_name} 고객 인터뷰 영상`,
    ...(youtubeUrl && youtubeEmbedUrl
      ? { youtubeEmbedUrl, youtubeUrl }
      : videoPath
        ? { videoUrl: resolveAssetUrl(videoPath) }
        : {}),
  };
}

function toCustomerInterviewCard(
  detail: CustomerInterviewDetail,
): CustomerInterviewCard {
  const presentation = getPresentation(detail.slug);
  const projectName = getProjectValue(detail.projectInfo, "deliverable");
  const quote =
    detail.content.find((block) => block.type === "quote")?.text ??
    detail.seoDescription;

  return {
    category: presentation?.industry ?? "고객사",
    company: detail.company,
    detailSlug: detail.slug,
    id: detail.slug,
    meta: projectName
      ? `${detail.company} · ${projectName}`
      : detail.company,
    publishedAt: detail.publishedAt,
    quote,
    thumbnail: detail.thumbnail,
    title: detail.title,
    videoAlt: detail.videoAlt,
    ...(detail.videoUrl ? { videoUrl: detail.videoUrl } : {}),
  };
}

function toFeaturedCustomerInterview(
  detail: CustomerInterviewDetail,
): FeaturedCustomerInterview {
  const presentation = getPresentation(detail.slug);
  const card = toCustomerInterviewCard(detail);
  const quote =
    detail.content.find((block) => block.type === "quote")?.text ??
    detail.seoDescription;
  const description =
    detail.content.find((block) => block.type === "paragraph")?.text ??
    detail.seoDescription;

  return {
    ...card,
    description,
    headlineLines: presentation?.featured?.headlineLines ?? [quote],
    projectName:
      presentation?.featured?.projectName ??
      getProjectValue(detail.projectInfo, "deliverable") ??
      detail.company,
  };
}

function mapCustomerTestimonial(row: ReviewRow): CustomerTestimonial {
  const company = row.company_name.trim();

  return {
    body: getPlainReviewContent(row),
    company,
    id: row.id,
    name: row.manager_name?.trim() || "고객님",
    publishedAt: getPublishedAt(row),
    title: row.title?.trim() || `${company} 후기`,
  };
}

export function mapCustomerReviewRows(
  rows: readonly ReviewRow[],
  resolveAssetUrl: AssetUrlResolver = (path) => path,
): CustomerReviewPageData {
  const publishedRows = rows.filter((row) => row.status === "published");
  const interviewDetails = publishedRows
    .filter((row) => row.kind === "interview")
    .map((row) => mapCustomerInterviewDetail(row, resolveAssetUrl));
  const featuredDetail =
    interviewDetails.find((detail) => getPresentation(detail.slug)?.featured) ??
    interviewDetails[0];

  return {
    customerInterviews: interviewDetails.map(toCustomerInterviewCard),
    customerTestimonials: publishedRows
      .filter((row) => row.kind === "testimonial")
      .map(mapCustomerTestimonial),
    featuredCustomerInterview: featuredDetail
      ? toFeaturedCustomerInterview(featuredDetail)
      : null,
  };
}

export function mapLandingCustomerTestimonials(
  rows: readonly ReviewRow[],
): CustomerTestimonial[] {
  return rows
    .filter(
      (row) =>
        row.status === "published" &&
        row.kind === "testimonial" &&
        row.show_on_landing,
    )
    .map(mapCustomerTestimonial)
    .slice(0, 3);
}

export function getCustomerInterviewDetailSeo(
  detail: CustomerInterviewDetail,
): CustomerInterviewDetailSeo {
  return {
    description: detail.seoDescription,
    keywords: [...detail.keywords],
    title: `${detail.title} | C-Brain`,
  };
}

function emptyCustomerReviewPageData(): CustomerReviewPageData {
  return {
    customerInterviews: [],
    customerTestimonials: [],
    featuredCustomerInterview: null,
  };
}

async function loadCustomerReviewPageData() {
  await connection();

  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return emptyCustomerReviewPageData();

    const rows = await listPublishedReviews(client);
    return mapCustomerReviewRows(rows, (path) => getPublicAssetUrl(client, path));
  } catch (error) {
    console.error("Failed to load published customer reviews.", error);
    return emptyCustomerReviewPageData();
  }
}

async function loadLandingCustomerTestimonials() {
  await connection();

  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return [];

    const rows = await listPublishedReviews(client);
    return mapLandingCustomerTestimonials(rows);
  } catch (error) {
    console.error("Failed to load landing customer reviews.", error);
    return [];
  }
}

async function loadPublishedCustomerInterviewDetailBySlug(slug: string) {
  await connection();

  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return undefined;

    const row = await getPublishedReview(client, slug);
    if (!row || row.kind !== "interview") return undefined;

    return mapCustomerInterviewDetail(row, (path) =>
      getPublicAssetUrl(client, path),
    );
  } catch (error) {
    console.error("Failed to load published customer interview.", error);
    return undefined;
  }
}

export const getCustomerReviewPageData = cache(loadCustomerReviewPageData);
export const getLandingCustomerTestimonials = cache(
  loadLandingCustomerTestimonials,
);
export const getPublishedCustomerInterviewDetailBySlug = cache(
  loadPublishedCustomerInterviewDetailBySlug,
);
