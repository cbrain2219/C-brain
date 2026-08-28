import { notFound, permanentRedirect } from "next/navigation";

import { getPublicEbook } from "../../../lib/publicEbooks";

type LegacyEbookPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 0;

export default async function LegacyEbookPage({
  params,
}: LegacyEbookPageProps) {
  const { slug } = await params;
  const ebook = await getPublicEbook(slug);

  if (!ebook) notFound();

  permanentRedirect(`/ebook/${slug}`);
}
