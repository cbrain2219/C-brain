import Image from "next/image";

import { aboutReasons } from "../_content/about";
import styles from "../page.module.css";

export function AboutSection() {
  return (
    <section className={styles.aboutSection} id="about">
      <div className={`${styles.sectionInner} ${styles.aboutInner}`}>
        <div className={styles.aboutHeader}>
          <p className={`${styles.sectionKicker} ${styles.aboutKicker}`}>
            씨브레인(C-Brain) 소개
          </p>
          <div className={styles.aboutHeadingText}>
            <h2 className={styles.aboutTitle}>
              <span>1,200여 기업이</span>
              <span>씨브레인을 선택한 이유</span>
            </h2>
            <p className={styles.aboutDescription}>
              씨브레인은 2000년 설립 이후 26년간 전국 1,200여 곳과의
              파트너십과 4,000건 이상의 제작 실적을 보유한
              <br className={styles.aboutDesktopBreak} /> 브로슈어 · 카탈로그 및
              각종 홍보물 기획 · 디자인 · 인쇄 원스톱 제작 전문 기업입니다.
            </p>
          </div>
        </div>

        <div className={styles.aboutContent}>
          <div className={styles.reasonGrid}>
            {aboutReasons.map((reason) => (
              <article className={styles.reasonItem} key={reason.title}>
                <span className={styles.reasonIcon}>
                  <Image alt="" height={14} src={reason.icon} width={14} />
                </span>
                <div>
                  <h3>{reason.title}</h3>
                  <p>{reason.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.aboutMedia}>
            <Image
              alt="코리아 나라장터 엑스포와 씨브레인의 협업 영상"
              className={styles.aboutImage}
              fill
              sizes="(min-width: 1440px) 680px, calc(100vw - 40px)"
              src="/figma-assets/about-partnership.jpg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
