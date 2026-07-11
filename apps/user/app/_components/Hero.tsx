import { Button } from "@repo/ui/button";
import type { CSSProperties } from "react";

import { Icon } from "../../components/Icon";
import styles from "../page.module.css";

const kakaoButtonStyle: CSSProperties = {
  width: 164,
  borderRadius: 32,
  borderColor: "#ffffff",
  background: "linear-gradient(105deg, #fae100 0%, #fac800 100%)",
  color: "#3b1d1d",
};

const priceButtonStyle: CSSProperties = {
  width: 164,
  borderRadius: 32,
  borderColor: "#ffffff",
  background: "linear-gradient(90deg, #30bac3 0%, #269aa3 100%)",
  color: "#fefefe",
};

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBackground} />
      <div className={styles.heroGradient} />
      <div className={styles.heroContent}>
        <p className={styles.heroBadge}>
          홍보물 기획 · 디자인 · 인쇄 원스톱 전문 회사
        </p>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            <span>26년 · 1,200개 기업이 선택한</span>
            <span>
              <strong>편집디자인 업체,</strong> 씨브레인
            </span>
          </h1>
          <p className={styles.heroDescription}>
            1:1 전담 디자이너가 제작부터 납품까지, 처음부터 끝까지 빠른
            소통으로 책임집니다.
          </p>
          <p className={styles.heroDescription}>
            박람회 · 전시회 참가 기업 / 신규 브랜드 런칭 / 기업 IR 제안서 ·
            브로슈어 제작이 필요한 모든 기업에
          </p>
        </div>
        <div className={styles.ctaRow}>
          <Button
            rightIcon={<Icon name="message-typing" size={16} />}
            style={kakaoButtonStyle}
          >
            실시간 카톡상담
          </Button>
          <Button
            rightIcon={<Icon name="arrow-right" size={16} />}
            style={priceButtonStyle}
          >
            정찰제 가격 보기
          </Button>
        </div>
      </div>
    </section>
  );
}
