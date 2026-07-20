import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  customerInterviewDetails,
  type CustomerInterviewDetail,
  getCustomerInterviewDetailBySlug,
  getCustomerInterviewDetailSeo,
  reviewPlayLargeIcon,
} from "../../../_content/customerReviews";
import styles from "./page.module.css";

type CustomerReviewDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getAbsoluteUrl(path: string, siteUrl: string | undefined) {
  return siteUrl ? new URL(path, siteUrl).toString() : path;
}

function getReviewDetailStructuredData(
  detail: CustomerInterviewDetail,
  pageUrl: string,
  imageUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    about: detail.projectInfo.map((item) => ({
      "@type": "PropertyValue",
      name: item.label,
      value: item.value,
    })),
    articleSection: detail.category,
    author: {
      "@type": "Organization",
      name: detail.author,
    },
    description: detail.seoDescription,
    headline: detail.title,
    image: imageUrl,
    mainEntityOfPage: pageUrl,
    publisher: {
      "@type": "Organization",
      name: "C-Brain",
    },
  };
}

function stringifyJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function generateStaticParams() {
  return customerInterviewDetails.map((detail) => ({
    slug: detail.slug,
  }));
}

export async function generateMetadata({
  params,
}: CustomerReviewDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = getCustomerInterviewDetailBySlug(slug);

  if (!detail) {
    return {
      title: "고객 후기 상세 | C-Brain",
    };
  }

  const seo = getCustomerInterviewDetailSeo(detail);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const canonicalUrl = siteUrl
    ? new URL(`/reviews/${detail.slug}`, siteUrl)
    : undefined;
  const socialImage = siteUrl
    ? {
        alt: detail.videoAlt,
        url: new URL(detail.thumbnail, siteUrl),
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

export default async function CustomerReviewDetailPage({
  params,
}: CustomerReviewDetailPageProps) {
  const { slug } = await params;
  const detail = getCustomerInterviewDetailBySlug(slug);

  if (!detail) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const pageUrl = getAbsoluteUrl(`/reviews/${detail.slug}`, siteUrl);
  const imageUrl = getAbsoluteUrl(detail.thumbnail, siteUrl);
  const structuredData = getReviewDetailStructuredData(
    detail,
    pageUrl,
    imageUrl,
  );

  return (
    <article
      className={styles.reviewDetailPage}
      itemScope
      itemType="https://schema.org/Article"
    >
      <meta content={detail.seoDescription} itemProp="description" />
      <meta content={imageUrl} itemProp="image" />
      <script
        dangerouslySetInnerHTML={{
          __html: stringifyJsonLd(structuredData),
        }}
        type="application/ld+json"
      />
      <div className={styles.reviewDetailInner}>
        <header className={styles.reviewDetailHeader}>
          <p className={styles.reviewDetailBadge} itemProp="articleSection">
            {detail.category}
          </p>
          <div className={styles.reviewDetailTitleGroup}>
            <h1 id="customer-review-detail-title" itemProp="headline">
              {detail.title}
            </h1>
            <address
              className={styles.reviewDetailAuthorLine}
              itemProp="author"
              itemScope
              itemType="https://schema.org/Organization"
            >
              <span>작성자</span>
              <Image
                alt=""
                className={styles.reviewDetailAuthorIcon}
                height={20}
                src="/figma-assets/cbrain-author.svg"
                width={20}
              />
              <span itemProp="name">{detail.author}</span>
            </address>
          </div>
        </header>

        <section
          aria-labelledby="customer-review-detail-title"
          className={styles.reviewDetailContent}
          itemProp="articleBody"
        >
          <figure
            className={styles.reviewDetailVideo}
            itemProp="video"
            itemScope
            itemType="https://schema.org/VideoObject"
          >
            <meta content={detail.title} itemProp="name" />
            <meta content={detail.videoAlt} itemProp="description" />
            <meta content={imageUrl} itemProp="thumbnailUrl" />
            <Image
              alt={detail.videoAlt}
              className={styles.reviewDetailVideoImage}
              fill
              priority
              sizes="(min-width: 640px) 640px, calc(100vw - 40px)"
              src={detail.thumbnail}
            />
            <span
              aria-hidden="true"
              className={styles.reviewDetailVideoOverlay}
            />
            <span aria-hidden="true" className={styles.reviewDetailPlayButton}>
              <Image
                alt=""
                className={styles.reviewDetailPlayIcon}
                fill
                sizes="48px"
                src={reviewPlayLargeIcon}
              />
            </span>
            <figcaption className={styles.visuallyHidden}>
              {detail.videoAlt}
            </figcaption>
          </figure>

          <div className={styles.reviewDetailBody}>
            {detail.content.map((block) => {
              if (block.type === "heading") {
                return <h2 key={block.text}>{block.text}</h2>;
              }

              if (block.type === "quote") {
                return (
                  <blockquote
                    className={styles.reviewDetailQuote}
                    key={block.text}
                  >
                    <p>&quot;{block.text}&quot;</p>
                    <cite>— {block.cite}</cite>
                  </blockquote>
                );
              }

              return <p key={block.text}>{block.text}</p>;
            })}
          </div>

          <section
            aria-labelledby="customer-review-project-info-title"
            className={styles.projectInfoSection}
          >
            <h2 id="customer-review-project-info-title">
              {detail.projectInfoTitle}
            </h2>
            <dl className={styles.projectInfoList}>
              {detail.projectInfo.map((item) => (
                <div className={styles.projectInfoItem} key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </section>

        <nav
          aria-label="고객후기 상세 페이지 이동"
          className={styles.reviewDetailNavigation}
        >
          <Link className={styles.backLink} href="/reviews">
            목록으로
          </Link>
        </nav>
      </div>
    </article>
  );
}
