import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createEbookMetadata } from "../../../lib/ebookMetadata";
import { getPublicEbook } from "../../../lib/publicEbooks";
import styles from "./page.module.css";

type EbookViewerPageProps = {
  params: Promise<{ slug: string }>;
};

const ebookOrigin =
  process.env.NEXT_PUBLIC_EBOOK_URL || "https://ebook.cbrain.kr";

export const revalidate = 0;

function createPublicUrl(slug: string) {
  return new URL(`/${slug}`, ebookOrigin);
}

export async function generateMetadata({
  params,
}: EbookViewerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const ebook = await getPublicEbook(slug);

  if (!ebook) return { title: "E-book | C-Brain" };

  const pageUrl = createPublicUrl(slug);

  return {
    ...createEbookMetadata(ebook, { url: pageUrl }),
    alternates: { canonical: pageUrl },
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
