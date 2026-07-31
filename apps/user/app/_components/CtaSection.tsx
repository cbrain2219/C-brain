import type { ReactNode } from "react";

import {
  ContactActionButtons,
  type ContactSecondaryAction,
} from "./ContactActionButtons";
import styles from "./CtaSection.module.css";

type CtaSectionProps = {
  id?: string;
  badge?: string;
  titleLines: readonly ReactNode[];
  description?: string;
  descriptionSize?: "sm" | "md";
  secondaryAction?: ContactSecondaryAction;
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
        <div className={styles.copyGroup}>
          {badge ? <p className={styles.badge}>{badge}</p> : null}
          <div className={styles.copy}>
            <h2 className={styles.title}>
              {titleLines.map((line, index) => (
                <span key={typeof line === "string" ? line : index}>
                  {line}
                </span>
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
        </div>
        <ContactActionButtons secondaryAction={secondaryAction} />
      </div>
    </section>
  );
}
