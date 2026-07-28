"use client";

import { TextButton } from "@repo/ui/text-button";
import { useState } from "react";

import { Icon } from "../../../components/Icon";
import { CustomerTestimonialCard } from "../../_components/CustomerTestimonialCard";
import type { CustomerTestimonial } from "../../_content/customerReviews";
import styles from "../../page.module.css";

const TESTIMONIALS_PER_PAGE = 6;

type CustomerTestimonialListProps = {
  testimonials: readonly CustomerTestimonial[];
};

export function CustomerTestimonialList({
  testimonials,
}: CustomerTestimonialListProps) {
  const [visibleCount, setVisibleCount] = useState(TESTIMONIALS_PER_PAGE);
  const visibleTestimonials = testimonials.slice(0, visibleCount);
  const hasMoreTestimonials = visibleCount < testimonials.length;

  const handleLoadMore = () => {
    setVisibleCount((currentCount) => currentCount + TESTIMONIALS_PER_PAGE);
  };

  return (
    <div className={styles.reviewsTestimonialList}>
      <ul className={styles.reviewsTestimonialGrid} id="customer-review-list">
        {visibleTestimonials.map((review) => (
          <CustomerTestimonialCard
            key={review.id}
            testimonial={review}
            variant="reviews"
          />
        ))}
      </ul>

      {hasMoreTestimonials ? (
        <TextButton
          aria-controls="customer-review-list"
          lineHeight="20px"
          onClick={handleLoadMore}
          rightIcon={<Icon name="arrow-down" size={16} />}
          textColor="var(--landing-brand-500)"
        >
          더보기
        </TextButton>
      ) : null}
    </div>
  );
}
