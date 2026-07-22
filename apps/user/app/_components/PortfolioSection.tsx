import Image from "next/image";
import Link from "next/link";
import { getPublicAssetUrl } from "@repo/supabase/files";
import { listPublishedPortfolioItems } from "@repo/supabase/portfolio";

import { HorizontalDragScroll } from "../../components/HorizontalDragScroll";
import { Icon } from "../../components/Icon";
import { SectionLayout } from "../../components/SectionLayout";
import {
  featuredPortfolioItems,
  getPortfolioDetailHref,
  mapPortfolioRows,
  portfolioCategories,
} from "../_content/portfolio";
import { createUserSupabaseClient } from "../../lib/supabase";
import styles from "../page.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const buttonStyle = createGradientBorderButtonStyle();

async function loadLandingPortfolioItems() {
  const supabase = await createUserSupabaseClient();

  if (!supabase) {
    return featuredPortfolioItems;
  }

  try {
    const rows = await listPublishedPortfolioItems(supabase);
    return mapPortfolioRows(
      rows.filter((row) => row.is_landing_enabled),
      (path) => getPublicAssetUrl(supabase, path),
    ).slice(0, 12);
  } catch (error) {
    console.error("Failed to load landing portfolio items.", error);
    return [];
  }
}

export async function PortfolioSection() {
  const items = await loadLandingPortfolioItems();

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
        {items.length > 0 ? (
          <div className={styles.portfolioGrid}>
            {items.map((item) => (
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
        ) : (
          <p className={styles.contentEmptyState} role="status">
            등록된 포트폴리오가 없습니다.
          </p>
        )}
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
