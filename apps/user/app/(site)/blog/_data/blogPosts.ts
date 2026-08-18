import { normalizeBlogCategory } from "@repo/supabase/categories";
import type { PublicPostRecord } from "@repo/supabase";

import type {
  BlogContentBlock,
  BlogPost,
  BlogPostDetail,
} from "../_types/blog";

export type BlogDetailSeo = {
  description: string;
  keywords: string[];
  title: string;
};

type BlogAssetUrlResolver = (path: string) => string;

const defaultBlogKeywords = [
  "씨브레인",
  "홍보물 제작",
  "브로슈어 제작",
  "카탈로그 제작",
  "인쇄 실무",
] as const;

const defaultBlogImage = "/figma-assets/blog-brochure.png";

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function getBlogPlainText(
  content: string,
  contentMode: PublicPostRecord["content_mode"],
) {
  const text =
    contentMode === "html"
      ? content
          .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/(?:blockquote|div|h[1-6]|li|ol|p|section|ul)>/gi, "\n\n")
          .replace(/<[^>]+>/g, "")
      : content;

  return decodeHtmlEntities(text)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getCompactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateSummary(value: string, maxLength = 160) {
  if (value.length <= maxLength) return value;

  return `${value.slice(0, maxLength).trimEnd()}…`;
}

function formatPublishedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(date);
  const datePart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${datePart("year")}. ${datePart("month")}. ${datePart("day")}`;
}

function isBlogImagePath(path: string) {
  if (path.startsWith("/")) return path.length > 1 && !path.startsWith("//");

  return (
    !path.startsWith(".") &&
    !path.includes("\\") &&
    !/^[a-z][a-z\d+.-]*:/i.test(path)
  );
}

function getBlogImage(
  path: string | null,
  resolveAssetUrl: BlogAssetUrlResolver,
) {
  const normalizedPath = path?.trim() ?? "";

  if (!normalizedPath || !isBlogImagePath(normalizedPath)) {
    return defaultBlogImage;
  }

  return normalizedPath.startsWith("/")
    ? normalizedPath
    : resolveAssetUrl(normalizedPath);
}

function createBlogBody(
  row: PublicPostRecord,
  plainText: string,
  summary: string,
): BlogContentBlock[] {
  const paragraphs = (plainText || summary)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.map((text, index) => ({
    id: `${row.id}-paragraph-${index + 1}`,
    text,
    type: "paragraph",
  }));
}

function createBlogDetail(
  row: PublicPostRecord,
  plainText: string,
  summary: string,
): BlogPostDetail {
  return {
    body: createBlogBody(row, plainText, summary),
    keywords: [
      ...new Set([...defaultBlogKeywords, row.type.trim(), row.title.trim()]),
    ],
    seoDescription: row.seo_description?.trim() || summary,
  };
}

export function mapBlogRows(
  rows: readonly PublicPostRecord[],
  resolveAssetUrl: BlogAssetUrlResolver,
): BlogPost[] {
  let landingRank = 0;
  let bannerRank = 0;
  let popularRank = 0;

  return rows.map((row) => {
    const plainText = getBlogPlainText(row.content, row.content_mode);
    const summary =
      row.excerpt?.trim() ||
      row.seo_description?.trim() ||
      truncateSummary(getCompactText(plainText)) ||
      row.title;

    return {
      author: "씨브레인",
      bannerRank: row.show_as_banner ? ++bannerRank : undefined,
      category: normalizeBlogCategory(row.type),
      detail: createBlogDetail(row, plainText, summary),
      id: row.id,
      image: getBlogImage(row.thumbnail_path, resolveAssetUrl),
      imageAlt: row.thumbnail_alt?.trim() || row.title,
      landingRank: row.show_on_landing ? ++landingRank : undefined,
      popularRank: row.featured ? ++popularRank : undefined,
      publishedAt: formatPublishedAt(row.published_at),
      publishedAtIso: row.published_at,
      slug: row.slug,
      summary,
      title: row.title,
    };
  });
}

export function getBlogPostBySlug(
  slug: string,
  posts: readonly BlogPost[],
): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(
  currentSlug: string,
  posts: readonly BlogPost[],
  limit = 3,
): BlogPost[] {
  const currentPost = getBlogPostBySlug(currentSlug, posts);
  const sameCategoryPosts = currentPost
    ? posts.filter(
        (post) =>
          post.slug !== currentSlug && post.category === currentPost.category,
      )
    : [];
  const fallbackPosts = posts.filter(
    (post) =>
      post.slug !== currentSlug &&
      !sameCategoryPosts.some((relatedPost) => relatedPost.slug === post.slug),
  );

  return [...sameCategoryPosts, ...fallbackPosts].slice(0, limit);
}

export function getBlogDetailSeo(post: BlogPost): BlogDetailSeo {
  return {
    description: post.detail.seoDescription,
    keywords: [...post.detail.keywords],
    title: `${post.title} | C-Brain Blog`,
  };
}
