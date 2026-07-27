import Image from "next/image";
import Link from "next/link";

import { HorizontalDragScroll } from "../../components/HorizontalDragScroll";
import { Icon } from "../../components/Icon";
import { SectionLayout } from "../../components/SectionLayout";
import { blogPosts } from "../(site)/blog/_data/blogPosts";
import styles from "../page.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const buttonStyle = createGradientBorderButtonStyle();
const landingPosts = blogPosts
  .filter((post) => post.landingRank !== undefined)
  .sort(
    (firstPost, secondPost) =>
      (firstPost.landingRank ?? Infinity) -
      (secondPost.landingRank ?? Infinity),
  )
  .slice(0, 3);

export function BlogSection() {
  return (
    <SectionLayout
      badge="블로그"
      badgeClassName={styles.blogKicker}
      className={styles.blogSection}
      description="26년 경력 전문가 씨브레인이 직접 작성하는 브로슈어 · 카탈로그 · 인쇄물 제작 실전 정보"
      descriptionClassName={styles.blogDescription}
      id="blog"
      innerClassName={styles.blogInner}
      title={
        <>
          <span>26년 현장에서 검증된</span>
          <span>홍보물 제작 · 디자인 · 인쇄 가이드</span>
        </>
      }
      titleClassName={styles.blogTitle}
    >
      <HorizontalDragScroll
        ariaLabel="블로그 게시글 목록"
        className={styles.blogGrid}
      >
        {landingPosts.map((post) => (
          <Link
            className={styles.blogCard}
            href={`/blog/${post.slug}`}
            key={post.id}
          >
            <div className={styles.blogImage}>
              <Image
                alt={post.title}
                className={styles.coverImage}
                fill
                sizes="(min-width: 1440px) 440px, (min-width: 1080px) 33vw, (min-width: 640px) 400px, 350px"
                src={post.image}
              />
            </div>
            <div className={styles.blogCardBody}>
              <div className={styles.blogCopy}>
                <p className={styles.blogCategory}>{post.category}</p>
                <h3>{post.title}</h3>
                <p>{post.summary}</p>
              </div>
              <time dateTime={post.publishedAtIso}>{post.publishedAt}</time>
            </div>
          </Link>
        ))}
      </HorizontalDragScroll>

      <div className={styles.centerAction}>
        <Link
          className={styles.blogMoreLink}
          href="/blog"
          style={buttonStyle}
        >
          <span>블로그 전체 보기</span>
          <Icon
            className={styles.moreButtonIcon}
            name="arrow-right"
            size={24}
          />
        </Link>
      </div>
    </SectionLayout>
  );
}
