import type { Metadata } from "next";

export type StaticPageSeoEntry = {
  description: string;
  keywords: readonly string[];
  path: `/${string}` | "/";
  title: string;
};

export const siteSeo = {
  defaultDescription:
    "씨브레인은 브로슈어, 카탈로그, 리플렛, 포스터 등 홍보물 기획부터 디자인, 인쇄까지 원스톱으로 제공하는 편집디자인 전문회사입니다.",
  defaultKeywords: [
    "씨브레인",
    "C-Brain",
    "브로슈어 제작",
    "카탈로그 제작",
    "홍보물 디자인",
    "편집디자인",
  ],
  defaultTitle: "씨브레인 | C-Brain",
  name: "C-Brain",
  url: "https://cbrain.kr",
} as const;

const defaultSocialImage = {
  alt: "씨브레인 홍보물 제작·디자인·인쇄 원스톱 전문",
  height: 3200,
  url: "/opengraph-image.png",
  width: 4800,
} as const;

export const homeSeo = {
  description: siteSeo.defaultDescription,
  keywords: siteSeo.defaultKeywords,
  path: "/",
  title: siteSeo.defaultTitle,
} as const satisfies StaticPageSeoEntry;

export const aboutSeo = {
  description:
    "2000년 설립 이후 전국 1,200여 곳과 함께해 온 씨브레인의 회사 소개, 연혁, 주요 협력 이력과 위치 정보를 확인하세요.",
  keywords: [
    "씨브레인 회사소개",
    "C-Brain",
    "편집디자인 회사",
    "브로슈어 제작 회사",
    "카탈로그 제작 회사",
  ],
  path: "/about",
  title: "회사소개 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const portfolioSeo = {
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
  path: "/portfolio",
  title: "포트폴리오 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const reviewsSeo = {
  description:
    "씨브레인과 함께 브로슈어, 카탈로그, 홍보물 제작을 진행한 고객 인터뷰와 후기를 확인하세요.",
  keywords: [
    "씨브레인 고객후기",
    "브로슈어 제작 후기",
    "카탈로그 제작 후기",
    "홍보물 디자인 후기",
    "편집디자인 후기",
  ],
  path: "/reviews",
  title: "고객 후기 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const blogSeo = {
  description:
    "26년 경력 전문가 씨브레인이 직접 작성하는 브로슈어, 카탈로그, 디자인, 인쇄 실무 정보입니다.",
  keywords: [
    "브로슈어 제작 팁",
    "카탈로그 제작 가이드",
    "홍보물 디자인",
    "인쇄 실무",
    "씨브레인 블로그",
  ],
  path: "/blog",
  title: "블로그 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const noticeSeo = {
  description: "씨브레인의 공식 소식과 안내를 빠르게 확인하세요.",
  keywords: [
    "씨브레인 공지사항",
    "C-Brain 공지",
    "홍보물 제작 안내",
    "인쇄 제작 공지",
  ],
  path: "/notice",
  title: "공지사항 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const faqSeo = {
  description:
    "브로슈어, 카탈로그, 리플렛 등 홍보물 제작·주문·결제·납기에 관한 자주 묻는 질문과 가이드를 확인하세요.",
  keywords: [
    "씨브레인 FAQ",
    "홍보물 제작 가이드",
    "브로슈어 제작 문의",
    "카탈로그 주문",
    "인쇄 납기",
  ],
  path: "/faq",
  title: "FAQ & 가이드 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const orderSeo = {
  description:
    "씨브레인 홍보물 제작 가격을 확인하고 브로슈어, 카탈로그, 리플렛 등 필요한 제작물을 주문하세요.",
  keywords: [
    "홍보물 제작 가격",
    "브로슈어 주문",
    "카탈로그 주문",
    "리플렛 제작",
    "씨브레인 주문 결제",
  ],
  path: "/order",
  title: "주문·결제 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const complaintSeo = {
  description:
    "씨브레인 서비스 이용 중 불편했던 점을 접수하고 답변을 받을 수 있는 고객 지원 페이지입니다.",
  keywords: [
    "씨브레인 불편 접수",
    "고객 지원",
    "문의 접수",
    "서비스 불편 접수",
  ],
  path: "/complaint",
  title: "불편 접수 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const privacyPolicySeo = {
  description: "씨브레인의 개인정보처리방침을 확인하세요.",
  keywords: ["씨브레인 개인정보처리방침", "개인정보 처리방침"],
  path: "/privacy-policy",
  title: "개인정보처리방침 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const privacyCollectionSeo = {
  description: "씨브레인의 개인정보 수집 및 이용 동의 내용을 확인하세요.",
  keywords: [
    "씨브레인 개인정보 수집",
    "개인정보 수집 및 이용",
    "개인정보 수집 동의",
  ],
  path: "/privacy-collection",
  title: "개인정보 수집 및 이용 동의 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const termsSeo = {
  description: "씨브레인 인쇄·디자인 서비스 이용약관을 확인하세요.",
  keywords: ["씨브레인 이용약관", "인쇄 서비스 이용약관"],
  path: "/terms",
  title: "이용약관 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const refundPolicySeo = {
  description: "씨브레인 인쇄·디자인 서비스의 취소 및 환불 규정을 확인하세요.",
  keywords: ["씨브레인 환불 규정", "인쇄 취소", "디자인 환불"],
  path: "/refund-policy",
  title: "취소 및 환불 규정 | C-Brain",
} as const satisfies StaticPageSeoEntry;

export const pageSeo = {
  home: homeSeo,
  about: aboutSeo,
  portfolio: portfolioSeo,
  reviews: reviewsSeo,
  blog: blogSeo,
  notice: noticeSeo,
  faq: faqSeo,
  order: orderSeo,
  complaint: complaintSeo,
  terms: termsSeo,
  privacyPolicy: privacyPolicySeo,
  privacyCollection: privacyCollectionSeo,
  refundPolicy: refundPolicySeo,
} as const satisfies Record<string, StaticPageSeoEntry>;

export type StaticPageSeoKey = keyof typeof pageSeo;

type NoIndexMetadataInput = {
  description?: string;
  path?: `/${string}`;
  title: string;
};

export function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(envUrl || siteSeo.url);
  } catch {
    return new URL(siteSeo.url);
  }
}

function parseVercelUrl(value: string | undefined) {
  const host = value?.trim();

  if (!host) {
    return undefined;
  }

  try {
    return new URL(host.includes("://") ? host : `https://${host}`);
  } catch {
    return undefined;
  }
}

function getSocialImageUrl() {
  const deploymentUrl = parseVercelUrl(
    process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL,
  );
  const productionUrl = parseVercelUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
  );
  const assetBaseUrl =
    process.env.VERCEL_ENV === "production"
      ? (productionUrl ?? deploymentUrl ?? getSiteUrl())
      : (deploymentUrl ?? getSiteUrl());

  return new URL(defaultSocialImage.url, assetBaseUrl);
}

export function getPageUrl(path: StaticPageSeoEntry["path"] | `/${string}`) {
  return new URL(path, getSiteUrl());
}

export function createRootMetadata(): Metadata {
  const url = getSiteUrl();
  const socialImage = {
    ...defaultSocialImage,
    url: getSocialImageUrl(),
  };

  return {
    description: siteSeo.defaultDescription,
    keywords: [...siteSeo.defaultKeywords],
    metadataBase: url,
    openGraph: {
      description: siteSeo.defaultDescription,
      images: [socialImage],
      locale: "ko_KR",
      siteName: siteSeo.name,
      title: siteSeo.defaultTitle,
      type: "website",
      url,
    },
    title: {
      default: siteSeo.defaultTitle,
      template: `%s | ${siteSeo.name}`,
    },
    twitter: {
      card: "summary_large_image",
      description: siteSeo.defaultDescription,
      images: [socialImage],
      title: siteSeo.defaultTitle,
    },
  };
}

export function createPageMetadata(pageKey: StaticPageSeoKey): Metadata {
  const entry = pageSeo[pageKey];
  const url = getPageUrl(entry.path);
  const socialImage = {
    ...defaultSocialImage,
    url: getSocialImageUrl(),
  };

  return {
    alternates: {
      canonical: url,
    },
    description: entry.description,
    keywords: [...entry.keywords],
    openGraph: {
      description: entry.description,
      images: [socialImage],
      locale: "ko_KR",
      siteName: siteSeo.name,
      title: entry.title,
      type: "website",
      url,
    },
    title: {
      absolute: entry.title,
    },
    twitter: {
      card: "summary_large_image",
      description: entry.description,
      images: [socialImage],
      title: entry.title,
    },
  };
}

export function createNoIndexMetadata({
  description,
  path,
  title,
}: NoIndexMetadataInput): Metadata {
  return {
    alternates: path
      ? {
          canonical: getPageUrl(path),
        }
      : undefined,
    description,
    robots: {
      follow: false,
      index: false,
    },
    title: {
      absolute: title,
    },
  };
}
