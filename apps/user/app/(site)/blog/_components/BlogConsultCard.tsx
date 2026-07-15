import { Button } from "@repo/ui/button";

import { Icon } from "../../../../components/Icon";

import styles from "../page.module.css";

type BlogConsultCardProps = {
  className?: string;
};

export function BlogConsultCard({ className }: BlogConsultCardProps) {
  const cardClassName = className
    ? `${styles.blogConsultCard} ${className}`
    : styles.blogConsultCard;

  return (
    <aside className={cardClassName} aria-label="카카오톡 1:1 상담">
      <div className={styles.blogConsultCopy}>
        <h3
          className={`${styles.blogConsultTitle} ${styles.blogConsultTitleDesktop}`}
        >
          실시간 카톡상담
        </h3>
        <h3
          className={`${styles.blogConsultTitle} ${styles.blogConsultTitleMobile}`}
        >
          카카오톡으로 1:1 상담하기
        </h3>
        <p className={styles.blogConsultDescription}>
          견적·납기·디자인 질문을 바로 물어보세요
        </p>
      </div>
      <Button
        className={styles.blogConsultButton}
        rightIcon={<Icon name="arrow-right" size={16} />}
      >
        지금 상담 시작하기
      </Button>
    </aside>
  );
}
