import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  type BlogCategoryFilter,
  resolveBlogCategory,
} from "../_constants/blogCategories";
import {
  blogPosts,
  getBlogDetailSeo,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "../_data/blogPosts";
import type { BlogContentBlock, BlogPost } from "../_types/blog";
import { BlogDetailBackLink } from "./BlogDetailBackLink";
import styles from "./page.module.css";

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    category?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getBlogListHref(category: BlogCategoryFilter) {
  if (category === "전체") return "/blog";

  const params = new URLSearchParams({ category });
  return `/blog?${params.toString()}`;
}

function getBlogDetailHref(post: BlogPost, category: BlogCategoryFilter) {
  if (category === "전체") return `/blog/${post.slug}`;

  const params = new URLSearchParams({ category });
  return `/blog/${post.slug}?${params.toString()}`;
}

function getAbsoluteUrl(path: string, siteUrl: string | undefined) {
  return siteUrl ? new URL(path, siteUrl).toString() : undefined;
}

function stringifyJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function getBlogDetailStructuredData(
  post: BlogPost,
  pageUrl: string | undefined,
  imageUrl: string | undefined,
) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    articleSection: post.category,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    dateModified: post.publishedAtIso,
    datePublished: post.publishedAtIso,
    description: post.detail.seoDescription,
    headline: post.title,
    publisher: {
      "@type": "Organization",
      name: "C-Brain",
    },
  };

  if (pageUrl) {
    data.mainEntityOfPage = pageUrl;
  }

  if (imageUrl) {
    data.image = imageUrl;
  }

  return data;
}

function renderBlogContentBlock(block: BlogContentBlock) {
  switch (block.type) {
    case "heading":
      return <h2 key={block.id}>{block.text}</h2>;
    case "paragraph":
      return <p key={block.id}>{block.text}</p>;
    case "orderedList":
      return (
        <ol
          className={styles.blogDetailList}
          key={block.id}
          start={block.start}
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "unorderedList":
      return (
        <ul className={styles.blogDetailList} key={block.id}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "image": {
      const figureClassName =
        block.visibleOn === "desktop"
          ? `${styles.blogDetailImageFigure} ${styles.blogDetailDesktopOnly}`
          : styles.blogDetailImageFigure;

      return (
        <figure className={figureClassName} key={block.id}>
          {block.src ? (
            <Image
              alt={block.alt}
              className={styles.blogDetailImage}
              fill
              sizes="640px"
              src={block.src}
            />
          ) : (
            <div
              aria-hidden="true"
              className={styles.blogDetailImagePlaceholder}
            >
              {block.label ?? "IMG"}
            </div>
          )}
          <figcaption className={styles.visuallyHidden}>{block.alt}</figcaption>
        </figure>
      );
    }
  }
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "블로그 상세 | C-Brain",
    };
  }

  const seo = getBlogDetailSeo(post);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const canonicalUrl = siteUrl
    ? new URL(`/blog/${post.slug}`, siteUrl)
    : undefined;
  const socialImage = siteUrl
    ? {
        alt: post.title,
        url: new URL(post.image, siteUrl),
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
      publishedTime: post.publishedAtIso,
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

export default async function BlogDetailPage({
  params,
  searchParams,
}: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const activeCategory = resolveBlogCategory(
    getSearchParamValue(resolvedSearchParams?.category),
  );
  const listHref = getBlogListHref(activeCategory);
  const relatedPosts = getRelatedBlogPosts(post.slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const pageUrl = getAbsoluteUrl(`/blog/${post.slug}`, siteUrl);
  const imageUrl = getAbsoluteUrl(post.image, siteUrl);
  const structuredData = getBlogDetailStructuredData(post, pageUrl, imageUrl);

  return (
    <article
      className={styles.blogDetailPage}
      itemScope
      itemType="https://schema.org/Article"
    >
      <meta content={post.detail.seoDescription} itemProp="description" />
      <meta content={post.publishedAtIso} itemProp="datePublished" />
      <meta content={post.publishedAtIso} itemProp="dateModified" />
      {imageUrl ? <meta content={imageUrl} itemProp="image" /> : null}
      <script
        dangerouslySetInnerHTML={{
          __html: stringifyJsonLd(structuredData),
        }}
        type="application/ld+json"
      />
      <div className={styles.blogDetailInner}>
        <header className={styles.blogDetailHeader}>
          <p className={styles.blogDetailBadge} itemProp="articleSection">
            {post.category}
          </p>
          <div className={styles.blogDetailTitleGroup}>
            <h1 id="blog-detail-title" itemProp="headline">
              {post.title}
            </h1>
            <div className={styles.blogDetailMeta}>
              <address
                className={styles.blogDetailAuthorLine}
                itemProp="author"
                itemScope
                itemType="https://schema.org/Organization"
              >
                <span>작성자</span>
                <Image
                  alt=""
                  className={styles.blogDetailAuthorIcon}
                  height={20}
                  src="/figma-assets/cbrain-author.svg"
                  width={20}
                />
                <span itemProp="name">{post.author}</span>
              </address>
              <span aria-hidden="true" className={styles.blogDetailMetaDot} />
              <div className={styles.blogDetailDateLine}>
                <span>작성일</span>
                <time dateTime={post.publishedAtIso}>{post.publishedAt}</time>
              </div>
            </div>
          </div>
        </header>

        <section
          aria-labelledby="blog-detail-title"
          className={styles.blogDetailContent}
          itemProp="articleBody"
        >
          {post.detail.body.map(renderBlogContentBlock)}
        </section>

        <BlogDetailBackLink href={listHref} />

        <aside
          aria-labelledby="more-blog-title"
          className={styles.moreBlogSection}
        >
          <h2 id="more-blog-title">더 많은 블로그</h2>
          <ul className={styles.moreBlogList}>
            {relatedPosts.map((relatedPost) => {
              const relatedHref = getBlogDetailHref(
                relatedPost,
                activeCategory,
              );

              return (
                <li className={styles.moreBlogItem} key={relatedPost.id}>
                  <article
                    aria-labelledby={`more-blog-${relatedPost.id}-title`}
                  >
                    <Link
                      aria-label={`${relatedPost.title} 상세 보기`}
                      className={styles.moreBlogCard}
                      data-blog-detail-href={relatedHref}
                      href={relatedHref}
                    >
                      <figure className={styles.moreBlogFigure}>
                        <div className={styles.moreBlogImageFrame}>
                          <Image
                            alt={relatedPost.title}
                            className={styles.moreBlogImage}
                            fill
                            sizes="(min-width: 481px) 200px, calc(100vw - 40px)"
                            src={relatedPost.image}
                          />
                        </div>
                        <figcaption className={styles.moreBlogCardBody}>
                          <span className={styles.moreBlogTag}>
                            {relatedPost.category}
                          </span>
                          <div className={styles.moreBlogText}>
                            <h3 id={`more-blog-${relatedPost.id}-title`}>
                              {relatedPost.title}
                            </h3>
                            <p>{relatedPost.summary}</p>
                          </div>
                          <footer className={styles.moreBlogMeta}>
                            <span aria-hidden="true">C</span>
                            <span>{relatedPost.author}</span>
                            <time dateTime={relatedPost.publishedAtIso}>
                              {relatedPost.publishedAt}
                            </time>
                          </footer>
                        </figcaption>
                      </figure>
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </article>
  );
}
