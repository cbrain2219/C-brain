import { Button, ButtonLink } from "@repo/ui/button";

import { Icon } from "../../components/Icon";
import { PageHero } from "../../components/PageHero";
import { KAKAO_CHANNEL_URL } from "../_content/contact";
import styles from "../page.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const heroButtonWidth = "var(--landing-hero-button-width, 164px)" as const;

const kakaoButtonStyle = {
  ...createGradientBorderButtonStyle({ tone: "contactKakao" }),
  width: heroButtonWidth,
};

const priceButtonStyle = {
  ...createGradientBorderButtonStyle(),
  width: heroButtonWidth,
};

export function Hero() {
  return (
    <PageHero
      actions={
        <>
          <ButtonLink
            className={styles.heroGradientButton}
            href={KAKAO_CHANNEL_URL}
            rel="noreferrer"
            rightIcon={<Icon name="message-typing" size={16} />}
            style={kakaoButtonStyle}
            target="_blank"
          >
            실시간 카톡상담
          </ButtonLink>
          <Button
            className={styles.heroGradientButton}
            rightIcon={<Icon name="arrow-right" size={16} />}
            style={priceButtonStyle}
          >
            정찰제 가격 보기
          </Button>
        </>
      }
      backgroundAlt="편집디자인 전문회사 씨브레인 브랜드 이미지"
      backgroundImage="/figma-assets/landing-hero-background.png"
      backgroundPosition="62% center"
      badge="홍보물 기획 · 디자인 · 인쇄 원스톱 전문 회사"
      description={
        <>
          <p>
            1:1 전담 디자이너가 제작부터 납품까지,
            <br className={styles.heroMobileBreak} /> 처음부터 끝까지 빠른 소통으로
            책임집니다.
          </p>
          <p className={styles.heroAudience}>
            박람회 · 전시회 참가 기업 / 신규 브랜드 런칭
            <br className={styles.heroMobileBreak} /> 기업 IR 제안서 · 브로슈어 제작이
            필요한 모든 기업에
          </p>
        </>
      }
      title={
        <>
          <span>26년 · 1,200개 기업이 선택한</span>
          <span>
            <strong>편집디자인 업체,</strong> 씨브레인
          </span>
        </>
      }
      variant="landing"
    />
  );
}
