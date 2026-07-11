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

export function CtaSection() {
  return (
    <section className={styles.ctaSection} id="contact">
      <div className={styles.ctaBackground} />
      <div className={styles.ctaContent}>
        <p className={styles.ctaBadge}>지금 바로 시작하세요</p>
        <div className={styles.ctaText}>
          <h2>
            <span>실패 없는 홍보물 디자인 제작,</span>
            <span>
              지금 바로 <strong>씨브레인</strong>에 맡기세요
            </span>
          </h2>
          <p>빠른 상담 · 전국 납품 · 소량부터 대량까지</p>
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
