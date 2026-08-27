import { companyLinks, companyProfile, companySocialLinks } from "./company.ts";
import { faqCategories } from "./faqs.ts";
import type { OrderProductCatalogItem } from "@repo/supabase/product-catalog";

import {
  type StaticPageSeoEntry,
  type StaticPageSeoKey,
  getPageUrl,
  pageSeo,
  siteSeo,
} from "./seo.ts";

type JsonLdPrimitive = boolean | number | string | null;

export type JsonLdValue =
  | JsonLdPrimitive
  | JsonLdValue[]
  | { [key: string]: JsonLdValue | undefined };

export type JsonLdObject = { [key: string]: JsonLdValue | undefined };

export type JsonLdData = JsonLdObject;

type StaticPageStructuredDataOptions = {
  includeOrganization?: boolean;
  pageType?: string;
};

type ArticleStructuredDataInput = {
  about?: readonly {
    name: string;
    value: string;
  }[];
  authorName: string;
  dateModified?: string;
  datePublished?: string;
  description: string;
  headline: string;
  imagePath?: string;
  section?: string;
  urlPath: `/${string}`;
  video?: {
    contentUrl?: string;
    description: string;
    embedUrl?: string;
    name: string;
    thumbnailUrl?: string;
    uploadDate?: string;
  };
};

type CreativeWorkStructuredDataInput = {
  authorName: string;
  category: string;
  description: string;
  imagePath?: string;
  name: string;
  urlPath: `/${string}`;
};

function getAbsoluteUrl(urlOrPath: string) {
  try {
    return new URL(urlOrPath).toString();
  } catch {
    return new URL(urlOrPath, getPageUrl("/")).toString();
  }
}

function createGraph(items: readonly JsonLdObject[]): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@graph": [...items],
  };
}

function getOrganizationId() {
  return new URL("#organization", getPageUrl("/")).toString();
}

function getWebsiteId() {
  return new URL("#website", getPageUrl("/")).toString();
}

function getWebPageId(path: StaticPageSeoEntry["path"] | `/${string}`) {
  return new URL("#webpage", getPageUrl(path)).toString();
}

function createOrganizationNode(): JsonLdObject {
  return {
    "@id": getOrganizationId(),
    "@type": "Organization",
    address: {
      "@type": "PostalAddress",
      addressCountry: companyProfile.address.country,
      addressLocality: companyProfile.address.locality,
      addressRegion: companyProfile.address.region,
      postalCode: companyProfile.address.postalCode,
      streetAddress: companyProfile.address.streetAddress,
    },
    alternateName: [...companyProfile.alternateNames],
    areaServed: "KR",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: companyProfile.phone,
      },
    ],
    description: siteSeo.defaultDescription,
    email: companyProfile.email,
    foundingDate: companyProfile.foundedYear,
    logo: getAbsoluteUrl(companyProfile.logo.main.src),
    name: companyProfile.name,
    sameAs: companySocialLinks.map((link) => link.href),
    telephone: companyProfile.phone,
    url: getPageUrl("/").toString(),
  };
}

const professionalServiceDescription =
  "씨브레인(C-Brain)은 경기도 성남시에 본사를 둔 브로슈어·카탈로그 및 각종 홍보물 기획·디자인·인쇄 원스톱 전문 기업입니다. 2000년 창업 이후 축적한 경험을 바탕으로 전국 1,200개 이상의 기업·기관과 파트너십을 맺고 4,000건 이상의 홍보물 제작 서비스를 제공해 왔습니다. 리플렛·팜플렛·포스터·명함·배너 등 다양한 홍보물을 소량부터 대량까지 전국 납품하며, 킨텍스·코리아나라장터엑스포와 15년 연속 공식 협력한 전시·박람회 홍보물 제작 노하우를 보유하고 있습니다.";

const professionalServiceOffers = [
  {
    alternateName: "회사소개서·제품카탈로그 제작",
    description:
      "기업 브로슈어, 카탈로그, 브로셔, 카달로그의 기획, 디자인, 인쇄를 원스톱으로 제공하는 서비스입니다.",
    name: "브로슈어·카탈로그 디자인 제작",
    serviceType: "브로슈어·카탈로그 디자인 및 인쇄",
    urlPath: "/portfolio/brochure",
  },
  {
    alternateName: "2단접지, 3단접지, 4단접지 리플렛 제작",
    description:
      "2단접지, 3단접지, 4단접지 등 다양한 형태의 리플렛과 팜플렛을 기획부터 디자인, 인쇄까지 제공합니다.",
    name: "리플렛·팜플렛 디자인 제작",
    serviceType: "리플렛 디자인 및 인쇄",
    urlPath: "/portfolio/leaflet",
  },
  {
    alternateName: "행사 포스터 제작",
    description:
      "행사, 기업 홍보, 제품 홍보용 포스터의 디자인과 대형 출력 인쇄 서비스를 제공합니다.",
    name: "포스터 디자인·인쇄",
    serviceType: "포스터 디자인 및 인쇄",
    urlPath: "/portfolio/poster",
  },
  {
    alternateName: "패키지 제작",
    description:
      "제품 패키지, 박스, 쇼핑백의 기획, 디자인, 인쇄 제작 서비스를 제공합니다.",
    name: "패키지·쇼핑백 디자인 제작",
    serviceType: "패키지 디자인 및 인쇄",
    urlPath: "/portfolio/package",
  },
  {
    alternateName: "명함 제작",
    description:
      "기업용 명함과 봉투, 레터헤드의 기획, 디자인, 인쇄를 정찰제 가격으로 제공합니다.",
    name: "명함·봉투 디자인 제작",
    serviceType: "명함·봉투 디자인 및 인쇄",
    urlPath: "/portfolio/business-card",
  },
  {
    alternateName: "브랜드 로고 제작",
    description:
      "브랜드의 첫인상을 결정하는 로고를 전략적 기획과 감각적 디자인으로 제작합니다.",
    name: "로고 디자인 제작",
    serviceType: "로고 디자인",
    urlPath: "/portfolio/logo",
  },
  {
    alternateName: "제품·공간 촬영",
    description:
      "제품·공간·인물 등 홍보물 제작에 필요한 사진 촬영 서비스를 제공합니다.",
    name: "촬영",
    serviceType: "촬영 서비스",
    urlPath: "/portfolio/photo",
  },
  {
    alternateName: "전시회·박람회 홍보물 디자인 제작",
    description:
      "전시회와 박람회에서 사용하는 배너, X배너, 현수막 등 다양한 홍보물의 기획, 디자인, 인쇄를 제공합니다.",
    name: "배너·현수막 디자인 제작",
    serviceType: "전시 홍보물 디자인 및 인쇄",
    urlPath: "/portfolio/banner",
  },
  {
    alternateName: "기업 홍보물 제작",
    description:
      "브로슈어, 카탈로그, 리플렛, 포스터, 패키지, 명함, 배너 등 다양한 홍보물을 기획부터 디자인, 인쇄, 전국 납품까지 원스톱으로 제공합니다.",
    name: "홍보물 기획·디자인·인쇄 원스톱",
    serviceType: "홍보물 통합 제작",
    urlPath: "/portfolio/custom",
  },
] as const;

const portfolioStructuredDataCategories = [
  { name: "브로슈어·카탈로그", urlPath: "/portfolio/brochure" },
  { name: "리플렛·팜플렛", urlPath: "/portfolio/leaflet" },
  { name: "포스터·전단지", urlPath: "/portfolio/poster" },
  { name: "배너·족자·현수막", urlPath: "/portfolio/banner" },
  { name: "명함·봉투", urlPath: "/portfolio/business-card" },
  { name: "로고", urlPath: "/portfolio/logo" },
  { name: "패키지·쇼핑백", urlPath: "/portfolio/package" },
  { name: "촬영", urlPath: "/portfolio/photo" },
  { name: "기타", urlPath: "/portfolio/custom" },
] as const;

const orderDirectStructuredDataOffers = [
  {
    categoryId: "brochure-catalog",
    name: "브로슈어·카탈로그",
    serviceDescription:
      "기업소개, 제품 카탈로그 등 핵심 홍보물. 기획부터 인쇄까지 원스톱",
    urlPath: "/order?service=brochure-catalog",
  },
  {
    categoryId: "leaflet-pamphlet",
    name: "리플렛·팜플렛",
    serviceDescription:
      "단면, 양면, 접지 등 다양한 형태의 소책자 및 안내물 제작",
    urlPath: "/order?service=leaflet-pamphlet",
  },
  {
    categoryId: "poster-flyer",
    name: "포스터·전단지",
    serviceDescription:
      "행사·이벤트·홍보용 포스터와 전단지. 빠른 납기 대응 가능",
    urlPath: "/order?service=poster-flyer",
  },
  {
    categoryId: "banner-display",
    name: "배너·족자·현수막",
    serviceDescription:
      "박람회, 매장, 행사장용 대형 출력물. 설치·운송 상담 가능",
    urlPath: "/order?service=banner-display",
  },
  {
    categoryId: "business-card-envelope",
    name: "명함·봉투",
    serviceDescription:
      "소량 명함부터 기업용 봉투·레터헤드까지 정찰제 가격 제공",
    urlPath: "/order?service=business-card-envelope",
  },
  {
    categoryId: "logo",
    name: "로고",
    serviceDescription:
      "브랜드의 첫인상을 결정하는 로고. 전략적 기획 + 감각적 디자인",
    urlPath: "/order?service=logo",
  },
] as const;

const orderQuoteStructuredDataOffers = [
  {
    name: "패키지·쇼핑백",
    offerDescription: "견적 후 카카오톡으로 주문 진행",
    serviceDescription: "브랜드 아이덴티티를 담은 패키지 디자인 및 쇼핑백 제작",
    urlPath: "/order",
  },
  {
    name: "촬영",
    offerDescription: "견적 후 진행",
    serviceDescription: "제품·공간·인물 등 홍보물에 필요한 사진 촬영",
    urlPath: "/order",
  },
  {
    name: "기타",
    offerDescription: "카카오톡 1:1 문의",
    serviceDescription:
      "다이어리·캘린더, 스티커, 초청장 등 기타 맞춤 홍보물 제작",
    urlPath: "/order",
  },
] as const;

function createProfessionalServiceNode(): JsonLdObject {
  const organizationId = getOrganizationId();

  return {
    "@id": organizationId,
    "@type": "ProfessionalService",
    address: {
      "@type": "PostalAddress",
      addressCountry: companyProfile.address.country,
      addressLocality: companyProfile.address.locality,
      addressRegion: companyProfile.address.region,
      postalCode: companyProfile.address.postalCode,
      streetAddress: companyProfile.address.streetAddress,
    },
    alternateName: ["CBRAIN", "씨브레인 디자인그룹", "CBRAIN Design Group"],
    areaServed: [
      {
        "@type": "Country",
        name: "대한민국",
        sameAs: "https://www.wikidata.org/wiki/Q884",
      },
      { "@type": "AdministrativeArea", name: "서울특별시" },
      { "@type": "AdministrativeArea", name: "경기도" },
      { "@type": "AdministrativeArea", name: "성남시" },
    ],
    award: ["여성기업확인서", "중소기업확인서"],
    contactPoint: {
      "@type": "ContactPoint",
      areaServed: "KR",
      availableLanguage: ["Korean"],
      contactType: "customer service",
      email: companyProfile.email,
      telephone: "+82-70-8830-2219",
    },
    description: professionalServiceDescription,
    email: companyProfile.email,
    founder: {
      "@type": "Person",
      name: companyProfile.representative,
    },
    foundingDate: companyProfile.foundedYear,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 37.4387404,
      longitude: 127.1738368,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      itemListElement: professionalServiceOffers.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          alternateName: service.alternateName,
          description: service.description,
          name: service.name,
          provider: { "@id": organizationId },
          serviceType: service.serviceType,
          url: getPageUrl(service.urlPath).toString(),
        },
      })),
      name: "브로슈어·카탈로그·브로셔·카달로그 및 각종 홍보물 기획·디자인·인쇄 제작 서비스",
    },
    identifier: {
      "@type": "PropertyValue",
      name: "통신판매업신고번호",
      value: companyProfile.mailOrderSalesNumber,
    },
    image: [
      getAbsoluteUrl("/images/cbrain-about-planning-process-large.webp"),
      getAbsoluteUrl("/images/cbrain-about-team-collaboration.webp"),
      getAbsoluteUrl("/images/cbrain-about-certifications.webp"),
    ],
    knowsAbout: [
      "브로슈어·브로셔 제작",
      "카탈로그·카달로그 디자인",
      "리플렛·팜플렛 제작",
      "포스터 디자인 및 인쇄",
      "패키지·쇼핑백 디자인 제작",
      "박람회·전시회 홍보물 제작",
      "홍보물 기획·디자인·인쇄 원스톱",
      "전국 인쇄물 납품",
      "명함 제작 인쇄",
    ],
    logo: getAbsoluteUrl(companyProfile.logo.main.src),
    name: companyProfile.name,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        closes: "11:00",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "08:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        closes: "17:00",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "12:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        closes: "11:00",
        dayOfWeek: ["Friday"],
        opens: "08:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        closes: "16:00",
        dayOfWeek: ["Friday"],
        opens: "12:30",
      },
    ],
    sameAs: [
      companyLinks.naverBlog,
      companyLinks.instagram,
      companyLinks.youtube,
      companyLinks.kakao,
    ],
    slogan: "홍보물에도 제대로 된 전략이 필요합니다.",
    taxID: companyProfile.businessRegistrationNumber,
    telephone: "+82-70-8830-2219",
    url: getPageUrl("/").origin,
  };
}

function createWebsiteNode(): JsonLdObject {
  return {
    "@id": getWebsiteId(),
    "@type": "WebSite",
    alternateName: [...companyProfile.alternateNames],
    inLanguage: "ko-KR",
    name: companyProfile.name,
    publisher: {
      "@id": getOrganizationId(),
    },
    url: getPageUrl("/").origin,
  };
}

function createBreadcrumbNode(page: StaticPageSeoEntry): JsonLdObject {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        item: getPageUrl("/").toString(),
        name: "홈",
        position: 1,
      },
      {
        "@type": "ListItem",
        item: getPageUrl(page.path).toString(),
        name: page.title.replace(" | C-Brain", ""),
        position: 2,
      },
    ],
  };
}

function createStandaloneBreadcrumbStructuredData(
  page: StaticPageSeoEntry,
  pageName: string,
): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        item: getPageUrl("/").origin,
        name: "홈",
        position: 1,
      },
      {
        "@type": "ListItem",
        item: getPageUrl(page.path).toString(),
        name: pageName,
        position: 2,
      },
    ],
  };
}

function createWebPageNode(
  page: StaticPageSeoEntry,
  pageType = "WebPage",
): JsonLdObject {
  return {
    "@id": getWebPageId(page.path),
    "@type": pageType,
    breadcrumb: createBreadcrumbNode(page),
    description: page.description,
    inLanguage: "ko-KR",
    isPartOf: {
      "@id": getWebsiteId(),
    },
    name: page.title.replace(" | C-Brain", ""),
    publisher: {
      "@id": getOrganizationId(),
    },
    url: getPageUrl(page.path).toString(),
  };
}

export function createHomeStructuredData() {
  return createGraph([
    createProfessionalServiceNode(),
    createWebsiteNode(),
    createWebPageNode(pageSeo.home),
    createBreadcrumbNode(pageSeo.home),
  ]);
}

export function createAboutPageStructuredData(): JsonLdData {
  const aboutPage = pageSeo.about;
  const organization = { "@id": getOrganizationId() };

  return {
    "@context": "https://schema.org",
    "@id": new URL("#aboutpage", getPageUrl(aboutPage.path)).toString(),
    "@type": "AboutPage",
    about: organization,
    description: aboutPage.description,
    isPartOf: { "@id": getWebsiteId() },
    mainEntity: organization,
    name: aboutPage.title,
    url: getPageUrl(aboutPage.path).toString(),
  };
}

export function createAboutBreadcrumbStructuredData(): JsonLdData {
  return createStandaloneBreadcrumbStructuredData(pageSeo.about, "회사소개");
}

export function createBlogPageStructuredData(): JsonLdData {
  const blogPage = pageSeo.blog;

  return {
    "@context": "https://schema.org",
    "@id": new URL("#blog", getPageUrl(blogPage.path)).toString(),
    "@type": "Blog",
    about: { "@id": getOrganizationId() },
    description: blogPage.description,
    isPartOf: { "@id": getWebsiteId() },
    name: blogPage.title,
    url: getPageUrl(blogPage.path).toString(),
  };
}

export function createBlogBreadcrumbStructuredData(): JsonLdData {
  return createStandaloneBreadcrumbStructuredData(pageSeo.blog, "블로그");
}

export function createComplaintPageStructuredData(): JsonLdData {
  const complaintPage = pageSeo.complaint;

  return {
    "@context": "https://schema.org",
    "@id": new URL("#contactpage", getPageUrl(complaintPage.path)).toString(),
    "@type": "ContactPage",
    about: { "@id": getOrganizationId() },
    description: complaintPage.description,
    isPartOf: { "@id": getWebsiteId() },
    name: complaintPage.title,
    url: getPageUrl(complaintPage.path).toString(),
  };
}

export function createComplaintBreadcrumbStructuredData(): JsonLdData {
  return createStandaloneBreadcrumbStructuredData(
    pageSeo.complaint,
    "불편 접수",
  );
}

export function createNoticePageStructuredData(): JsonLdData {
  const noticePage = pageSeo.notice;

  return {
    "@context": "https://schema.org",
    "@id": new URL("#collectionpage", getPageUrl(noticePage.path)).toString(),
    "@type": "CollectionPage",
    about: { "@id": getOrganizationId() },
    description: noticePage.description,
    isPartOf: { "@id": getWebsiteId() },
    name: noticePage.title,
    url: getPageUrl(noticePage.path).toString(),
  };
}

export function createNoticeBreadcrumbStructuredData(): JsonLdData {
  return createStandaloneBreadcrumbStructuredData(pageSeo.notice, "공지사항");
}

export function createPortfolioPageStructuredData(): JsonLdData {
  const portfolioPage = pageSeo.portfolio;

  return {
    "@context": "https://schema.org",
    "@id": new URL(
      "#collectionpage",
      getPageUrl(portfolioPage.path),
    ).toString(),
    "@type": "CollectionPage",
    about: { "@id": getOrganizationId() },
    description: portfolioPage.description,
    hasPart: {
      "@type": "ItemList",
      itemListElement: portfolioStructuredDataCategories.map(
        (category, index) => ({
          "@type": "ListItem",
          name: category.name,
          position: index + 1,
          url: getPageUrl(category.urlPath).toString(),
        }),
      ),
      name: "포트폴리오 카테고리",
    },
    isPartOf: { "@id": getWebsiteId() },
    name: portfolioPage.title,
    url: getPageUrl(portfolioPage.path).toString(),
  };
}

export function createPortfolioBreadcrumbStructuredData(): JsonLdData {
  return createStandaloneBreadcrumbStructuredData(
    pageSeo.portfolio,
    "포트폴리오",
  );
}

export function createReviewsPageStructuredData(): JsonLdData {
  const reviewsPage = pageSeo.reviews;

  return {
    "@context": "https://schema.org",
    "@id": new URL("#collectionpage", getPageUrl(reviewsPage.path)).toString(),
    "@type": "CollectionPage",
    about: { "@id": getOrganizationId() },
    description: reviewsPage.description,
    isPartOf: { "@id": getWebsiteId() },
    name: reviewsPage.title,
    url: getPageUrl(reviewsPage.path).toString(),
  };
}

export function createReviewsBreadcrumbStructuredData(): JsonLdData {
  return createStandaloneBreadcrumbStructuredData(pageSeo.reviews, "고객 후기");
}

export function createOrderPageStructuredData(): JsonLdData {
  const orderPage = pageSeo.order;

  return {
    "@context": "https://schema.org",
    "@id": new URL("#collectionpage", getPageUrl(orderPage.path)).toString(),
    "@type": "CollectionPage",
    about: { "@id": getOrganizationId() },
    description: orderPage.description,
    isPartOf: { "@id": getWebsiteId() },
    name: orderPage.title,
    url: getPageUrl(orderPage.path).toString(),
  };
}

export function createOrderOfferCatalogStructuredData(
  products: readonly OrderProductCatalogItem[],
): JsonLdData {
  const organization = { "@id": getOrganizationId() };
  const orderPageUrl = getPageUrl(pageSeo.order.path);
  const directOffers = orderDirectStructuredDataOffers.flatMap((offer) => {
    const product = products.find(
      (candidate) => candidate.categoryId === offer.categoryId,
    );

    if (!product) return [];

    return [
      {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        itemOffered: {
          "@type": "Service",
          description: offer.serviceDescription,
          name: offer.name,
          provider: organization,
        },
        priceCurrency: "KRW",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          minPrice: product.startingPrice,
          priceCurrency: "KRW",
        },
        seller: organization,
        url: getPageUrl(offer.urlPath).toString(),
      },
    ];
  });
  const quoteOffers = orderQuoteStructuredDataOffers.map((offer) => ({
    "@type": "Offer",
    description: offer.offerDescription,
    itemOffered: {
      "@type": "Service",
      description: offer.serviceDescription,
      name: offer.name,
      provider: organization,
    },
    seller: organization,
    url: getPageUrl(offer.urlPath).toString(),
  }));

  return {
    "@context": "https://schema.org",
    "@id": new URL("#offercatalog", orderPageUrl).toString(),
    "@type": "OfferCatalog",
    itemListElement: [...directOffers, ...quoteOffers],
    name: "씨브레인 정찰제 홍보물 제작 가격",
    url: orderPageUrl.toString(),
  };
}

export function createOrderBreadcrumbStructuredData(): JsonLdData {
  return createStandaloneBreadcrumbStructuredData(pageSeo.order, "주문·결제");
}

export function createStaticPageStructuredData(
  pageKey: StaticPageSeoKey,
  options: StaticPageStructuredDataOptions = {},
) {
  const page = pageSeo[pageKey];
  const nodes: JsonLdObject[] = [];

  if (options.includeOrganization) {
    nodes.push(createOrganizationNode());
  }

  nodes.push(createWebPageNode(page, options.pageType));
  nodes.push(createBreadcrumbNode(page));

  return createGraph(nodes);
}

export function createFaqPageStructuredData(): JsonLdData {
  const faqPage = pageSeo.faq;

  return {
    "@context": "https://schema.org",
    "@id": new URL("#faqpage", getPageUrl(faqPage.path)).toString(),
    "@type": "FAQPage",
    about: { "@id": getOrganizationId() },
    description: faqPage.description,
    isPartOf: { "@id": getWebsiteId() },
    mainEntity: faqCategories.flatMap((category) =>
      category.items.map((item) => ({
        "@type": "Question",
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
        name: item.question,
      })),
    ),
    name: faqPage.title,
    url: getPageUrl(faqPage.path).toString(),
  };
}

export function createFaqBreadcrumbStructuredData(): JsonLdData {
  return createStandaloneBreadcrumbStructuredData(pageSeo.faq, "FAQ & 가이드");
}

function createArticleGraph(
  type: "Article" | "BlogPosting",
  input: ArticleStructuredDataInput,
) {
  const article: JsonLdObject = {
    "@type": type,
    about: input.about?.map((item) => ({
      "@type": "PropertyValue",
      name: item.name,
      value: item.value,
    })),
    articleSection: input.section,
    author: {
      "@type": "Organization",
      name: input.authorName,
    },
    dateModified: input.dateModified ?? input.datePublished,
    datePublished: input.datePublished,
    description: input.description,
    headline: input.headline,
    image: input.imagePath ? getAbsoluteUrl(input.imagePath) : undefined,
    inLanguage: "ko-KR",
    mainEntityOfPage: getPageUrl(input.urlPath).toString(),
    publisher: {
      "@id": getOrganizationId(),
    },
    video: input.video
      ? {
          "@type": "VideoObject",
          contentUrl: input.video.contentUrl,
          description: input.video.description,
          embedUrl: input.video.embedUrl,
          name: input.video.name,
          thumbnailUrl: input.video.thumbnailUrl,
          uploadDate: input.video.uploadDate,
        }
      : undefined,
  };

  return createGraph([article]);
}

export function createBlogPostingStructuredData(
  input: ArticleStructuredDataInput,
) {
  return createArticleGraph("BlogPosting", input);
}

export function createArticleStructuredData(input: ArticleStructuredDataInput) {
  return createArticleGraph("Article", input);
}

export function createCreativeWorkStructuredData(
  input: CreativeWorkStructuredDataInput,
) {
  return createGraph([
    {
      "@type": "CreativeWork",
      author: {
        "@type": "Organization",
        name: input.authorName,
      },
      creator: {
        "@type": "Organization",
        name: input.authorName,
      },
      description: input.description,
      genre: input.category,
      image: input.imagePath ? getAbsoluteUrl(input.imagePath) : undefined,
      inLanguage: "ko-KR",
      mainEntityOfPage: getPageUrl(input.urlPath).toString(),
      name: input.name,
      publisher: {
        "@id": getOrganizationId(),
      },
      url: getPageUrl(input.urlPath).toString(),
    },
  ]);
}
