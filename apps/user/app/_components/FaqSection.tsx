"use client";

import { Accordion } from "@repo/ui/accordion";
import type { CSSProperties } from "react";

import styles from "../page.module.css";

const faqs = [
  {
    question: "성남 외 지역도 납품 가능한가요?",
    answer:
      "씨브레인에서 제작하는 모든 홍보물은 전국 어디든 안전하게 납품이 가능합니다. 여러 지점으로 분할 발송도 지원하오니, 필요하신 경우 카카오톡 1:1 상담으로 문의해 주세요.",
  },
  {
    question: "소량 주문도 가능한가요?",
    answer:
      "씨브레인은 소량 주문도 진행이 가능합니다. 제품 사양에 따라 최소 주문 수량이 상이할 수 있으니, 카카오톡 1:1 상담으로 문의 주시면 정확한 최소 수량을 안내해 드립니다.",
  },
  {
    question: "기획 · 디자인 · 인쇄를 한 곳에서 맡기면 뭐가 좋나요?",
    answer:
      "씨브레인은 기획부터 디자인·인쇄·납품까지 한 곳에서 원스톱으로 처리합니다. 별도 디자인 에이전시와 인쇄소를 각각 섭외할 필요가 없어 시간·비용·소통 비용이 모두 절감됩니다. 1:1 전담 디자이너가 처음부터 끝까지 책임 진행합니다.",
  },
  {
    question: "제작 기간(납기)은 얼마나 걸리나요?",
    answer:
      "기본 명함은 영업일 기준 1~2일, 브로슈어·리플렛 소량은 3~5일, 대량(1,000부 이상)은 5~7일입니다. 후가공이 추가되면 일정이 달라질 수 있으니 카카오톡으로 문의 주세요.",
  },
  {
    question: "견적은 어떻게 받나요?",
    answer:
      "카카오톡 1:1 상담으로 제품 종류·수량·사양·납기를 알려주시면 빠르게 견적을 드립니다. 홈페이지 견적 폼으로도 요청하실 수 있습니다.",
  },
];

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
} as CSSProperties;

export function FaqSection() {
  return (
    <section className={styles.faqSection} id="faq">
      <div className={styles.faqInner}>
        <div className={styles.faqHeader}>
          <p className={`${styles.sectionKicker} ${styles.faqKicker}`}>
            자주 묻는 질문
          </p>
          <h2 className={styles.sectionTitle}>
            홍보물 제작, 궁금한 점이 있으신가요?
          </h2>
          <p className={styles.sectionDescription}>
            주문 · 납기 · 디자인에 관해 자주 묻는 질문을 모았습니다.
          </p>
        </div>

        <div className={styles.faqList}>
          {faqs.map((item) => (
            <Accordion
              answer={item.answer}
              className={styles.faqItem}
              key={item.question}
              question={
                <span className={styles.faqQuestion}>
                  <strong>Q</strong>
                  {item.question}
                </span>
              }
              style={faqAccordionStyle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
