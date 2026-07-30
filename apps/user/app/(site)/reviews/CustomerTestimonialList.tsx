"use client";

import { TextButton } from "@repo/ui/text-button";
import { useEffect, useRef, useState } from "react";

import { Icon } from "../../../components/Icon";
import { CustomerTestimonialCard } from "../../_components/CustomerTestimonialCard";
import type { CustomerTestimonial } from "../../_content/customerReviews";
import styles from "../../page.module.css";

const MOBILE_TESTIMONIALS_PER_PAGE = 4;
const DESKTOP_TESTIMONIALS_PER_PAGE = 6;
const MOBILE_TESTIMONIALS_MEDIA_QUERY = "(max-width: 640px)";

function getTestimonialsPerPage(mediaQuery: MediaQueryList) {
  return mediaQuery.matches
    ? MOBILE_TESTIMONIALS_PER_PAGE
    : DESKTOP_TESTIMONIALS_PER_PAGE;
}

type CustomerTestimonialListProps = {
  testimonials: readonly CustomerTestimonial[];
};

export function CustomerTestimonialList({
  testimonials,
}: CustomerTestimonialListProps) {
  const hasLoadedMoreRef = useRef(false);
  const [visibleCount, setVisibleCount] = useState(
    DESKTOP_TESTIMONIALS_PER_PAGE,
  );
  const visibleTestimonials = testimonials.slice(0, visibleCount);
  const hasMoreTestimonials = visibleCount < testimonials.length;

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_TESTIMONIALS_MEDIA_QUERY);
    const syncInitialVisibleCount = () => {
      if (!hasLoadedMoreRef.current) {
        setVisibleCount(getTestimonialsPerPage(mediaQuery));
      }
    };

    syncInitialVisibleCount();
    mediaQuery.addEventListener("change", syncInitialVisibleCount);

    return () => {
      mediaQuery.removeEventListener("change", syncInitialVisibleCount);
    };
  }, []);

  const handleLoadMore = () => {
    hasLoadedMoreRef.current = true;
    setVisibleCount(
      (currentCount) =>
        currentCount +
        getTestimonialsPerPage(
          window.matchMedia(MOBILE_TESTIMONIALS_MEDIA_QUERY),
        ),
    );
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
