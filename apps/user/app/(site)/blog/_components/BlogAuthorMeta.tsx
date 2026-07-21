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
      <span aria-hidden="true" className={styles.blogAuthorMark}>
        C
      </span>
      <span className={styles.blogAuthorName}>{author}</span>
      <time className={styles.blogPublishedAt} dateTime={publishedAtIso}>
        {publishedAt}
      </time>
    </footer>
  );
}
