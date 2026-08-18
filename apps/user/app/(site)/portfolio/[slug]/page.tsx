import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LightHeroBadge } from "../../../../components/LightHeroBadge";
import { ManagedContent } from "../../../../components/ManagedContent";
import { RawHtmlDocumentFrame } from "../../../../components/RawHtmlDocumentFrame";
import { JsonLdScript } from "../../../_components/JsonLdScript";
import {
  getPortfolioCategoryIdFromValue,
  getPortfolioCategoryLabel,
  getPortfolioDetailBySlug,
  getPortfolioDetailHref,
  getPortfolioDetailSourceFromValue,
  getPortfolioDetailSeo,
  getPortfolioListHref,
} from "../../../_content/portfolio";
import { createCreativeWorkStructuredData } from "../../../_content/structured-data";
import {
  getPublishedPortfolioItems,
  getPublishedPortfolioItemSource,
} from "../../../../lib/publicContent";
import styles from "./page.module.css";

type PortfolioDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    category?: string | string[];
    from?: string | string[];
  }>;
};

export const revalidate = 0;

export async function generateMetadata({
  params,
}: PortfolioDetailPageProps): Promise<Metadata> {
  const [{ slug }, items] = await Promise.all([
    params,
    getPublishedPortfolioItems(),
  ]);
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
  const itemsPromise = getPublishedPortfolioItems();
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const [items, source] = await Promise.all([
    itemsPromise,
    getPublishedPortfolioItemSource(slug),
  ]);
  const detail = getPortfolioDetailBySlug(slug, items);

  if (!detail) {
    notFound();
  }

  const { categoryLabel, item, relatedItems } = detail;
  const listCategoryId =
    getPortfolioCategoryIdFromValue(resolvedSearchParams?.category) ??
    item.categoryId;
  const detailSource = getPortfolioDetailSourceFromValue(
    resolvedSearchParams?.from,
  );
  const listHref = getPortfolioListHref(listCategoryId, detailSource);
  const rawHtmlSource =
    source?.contentMode === "html" &&
    source.contentAuthoringMode === "raw_html" &&
    source.content.trim()
      ? source.content
      : undefined;

  return (
    <article className={styles.detailPage}>
      <JsonLdScript
        data={createCreativeWorkStructuredData({
          authorName: item.author,
          category: categoryLabel,
          description: item.description,
          imagePath: item.image,
          name: `${item.client} ${item.title}`,
          urlPath: `/portfolio/${item.slug}`,
        })}
      />
      <div className={styles.detailInner}>
        <div className={styles.detailBody}>
          <header className={styles.detailHeader}>
            <LightHeroBadge>{categoryLabel}</LightHeroBadge>
            <div className={styles.titleGroup}>
              <h1 id="portfolio-detail-title">
                {item.title} - {item.client}
              </h1>
              <p className={styles.authorLine}>
                <span>작성자</span>
                <span className={styles.authorIdentity}>
                  <Image
                    alt=""
                    className={styles.authorIcon}
                    height={20}
                    src="/figma-assets/cbrain-author.svg"
                    width={20}
                  />
                  <span>{item.author}</span>
                </span>
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
                    quality={90}
                    sizes="(min-width: 680px) 720px, calc(112.5vw - 45px)"
                    src={image.src}
                  />
                </figure>
              ))}
            </div>

            {rawHtmlSource ? (
              <RawHtmlDocumentFrame html={rawHtmlSource} title={item.title} />
            ) : (
              <div className={styles.description}>
                <ManagedContent
                  legacyFallback={<p>{item.description}</p>}
                  value={source}
                />
              </div>
            )}
          </section>

          <Link className={styles.backLink} href={listHref}>
            목록으로
          </Link>
        </div>

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
                    href={getPortfolioDetailHref(
                      relatedItem,
                      listCategoryId,
                      detailSource,
                    )}
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
