import Image from "next/image";

import type { BlogPost } from "../_types/blog";

import styles from "../page.module.css";

type BlogAuthorMetaProps = Pick<
  BlogPost,
  "author" | "publishedAt" | "publishedAtIso"
>;

export function BlogAuthorMeta({
  author,
  publishedAt,
  publishedAtIso,
}: BlogAuthorMetaProps) {
  return (
    <footer className={styles.blogAuthorMeta}>
      <Image
        alt=""
        className={styles.blogAuthorIcon}
        height={16}
        src="/figma-assets/cbrain-author.svg"
        width={16}
      />
      <span className={styles.blogAuthorName}>{author}</span>
      <time className={styles.blogPublishedAt} dateTime={publishedAtIso}>
        {publishedAt}
      </time>
    </footer>
  );
}
