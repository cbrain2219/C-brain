import { SectionLayout } from "../../components/SectionLayout";
import { getLandingCustomerTestimonials } from "../_content/customerReviews";
import styles from "../page.module.css";
import { PartnerLogoCloud } from "./PartnerLogoCloud";

export async function CustomerReviewSection() {
  const reviews = await getLandingCustomerTestimonials();

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
            <article className={styles.reviewCard} key={review.name}>
              <div className={styles.reviewContent}>
                <p className={styles.reviewStars} aria-label="별점 5점">
                  ★★★★★
                </p>
                <p className={styles.reviewBody}>{review.body}</p>
              </div>
              <span className={styles.reviewDivider} aria-hidden="true" />
              <div className={styles.reviewMeta}>
                <p>{review.name}</p>
                <span>{review.company}</span>
              </div>
            </article>
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
