import {
  getPortfolioCategory as getSharedPortfolioCategory,
  getPortfolioCategoryLabel as getSharedPortfolioCategoryLabel,
  portfolioCategories as sharedPortfolioCategories,
} from "@repo/supabase/categories";
import type {
  PortfolioCategory as SharedPortfolioCategory,
  PortfolioCategoryId as SharedPortfolioCategoryId,
} from "@repo/supabase/categories";
import type { PublicPortfolioRecord } from "@repo/supabase";

export type PortfolioCategoryId = SharedPortfolioCategoryId;
export type PortfolioCategory = SharedPortfolioCategory;

export type PortfolioDetailImage = {
  alt: string;
  src: string;
};

export type PortfolioItem = {
  author: string;
  categoryId: PortfolioCategoryId;
  client: string;
  description: string;
  detailImages: readonly PortfolioDetailImage[];
  id: string;
  image: string;
  imageAlt: string;
  showOnLanding: boolean;
  slug: string;
  summary: string;
  title: string;
};

export type PortfolioDetail = {
  categoryLabel: string;
  item: PortfolioItem;
  relatedItems: PortfolioItem[];
};

export type PortfolioSeo = {
  description: string;
  keywords: string[];
  title: string;
};

export const portfolioCategories = sharedPortfolioCategories;

export const landingPortfolioCategorySearchParam = "portfolioCategory";

export type PortfolioListHref =
  | "/#portfolio"
  | "/portfolio"
  | `/portfolio?category=${PortfolioCategoryId}`
  | `/?${typeof landingPortfolioCategorySearchParam}=${PortfolioCategoryId}#portfolio`;

export type PortfolioDetailSource = "landing";

export type PortfolioDetailHref =
  | `/portfolio/${string}?category=${PortfolioCategoryId}`
  | `/portfolio/${string}?category=${PortfolioCategoryId}&from=${PortfolioDetailSource}`;

type PortfolioAssetUrlResolver = (path: string) => string;

type StoredPortfolioImage = {
  alt: string;
  path: string;
};

const defaultPortfolioDescription =
  "대상 고객과 제작 목적에 맞춰 콘텐츠 구조와 시각 흐름을 정리한 포트폴리오 사례입니다. 브랜드의 핵심 메시지가 한눈에 들어오도록 표지, 본문, 그래픽 요소를 균형감 있게 구성했습니다.";

function isPortfolioImagePath(path: string) {
  if (path.startsWith("/")) return path.length > 1 && !path.startsWith("//");

  return (
    !path.startsWith(".") &&
    !path.includes("\\") &&
    !/^[a-z][a-z\d+.-]*:/i.test(path)
  );
}

export function parsePortfolioImages(value: unknown): StoredPortfolioImage[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((image) => {
    if (!image || typeof image !== "object") return [];

    const { alt, path } = image as Record<string, unknown>;
    const normalizedPath = typeof path === "string" ? path.trim() : "";

    return normalizedPath && isPortfolioImagePath(normalizedPath)
      ? [
          {
            alt: typeof alt === "string" ? alt.trim() : "",
            path: normalizedPath,
          },
        ]
      : [];
  });
}

function getPortfolioCategoryId(type: string): PortfolioCategoryId | undefined {
  return getSharedPortfolioCategory(type)?.id;
}

function getPortfolioAssetUrl(
  path: string,
  resolveAssetUrl: PortfolioAssetUrlResolver,
) {
  return path.startsWith("/") ? path : resolveAssetUrl(path);
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripUnsafeHtml(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?(?:<\/script>|$)/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?(?:<\/style>|$)/gi, "");
}

function markdownToPlainText(value: string) {
  return stripUnsafeHtml(value)
    .replace(/^\s*(?:`{3,}|~{3,}).*$/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(
      /^[ \t]{0,3}(?:#{1,6}[ \t]+|>[ \t]?|[-+*][ \t]+|\d+[.)][ \t]+)/gm,
      "",
    )
    .replace(/<[^>]+>/g, "")
    .replace(/[*_~`]/g, "");
}

function getPortfolioPlainText(
  content: string,
  contentMode: PublicPortfolioRecord["content_mode"],
) {
  const text =
    contentMode === "html"
      ? stripUnsafeHtml(content)
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/(?:blockquote|div|h[1-6]|li|ol|p|section|ul)>/gi, "\n")
          .replace(/<[^>]+>/g, "")
      : markdownToPlainText(content);

  return decodeHtmlEntities(text)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function mapPortfolioRows(
  rows: readonly PublicPortfolioRecord[],
  resolveAssetUrl: PortfolioAssetUrlResolver,
): PortfolioItem[] {
  return rows.flatMap((row) => {
    const categoryId = getPortfolioCategoryId(row.type);
    const client = row.client_name?.trim() || "씨브레인";
    const storedImages = parsePortfolioImages(row.images);

    if (!categoryId || !storedImages.length) return [];

    const detailImages = storedImages.map(({ alt, path }) => ({
      alt: alt || `${client} ${row.title} 제작 사례`,
      src: getPortfolioAssetUrl(path, resolveAssetUrl),
    }));
    const representativeImage = detailImages[0];
    if (!representativeImage) return [];

    const description = getPortfolioPlainText(row.content, row.content_mode);

    return [
      {
        author: "씨브레인",
        categoryId,
        client,
        description: description || defaultPortfolioDescription,
        detailImages,
        id: row.id,
        image: representativeImage.src,
        imageAlt: representativeImage.alt,
        showOnLanding: row.show_on_landing,
        slug: row.slug,
        summary: `${client}의 제작 목적과 브랜드 톤에 맞춰 완성한 ${row.title}입니다.`,
        title: row.title,
      },
    ];
  });
}

export function getPortfolioCategoryIdFromValue(
  value: string | string[] | undefined,
): PortfolioCategoryId | undefined {
  const categoryValue = Array.isArray(value) ? value[0] : value;

  return categoryValue
    ? getSharedPortfolioCategory(categoryValue)?.id
    : undefined;
}

export function getPortfolioCategoryLabel(
  categoryId: PortfolioCategoryId,
): string {
  return getSharedPortfolioCategoryLabel(categoryId);
}

export function getPortfolioDetailSourceFromValue(
  value: string | string[] | undefined,
): PortfolioDetailSource | undefined {
  const source = Array.isArray(value) ? value[0] : value;

  return source === "landing" ? source : undefined;
}

export function getPortfolioListHref(
  categoryId?: PortfolioCategoryId,
  source?: PortfolioDetailSource,
): PortfolioListHref {
  if (source === "landing") {
    if (!categoryId) return "/#portfolio";

    return `/?${landingPortfolioCategorySearchParam}=${categoryId}#portfolio`;
  }

  if (!categoryId) return "/portfolio";

  return `/portfolio?category=${categoryId}`;
}

export function getPortfolioDetailHref(
  item: PortfolioItem,
  categoryId: PortfolioCategoryId = item.categoryId,
  source?: PortfolioDetailSource,
): PortfolioDetailHref {
  if (source === "landing") {
    return `/portfolio/${item.slug}?category=${categoryId}&from=${source}`;
  }

  return `/portfolio/${item.slug}?category=${categoryId}`;
}

export function getPortfolioItemBySlug(
  slug: string,
  items: readonly PortfolioItem[],
): PortfolioItem | undefined {
  return items.find((item) => item.slug === slug);
}

export function getRelatedPortfolioItems(
  currentSlug: string,
  items: readonly PortfolioItem[],
  limit = 3,
): PortfolioItem[] {
  const currentItem = getPortfolioItemBySlug(currentSlug, items);
  const sameCategoryItems = currentItem
    ? items.filter(
        (item) =>
          item.slug !== currentSlug &&
          item.categoryId === currentItem.categoryId,
      )
    : [];
  const fallbackItems = items.filter(
    (item) =>
      item.slug !== currentSlug &&
      !sameCategoryItems.some((relatedItem) => relatedItem.slug === item.slug),
  );

  return [...sameCategoryItems, ...fallbackItems].slice(0, limit);
}

export function getPortfolioDetailBySlug(
  slug: string,
  items: readonly PortfolioItem[],
): PortfolioDetail | undefined {
  const item = getPortfolioItemBySlug(slug, items);

  if (!item) return undefined;

  return {
    categoryLabel: getPortfolioCategoryLabel(item.categoryId),
    item,
    relatedItems: getRelatedPortfolioItems(item.slug, items, 3),
  };
}

export function getPortfolioDetailSeo(detail: PortfolioDetail): PortfolioSeo {
  const { categoryLabel, item } = detail;

  return {
    description: item.summary,
    keywords: [
      "씨브레인",
      categoryLabel,
      item.client,
      item.title,
      "디자인 제작 사례",
      "포트폴리오",
    ],
    title: `${item.title} - ${item.client} | C-Brain`,
  };
}
