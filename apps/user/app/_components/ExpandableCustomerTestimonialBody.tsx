"use client";

import { useEffect, useId, useRef, useState } from "react";

import styles from "../page.module.css";

type ExpandableCustomerTestimonialBodyProps = {
  children: string;
  variant: "landing" | "reviews";
};

const testimonialBodyClassNames = {
  landing: {
    body: styles.reviewBody,
    collapsed: styles.reviewBodyCollapsed,
    expanded: "",
    moreButton: styles.reviewMoreButton,
  },
  reviews: {
    body: styles.reviewsTestimonialBody,
    collapsed: "",
    expanded: styles.reviewsTestimonialBodyExpanded,
    moreButton: styles.reviewsTestimonialMoreButton,
  },
} as const;

export function ExpandableCustomerTestimonialBody({
  children,
  variant,
}: ExpandableCustomerTestimonialBodyProps) {
  const bodyId = useId();
  const bodyRef = useRef<HTMLElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const classNames = testimonialBodyClassNames[variant];
  const bodyClassName = [
    classNames.body,
    isExpanded ? classNames.expanded : classNames.collapsed,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (isExpanded) {
      return;
    }

    const body = bodyRef.current;

    if (!body) {
      return;
    }

    const updateOverflow = () => {
      setIsOverflowing(body.scrollHeight > body.clientHeight);
    };

    updateOverflow();

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(body);

    void document.fonts.ready.then(updateOverflow);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children, isExpanded]);

  const setBodyRef = (body: HTMLElement | null) => {
    bodyRef.current = body;
  };

  return (
    <>
      {variant === "landing" ? (
        <p className={bodyClassName} id={bodyId} ref={setBodyRef}>
          {children}
        </p>
      ) : (
        <blockquote className={bodyClassName} id={bodyId} ref={setBodyRef}>
          {children}
        </blockquote>
      )}
      {isOverflowing && !isExpanded ? (
        <button
          aria-controls={bodyId}
          aria-expanded="false"
          className={classNames.moreButton}
          onClick={() => setIsExpanded(true)}
          type="button"
        >
          ... 더보기
        </button>
      ) : null}
    </>
  );
}
