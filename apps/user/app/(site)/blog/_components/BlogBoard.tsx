"use client";

import type { MouseEvent } from "react";
import { Fragment, useState } from "react";

import { HorizontalDragScroll } from "../../../../components/HorizontalDragScroll";

import { BLOG_CATEGORIES, type BlogCategoryFilter } from "../_constants/blogCategories";
import type { BlogPost } from "../_types/blog";
import { filterBlogPosts } from "../_utils/filterBlogPosts";
import { BlogCard } from "./BlogCard";
import { BlogConsultCard } from "./BlogConsultCard";
import { BlogFeaturedCard } from "./BlogFeaturedCard";
import { BlogPopularList } from "./BlogPopularList";
import styles from "../page.module.css";

type BlogBoardProps = {
  posts: readonly BlogPost[];
};

export function BlogBoard({ posts }: BlogBoardProps) {
  const [activeCategory, setActiveCategory] =
    useState<BlogCategoryFilter>("전체");
  const visiblePosts = filterBlogPosts(posts, activeCategory);
  const featuredPost =
    visiblePosts.find((post) => post.featured) ?? visiblePosts[0];
  const ordinaryPosts = visiblePosts.filter(
    (post) => post.id !== featuredPost?.id,
  );
  const popularPosts = posts.filter((post) => post.popularRank !== undefined);
  const consultPlacementIndex = Math.min(3, ordinaryPosts.length - 1);

  const handleCategoryChange = (event: MouseEvent<HTMLButtonElement>) => {
    setActiveCategory(event.currentTarget.value as BlogCategoryFilter);
  };

  return (
    <section className={styles.blogBoard} aria-labelledby="blog-board-title">
      <div className={styles.blogBoardInner}>
        <header className={styles.blogBoardHeader}>
          <p className={styles.blogBoardKicker}>C · Brain 공식 블로그</p>
          <h2 className={styles.blogBoardTitle} id="blog-board-title">
            전체 게시글 <strong>{posts.length}</strong>
          </h2>
        </header>

        <HorizontalDragScroll
          ariaLabel="블로그 카테고리"
          className={styles.blogCategoryScroll}
        >
          <div className={styles.blogCategoryList} role="group">
            {BLOG_CATEGORIES.map((category) => (
              <button
                aria-pressed={activeCategory === category}
                className={styles.blogCategoryButton}
                key={category}
                onClick={handleCategoryChange}
                type="button"
                value={category}
              >
                {category}
              </button>
            ))}
          </div>
        </HorizontalDragScroll>

        {featuredPost ? (
          <div className={styles.blogBoardLayout}>
            <div className={styles.blogBoardContent}>
              <BlogFeaturedCard post={featuredPost} />
              <div className={styles.blogOrdinaryGrid}>
                {ordinaryPosts.map((post, index) => (
                  <Fragment key={post.id}>
                    <BlogCard post={post} />
                    {index === consultPlacementIndex ? (
                      <BlogConsultCard
                        className={styles.blogConsultCardInFlow}
                      />
                    ) : null}
                  </Fragment>
                ))}
                {ordinaryPosts.length === 0 ? (
                  <BlogConsultCard className={styles.blogConsultCardInFlow} />
                ) : null}
              </div>
            </div>
            <aside className={styles.blogSidebar} aria-label="블로그 부가 정보">
              <BlogConsultCard className={styles.blogConsultCardSidebar} />
              <BlogPopularList posts={popularPosts} />
            </aside>
          </div>
        ) : (
          <p className={styles.blogEmptyState}>
            선택한 카테고리의 게시글을 준비하고 있습니다.
          </p>
        )}
      </div>
    </section>
  );
}
