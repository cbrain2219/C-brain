import type { Metadata } from "next";

import { getSiteUrl, siteSeo } from "../app/_content/seo";

type EbookMetadataRecord = {
  og_image_alt: string | null;
  og_image_url: string | null;
  seo_description: string;
  title: string;
};

type EbookMetadataOptions = {
  pageTitle?: string;
  robots?: Metadata["robots"];
  url?: URL;
};

const siteOrigin = getSiteUrl();

function createSocialImage(ebook: EbookMetadataRecord) {
  if (ebook.og_image_url) {
    return {
      alt: ebook.og_image_alt || ebook.title,
      url: ebook.og_image_url,
    };
  }

  return {
    alt: "씨브레인 홍보물 제작·디자인·인쇄 원스톱 전문",
    height: 3200,
    url: new URL("/opengraph-image.png", siteOrigin),
    width: 4800,
  };
}

export function createEbookMetadata(
  ebook: EbookMetadataRecord,
  options: EbookMetadataOptions = {},
): Metadata {
  const socialImage = createSocialImage(ebook);

  return {
    description: ebook.seo_description,
    openGraph: {
      description: ebook.seo_description,
      images: [socialImage],
      locale: "ko_KR",
      siteName: siteSeo.name,
      title: ebook.title,
      type: "website",
      ...(options.url ? { url: options.url } : {}),
    },
    ...(options.robots ? { robots: options.robots } : {}),
    title: { absolute: options.pageTitle || ebook.title },
    twitter: {
      card: "summary_large_image",
      description: ebook.seo_description,
      images: [socialImage],
      title: ebook.title,
    },
  };
}
