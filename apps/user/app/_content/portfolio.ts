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

export const PORTFOLIO_SCROLL_RESTORE_KEY = "portfolio-scroll-restore";

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
  "author" | "description" | "detailImages" | "summary"
> & {
  description?: string;
  detailImageSources?: readonly string[];
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

const fallbackPortfolioImages = [
  "/figma-assets/portfolio-blue-guide.png",
  "/figma-assets/portfolio-axis.png",
  "/figma-assets/portfolio-shinlim.png",
  "/figma-assets/portfolio-wedding.png",
] as const;

const categoryDetailImageSources: Record<
  PortfolioCategoryId,
  readonly string[]
> = {
  "banner-book": [
    "/figma-assets/portfolio-black-red.png",
    "/figma-assets/portfolio-orange.png",
  ],
  "brochure-catalog": [
    "/figma-assets/portfolio-blue-guide.png",
    "/figma-assets/portfolio-axis.png",
  ],
  "business-card-envelope": [
    "/figma-assets/portfolio-card.png",
    "/figma-assets/portfolio-blue-brochure.png",
  ],
  etc: [
    "/figma-assets/portfolio-building.png",
    "/figma-assets/portfolio-blue-guide.png",
  ],
  "leaflet-pamphlet": [
    "/figma-assets/portfolio-tmes.png",
    "/figma-assets/portfolio-blue-guide.png",
  ],
  logo: [
    "/figma-assets/portfolio-green.png",
    "/figma-assets/portfolio-card.png",
  ],
  "package-shopping-bag": [
    "/figma-assets/portfolio-green.png",
    "/figma-assets/portfolio-building.png",
  ],
  photo: [
    "/figma-assets/portfolio-lab.png",
    "/figma-assets/portfolio-orange.png",
  ],
  "poster-flyer": [
    "/figma-assets/portfolio-orange.png",
    "/figma-assets/portfolio-black-red.png",
  ],
};

const defaultPortfolioDescription =
  "대상 고객과 제작 목적에 맞춰 콘텐츠 구조와 시각 흐름을 정리한 포트폴리오 사례입니다. 브랜드의 핵심 메시지가 한눈에 들어오도록 표지, 본문, 그래픽 요소를 균형감 있게 구성했습니다.";

function createDetailImages(item: PortfolioItemSeed): PortfolioDetailImage[] {
  const sources = [
    item.image,
    ...(item.detailImageSources ?? categoryDetailImageSources[item.categoryId]),
    ...fallbackPortfolioImages,
  ].filter((source, index, array) => array.indexOf(source) === index);

  return sources.slice(0, 3).map((src, index) => ({
    alt: `${item.client} ${item.title} 상세 디자인 ${index + 1}`,
    src,
  }));
}

function createPortfolioItem(item: PortfolioItemSeed): PortfolioItem {
  return {
    ...item,
    author: "씨브레인",
    description: item.description ?? defaultPortfolioDescription,
    detailImages: createDetailImages(item),
    summary:
      item.summary ??
      `${item.client}의 제작 목적과 브랜드 톤에 맞춰 완성한 ${item.title}입니다.`,
  };
}

export const portfolioItems = [
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "신림산업㈜",
    image: "/figma-assets/portfolio-shinlim.png",
    imageAlt: "신림산업㈜ 제품 카탈로그 A4 16P 제작 사례",
    slug: "shinlim-product-catalog",
    title: "제품 카탈로그 A4 16P",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "세인티",
    image: "/figma-assets/portfolio-axis.png",
    imageAlt: "세인티 2단 접지 카탈로그 제작 사례",
    slug: "sainty-folded-catalog",
    title: "2단 접지 카탈로그",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "케어나인",
    image: "/figma-assets/portfolio-wedding.png",
    imageAlt: "케어나인 병원 서비스 안내 브로슈어 제작 사례",
    slug: "care-nine-hospital-brochure",
    title: "병원 서비스 안내 브로슈어",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "TMES",
    image: "/figma-assets/portfolio-tmes.png",
    imageAlt: "TMES 행사 안내 리플렛 제작 사례",
    slug: "tmes-event-leaflet",
    title: "행사 안내 리플렛",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "오렌지클래스",
    image: "/figma-assets/portfolio-orange.png",
    imageAlt: "오렌지클래스 프로모션 포스터 제작 사례",
    slug: "orange-class-poster",
    title: "프로모션 포스터",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "블랙레드",
    image: "/figma-assets/portfolio-black-red.png",
    imageAlt: "블랙레드 전시 홍보 배너 제작 사례",
    slug: "black-red-exhibition-banner",
    title: "전시 홍보 배너",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "랩프로젝트",
    image: "/figma-assets/portfolio-lab.png",
    imageAlt: "랩프로젝트 연구 소개 브로슈어 제작 사례",
    slug: "lab-project-brochure",
    title: "연구 소개 브로슈어",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "가이드랩",
    image: "/figma-assets/portfolio-blue-guide.png",
    imageAlt: "가이드랩 서비스 안내 팜플렛 제작 사례",
    slug: "guide-lab-pamphlet",
    title: "서비스 안내 팜플렛",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "그린패키지",
    image: "/figma-assets/portfolio-green.png",
    imageAlt: "그린패키지 브랜드 패키지 디자인 제작 사례",
    slug: "green-package-design",
    title: "브랜드 패키지 디자인",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "블루브로슈어",
    image: "/figma-assets/portfolio-blue-brochure.png",
    imageAlt: "블루브로슈어 기업 소개 브로슈어 제작 사례",
    slug: "blue-company-brochure",
    title: "기업 소개 브로슈어",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "빌딩파트너스",
    image: "/figma-assets/portfolio-building.png",
    imageAlt: "빌딩파트너스 분양 안내 제작물 제작 사례",
    slug: "building-partners-sales-material",
    title: "분양 안내 제작물",
  }),
  createPortfolioItem({
    categoryId: "brochure-catalog",
    client: "카드스튜디오",
    image: "/figma-assets/portfolio-card.png",
    imageAlt: "카드스튜디오 브랜드 명함 세트 제작 사례",
    slug: "card-studio-business-card",
    title: "브랜드 명함 세트",
  }),
  createPortfolioItem({
    categoryId: "leaflet-pamphlet",
    client: "가이드랩",
    image: "/figma-assets/portfolio-blue-guide.png",
    imageAlt: "가이드랩 서비스 안내 팜플렛 제작 사례",
    slug: "guide-lab-service-pamphlet",
    title: "서비스 안내 팜플렛",
  }),
  createPortfolioItem({
    categoryId: "poster-flyer",
    client: "오렌지클래스",
    image: "/figma-assets/portfolio-orange.png",
    imageAlt: "오렌지클래스 프로모션 포스터 제작 사례",
    slug: "orange-class-promotion-poster",
    title: "프로모션 포스터",
  }),
  createPortfolioItem({
    categoryId: "banner-book",
    client: "블랙레드",
    image: "/figma-assets/portfolio-black-red.png",
    imageAlt: "블랙레드 전시 홍보 배너 제작 사례",
    slug: "black-red-display-banner",
    title: "전시 홍보 배너",
  }),
  createPortfolioItem({
    categoryId: "business-card-envelope",
    client: "카드스튜디오",
    image: "/figma-assets/portfolio-card.png",
    imageAlt: "카드스튜디오 브랜드 명함 세트 제작 사례",
    slug: "card-studio-brand-stationery",
    title: "브랜드 명함 세트",
  }),
  createPortfolioItem({
    categoryId: "logo",
    client: "씨브레인",
    image: "/figma-assets/portfolio-green.png",
    imageAlt: "씨브레인 브랜드 로고 응용안 제작 사례",
    slug: "cbrain-logo-application",
    title: "브랜드 로고 응용안",
  }),
  createPortfolioItem({
    categoryId: "photo",
    client: "스튜디오 케이스",
    image: "/figma-assets/portfolio-lab.png",
    imageAlt: "스튜디오 케이스 제품 촬영 연출 제작 사례",
    slug: "studio-case-product-photo",
    title: "제품 촬영 연출",
  }),
  createPortfolioItem({
    categoryId: "package-shopping-bag",
    client: "그린패키지",
    image: "/figma-assets/portfolio-green.png",
    imageAlt: "그린패키지 브랜드 패키지 디자인 제작 사례",
    slug: "green-package-shopping-bag",
    title: "브랜드 패키지 디자인",
  }),
  createPortfolioItem({
    categoryId: "etc",
    client: "빌딩파트너스",
    image: "/figma-assets/portfolio-building.png",
    imageAlt: "빌딩파트너스 분양 안내 제작물 제작 사례",
    slug: "building-partners-real-estate-material",
    title: "분양 안내 제작물",
  }),
] as const satisfies readonly PortfolioItem[];

export const featuredPortfolioItems = portfolioItems.slice(0, 12);

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
): PortfolioItem | undefined {
  return portfolioItems.find((item) => item.slug === slug);
}

export function getRelatedPortfolioItems(
  currentSlug: string,
  limit = 3,
): PortfolioItem[] {
  const currentItem = getPortfolioItemBySlug(currentSlug);
  const sameCategoryItems = currentItem
    ? portfolioItems.filter(
        (item) =>
          item.slug !== currentSlug && item.categoryId === currentItem.categoryId,
      )
    : [];
  const fallbackItems = portfolioItems.filter(
    (item) =>
      item.slug !== currentSlug &&
      !sameCategoryItems.some((relatedItem) => relatedItem.slug === item.slug),
  );

  return [...sameCategoryItems, ...fallbackItems].slice(0, limit);
}

export function getPortfolioDetailBySlug(
  slug: string,
): PortfolioDetail | undefined {
  const item = getPortfolioItemBySlug(slug);

  if (!item) {
    return undefined;
  }

  return {
    categoryLabel: getPortfolioCategoryLabel(item.categoryId),
    item,
    relatedItems: getRelatedPortfolioItems(item.slug),
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
