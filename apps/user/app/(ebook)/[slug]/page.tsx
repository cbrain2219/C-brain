import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteSeo } from "../../_content/seo";
import { getPublicEbook } from "../../../lib/publicEbooks";
import styles from "./page.module.css";

type EbookViewerPageProps = {
  params: Promise<{ slug: string }>;
};

const ebookOrigin =
  process.env.NEXT_PUBLIC_EBOOK_URL || "https://ebook.cbrain.kr";
const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://cbrain.kr";

export const revalidate = 0;

function createPublicUrl(slug: string) {
  return new URL(`/${slug}`, ebookOrigin);
}

function createSocialImage() {
  return {
    alt: "씨브레인 홍보물 제작·디자인·인쇄 원스톱 전문",
    height: 3200,
    url: new URL("/opengraph-image.png", siteOrigin),
    width: 4800,
  };
}

export async function generateMetadata({
  params,
}: EbookViewerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const ebook = await getPublicEbook(slug);

  if (!ebook) return { title: "E-book | C-Brain" };

  const pageUrl = createPublicUrl(slug);
  const socialImage = ebook.og_image_url
    ? {
        alt: ebook.og_image_alt || ebook.title,
        url: ebook.og_image_url,
      }
    : createSocialImage();

  return {
    alternates: { canonical: pageUrl },
    description: ebook.seo_description,
    openGraph: {
      description: siteSeo.defaultDescription,
      images: [socialImage],
      locale: "ko_KR",
      siteName: siteSeo.name,
      title: siteSeo.defaultTitle,
      type: "website",
      url: pageUrl,
    },
    title: { absolute: ebook.title },
    twitter: {
      card: "summary_large_image",
      description: siteSeo.defaultDescription,
      images: [socialImage],
      title: siteSeo.defaultTitle,
    },
  };
}

export default async function EbookViewerPage({
  params,
}: EbookViewerPageProps) {
  const { slug } = await params;
  const ebook = await getPublicEbook(slug);

  if (!ebook) notFound();

  return (
    <main aria-label={`${ebook.title} E-book`} className={styles.viewer}>
      <iframe
        allowFullScreen
        className={styles.frame}
        src={ebook.embed_url}
        title={ebook.title}
      />
    </main>
  );
}
