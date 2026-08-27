import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createEbookMetadata } from "../../../../lib/ebookMetadata";
import { getPublicEbook } from "../../../../lib/publicEbooks";
import styles from "../../[slug]/page.module.css";

type EbookPreviewPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 0;

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://cbrain.kr";

export async function generateMetadata({
  params,
}: EbookPreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const ebook = await getPublicEbook(slug);

  if (!ebook) {
    return {
      robots: { follow: false, index: false },
      title: "E-book 미리보기 | C-Brain",
    };
  }

  const previewUrl = new URL(`/ebook-preview/${slug}`, siteOrigin);

  return createEbookMetadata(ebook, {
    pageTitle: `${ebook.title} 미리보기`,
    robots: { follow: false, index: false },
    url: previewUrl,
  });
}

export default async function EbookPreviewPage({
  params,
}: EbookPreviewPageProps) {
  const { slug } = await params;
  const ebook = await getPublicEbook(slug);

  if (!ebook) notFound();

  return (
    <main
      aria-label={`${ebook.title} E-book 미리보기`}
      className={styles.viewer}
    >
      <iframe
        allowFullScreen
        className={styles.frame}
        src={ebook.embed_url}
        title={`${ebook.title} 미리보기`}
      />
    </main>
  );
}
