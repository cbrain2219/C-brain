import type { Metadata } from "next";

import { CtaSection } from "../../_components/CtaSection";
import {
  getPortfolioCategoryIdFromValue,
  portfolioCategories,
  portfolioItems,
  portfolioPageSeo,
} from "../../_content/portfolio";
import { PortfolioGallery } from "./PortfolioGallery";
import styles from "./page.module.css";

type PortfolioPageProps = {
  searchParams?: Promise<{
    category?: string | string[];
  }>;
};

export const metadata: Metadata = {
  description: portfolioPageSeo.description,
  keywords: portfolioPageSeo.keywords,
  openGraph: {
    description: portfolioPageSeo.description,
    locale: "ko_KR",
    siteName: "C-Brain",
    title: portfolioPageSeo.title,
    type: "website",
  },
  title: portfolioPageSeo.title,
  twitter: {
    card: "summary",
    description: portfolioPageSeo.description,
    title: portfolioPageSeo.title,
  },
};

export default async function PortfolioPage({ searchParams }: PortfolioPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialCategoryId = getPortfolioCategoryIdFromValue(
    resolvedSearchParams?.category,
  );

  return (
    <div className={styles.portfolioPage}>
      <section className={styles.hero}>
        <div aria-hidden="true" className={styles.heroBackground} />
        <div aria-hidden="true" className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.badge}>Portfolio</p>
          <div className={styles.heroText}>
            <h1>
              <span>씨브레인 포트폴리오</span>
              <span>디자인 제작 사례</span>
            </h1>
            <p>
              <span>
                브로슈어 · 카탈로그 · 리플렛 · 팜플렛 · 포스터 · 명함 등
              </span>
              <span>씨브레인의 실제 제작물을 확인하세요.</span>
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="portfolio-work-title" className={styles.work}>
        <div className={styles.workInner}>
          <div className={styles.workHeader}>
            <p className={styles.badge}>4,000건+ 대표 디자인 제작 사례</p>
            <h2 id="portfolio-work-title">브로슈어 · 카탈로그 제작물</h2>
          </div>

          <PortfolioGallery
            categories={portfolioCategories}
            initialCategoryId={initialCategoryId}
            items={portfolioItems}
          />
        </div>
      </section>

      <CtaSection
        description="견적부터 납기까지 빠르고 명확하게 안내드립니다."
        descriptionSize="md"
        id="contact"
        secondaryAction={{
          label: "정찰제 가격 보기",
          href: "/#services",
        }}
        titleLines={["궁금하신 점, 지금 바로 문의하세요"]}
      />
    </div>
  );
}
