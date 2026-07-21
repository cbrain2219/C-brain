"use client";

import Link from "next/link";
import { Fragment } from "react";

import { HorizontalDragScroll } from "../../../../components/HorizontalDragScroll";

import {
  BLOG_CATEGORIES,
  type BlogCategoryFilter,
} from "../_constants/blogCategories";
import type { BlogPost } from "../_types/blog";
import { filterBlogPosts } from "../_utils/filterBlogPosts";
import { BlogCard } from "./BlogCard";
import { BlogConsultCard } from "./BlogConsultCard";
import { BlogFeaturedCard } from "./BlogFeaturedCard";
import { BlogHistoryBoundary } from "./BlogHistoryBoundary";
import { BlogPopularList } from "./BlogPopularList";
import styles from "../page.module.css";

type BlogBoardProps = {
  activeCategory: BlogCategoryFilter;
  posts: readonly BlogPost[];
};

const FEATURED_SLIDE_COUNT = 3;

function getCategoryHref(category: BlogCategoryFilter) {
  if (category === "전체") return "/blog";

  const params = new URLSearchParams({ category });
  return `/blog?${params.toString()}`;
}

function getBlogDetailHref(post: BlogPost, category: BlogCategoryFilter) {
  if (category === "전체") return `/blog/${post.slug}`;

  const params = new URLSearchParams({ category });
  return `/blog/${post.slug}?${params.toString()}`;
}

function getFeaturedSlides(posts: readonly BlogPost[]) {
  return posts.slice(0, FEATURED_SLIDE_COUNT);
}

export function BlogBoard({ activeCategory, posts }: BlogBoardProps) {
  const visiblePosts = filterBlogPosts(posts, activeCategory);
  const featuredSlides = getFeaturedSlides(visiblePosts);
  const featuredPost = featuredSlides[0];
  const ordinaryPosts = visiblePosts.filter(
    (post) => post.id !== featuredPost?.id,
  );
  const popularPosts = posts.filter((post) => post.popularRank !== undefined);
  const consultPlacementIndex = Math.min(3, ordinaryPosts.length - 1);
  const listHref = getCategoryHref(activeCategory);

  return (
    <section className={styles.blogBoard} aria-labelledby="blog-board-title">
      <div className={styles.blogBoardInner}>
        <header className={styles.blogBoardHeader}>
          <p className={styles.blogBoardKicker}>C · Brain 공식 블로그</p>
          <h2 className={styles.blogBoardTitle} id="blog-board-title">
            전체 게시글 <strong>{posts.length}</strong>
          </h2>
        </header>

        <nav
          aria-label="블로그 카테고리"
          className={styles.blogCategoryNavigation}
        >
          <HorizontalDragScroll
            ariaLabel="블로그 카테고리 스크롤"
            className={styles.blogCategoryScroll}
          >
            <ul className={styles.blogCategoryList}>
              {BLOG_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    aria-current={activeCategory === category ? "page" : undefined}
                    className={styles.blogCategoryButton}
                    href={getCategoryHref(category)}
                    scroll={false}
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </HorizontalDragScroll>
        </nav>

        <BlogHistoryBoundary listHref={listHref}>
          {featuredPost ? (
            <div className={styles.blogBoardLayout}>
              <div className={styles.blogBoardContent}>
                <BlogFeaturedCard
                  getDetailHref={(post) =>
                    getBlogDetailHref(post, activeCategory)
                  }
                  posts={featuredSlides}
                />
                <ul className={styles.blogOrdinaryGrid}>
                  {ordinaryPosts.map((post, index) => (
                    <Fragment key={post.id}>
                      <BlogCard
                        detailHref={getBlogDetailHref(post, activeCategory)}
                        post={post}
                      />
                      {index === consultPlacementIndex ? (
                        <li className={styles.blogConsultCardInFlow}>
                          <BlogConsultCard />
                        </li>
                      ) : null}
                    </Fragment>
                  ))}
                  {ordinaryPosts.length === 0 ? (
                    <li className={styles.blogConsultCardInFlow}>
                      <BlogConsultCard />
                    </li>
                  ) : null}
                </ul>
              </div>
              <aside
                className={styles.blogSidebar}
                aria-label="블로그 부가 정보"
              >
                <BlogConsultCard className={styles.blogConsultCardSidebar} />
                <BlogPopularList
                  getDetailHref={(post) =>
                    getBlogDetailHref(post, activeCategory)
                  }
                  posts={popularPosts}
                />
              </aside>
            </div>
          ) : (
            <p className={styles.blogEmptyState}>
              선택한 카테고리의 게시글을 준비하고 있습니다.
            </p>
          )}
        </BlogHistoryBoundary>
      </div>
    </section>
  );
}
