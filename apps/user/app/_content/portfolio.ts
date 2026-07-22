import type { TableRow } from "@repo/supabase/types";

export type PortfolioCategoryId =
  | "brochure-catalog"
  | "leaflet-pamphlet"
  | "poster-flyer"
  | "banner-book"
  | "business-card-envelope"
  | "logo"
  | "package-shopping-bag"
  | "photo"
  | "etc";

export type PortfolioCategory = {
  id: PortfolioCategoryId;
  label: string;
};

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
  image: string;
  imageAlt: string;
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

export type PortfolioListHref =
  | "/portfolio"
  | `/portfolio?category=${PortfolioCategoryId}`;

export type PortfolioDetailHref =
  `/portfolio/${string}?category=${PortfolioCategoryId}`;

export const portfolioPageSeo: PortfolioSeo = {
  description:
    "씨브레인의 브로슈어, 카탈로그, 리플렛, 포스터, 명함 등 실제 디자인 제작 사례를 확인하세요.",
  keywords: [
    "씨브레인",
    "포트폴리오",
    "브로슈어 디자인",
    "카탈로그 제작",
    "리플렛 제작",
    "홍보물 디자인",
  ],
  title: "포트폴리오 | C-Brain",
};

type PortfolioItemSeed = Omit<
  PortfolioItem,
  "author" | "description" | "summary"
> & {
  description?: string;
  summary?: string;
};

export const portfolioCategories = [
  { id: "brochure-catalog", label: "브로슈어 · 카탈로그" },
  { id: "leaflet-pamphlet", label: "리플렛 · 팜플렛" },
  { id: "poster-flyer", label: "포스터 · 전단지" },
  { id: "banner-book", label: "배너 · 족자 · 현수막" },
  { id: "business-card-envelope", label: "명함 · 봉투" },
  { id: "logo", label: "로고" },
  { id: "package-shopping-bag", label: "패키지 · 쇼핑백" },
  { id: "photo", label: "촬영" },
  { id: "etc", label: "기타" },
] as const satisfies readonly PortfolioCategory[];

const portfolioDetailImages = {
  axis: {
    alt: "SAINTI AXis PHM 2단 접지 카탈로그 앞뒤면",
    src: "/figma-assets/portfolio-axis.png",
  },
  blackRed: {
    alt: "병원 의약품 공급 플랫폼 소개 리플렛 표지와 내지",
    src: "/figma-assets/portfolio-black-red.png",
  },
  blueBrochure: {
    alt: "한결정보기술 클라우드와 인공지능 기업 소개 브로슈어",
    src: "/figma-assets/portfolio-blue-brochure.png",
  },
  blueGuide: {
    alt: "중소기업 지원 제도 안내 팜플렛 표지와 펼침면",
    src: "/figma-assets/portfolio-blue-guide.png",
  },
  building: {
    alt: "성방산업 창호 제품 카탈로그 표지와 내지",
    src: "/figma-assets/portfolio-building.png",
  },
  card: {
    alt: "남이면 어울림한마당 행사 초청장 앞뒤면",
    src: "/figma-assets/portfolio-card.png",
  },
  green: {
    alt: "웰롯 시니어 웰니스 서비스 소개 리플렛",
    src: "/figma-assets/portfolio-green.png",
  },
  lab: {
    alt: "TEMES 전자현미경 분석센터 안내 리플렛",
    src: "/figma-assets/portfolio-lab.png",
  },
  orange: {
    alt: "화인아이앤씨 전자파 차폐 기술 회사 현황 브로슈어",
    src: "/figma-assets/portfolio-orange.png",
  },
  shinlim: {
    alt: "신림산업 S-BAG 제품 카탈로그 표지와 펼침면",
    src: "/figma-assets/portfolio-shinlim.png",
  },
  tmes: {
    alt: "TMS 산업 자동화 기업 소개 리플렛 표지와 펼침면",
    src: "/figma-assets/portfolio-tmes.png",
  },
  wedding: {
    alt: "케어나인 병원 서비스 안내 브로슈어 표지와 내지",
    src: "/figma-assets/portfolio-wedding.png",
  },
} as const satisfies Record<string, PortfolioDetailImage>;

const defaultPortfolioDescription =
  "대상 고객과 제작 목적에 맞춰 콘텐츠 구조와 시각 흐름을 정리한 포트폴리오 사례입니다. 브랜드의 핵심 메시지가 한눈에 들어오도록 표지, 본문, 그래픽 요소를 균형감 있게 구성했습니다.";

function createPortfolioItem(item: PortfolioItemSeed): PortfolioItem {
  return {
    ...item,
    author: "씨브레인",
    description: item.description ?? defaultPortfolioDescription,
    summary:
      item.summary ??
      `${item.client}의 제작 목적과 브랜드 톤에 맞춰 완성한 ${item.title}입니다.`,
  };
}

export const portfolioItems = [
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "신림산업㈜",
    detailImages: [
      portfolioDetailImages.shinlim,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-shinlim.png",
    imageAlt: "신림산업㈜ 제품 카탈로그 A4 16P 제작 사례",
    slug: "shinlim-product-catalog",
    title: "제품 카탈로그 A4 16P",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "세인티",
    detailImages: [
      portfolioDetailImages.axis,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.shinlim,
    ],
    image: "/figma-assets/portfolio-axis.png",
    imageAlt: "세인티 2단 접지 카탈로그 제작 사례",
    slug: "sainty-folded-catalog",
    title: "2단 접지 카탈로그",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "케어나인",
    detailImages: [
      portfolioDetailImages.wedding,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-wedding.png",
    imageAlt: "케어나인 병원 서비스 안내 브로슈어 제작 사례",
    slug: "care-nine-hospital-brochure",
    title: "병원 서비스 안내 브로슈어",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "TMES",
    detailImages: [
      portfolioDetailImages.tmes,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-tmes.png",
    imageAlt: "TMES 행사 안내 리플렛 제작 사례",
    slug: "tmes-event-leaflet",
    title: "행사 안내 리플렛",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "오렌지클래스",
    detailImages: [
      portfolioDetailImages.orange,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-orange.png",
    imageAlt: "오렌지클래스 프로모션 포스터 제작 사례",
    slug: "orange-class-poster",
    title: "프로모션 포스터",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "블랙레드",
    detailImages: [
      portfolioDetailImages.blackRed,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-black-red.png",
    imageAlt: "블랙레드 전시 홍보 배너 제작 사례",
    slug: "black-red-exhibition-banner",
    title: "전시 홍보 배너",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "랩프로젝트",
    detailImages: [
      portfolioDetailImages.lab,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-lab.png",
    imageAlt: "랩프로젝트 연구 소개 브로슈어 제작 사례",
    slug: "lab-project-brochure",
    title: "연구 소개 브로슈어",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "가이드랩",
    detailImages: [
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
      portfolioDetailImages.shinlim,
    ],
    image: "/figma-assets/portfolio-blue-guide.png",
    imageAlt: "가이드랩 서비스 안내 팜플렛 제작 사례",
    slug: "guide-lab-pamphlet",
    title: "서비스 안내 팜플렛",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "그린패키지",
    detailImages: [
      portfolioDetailImages.green,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-green.png",
    imageAlt: "그린패키지 브랜드 패키지 디자인 제작 사례",
    slug: "green-package-design",
    title: "브랜드 패키지 디자인",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "블루브로슈어",
    detailImages: [
      portfolioDetailImages.blueBrochure,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-blue-brochure.png",
    imageAlt: "블루브로슈어 기업 소개 브로슈어 제작 사례",
    slug: "blue-company-brochure",
    title: "기업 소개 브로슈어",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "빌딩파트너스",
    detailImages: [
      portfolioDetailImages.building,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-building.png",
    imageAlt: "빌딩파트너스 분양 안내 제작물 제작 사례",
    slug: "building-partners-sales-material",
    title: "분양 안내 제작물",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "카드스튜디오",
    detailImages: [
      portfolioDetailImages.card,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-card.png",
    imageAlt: "카드스튜디오 브랜드 명함 세트 제작 사례",
    slug: "card-studio-business-card",
    title: "브랜드 명함 세트",
  }),
  createPortfolioItem({
    categoryId: "leaflet-pamphlet",
    client: "가이드랩",
    detailImages: [
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.tmes,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-blue-guide.png",
    imageAlt: "가이드랩 서비스 안내 팜플렛 제작 사례",
    slug: "guide-lab-service-pamphlet",
    title: "서비스 안내 팜플렛",
  }),
  createPortfolioItem({
    categoryId: "poster-flyer",
    client: "오렌지클래스",
    detailImages: [
      portfolioDetailImages.orange,
      portfolioDetailImages.blackRed,
      portfolioDetailImages.blueGuide,
    ],
    image: "/figma-assets/portfolio-orange.png",
    imageAlt: "오렌지클래스 프로모션 포스터 제작 사례",
    slug: "orange-class-promotion-poster",
    title: "프로모션 포스터",
  }),
  createPortfolioItem({
    categoryId: "banner-book",
    client: "블랙레드",
    detailImages: [
      portfolioDetailImages.blackRed,
      portfolioDetailImages.orange,
      portfolioDetailImages.blueGuide,
    ],
    image: "/figma-assets/portfolio-black-red.png",
    imageAlt: "블랙레드 전시 홍보 배너 제작 사례",
    slug: "black-red-display-banner",
    title: "전시 홍보 배너",
  }),
  createPortfolioItem({
    categoryId: "business-card-envelope",
    client: "카드스튜디오",
    detailImages: [
      portfolioDetailImages.card,
      portfolioDetailImages.blueBrochure,
      portfolioDetailImages.blueGuide,
    ],
    image: "/figma-assets/portfolio-card.png",
    imageAlt: "카드스튜디오 브랜드 명함 세트 제작 사례",
    slug: "card-studio-brand-stationery",
    title: "브랜드 명함 세트",
  }),
  createPortfolioItem({
    categoryId: "logo",
    client: "씨브레인",
    detailImages: [
      portfolioDetailImages.green,
      portfolioDetailImages.card,
      portfolioDetailImages.blueGuide,
    ],
    image: "/figma-assets/portfolio-green.png",
    imageAlt: "씨브레인 브랜드 로고 응용안 제작 사례",
    slug: "cbrain-logo-application",
    title: "브랜드 로고 응용안",
  }),
  createPortfolioItem({
    categoryId: "photo",
    client: "스튜디오 케이스",
    detailImages: [
      portfolioDetailImages.lab,
      portfolioDetailImages.orange,
      portfolioDetailImages.blueGuide,
    ],
    image: "/figma-assets/portfolio-lab.png",
    imageAlt: "스튜디오 케이스 제품 촬영 연출 제작 사례",
    slug: "studio-case-product-photo",
    title: "제품 촬영 연출",
  }),
  createPortfolioItem({
    categoryId: "package-shopping-bag",
    client: "그린패키지",
    detailImages: [
      portfolioDetailImages.green,
      portfolioDetailImages.building,
      portfolioDetailImages.blueGuide,
    ],
    image: "/figma-assets/portfolio-green.png",
    imageAlt: "그린패키지 브랜드 패키지 디자인 제작 사례",
    slug: "green-package-shopping-bag",
    title: "브랜드 패키지 디자인",
  }),
  createPortfolioItem({
    categoryId: "etc",
    client: "빌딩파트너스",
    detailImages: [
      portfolioDetailImages.building,
      portfolioDetailImages.blueGuide,
      portfolioDetailImages.axis,
    ],
    image: "/figma-assets/portfolio-building.png",
    imageAlt: "빌딩파트너스 분양 안내 제작물 제작 사례",
    slug: "building-partners-real-estate-material",
    title: "분양 안내 제작물",
  }),
] as const satisfies readonly PortfolioItem[];

export const featuredPortfolioItems = portfolioItems.slice(0, 12);

type PortfolioAssetUrlResolver = (path: string) => string;

type StoredPortfolioImage = {
  alt: string;
  path: string;
};

function isPortfolioImagePath(path: string) {
  if (path.startsWith("/")) return path.length > 1 && !path.startsWith("//");

  return (
    !path.startsWith(".") &&
    !path.includes("\\") &&
    !/^[a-z][a-z\d+.-]*:/i.test(path)
  );
}

export function parsePortfolioImages(value: unknown): StoredPortfolioImage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((image) => {
    if (!image || typeof image !== "object") {
      return [];
    }

    const { alt, path } = image as Record<string, unknown>;

    const normalizedPath = typeof path === "string" ? path.trim() : "";

    return normalizedPath && isPortfolioImagePath(normalizedPath)
      ? [{ alt: typeof alt === "string" ? alt.trim() : "", path: normalizedPath }]
      : [];
  });
}

function getPortfolioCategoryId(type: string): PortfolioCategoryId {
  return (
    portfolioCategories.find(
      (category) => category.id === type || category.label === type,
    )?.id ?? portfolioCategories[0].id
  );
}

function getPortfolioAssetUrl(
  path: string,
  resolveAssetUrl: PortfolioAssetUrlResolver,
) {
  return path.startsWith("/") ? path : resolveAssetUrl(path);
}

function getPortfolioPlainText(
  content: string,
  contentMode: TableRow<"portfolio_items">["content_mode"],
) {
  if (contentMode === "text") return content;

  return content
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:div|h[1-6]|li|ol|p|section|ul)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
}

export function mapPortfolioRows(
  rows: readonly TableRow<"portfolio_items">[],
  resolveAssetUrl: PortfolioAssetUrlResolver,
): PortfolioItem[] {
  const pinnedRows = rows.filter((row) => row.is_pinned);
  const unpinnedRows = rows.filter((row) => !row.is_pinned);

  return [...pinnedRows, ...unpinnedRows].flatMap((row) => {
    const client = row.client_name?.trim() || "씨브레인";
    const storedImages = parsePortfolioImages(row.images);

    if (!storedImages.length && row.image_path) {
      storedImages.push(
        ...parsePortfolioImages([{ alt: "", path: row.image_path }]),
      );
    }

    if (!storedImages.length) return [];

    const detailImages = storedImages.map(({ alt, path }) => ({
      alt: alt || `${client} ${row.title} 제작 사례`,
      src: getPortfolioAssetUrl(path, resolveAssetUrl),
    }));
    const representativeImage = detailImages[0];
    if (!representativeImage) return [];

    const description = getPortfolioPlainText(
      row.content,
      row.content_mode,
    ).trim();

    return [{
      author: "씨브레인",
      categoryId: getPortfolioCategoryId(row.type.trim()),
      client,
      description:
        description || row.summary?.trim() || defaultPortfolioDescription,
      detailImages,
      image: representativeImage.src,
      imageAlt: representativeImage.alt,
      slug: row.slug,
      summary:
        row.summary?.trim() ||
        `${client}의 제작 목적과 브랜드 톤에 맞춰 완성한 ${row.title}입니다.`,
      title: row.title,
    }];
  });
}

const portfolioCategoryIds = new Set<PortfolioCategoryId>(
  portfolioCategories.map((category) => category.id),
);

const portfolioCategoryLabelById = new Map(
  portfolioCategories.map((category) => [category.id, category.label]),
);

export function getPortfolioCategoryIdFromValue(
  value: string | string[] | undefined,
): PortfolioCategoryId | undefined {
  const categoryId = Array.isArray(value) ? value[0] : value;

  if (!categoryId || !portfolioCategoryIds.has(categoryId as PortfolioCategoryId)) {
    return undefined;
  }

  return categoryId as PortfolioCategoryId;
}

export function getPortfolioCategoryLabel(
  categoryId: PortfolioCategoryId,
): string {
  return portfolioCategoryLabelById.get(categoryId) ?? "포트폴리오";
}

export function getPortfolioListHref(
  categoryId?: PortfolioCategoryId,
): PortfolioListHref {
  if (!categoryId) {
    return "/portfolio";
  }

  return `/portfolio?category=${categoryId}`;
}

export function getPortfolioDetailHref(
  item: PortfolioItem,
  categoryId: PortfolioCategoryId = item.categoryId,
): PortfolioDetailHref {
  return `/portfolio/${item.slug}?category=${categoryId}`;
}

export function getPortfolioItemBySlug(
  slug: string,
  items: readonly PortfolioItem[] = portfolioItems,
): PortfolioItem | undefined {
  return items.find((item) => item.slug === slug);
}

export function getRelatedPortfolioItems(
  currentSlug: string,
  limit = 3,
  items: readonly PortfolioItem[] = portfolioItems,
): PortfolioItem[] {
  const currentItem = getPortfolioItemBySlug(currentSlug, items);
  const sameCategoryItems = currentItem
    ? items.filter(
        (item) =>
          item.slug !== currentSlug && item.categoryId === currentItem.categoryId,
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
  items: readonly PortfolioItem[] = portfolioItems,
): PortfolioDetail | undefined {
  const item = getPortfolioItemBySlug(slug, items);

  if (!item) {
    return undefined;
  }

  return {
    categoryLabel: getPortfolioCategoryLabel(item.categoryId),
    item,
    relatedItems: getRelatedPortfolioItems(item.slug, 3, items),
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
