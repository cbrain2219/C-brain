import { Accordion } from "@repo/ui/accordion";
import type { CSSProperties } from "react";

import { CtaSection } from "../../_components/CtaSection";
import { JsonLdScript } from "../../_components/JsonLdScript";
import { faqCategories } from "../../_content/faqs";
import { createPageMetadata } from "../../_content/seo";
import { createFaqPageStructuredData } from "../../_content/structured-data";
import { FaqCategoryNavigation } from "./FaqCategoryNavigation";
import styles from "./page.module.css";

export const metadata = createPageMetadata("faq");

const faqAccordionStyle = {
  width: "100%",
  background: "var(--faq-page-card-bg)",
  border: "1px solid var(--faq-page-card-border)",
  borderRadius: 12,
  color: "var(--landing-gray-800)",
  "--accordion-background": "var(--faq-page-card-bg)",
  "--accordion-border-color": "var(--faq-page-card-border)",
  "--accordion-radius": "12px",
  "--accordion-color": "var(--landing-gray-800)",
  "--accordion-question-color": "var(--landing-gray-800)",
  "--accordion-question-font-weight": "500",
  "--accordion-question-line-height": "20px",
  "--accordion-question-letter-spacing": "0",
  "--accordion-answer-color": "var(--landing-gray-800)",
  "--accordion-answer-line-height": "20px",
  "--accordion-answer-letter-spacing": "0",
  "--accordion-divider-color": "var(--faq-page-card-border)",
  "--accordion-divider-background": "var(--faq-page-divider-gradient)",
} as CSSProperties;

function CategoryLabel({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <>
      <span aria-hidden="true">{icon}</span>
      <span>{title}</span>
    </>
  );
}

export default function FaqPage() {
  const categoryNavItems = faqCategories.map(({ icon, id, title }) => ({
    icon,
    id,
    title,
  }));

  return (
    <div className={styles.faqPage} data-faq-page>
      <JsonLdScript data={createFaqPageStructuredData()} />
      <div className={styles.faqLayout}>
        <FaqCategoryNavigation
          categories={categoryNavItems}
          variant="sidebar"
        />

        <div className={styles.mainColumn}>
          <section aria-labelledby="faq-page-title" className={styles.hero}>
            <p className={styles.heroBadge}>FAQ &amp; 가이드</p>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle} id="faq-page-title">
                씨브레인 홍보물 제작 FAQ &amp; 가이드
              </h1>
              <p className={styles.heroDescription}>
                홍보물 제작·주문·결제·납기에 관한 궁금증을 해결해
                드립니다.
              </p>
            </div>
          </section>

          <FaqCategoryNavigation
            categories={categoryNavItems}
            variant="mobile"
          />

          <div className={styles.categorySections}>
            {faqCategories.map((category) => (
              <section
                className={styles.categorySection}
                id={category.id}
                key={category.id}
              >
                <h2 className={styles.categoryTitle}>
                  <CategoryLabel icon={category.icon} title={category.title} />
                </h2>
                <div className={styles.faqList}>
                  {category.items.map((item) => (
                    <Accordion
                      answer={item.answer}
                      className={styles.faqItem}
                      key={item.question}
                      question={
                        <span className={styles.faqQuestion}>
                          <strong>Q</strong>
                          <span className={styles.faqQuestionText}>
                            {item.question}
                          </span>
                        </span>
                      }
                      style={faqAccordionStyle}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <CtaSection
        badge="상담 가능 시간 : 평일 오전 9시 ~ 오후 6시"
        description="씨브레인에 직접 물어보세요. 빠르게 답변드립니다."
        id="faq-contact"
        titleLines={["찾으시는 답변이 없으신가요?"]}
      />
    </div>
  );
}
