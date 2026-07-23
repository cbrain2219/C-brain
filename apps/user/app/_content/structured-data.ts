import { companyProfile, companySocialLinks } from "./company.ts";
import { faqCategories } from "./faqs.ts";
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
    contentUrl: string;
    description: string;
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
    url: getPageUrl("/").toString(),
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
    createOrganizationNode(),
    createWebsiteNode(),
    createWebPageNode(pageSeo.home),
    createBreadcrumbNode(pageSeo.home),
  ]);
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

export function createFaqPageStructuredData() {
  const faqPage = pageSeo.faq;
  const faqNode: JsonLdObject = {
    "@id": getWebPageId(faqPage.path),
    "@type": "FAQPage",
    description: faqPage.description,
    inLanguage: "ko-KR",
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
    name: faqPage.title.replace(" | C-Brain", ""),
    publisher: {
      "@id": getOrganizationId(),
    },
    url: getPageUrl(faqPage.path).toString(),
  };

  return createGraph([faqNode, createBreadcrumbNode(faqPage)]);
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
