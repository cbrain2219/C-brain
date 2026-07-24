import { ButtonLink } from "@repo/ui/button";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { Icon } from "../../components/Icon";
import { KAKAO_CHANNEL_URL } from "../_content/contact";
import styles from "./CtaSection.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const actionWidth = "var(--cta-action-width)";
const actionPadding = "8px 23px";

const kakaoButtonStyle: CSSProperties = {
  ...createGradientBorderButtonStyle({
    padding: actionPadding,
    tone: "contactKakao",
  }),
  width: actionWidth,
};

const secondaryActionStyle: CSSProperties = {
  ...createGradientBorderButtonStyle({ padding: actionPadding }),
  width: actionWidth,
};

type CtaSectionProps = {
  id?: string;
  badge?: string;
  titleLines: readonly ReactNode[];
  description?: string;
  descriptionSize?: "sm" | "md";
  secondaryAction?: {
    label: string;
    href: string;
  };
};

export function CtaSection({
  id,
  badge,
  titleLines,
  description,
  descriptionSize = "sm",
  secondaryAction,
}: CtaSectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div aria-hidden="true" className={styles.background} />
      <div className={styles.content}>
        {badge ? <p className={styles.badge}>{badge}</p> : null}
        <div className={styles.copy}>
          <h2 className={styles.title}>
            {titleLines.map((line, index) => (
              <span key={typeof line === "string" ? line : index}>{line}</span>
            ))}
          </h2>
          {description ? (
            <p
              className={
                descriptionSize === "md"
                  ? styles.descriptionMd
                  : styles.descriptionSm
              }
            >
              {description}
            </p>
          ) : null}
        </div>
        <div className={styles.actions}>
          <ButtonLink
            href={KAKAO_CHANNEL_URL}
            rel="noreferrer"
            style={kakaoButtonStyle}
            target="_blank"
          >
            <span>실시간 카톡상담</span>
            <Icon className={styles.icon} name="message-typing" size={24} />
          </ButtonLink>
          {secondaryAction ? (
            <Link
              className={styles.secondaryAction}
              href={secondaryAction.href}
              style={secondaryActionStyle}
            >
              <span>{secondaryAction.label}</span>
              <Icon className={styles.icon} name="arrow-right" size={24} />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
