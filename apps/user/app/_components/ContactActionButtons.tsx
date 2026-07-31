import { ButtonLink } from "@repo/ui/button";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Icon } from "../../components/Icon";
import { KAKAO_CHANNEL_URL } from "../_content/contact";
import { createGradientBorderButtonStyle } from "./buttonStyles";
import styles from "./ContactActionButtons.module.css";

const actionWidth = "var(--contact-action-width)";
const actionPadding = "8px 23px";

const kakaoButtonStyle: CSSProperties = {
  ...createGradientBorderButtonStyle({
    includeBorder: false,
    padding: actionPadding,
    tone: "contactKakao",
  }),
  width: actionWidth,
};

const secondaryActionStyle: CSSProperties = {
  ...createGradientBorderButtonStyle({
    includeBorder: false,
    padding: actionPadding,
  }),
  width: actionWidth,
};

export type ContactSecondaryAction = {
  label: string;
  href: string;
};

export const FIXED_PRICE_ACTION = {
  label: "정찰제 가격 보기",
  href: "/order",
} as const satisfies ContactSecondaryAction;

type ContactActionButtonsProps = {
  actionOrder?: "contact-first" | "secondary-first";
  secondaryAction?: ContactSecondaryAction;
  variant?: "default" | "compact";
};

export function ContactActionButtons({
  actionOrder = "contact-first",
  secondaryAction,
  variant = "default",
}: ContactActionButtonsProps) {
  const isCompact = variant === "compact";
  const isSecondaryActionFirst = actionOrder === "secondary-first";
  const secondaryActionLink = secondaryAction ? (
    <Link
      className={`${styles.secondaryAction} ${styles.actionButton}`}
      href={secondaryAction.href}
      style={secondaryActionStyle}
    >
      <span>{secondaryAction.label}</span>
      {isCompact ? null : (
        <Icon className={styles.icon} name="arrow-right" size={24} />
      )}
    </Link>
  ) : null;

  return (
    <div className={`${styles.actions} ${isCompact ? styles.compact : ""}`}>
      {isSecondaryActionFirst ? secondaryActionLink : null}
      <ButtonLink
        className={styles.actionButton}
        href={KAKAO_CHANNEL_URL}
        rel="noreferrer"
        style={kakaoButtonStyle}
        target="_blank"
      >
        <span>실시간 카톡상담</span>
        {isCompact ? null : (
          <Icon className={styles.icon} name="message-typing" size={24} />
        )}
      </ButtonLink>
      {isSecondaryActionFirst ? null : secondaryActionLink}
    </div>
  );
}
