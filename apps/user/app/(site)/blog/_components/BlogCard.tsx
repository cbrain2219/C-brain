import Image from "next/image";
import Link from "next/link";

import type { BlogPost } from "../_types/blog";

import { BlogAuthorMeta } from "./BlogAuthorMeta";
import styles from "../page.module.css";

type BlogCardProps = {
  detailHref: string;
  post: BlogPost;
};

// Oversample detailed print mockups so browser downscaling keeps small text sharp.
const blogCardThumbnailSizes =
  "(min-width: 1440px) 488px, " +
  "(min-width: 1080px) 50vw, " +
  "(min-width: 640px) 87vw, 450px";

export function BlogCard({ detailHref, post }: BlogCardProps) {
  return (
    <li className={styles.blogCard}>
      <article>
        <Link
          aria-label={`${post.title} 상세 보기`}
          className={styles.blogCardLink}
          data-blog-detail-href={detailHref}
          href={detailHref}
        >
          <div className={styles.blogCardImage}>
            <Image
              alt={post.imageAlt}
              className={styles.blogCardImageAsset}
              fill
              quality={90}
              sizes={blogCardThumbnailSizes}
              src={post.image}
            />
          </div>
          <div className={styles.blogCardBody}>
            <div className={styles.blogCardTextGroup}>
              <p className={styles.blogCardCategory}>{post.category}</p>
              <div className={styles.blogCardCopy}>
                <h3 className={styles.blogCardTitle}>{post.title}</h3>
                <p className={styles.blogCardSummary}>{post.summary}</p>
              </div>
            </div>
            <BlogAuthorMeta
              author={post.author}
              publishedAt={post.publishedAt}
              publishedAtIso={post.publishedAtIso}
            />
          </div>
        </Link>
      </article>
    </li>
  );
}
