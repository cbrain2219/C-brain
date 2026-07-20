import { Button } from "@repo/ui/button";

import { HorizontalDragScroll } from "../../components/HorizontalDragScroll";
import { Icon } from "../../components/Icon";
import { SectionLayout } from "../../components/SectionLayout";
import styles from "../page.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const categories = [
  "브로슈어 · 카탈로그",
  "리플렛 · 팜플렛",
  "포스터 · 전단지",
  "배너 · 책자 · 현수막",
  "명함 · 봉투",
  "로고",
  "패키지 · 쇼핑백",
  "촬영",
  "기타",
];

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
          {categories.map((category, index) => (
            <button
              aria-pressed={index === 0}
              className={`${styles.categoryChip} ${
                index === 0 ? styles.categoryChipActive : ""
              }`}
              key={category}
              type="button"
            >
              {category}
            </button>
          ))}
        </HorizontalDragScroll>
      </div>

      <div className={styles.centerAction}>
        <Button
          rightIcon={<Icon name="arrow-right" size={16} />}
          style={buttonStyle}
        >
          더 많은 포트폴리오
        </Button>
      </div>
    </SectionLayout>
  );
}
