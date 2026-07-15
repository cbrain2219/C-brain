import { Button } from "@repo/ui/button";
import type { CSSProperties, ReactNode } from "react";

import { Icon } from "../../components/Icon";
import styles from "../page.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const contactButtonPadding = "8px 23px";
const contactButtonWidth = "var(--contact-button-width)";

const kakaoButtonStyle: CSSProperties = {
  ...createGradientBorderButtonStyle({
    padding: contactButtonPadding,
    tone: "contactKakao",
  }),
  width: contactButtonWidth,
};

const priceButtonStyle: CSSProperties = {
  ...createGradientBorderButtonStyle({
    padding: contactButtonPadding,
  }),
  width: contactButtonWidth,
};

const ctaButtonIconStyle: CSSProperties = {
  flex: "0 0 auto",
};

type CtaSectionProps = {
  backgroundImage?: string;
  badge?: ReactNode | null;
  description?: ReactNode | null;
  id?: string;
  titleLines: readonly ReactNode[];
};

type CtaSectionStyle = CSSProperties & {
  "--cta-background-image": string;
};

export function CtaSection({
  backgroundImage = "/figma-assets/landing-cta-background.jpg",
  badge = null,
  description = null,
  id,
  titleLines,
}: CtaSectionProps) {
  const sectionStyle: CtaSectionStyle = {
    "--cta-background-image": `url("${backgroundImage}")`,
  };

  return (
    <section className={styles.ctaSection} id={id} style={sectionStyle}>
      <div className={styles.ctaBackground} />
      <div className={styles.ctaContent}>
        {badge ? <p className={styles.ctaBadge}>{badge}</p> : null}
        <div className={styles.ctaText}>
          <h2>
            {titleLines.map((titleLine, index) => (
              <span key={typeof titleLine === "string" ? titleLine : index}>
                {titleLine}
              </span>
            ))}
          </h2>
          {description ? <p>{description}</p> : null}
        </div>
        <div className={styles.ctaRow}>
          <Button style={kakaoButtonStyle}>
            <span>실시간 카톡상담</span>
            <Icon name="message-typing" size={24} style={ctaButtonIconStyle} />
          </Button>
          <Button style={priceButtonStyle}>
            <span>정찰제 가격 보기</span>
            <Icon name="arrow-right" size={24} style={ctaButtonIconStyle} />
          </Button>
        </div>
      </div>
    </section>
  );
}
