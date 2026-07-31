import type { ReactNode } from "react";

import styles from "./DarkHeroBadge.module.css";

const BORDER_GRADIENT_ID = "dark-hero-badge-border-gradient";

type DarkHeroBadgeProps = {
  children: ReactNode;
};

export function DarkHeroBadge({ children }: DarkHeroBadgeProps) {
  return (
    <p className={styles.badge}>
      <span className={styles.label}>{children}</span>
      <svg
        aria-hidden="true"
        className={styles.border}
        focusable="false"
        shapeRendering="geometricPrecision"
      >
        <defs>
          <linearGradient id={BORDER_GRADIENT_ID} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.816" />
            <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.1536" />
            <stop offset="0.7" stopColor="#ffffff" stopOpacity="0.1536" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.816" />
          </linearGradient>
        </defs>
        <rect
          className={styles.borderRect}
          fill="none"
          height="calc(100% - 1px)"
          rx="20.5"
          stroke={`url(#${BORDER_GRADIENT_ID})`}
          width="calc(100% - 1px)"
          x="0.5"
          y="0.5"
        />
      </svg>
    </p>
  );
}
