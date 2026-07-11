import { Button } from "@repo/ui/button";
import Image from "next/image";
import type { CSSProperties } from "react";

import { Icon } from "../../components/Icon";
import styles from "../page.module.css";

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

const portfolioItems = [
  {
    title: "신림산업㈜",
    src: "/figma-assets/portfolio-shinlim.png",
    description:
      "벌크백 물류 솔루션 전문 기업의 S-BAG 제품 브로슈어·카탈로그를 기술형 인포그래픽 중심으로 제작했습니다.",
  },
  { title: "Axis", src: "/figma-assets/portfolio-axis.png" },
  { title: "Wedding", src: "/figma-assets/portfolio-wedding.png" },
  { title: "TMES", src: "/figma-assets/portfolio-tmes.png" },
  { title: "Orange", src: "/figma-assets/portfolio-orange.png" },
  { title: "Black Red", src: "/figma-assets/portfolio-black-red.png" },
  { title: "Lab", src: "/figma-assets/portfolio-lab.png" },
  { title: "Guide", src: "/figma-assets/portfolio-blue-guide.png" },
  { title: "Green", src: "/figma-assets/portfolio-green.png" },
  { title: "Brochure", src: "/figma-assets/portfolio-blue-brochure.png" },
  { title: "Building", src: "/figma-assets/portfolio-building.png" },
  { title: "Card", src: "/figma-assets/portfolio-card.png" },
];

const buttonStyle: CSSProperties = {
  width: 164,
  borderRadius: 32,
  borderColor: "#ffffff",
  background: "linear-gradient(90deg, #30bac3 0%, #269aa3 100%)",
  color: "#fefefe",
};

export function PortfolioSection() {
  return (
    <section className={styles.section} id="portfolio">
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>포트폴리오</p>
          <h2 className={styles.sectionTitle}>
            4,000건+ 대표 디자인 제작 사례
          </h2>
          <p className={styles.sectionDescription}>
            브로슈어 · 카탈로그 · 리플렛 · 포스터 · 명함 등 씨브레인의 실제
            디자인 제작물을 확인하세요.
          </p>
        </div>

        <div aria-label="포트폴리오 카테고리" className={styles.categoryRail}>
          {categories.map((category, index) => (
            <button
              className={`${styles.categoryChip} ${
                index === 0 ? styles.categoryChipActive : ""
              }`}
              key={category}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className={styles.portfolioGrid}>
          {portfolioItems.map((item, index) => (
            <article className={styles.portfolioCard} key={item.src}>
              <Image
                alt={item.title}
                className={styles.coverImage}
                fill
                sizes="(min-width: 1440px) 325px, (min-width: 1080px) 33vw, (min-width: 640px) 50vw, 300px"
                src={item.src}
              />
              {index === 0 ? (
                <div className={styles.portfolioOverlay}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className={styles.centerAction}>
          <Button
            rightIcon={<Icon name="arrow-right" size={16} />}
            style={buttonStyle}
          >
            더 많은 포트폴리오
          </Button>
        </div>
      </div>
    </section>
  );
}
