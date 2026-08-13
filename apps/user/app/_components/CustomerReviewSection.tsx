import { SectionLayout } from "../../components/SectionLayout";
import type { CustomerTestimonial } from "../_content/customerReviews";
import styles from "../page.module.css";
import { CustomerTestimonialCard } from "./CustomerTestimonialCard";
import { PartnerLogoCloud } from "./PartnerLogoCloud";

type CustomerReviewSectionProps = {
  reviews: readonly CustomerTestimonial[];
};

export function CustomerReviewSection({ reviews }: CustomerReviewSectionProps) {
  return (
    <SectionLayout
      badge="고객 후기"
      badgeClassName={styles.reviewKicker}
      className={styles.reviewSection}
      id="reviews"
      innerClassName={styles.reviewInner}
      title={
        <>
          <span>왜 다양한 산업군의 기업들이</span>
          <span>씨브레인을 다시 찾을까요?</span>
        </>
      }
      titleClassName={styles.reviewTitle}
    >
      {reviews.length > 0 ? (
        <div className={styles.reviewGrid}>
          {reviews.map((review) => (
            <CustomerTestimonialCard key={review.name} testimonial={review} />
          ))}
        </div>
      ) : (
        <p className={styles.contentEmptyState} role="status">
          등록된 고객 후기가 없습니다.
        </p>
      )}

      <PartnerLogoCloud />
    </SectionLayout>
  );
}
