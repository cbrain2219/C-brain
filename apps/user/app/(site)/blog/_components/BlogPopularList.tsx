import Link from "next/link";

import type { BlogPost } from "../_types/blog";

import styles from "../page.module.css";

type BlogPopularListProps = {
  getDetailHref: (post: BlogPost) => string;
  posts: readonly BlogPost[];
};

export function BlogPopularList({
  getDetailHref,
  posts,
}: BlogPopularListProps) {
  const popularPosts = [...posts]
    .filter(
      (post): post is BlogPost & { popularRank: number } =>
        typeof post.popularRank === "number",
    )
    .sort((first, second) => first.popularRank - second.popularRank)
    .slice(0, 5);

  return (
    <section className={styles.blogPopularList} aria-labelledby="blog-popular-title">
      <h3 className={styles.blogPopularHeading} id="blog-popular-title">
        주요게시글 <strong>TOP5</strong>
      </h3>
      <ol className={styles.blogPopularItems}>
        {popularPosts.map((post) => (
          <li className={styles.blogPopularItem} key={post.id}>
            <Link
              aria-label={`${post.title} 상세 보기`}
              className={styles.blogPopularLink}
              data-blog-detail-href={getDetailHref(post)}
              href={getDetailHref(post)}
            >
              <span className={styles.blogPopularRank}>{post.popularRank}</span>
              <span className={styles.blogPopularTitle}>{post.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
