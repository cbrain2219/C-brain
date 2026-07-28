import type { CustomerTestimonial } from "../_content/customerReviews";
import styles from "../page.module.css";

type CustomerTestimonialCardVariant = "landing" | "reviews";
type CustomerTestimonialBodyElement = "p" | "blockquote";

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
    body: styles.reviewBody,
    card: styles.reviewCard,
    content: styles.reviewContent,
    divider: styles.reviewDivider,
    meta: styles.reviewMeta,
    stars: styles.reviewStars,
  },
  reviews: {
    article: styles.reviewsTestimonialArticle,
    body: styles.reviewsTestimonialBody,
    card: styles.reviewsTestimonialCard,
    content: styles.reviewsTestimonialContent,
    divider: styles.reviewsDivider,
    meta: styles.reviewsTestimonialMeta,
    stars: styles.reviewsStars,
  },
} as const;

function CustomerTestimonialCardContent({
  bodyElement,
  testimonial,
  variant,
}: {
  bodyElement: CustomerTestimonialBodyElement;
  testimonial: Pick<CustomerTestimonial, "body" | "company" | "name">;
  variant: CustomerTestimonialCardVariant;
}) {
  const BodyElement = bodyElement;
  const classNames = testimonialCardClassNames[variant];

  return (
    <>
      <div className={classNames.content}>
        <p className={classNames.stars} aria-label="별점 5점">
          ★★★★★
        </p>
        <BodyElement className={classNames.body}>
          {testimonial.body}
        </BodyElement>
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
            bodyElement="blockquote"
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
        bodyElement="p"
        testimonial={props.testimonial}
        variant="landing"
      />
    </article>
  );
}
