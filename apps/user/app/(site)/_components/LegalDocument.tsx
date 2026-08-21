import type { ReactNode } from "react";

import styles from "./LegalDocument.module.css";

type LegalDocumentProps = {
  children: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

type LegalTableProps = {
  children: ReactNode;
  label: string;
};

export function LegalDocument({
  children,
  description,
  eyebrow = "씨브레인 정책 안내",
  title,
}: LegalDocumentProps) {
  return (
    <div className={styles.legalPage}>
      <section className={styles.legalSection}>
        <header className={styles.legalHeader}>
          <p className={styles.legalEyebrow}>{eyebrow}</p>
          <div className={styles.legalHeading}>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </header>
        <div className={styles.legalBody}>{children}</div>
      </section>
    </div>
  );
}

export function LegalTable({ children, label }: LegalTableProps) {
  return (
    <div
      aria-label={label}
      className={styles.tableScroller}
      role="region"
      tabIndex={0}
    >
      <table>{children}</table>
    </div>
  );
}
