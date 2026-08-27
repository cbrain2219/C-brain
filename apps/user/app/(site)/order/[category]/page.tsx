import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getOrderCategoryBySlug,
  getOrderCategoryHref,
} from "../../../_content/order";
import { createPageMetadata, getPageUrl } from "../../../_content/seo";
import { OrderPageContent } from "../OrderPageContent";

type OrderCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export async function generateMetadata({
  params,
}: OrderCategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getOrderCategoryBySlug(categorySlug);
  const metadata = createPageMetadata("order");

  if (!category) return metadata;

  const canonicalUrl = getPageUrl(getOrderCategoryHref(category.id));

  return {
    ...metadata,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      ...metadata.openGraph,
      url: canonicalUrl,
    },
  };
}

export default async function OrderCategoryPage({
  params,
}: OrderCategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = getOrderCategoryBySlug(categorySlug);

  if (!category) notFound();

  return <OrderPageContent initialCategoryId={category.id} />;
}
