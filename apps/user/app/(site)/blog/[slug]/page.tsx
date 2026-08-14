import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  type BlogCategoryFilter,
  getBlogCategories,
  resolveBlogCategory,
} from "../_constants/blogCategories";
import {
  getBlogDetailSeo,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "../_data/blogPosts";
import {
  parseBlogHtmlDocument,
  type BlogHtmlDocument,
} from "../_data/blogHtmlDocument";
import type { BlogContentBlock, BlogPost } from "../_types/blog";
import { LightHeroBadge } from "../../../../components/LightHeroBadge";
import { JsonLdScript } from "../../../_components/JsonLdScript";
import { createBlogPostingStructuredData } from "../../../_content/structured-data";
import {
  getPublishedBlogPostSource,
  getPublishedBlogPosts,
} from "../../../../lib/publicContent";
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

export const revalidate = 0;

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

function BlogHtmlContent({ document }: { document: BlogHtmlDocument }) {
  return (
    <div className={styles.blogHtmlDocumentBoundary}>
      {document.css ? <style>{document.css}</style> : null}
      <div
        className={styles.blogHtmlDocumentContent}
        data-blog-html-document=""
        dangerouslySetInnerHTML={{ __html: document.bodyHtml }}
      />
    </div>
  );
}

function MoreBlogSection({
  activeCategory,
  relatedPosts,
}: {
  activeCategory: BlogCategoryFilter;
  relatedPosts: readonly BlogPost[];
}) {
  return (
    <aside aria-labelledby="more-blog-title" className={styles.moreBlogSection}>
      <h2 id="more-blog-title">더 많은 블로그</h2>
      <ul className={styles.moreBlogList}>
        {relatedPosts.map((relatedPost) => {
          const relatedHref = getBlogDetailHref(relatedPost, activeCategory);

          return (
            <li className={styles.moreBlogItem} key={relatedPost.id}>
              <article aria-labelledby={`more-blog-${relatedPost.id}-title`}>
                <Link
                  aria-label={`${relatedPost.title} 상세 보기`}
                  className={styles.moreBlogCard}
                  data-blog-detail-href={relatedHref}
                  href={relatedHref}
                >
                  <figure className={styles.moreBlogFigure}>
                    <div className={styles.moreBlogImageFrame}>
                      <Image
                        alt={relatedPost.imageAlt}
                        className={styles.moreBlogImage}
                        fill
                        sizes="(min-width: 481px) 200px, calc(100vw - 40px)"
                        src={relatedPost.image}
                      />
                    </div>
                    <figcaption className={styles.moreBlogCardBody}>
                      <div className={styles.moreBlogCopy}>
                        <span className={styles.moreBlogTag}>
                          {relatedPost.category}
                        </span>
                        <div className={styles.moreBlogText}>
                          <h3
                            id={`more-blog-${relatedPost.id}-title`}
                            title={relatedPost.title}
                          >
                            {relatedPost.title}
                          </h3>
                          <p title={relatedPost.summary}>
                            {relatedPost.summary}
                          </p>
                        </div>
                      </div>
                      <footer className={styles.moreBlogMeta}>
                        <Image
                          alt=""
                          className={styles.moreBlogAuthorIcon}
                          height={16}
                          src="/figma-assets/cbrain-author.svg"
                          width={16}
                        />
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
  );
}

function createBlogMetadata(
  post: BlogPost,
  htmlDocument: BlogHtmlDocument | undefined,
): Metadata {
  const seo = getBlogDetailSeo(post);
  const custom = htmlDocument?.metadata;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const defaultCanonicalUrl = siteUrl
    ? new URL(`/blog/${post.slug}`, siteUrl)
    : undefined;
  const canonicalUrl = custom?.canonical ?? defaultCanonicalUrl;
  const defaultSocialImage = siteUrl
    ? {
        alt: post.imageAlt,
        url: new URL(post.image, siteUrl),
      }
    : undefined;
  const openGraphImage = custom?.openGraph.image
    ? { alt: post.imageAlt, url: custom.openGraph.image }
    : defaultSocialImage;
  const twitterImage = custom?.twitter.image
    ? { alt: post.imageAlt, url: custom.twitter.image }
    : openGraphImage;
  const description = custom?.description ?? seo.description;
  const title = custom?.title ?? seo.title;
  const openGraphBase = {
    description: custom?.openGraph.description ?? description,
    images: openGraphImage ? [openGraphImage] : undefined,
    locale: custom?.openGraph.locale ?? "ko_KR",
    siteName: custom?.openGraph.siteName ?? "C-Brain",
    title: custom?.openGraph.title ?? title,
    url: custom?.openGraph.url ?? canonicalUrl,
  };
  const openGraph =
    custom?.openGraph.type === "website"
      ? {
          ...openGraphBase,
          type: "website" as const,
        }
      : {
          ...openGraphBase,
          authors: custom?.openGraph.author
            ? [custom.openGraph.author]
            : undefined,
          modifiedTime: custom?.openGraph.modifiedTime ?? post.publishedAtIso,
          publishedTime: custom?.openGraph.publishedTime ?? post.publishedAtIso,
          section: custom?.openGraph.section,
          type: "article" as const,
        };

  return {
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    authors: custom?.author ? [{ name: custom.author }] : undefined,
    description,
    keywords: custom?.keywords ? [...custom.keywords] : seo.keywords,
    openGraph,
    robots: custom?.robots,
    title: custom?.title ? { absolute: custom.title } : title,
    twitter: {
      card: custom?.twitter.card ?? "summary",
      description: custom?.twitter.description ?? description,
      images: twitterImage ? [twitterImage] : undefined,
      title: custom?.twitter.title ?? title,
    },
  };
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const postsPromise = getPublishedBlogPosts();
  const { slug } = await params;
  const [posts, source] = await Promise.all([
    postsPromise,
    getPublishedBlogPostSource(slug),
  ]);
  const post = getBlogPostBySlug(slug, posts);

  if (!post) {
    return {
      title: "블로그 상세 | C-Brain",
    };
  }

  const htmlDocument =
    source?.content_mode === "html"
      ? parseBlogHtmlDocument(source.content)
      : undefined;

  return createBlogMetadata(post, htmlDocument);
}

export default async function BlogDetailPage({
  params,
  searchParams,
}: BlogDetailPageProps) {
  const postsPromise = getPublishedBlogPosts();
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const [posts, source] = await Promise.all([
    postsPromise,
    getPublishedBlogPostSource(slug),
  ]);
  const post = getBlogPostBySlug(slug, posts);

  if (!post) {
    notFound();
  }

  const categories = getBlogCategories(posts);
  const activeCategory = resolveBlogCategory(
    getSearchParamValue(resolvedSearchParams?.category),
    categories,
  );
  const listHref = getBlogListHref(activeCategory);
  const relatedPosts = getRelatedBlogPosts(post.slug, posts);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const imageUrl = getAbsoluteUrl(post.image, siteUrl);
  const htmlDocument =
    source?.content_mode === "html"
      ? parseBlogHtmlDocument(source.content)
      : undefined;
  const defaultStructuredData = createBlogPostingStructuredData({
    authorName: post.author,
    dateModified: post.publishedAtIso,
    datePublished: post.publishedAtIso,
    description: post.detail.seoDescription,
    headline: post.title,
    imagePath: post.image,
    section: post.category,
    urlPath: `/blog/${post.slug}`,
  });
  const structuredData =
    htmlDocument && htmlDocument.jsonLd.length > 0
      ? htmlDocument.jsonLd
      : [defaultStructuredData];
  const structuredDataScripts = structuredData.map((data, index) => (
    <JsonLdScript data={data} key={`blog-jsonld-${index + 1}`} />
  ));

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
      {structuredDataScripts}
      <div className={styles.blogDetailInner}>
        <div className={styles.blogDetailArticleContent}>
          <header className={styles.blogDetailHeader}>
            <LightHeroBadge itemProp="articleSection">
              {post.category}
            </LightHeroBadge>
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
                  <span className={styles.blogDetailAuthorIdentity}>
                    <Image
                      alt=""
                      className={styles.blogDetailAuthorIcon}
                      height={20}
                      src="/figma-assets/cbrain-author.svg"
                      width={20}
                    />
                    <span itemProp="name">{post.author}</span>
                  </span>
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
            {htmlDocument ? (
              <BlogHtmlContent document={htmlDocument} />
            ) : (
              post.detail.body.map(renderBlogContentBlock)
            )}
          </section>

          <BlogDetailBackLink href={listHref} />
        </div>

        <MoreBlogSection
          activeCategory={activeCategory}
          relatedPosts={relatedPosts}
        />
      </div>
    </article>
  );
}
