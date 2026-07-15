import Image from "next/image";

import type { BlogPost } from "../_types/blog";

import styles from "../page.module.css";

type BlogFeaturedCardProps = {
  post: BlogPost;
};

export function BlogFeaturedCard({ post }: BlogFeaturedCardProps) {
  return (
    <article className={styles.blogFeaturedCard}>
      <div className={styles.blogFeaturedImage}>
        <Image
          alt={post.title}
          className={styles.blogFeaturedImageAsset}
          fill
          priority
          sizes="(min-width: 1440px) 720px, (min-width: 1080px) 66vw, (min-width: 640px) 100vw, 100vw"
          src={post.image}
        />
        <div aria-hidden="true" className={styles.blogFeaturedOverlay} />
      </div>
      <div className={styles.blogFeaturedContent}>
        <p className={styles.blogFeaturedCategory}>{post.category}</p>
        <div className={styles.blogFeaturedCopy}>
          <h3 className={styles.blogFeaturedTitle}>{post.title}</h3>
          <p className={styles.blogFeaturedSummary}>{post.summary}</p>
        </div>
      </div>
      <p aria-label="대표 게시글 1 / 3" className={styles.blogFeaturedIndex}>
        1 / 3
      </p>
    </article>
  );
}
