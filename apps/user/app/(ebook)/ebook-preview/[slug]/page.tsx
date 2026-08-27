import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicEbook } from "../../../../lib/publicEbooks";
import styles from "../../[slug]/page.module.css";

type EbookPreviewPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 0;

export async function generateMetadata({
  params,
}: EbookPreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const ebook = await getPublicEbook(slug);

  return {
    robots: { follow: false, index: false },
    title: ebook ? `${ebook.title} 미리보기` : "E-book 미리보기 | C-Brain",
  };
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
