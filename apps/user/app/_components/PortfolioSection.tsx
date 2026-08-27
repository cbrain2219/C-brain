"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { HorizontalDragScroll } from "../../components/HorizontalDragScroll";
import { Icon } from "../../components/Icon";
import { SectionLayout } from "../../components/SectionLayout";
import {
  getPortfolioDetailHref,
  getPortfolioListHref,
  portfolioCategories,
  type PortfolioCategoryId,
  type PortfolioItem,
} from "../_content/portfolio";
import styles from "../page.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const buttonStyle = createGradientBorderButtonStyle({ width: 184 });
const landingPortfolioScrollStorageKey = "cbrain:landing-portfolio-scroll-y";
// Preserve enough vertical pixels when 3:2 source images cover square/portrait cards.
const portfolioCoverImageSizes =
  "(min-width: 1440px) 488px, " +
  "(min-width: 1080px) 50vw, " +
  "(min-width: 640px) 87vw, 450px";

type PortfolioSectionProps = {
  initialCategoryId?: PortfolioCategoryId;
  items: readonly PortfolioItem[];
};

export function PortfolioSection({
  initialCategoryId,
  items,
}: PortfolioSectionProps) {
  const initialActiveCategoryId =
    initialCategoryId ?? portfolioCategories[0].id;
  const [activeCategoryId, setActiveCategoryId] = useState<PortfolioCategoryId>(
    initialActiveCategoryId,
  );
  const activePortfolioItems = items
    .filter(
      (item) => item.showOnLanding && item.categoryId === activeCategoryId,
    )
    .slice(0, 12);

  const handleCategoryClick = (categoryId: PortfolioCategoryId) => {
    setActiveCategoryId(categoryId);
  };

  const saveLandingPortfolioScroll = () => {
    try {
      window.sessionStorage.setItem(
        landingPortfolioScrollStorageKey,
        String(window.scrollY),
      );
    } catch {
      // Storage can be unavailable; navigation should still continue.
    }
  };

  useEffect(() => {
    setActiveCategoryId(initialActiveCategoryId);
  }, [initialActiveCategoryId]);

  useEffect(() => {
    if (window.location.hash !== "#portfolio") return;

    let savedScrollY: string | null;

    try {
      savedScrollY = window.sessionStorage.getItem(
        landingPortfolioScrollStorageKey,
      );
    } catch {
      return;
    }

    if (!savedScrollY) return;

    try {
      window.sessionStorage.removeItem(landingPortfolioScrollStorageKey);
    } catch {
      // If cleanup is blocked, keep the page usable and still restore once.
    }

    const scrollY = Number.parseInt(savedScrollY, 10);
    if (!Number.isFinite(scrollY)) return;

    window.requestAnimationFrame(() => {
      window.scrollTo({ behavior: "auto", left: 0, top: scrollY });
    });
  }, [initialActiveCategoryId]);

  return (
    <SectionLayout
      badge="포트폴리오"
      badgeClassName={styles.portfolioKicker}
      className={styles.portfolioSection}
      description={
        <>
          브로슈어 · 카탈로그 · 리플렛 · 포스터 · 명함 등
          <span className={styles.portfolioDescriptionDesktopSpace}> </span>
          <br className={styles.portfolioDescriptionMobileBreak} />
          씨브레인의
          <br className={styles.portfolioDescriptionBreak} />
          <span className={styles.portfolioDescriptionMobileSpace}> </span>
          실제 디자인 제작물을 확인하세요.
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
          {portfolioCategories.map((category) => {
            const isActive = activeCategoryId === category.id;

            return (
              <button
                aria-pressed={isActive}
                className={`${styles.categoryChip} ${
                  isActive ? styles.categoryChipActive : ""
                }`}
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                type="button"
              >
                {category.label}
              </button>
            );
          })}
        </HorizontalDragScroll>
        <div className={styles.portfolioGrid}>
          {activePortfolioItems.map((item) => (
            <Link
              aria-label={`${item.client} ${item.title} 상세 보기`}
              className={styles.portfolioCard}
              href={getPortfolioDetailHref(item, "landing")}
              key={item.slug}
              onClick={saveLandingPortfolioScroll}
            >
              <Image
                alt={item.imageAlt}
                className={styles.coverImage}
                fill
                quality={90}
                sizes={portfolioCoverImageSizes}
                src={item.image}
              />
              <div className={styles.portfolioOverlay}>
                <h3>{item.client}</h3>
                <p>{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.centerAction}>
        <Link
          className={styles.portfolioMoreLink}
          href={getPortfolioListHref(activeCategoryId)}
          style={buttonStyle}
        >
          <span>더 많은 포트폴리오</span>
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
