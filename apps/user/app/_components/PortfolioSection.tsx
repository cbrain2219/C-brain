import Image from "next/image";
import Link from "next/link";

import { HorizontalDragScroll } from "../../components/HorizontalDragScroll";
import { Icon } from "../../components/Icon";
import { SectionLayout } from "../../components/SectionLayout";
import {
  featuredPortfolioItems,
  getPortfolioDetailHref,
  portfolioCategories,
} from "../_content/portfolio";
import styles from "../page.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const buttonStyle = createGradientBorderButtonStyle();

export function PortfolioSection() {
  return (
    <SectionLayout
      badge="포트폴리오"
      badgeClassName={styles.portfolioKicker}
      className={styles.portfolioSection}
      description={
        <>
          브로슈어 · 카탈로그 · 리플렛 · 포스터 · 명함 등 씨브레인
          <br />의 실제 디자인 제작물을 확인하세요.
        </>
      }
      descriptionClassName={styles.portfolioDescription}
      id="portfolio"
      innerClassName={styles.portfolioInner}
      title="4,000건+ 대표 디자인 제작 사례"
    >
      <div className={styles.portfolioContent}>
        <HorizontalDragScroll
          ariaLabel="포트폴리오 카테고리"
          className={styles.categoryRail}
        >
          {portfolioCategories.map((category, index) => (
            <button
              aria-pressed={index === 0}
              className={`${styles.categoryChip} ${
                index === 0 ? styles.categoryChipActive : ""
              }`}
              key={category.id}
              type="button"
            >
              {category.label}
            </button>
          ))}
        </HorizontalDragScroll>

        <div className={styles.portfolioGrid}>
          {featuredPortfolioItems.map((item) => (
            <Link
              aria-label={`${item.client} ${item.title} 상세 보기`}
              className={styles.portfolioCard}
              href={getPortfolioDetailHref(item)}
              key={item.slug}
            >
              <Image
                alt={item.imageAlt}
                className={styles.coverImage}
                fill
                sizes="(min-width: 1440px) 325px, (min-width: 1080px) 33vw, (min-width: 640px) 50vw, 300px"
                src={item.image}
              />
              <div className={styles.portfolioOverlay}>
                <h3>{item.client}</h3>
                <p>{item.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.centerAction}>
        <Link
          className={styles.portfolioMoreLink}
          href="/portfolio"
          style={buttonStyle}
        >
          <span>더 많은 포트폴리오</span>
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </SectionLayout>
  );
}
