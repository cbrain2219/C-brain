import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicAssetUrl } from "@repo/supabase/files";
import { listPublishedPortfolioItems } from "@repo/supabase/portfolio";
import { cache } from "react";

import {
  getPortfolioCategoryIdFromValue,
  getPortfolioCategoryLabel,
  getPortfolioDetailBySlug,
  getPortfolioDetailHref,
  getPortfolioDetailSeo,
  getPortfolioListHref,
  mapPortfolioRows,
  portfolioItems,
} from "../../../_content/portfolio";
import { createUserSupabaseClient } from "../../../../lib/supabase";
import styles from "./page.module.css";

type PortfolioDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    category?: string | string[];
  }>;
};

const loadPortfolioItems = cache(async () => {
  const supabase = await createUserSupabaseClient();

  if (!supabase) {
    return portfolioItems;
  }

  try {
    const rows = await listPublishedPortfolioItems(supabase);
    return mapPortfolioRows(rows, (path) => getPublicAssetUrl(supabase, path));
  } catch (error) {
    console.error("Failed to load published portfolio detail.", error);
    return [];
  }
});

export async function generateMetadata({
  params,
}: PortfolioDetailPageProps): Promise<Metadata> {
  const [{ slug }, items] = await Promise.all([params, loadPortfolioItems()]);
  const detail = getPortfolioDetailBySlug(slug, items);

  if (!detail) {
    return {
      title: "포트폴리오 상세 | C-Brain",
    };
  }

  const seo = getPortfolioDetailSeo(detail);
  const { item } = detail;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const canonicalUrl = siteUrl
    ? new URL(`/portfolio/${item.slug}`, siteUrl)
    : undefined;
  const socialImage = siteUrl
    ? {
        alt: item.imageAlt,
        url: new URL(item.image, siteUrl),
      }
    : undefined;

  return {
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      description: seo.description,
      images: socialImage ? [socialImage] : undefined,
      locale: "ko_KR",
      siteName: "C-Brain",
      title: seo.title,
      type: "article",
    },
    title: seo.title,
    twitter: {
      card: "summary",
      description: seo.description,
      images: socialImage ? [socialImage] : undefined,
      title: seo.title,
    },
  };
}

export default async function PortfolioDetailPage({
  params,
  searchParams,
}: PortfolioDetailPageProps) {
  const [{ slug }, resolvedSearchParams, items] = await Promise.all([
    params,
    searchParams,
    loadPortfolioItems(),
  ]);
  const detail = getPortfolioDetailBySlug(slug, items);

  if (!detail) {
    notFound();
  }

  const { categoryLabel, item, relatedItems } = detail;
  const listCategoryId =
    getPortfolioCategoryIdFromValue(resolvedSearchParams?.category) ??
    item.categoryId;
  const listHref = getPortfolioListHref(listCategoryId);

  return (
    <article className={styles.detailPage}>
      <div className={styles.detailInner}>
        <header className={styles.detailHeader}>
          <p className={styles.categoryBadge}>{categoryLabel}</p>
          <div className={styles.titleGroup}>
            <h1 id="portfolio-detail-title">
              {item.title} - {item.client}
            </h1>
            <p className={styles.authorLine}>
              <span>작성자</span>
              <Image
                alt=""
                className={styles.authorIcon}
                height={20}
                src="/figma-assets/cbrain-author.svg"
                width={20}
              />
              <span>{item.author}</span>
            </p>
          </div>
        </header>

        <section
          aria-labelledby="portfolio-detail-title"
          className={styles.detailContent}
        >
          <div className={styles.detailImageList}>
            {item.detailImages.map((image) => (
              <figure className={styles.detailImageFrame} key={image.src}>
                <Image
                  alt={image.alt}
                  className={styles.detailImage}
                  fill
                  priority={image.src === item.detailImages[0]?.src}
                  sizes="(min-width: 768px) 640px, calc(100vw - 40px)"
                  src={image.src}
                />
              </figure>
            ))}
          </div>

          <p className={styles.description}>{item.description}</p>
        </section>

        <Link className={styles.backLink} href={listHref}>
          목록으로
        </Link>

        <section
          aria-labelledby="related-portfolio-title"
          className={styles.relatedSection}
        >
          <h2 id="related-portfolio-title">더 많은 포트폴리오</h2>
          <ul className={styles.relatedList}>
            {relatedItems.map((relatedItem) => (
              <li className={styles.relatedItem} key={relatedItem.slug}>
                <article>
                  <Link
                    aria-label={`${relatedItem.client} ${relatedItem.title} 상세 보기`}
                    className={styles.relatedCard}
                    href={getPortfolioDetailHref(relatedItem, listCategoryId)}
                  >
                    <figure className={styles.relatedFigure}>
                      <div className={styles.relatedImageFrame}>
                        <Image
                          alt={relatedItem.imageAlt}
                          className={styles.relatedImage}
                          fill
                          sizes="(min-width: 640px) 200px, calc(100vw - 40px)"
                          src={relatedItem.image}
                        />
                      </div>
                      <figcaption className={styles.relatedCardBody}>
                        <span className={styles.relatedTag}>
                          {getPortfolioCategoryLabel(relatedItem.categoryId)}
                        </span>
                        <div className={styles.relatedText}>
                          <p>{relatedItem.client}</p>
                          <h3>{relatedItem.title}</h3>
                          <span>{relatedItem.summary}</span>
                        </div>
                      </figcaption>
                    </figure>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
