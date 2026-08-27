"use client";

import { Accordion } from "@repo/ui/accordion";
import type { CSSProperties } from "react";

import { Icon } from "../../components/Icon";
import { SectionLayout } from "../../components/SectionLayout";
import type { FaqItem } from "../_content/faqs";
import styles from "../page.module.css";

type FaqSectionProps = {
  badge?: string;
  description?: string;
  id?: string;
  items: readonly FaqItem[];
  moreHref?: string | null;
  moreLabel?: string;
  title?: string;
};

const faqAccordionStyle = {
  width: "100%",
  background: "var(--faq-card-bg)",
  border: "1px solid var(--faq-card-border)",
  borderRadius: 12,
  color: "var(--landing-gray-800)",
  "--accordion-background": "var(--faq-card-bg)",
  "--accordion-border-color": "var(--faq-card-border)",
  "--accordion-radius": "12px",
  "--accordion-color": "var(--landing-gray-800)",
  "--accordion-question-color": "var(--landing-gray-800)",
  "--accordion-question-font-weight": "500",
  "--accordion-question-line-height": "20px",
  "--accordion-question-letter-spacing": "-0.21px",
  "--accordion-answer-color": "var(--landing-gray-800)",
  "--accordion-answer-line-height": "20px",
  "--accordion-answer-letter-spacing": "-0.21px",
  "--accordion-divider-color": "var(--faq-card-border)",
  "--accordion-divider-background": "var(--faq-accordion-divider-gradient)",
} as CSSProperties;

export function FaqSection({
  badge = "자주 묻는 질문",
  description = "주문 · 납기 · 디자인에 관해 자주 묻는 질문을 모았습니다.",
  id = "faq",
  items,
  moreHref = "/faq-guide",
  moreLabel = "더 많은 FAQ 보기",
  title = "홍보물 제작, 궁금한 점이 있으신가요?",
}: FaqSectionProps) {
  return (
    <SectionLayout
      align="center"
      badge={badge}
      badgeAs="p"
      badgeClassName={styles.faqKicker}
      className={styles.faqSection}
      description={description}
      descriptionClassName={styles.faqDescription}
      id={id}
      innerClassName={styles.faqInner}
      title={title}
      titleClassName={styles.faqTitle}
    >
      <div className={styles.faqList}>
        {items.map((item) => (
          <Accordion
            answer={item.answer}
            className={styles.faqItem}
            key={item.question}
            question={
              <span className={styles.faqQuestion}>
                <strong>Q</strong>
                <span className={styles.faqQuestionText}>{item.question}</span>
              </span>
            }
            style={faqAccordionStyle}
          />
        ))}
      </div>

      {moreHref ? (
        <a className={styles.faqMoreButton} href={moreHref}>
          {moreLabel}
          <Icon
            className={styles.moreButtonIcon}
            name="arrow-right"
            size={24}
          />
        </a>
      ) : null}
    </SectionLayout>
  );
}
