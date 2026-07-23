import { PageHero } from "../../../components/PageHero";

import { JsonLdScript } from "../../_components/JsonLdScript";
import { createPageMetadata } from "../../_content/seo";
import { createStaticPageStructuredData } from "../../_content/structured-data";
import { BlogBoard } from "./_components/BlogBoard";
import { resolveBlogCategory } from "./_constants/blogCategories";
import { blogPosts } from "./_data/blogPosts";
import styles from "./page.module.css";

type BlogPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export const metadata = createPageMetadata("blog");

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category } = await searchParams;
  const activeCategory = resolveBlogCategory(category);

  return (
    <div className={styles.page}>
      <JsonLdScript
        data={createStaticPageStructuredData("blog", {
          pageType: "Blog",
        })}
      />
      <PageHero
        backgroundAlt="대전화병원 브로슈어 디자인 및 인쇄 제작 사례, 화이트 톤 표지와 병원 외관 사진을 활용한 내지 구성"
        backgroundImage="/figma-assets/blog-hero-background.png"
        backgroundPosition="center"
        badge="C · Brain Blog"
        description={
          <p className={styles.description}>
            26년 경력 전문가 씨브레인이 직접 작성하는
            <br />
            브로슈어 · 카탈로그 · 인쇄물 제작에 관한 실전 정보
          </p>
        }
        title={
          <span className={styles.title}>
            홍보물 제작
            <br className={styles.heroMobileBreak} /> 디자인 · 인쇄 실무 꿀팁
          </span>
        }
      />
      <BlogBoard activeCategory={activeCategory} posts={blogPosts} />
    </div>
  );
}
