import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { DarkHeroBadge } from "./DarkHeroBadge";
import { LightHeroBadge } from "./LightHeroBadge";
import styles from "./PageHero.module.css";

type PageHeroProps = {
  actions?: ReactNode;
  backgroundAlt: string;
  backgroundClassName?: string;
  backgroundImage: string;
  backgroundPosition?: CSSProperties["backgroundPosition"];
  mobileBackgroundPosition?: CSSProperties["backgroundPosition"];
  overlayClassName?: string;
  badge: ReactNode;
  description: ReactNode;
  title: ReactNode;
  tone?: "dark" | "light";
  variant?: "landing" | "subpage";
};

export function PageHero({
  actions,
  backgroundAlt,
  backgroundClassName,
  backgroundImage,
  backgroundPosition = "center",
  mobileBackgroundPosition,
  overlayClassName,
  badge,
  description,
  title,
  tone = "light",
  variant = "subpage",
}: PageHeroProps) {
  return (
    <section className={`${styles.hero} ${styles[variant]} ${styles[tone]}`}>
      <Image
        alt={backgroundAlt}
        className={[styles.background, backgroundClassName]
          .filter(Boolean)
          .join(" ")}
        fill
        priority
        sizes="100vw"
        src={backgroundImage}
        style={
          {
            "--page-hero-background-position": backgroundPosition,
            "--page-hero-mobile-background-position":
              mobileBackgroundPosition ?? backgroundPosition,
          } as CSSProperties
        }
      />
      <div
        aria-hidden="true"
        className={[styles.overlay, overlayClassName].filter(Boolean).join(" ")}
      />
      <div className={styles.content}>
        <div className={styles.copy}>
          {tone === "dark" ? (
            <DarkHeroBadge>{badge}</DarkHeroBadge>
          ) : (
            <LightHeroBadge>{badge}</LightHeroBadge>
          )}
          <div className={styles.heading}>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.description}>{description}</div>
          </div>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </section>
  );
}
