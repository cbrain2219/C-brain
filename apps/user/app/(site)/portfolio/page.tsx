import Image from "next/image";

import { FIXED_PRICE_ACTION } from "../../_components/ContactActionButtons";
import { CtaSection } from "../../_components/CtaSection";
import { JsonLdScript } from "../../_components/JsonLdScript";
import {
  getPortfolioCategoryIdFromValue,
  portfolioCategories,
} from "../../_content/portfolio";
import { createPageMetadata } from "../../_content/seo";
import {
  createPortfolioBreadcrumbStructuredData,
  createPortfolioPageStructuredData,
} from "../../_content/structured-data";
import { getPublishedPortfolioItems } from "../../../lib/publicContent";
import { PortfolioGallery } from "./PortfolioGallery";
import styles from "./page.module.css";

type PortfolioPageProps = {
  searchParams?: Promise<{
    category?: string | string[];
  }>;
};

export const metadata = createPageMetadata("portfolio");

export default async function PortfolioPage({
  searchParams,
}: PortfolioPageProps) {
  const [resolvedSearchParams, items] = await Promise.all([
    searchParams,
    getPublishedPortfolioItems(),
  ]);
  const initialCategoryId = getPortfolioCategoryIdFromValue(
    resolvedSearchParams?.category,
  );

  return (
    <div className={styles.portfolioPage}>
      <JsonLdScript data={createPortfolioPageStructuredData()} />
      <JsonLdScript data={createPortfolioBreadcrumbStructuredData()} />
      <section className={styles.hero}>
        <Image
          alt="MBC 베이비페어 박람회 포스터 디자인 및 인쇄 제작 사례, 핑크 톤 베이비 일러스트가 돋보이는 행사 홍보물"
          className={styles.heroBackground}
          fill
          priority
          sizes="100vw"
          src="/figma-assets/portfolio-hero-background.png"
        />
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
          <PortfolioGallery
            categories={portfolioCategories}
            initialCategoryId={initialCategoryId}
            items={items}
          />
        </div>
      </section>

      <CtaSection
        description="견적부터 납기까지 빠르고 명확하게 안내드립니다."
        descriptionSize="md"
        id="contact"
        secondaryAction={FIXED_PRICE_ACTION}
        titleLines={["궁금하신 점, 지금 바로 문의하세요"]}
      />
    </div>
  );
}
