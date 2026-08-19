import type { CustomerTestimonial } from "../_content/customerReviews";
import styles from "../page.module.css";
import { ExpandableCustomerTestimonialBody } from "./ExpandableCustomerTestimonialBody";

type CustomerTestimonialCardVariant = "landing" | "reviews";

type CustomerTestimonialCardProps =
  | {
      testimonial: Pick<CustomerTestimonial, "body" | "company" | "name">;
      variant?: "landing";
    }
  | {
      testimonial: Pick<
        CustomerTestimonial,
        "body" | "company" | "name" | "title"
      >;
      variant: "reviews";
    };

const testimonialCardClassNames = {
  landing: {
    card: styles.reviewCard,
    content: styles.reviewContent,
    divider: styles.reviewDivider,
    meta: styles.reviewMeta,
    stars: styles.reviewStars,
  },
  reviews: {
    article: styles.reviewsTestimonialArticle,
    card: styles.reviewsTestimonialCard,
    content: styles.reviewsTestimonialContent,
    divider: styles.reviewsDivider,
    meta: styles.reviewsTestimonialMeta,
    stars: styles.reviewsStars,
  },
} as const;

function CustomerTestimonialCardContent({
  testimonial,
  variant,
}: {
  testimonial: Pick<CustomerTestimonial, "body" | "company" | "name">;
  variant: CustomerTestimonialCardVariant;
}) {
  const classNames = testimonialCardClassNames[variant];

  return (
    <>
      <div className={classNames.content}>
        <p className={classNames.stars} aria-label="별점 5점">
          ★★★★★
        </p>
        <ExpandableCustomerTestimonialBody variant={variant}>
          {testimonial.body}
        </ExpandableCustomerTestimonialBody>
      </div>
      <span className={classNames.divider} aria-hidden="true" />
      <footer className={classNames.meta}>
        <p>{testimonial.name}</p>
        <span>{testimonial.company}</span>
      </footer>
    </>
  );
}

export function CustomerTestimonialCard(props: CustomerTestimonialCardProps) {
  if (props.variant === "reviews") {
    return (
      <li className={testimonialCardClassNames.reviews.card}>
        <article
          aria-label={`${props.testimonial.title} 고객 후기`}
          className={testimonialCardClassNames.reviews.article}
        >
          <CustomerTestimonialCardContent
            testimonial={props.testimonial}
            variant="reviews"
          />
        </article>
      </li>
    );
  }

  return (
    <article className={testimonialCardClassNames.landing.card}>
      <CustomerTestimonialCardContent
        testimonial={props.testimonial}
        variant="landing"
      />
    </article>
  );
}
