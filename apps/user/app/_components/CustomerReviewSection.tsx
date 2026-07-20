import Image from "next/image";
import type { CSSProperties } from "react";

import { SectionLayout } from "../../components/SectionLayout";
import styles from "../page.module.css";

const featuredClients = [
  {
    src: "/images/partners/hyundai-rotem-partner-logo.png",
    alt: "현대로템 씨브레인 고객사",
    width: 135,
    height: 46,
    marqueeWidth: 121,
    marqueeHeight: 41,
  },
  {
    src: "/images/partners/lotte-global-logistics-partner-logo.png",
    alt: "롯데글로벌로지스 씨브레인 고객사",
    width: 156,
    height: 48,
    marqueeWidth: 129,
    marqueeHeight: 41,
  },
  {
    src: "/images/partners/hanwha-life-financial-service-partner-logo.png",
    alt: "한화생명금융서비스 씨브레인 고객사",
    width: 228,
    height: 42,
    marqueeWidth: 156,
    marqueeHeight: 30,
  },
] as const;

const clientRows = [
  [
    {
      src: "/images/partners/gyeonggi-office-of-education-partner-logo.png",
      alt: "경기도교육청 씨브레인 고객사",
      width: 107,
      height: 28,
    },
    {
      src: "/images/partners/sogang-university-partner-logo.png",
      alt: "서강대학교 씨브레인 고객사",
      width: 133,
      height: 41,
    },
    {
      src: "/images/partners/ppta-partner-logo.png",
      alt: "정부조달기술진흥협회 PPTA 씨브레인 고객사",
      width: 152,
      height: 23,
    },
    {
      src: "/images/partners/seongnam-city-hall-partner-logo.png",
      alt: "성남시청 씨브레인 고객사",
      width: 105,
      height: 35,
    },
    {
      src: "/images/partners/seven-eleven-partner-logo.png",
      alt: "세븐일레븐 씨브레인 고객사",
      width: 126,
      height: 17,
    },
  ],
  [
    {
      src: "/images/partners/ajou-university-hospital-partner-logo.png",
      alt: "아주대학교병원 씨브레인 고객사",
      width: 104,
      height: 36,
    },
    {
      src: "/images/partners/hwahospital-partner-logo.png",
      alt: "대전한방병원 씨브레인 고객사",
      width: 104,
      height: 28,
    },
    {
      src: "/images/partners/ninebell-partner-logo.png",
      alt: "나인벨 씨브레인 고객사",
      width: 126,
      height: 18,
    },
    {
      src: "/images/partners/gafi-partner-logo.png",
      alt: "경기도수산진흥원 GAFI 씨브레인 고객사",
      width: 94,
      height: 48,
    },
    {
      src: "/images/partners/chungkang-college-partner-logo.png",
      alt: "청강문화산업대학교 씨브레인 고객사",
      width: 146,
      height: 20,
    },
    {
      src: "/images/partners/seongnam-senior-innovation-center-partner-logo.png",
      alt: "성남시니어산업혁신센터 씨브레인 고객사",
      width: 154,
      height: 34,
    },
  ],
  [
    {
      src: "/images/partners/laminar-partner-logo.png",
      alt: "라미나 씨브레인 고객사",
      width: 131,
      height: 27,
    },
    {
      src: "/images/partners/hangyeol-it-partner-logo.png",
      alt: "한결정보기술 씨브레인 고객사",
      width: 141,
      height: 27,
    },
    {
      src: "/images/partners/flow-tax-accounting-partner-logo.png",
      alt: "플로우세무회계 씨브레인 고객사",
      width: 147,
      height: 21,
    },
    {
      src: "/images/partners/purom-partner-logo.png",
      alt: "퓨롬 씨브레인 고객사",
      width: 126,
      height: 31,
    },
    {
      src: "/images/partners/seojin-instech-partner-logo.png",
      alt: "서진인스텍 씨브레인 고객사",
      width: 142,
      height: 28,
    },
  ],
] as const;

const marqueeFeaturedClients = featuredClients.map((client) => ({
  alt: client.alt,
  height: client.marqueeHeight,
  src: client.src,
  width: client.marqueeWidth,
}));

const marqueeClients = [...marqueeFeaturedClients, ...clientRows.flat()];
const marqueeClientRows = [
  marqueeClients.filter((_, index) => index % 2 === 0),
  marqueeClients.filter((_, index) => index % 2 === 1),
] as const;

const getLogoImageStyle = (width: number, height: number) =>
  ({
    "--partner-logo-height": `${height}px`,
    "--partner-logo-width": `${width}px`,
  }) as CSSProperties;

export function CustomerReviewSection() {
  return (
    <SectionLayout
      badge="고객 후기"
      badgeClassName={styles.reviewKicker}
      className={styles.reviewSection}
      id="reviews"
      innerClassName={styles.reviewInner}
      title={
        <>
          <span>왜 다양한 산업군의 기업들이</span>
          <span>씨브레인을 다시 찾을까요?</span>
        </>
      }
      titleClassName={styles.reviewTitle}
    >
      <div
        className={`${styles.reviewLogoCloud} ${styles.reviewLogoCloudStatic}`}
        aria-label="고객사 로고"
      >
        <div className={styles.featuredClientLogos}>
          {featuredClients.map((client) => (
            <span className={styles.featuredClientLogo} key={client.src}>
              <Image
                alt={client.alt}
                className={styles.partnerLogoImage}
                height={client.height}
                src={client.src}
                style={getLogoImageStyle(client.width, client.height)}
                width={client.width}
              />
            </span>
          ))}
        </div>
        <div className={styles.reviewClientLogoRows}>
          {clientRows.map((row) => (
            <div className={styles.reviewClientLogoRow} key={row[0].src}>
              {row.map((client) => (
                <span className={styles.reviewClientLogo} key={client.src}>
                  <Image
                    alt={client.alt}
                    className={styles.partnerLogoImage}
                    height={client.height}
                    src={client.src}
                    style={getLogoImageStyle(client.width, client.height)}
                    width={client.width}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.reviewLogoMarquee} aria-label="고객사 로고">
        {marqueeClientRows.map((row, rowIndex) => (
          <div
            className={styles.reviewLogoMarqueeRow}
            key={`marquee-row-${rowIndex}`}
          >
            <div className={styles.reviewLogoMarqueeTrack}>
              {[0, 1].map((copyIndex) => (
                <div
                  aria-hidden={copyIndex === 1 ? true : undefined}
                  className={`${styles.reviewLogoMarqueeGroup} ${
                    copyIndex === 1
                      ? styles.reviewLogoMarqueeGroupDuplicate
                      : ""
                  }`}
                  key={`marquee-copy-${copyIndex}`}
                >
                  {row.map((client) => (
                    <span
                      className={styles.reviewMarqueeLogo}
                      key={`${copyIndex}-${client.src}`}
                    >
                      <Image
                        alt={copyIndex === 1 ? "" : client.alt}
                        className={styles.partnerLogoImage}
                        height={client.height}
                        loading="eager"
                        src={client.src}
                        style={getLogoImageStyle(client.width, client.height)}
                        width={client.width}
                      />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionLayout>
  );
}
