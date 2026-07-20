import Image from "next/image";

import { CtaSection } from "../../_components/CtaSection";
import {
  customerInterviews,
  customerTestimonials,
  featuredCustomerInterview,
  reviewHeroImage,
  reviewPlayLargeIcon,
  reviewPlaySmallIcon,
  reviewQuoteMarkIcon,
} from "../../_content/customerReviews";
import styles from "../../page.module.css";

export const metadata = {
  title: "고객 후기 | 씨브레인",
};

function PlayButton({ size = "small" }: { size?: "large" | "small" }) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.reviewsPlayButton} ${
        size === "large"
          ? styles.reviewsPlayButtonLarge
          : styles.reviewsPlayButtonSmall
      }`}
    >
      <Image
        alt=""
        className={styles.reviewsPlayIconImage}
        fill
        sizes={size === "large" ? "64px" : "36px"}
        src={size === "large" ? reviewPlayLargeIcon : reviewPlaySmallIcon}
      />
    </span>
  );
}

function FeaturedInterview({ variant }: { variant: "inline" | "standalone" }) {
  const isStandalone = variant === "standalone";
  const titleId = `featured-interview-${variant}-title`;
  const desktopTitleId = `${titleId}-desktop`;
  const media = (
    <figure className={styles.reviewsFeaturedMedia}>
      <Image
        alt={featuredCustomerInterview.videoAlt}
        className={styles.reviewsMediaImage}
        fill
        sizes="(min-width: 1440px) 530px, (min-width: 1080px) 530px, (min-width: 640px) 600px, 350px"
        src={featuredCustomerInterview.thumbnail}
      />
      <span className={styles.reviewsMediaOverlay} aria-hidden="true" />
      <PlayButton size="large" />
    </figure>
  );
  const text = (
    <div className={styles.reviewsFeaturedText}>
      <h3 className={styles.reviewsFeaturedCompactTitle} id={titleId}>
        {featuredCustomerInterview.title}
      </h3>
      <span className={styles.reviewsQuoteMark} aria-hidden="true">
        <Image
          alt=""
          className={styles.reviewsQuoteMarkImage}
          fill
          sizes="22px"
          src={reviewQuoteMarkIcon}
        />
      </span>
      <h3 className={styles.reviewsFeaturedDesktopTitle} id={desktopTitleId}>
        {featuredCustomerInterview.headlineLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h3>
      <div className={styles.reviewsFeaturedBody}>
        <p>{featuredCustomerInterview.body[0]}</p>
        <p>
          <strong>{featuredCustomerInterview.body[1]}</strong>
        </p>
        <blockquote>
          <p>&quot;{featuredCustomerInterview.quote}&quot;</p>
        </blockquote>
        <p>{featuredCustomerInterview.body[2]}</p>
      </div>
      <footer className={styles.reviewsCardMeta}>
        {featuredCustomerInterview.meta}
      </footer>
    </div>
  );

  return (
    <article
      aria-labelledby={isStandalone ? titleId : desktopTitleId}
      className={`${styles.reviewsFeatured} ${
        isStandalone
          ? styles.reviewsFeaturedStandalone
          : styles.reviewsFeaturedInline
      }`}
    >
      {isStandalone ? (
        <>
          {text}
          {media}
        </>
      ) : (
        <>
          {media}
          {text}
        </>
      )}
    </article>
  );
}

export default function CustomerReviewsPage() {
  return (
    <>
      <section className={styles.reviewsPageHero}>
        <Image
          alt=""
          className={styles.reviewsHeroImage}
          fill
          priority
          sizes="100vw"
          src={reviewHeroImage}
        />
        <div aria-hidden="true" className={styles.reviewsHeroOverlay} />
        <div className={styles.reviewsHeroContent}>
          <p className={styles.reviewsBadge}>Interview · Review</p>
          <div className={styles.reviewsHeroCopy}>
            <h1>
              <span>홍보물 디자인 제작,</span>
              <span>고객이 직접 말하는 씨브레인</span>
            </h1>
            <p>
              제조·병원·교육·바이오·IT·부동산·공공기관 등 다양한 업종의
              기업 고객님들이 직접 전하는 씨브레인 제작 경험을 들어보세요.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.reviewsMain}>
        <div className={styles.reviewsContent}>
          <FeaturedInterview variant="standalone" />

          <section
            aria-labelledby="customer-interview-heading"
            className={`${styles.reviewsSectionBlock} ${styles.reviewsInterviewSection}`}
          >
            <div className={styles.reviewsSectionHeading}>
              <p className={styles.reviewsBadge}>고객 인터뷰</p>
              <h2 id="customer-interview-heading">
                실제 인터뷰 영상으로 확인하세요
              </h2>
              <p className={styles.reviewsSectionDescription}>
                씨브레인을 선택한 고객들이 직접 이야기합니다.
              </p>
            </div>

            <FeaturedInterview variant="inline" />

            <ul className={styles.reviewsInterviewGrid}>
              {customerInterviews.map((interview) => {
                const titleId = `customer-interview-${interview.id}-title`;

                return (
                  <li className={styles.reviewsInterviewCard} key={interview.id}>
                    <article
                      aria-labelledby={titleId}
                      className={styles.reviewsInterviewArticle}
                    >
                      <figure className={styles.reviewsInterviewMedia}>
                        <Image
                          alt={interview.videoAlt}
                          className={styles.reviewsMediaImage}
                          fill
                          sizes="(min-width: 1080px) 341px, (min-width: 640px) 296px, 350px"
                          src={interview.thumbnail}
                        />
                        <span
                          className={styles.reviewsMediaOverlay}
                          aria-hidden="true"
                        />
                        <PlayButton />
                      </figure>
                      <div className={styles.reviewsInterviewBody}>
                        <p className={styles.reviewsCategory}>
                          {interview.category}
                        </p>
                        <div className={styles.reviewsInterviewCopy}>
                          <h3 id={titleId}>{interview.title}</h3>
                          <blockquote>&quot;{interview.quote}&quot;</blockquote>
                        </div>
                      </div>
                      <footer className={styles.reviewsCardMeta}>
                        {interview.meta}
                      </footer>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            aria-labelledby="customer-review-heading"
            className={`${styles.reviewsSectionBlock} ${styles.reviewsTestimonialSection}`}
          >
            <div className={styles.reviewsSectionHeading}>
              <p className={styles.reviewsBadge}>고객 리뷰</p>
              <h2 id="customer-review-heading">실제 고객의 생생한 후기</h2>
            </div>

            <ul className={styles.reviewsTestimonialGrid}>
              {customerTestimonials.map((review) => (
                <li
                  className={styles.reviewsTestimonialCard}
                  key={`${review.name}-${review.company}`}
                >
                  <article
                    aria-label={`${review.name} 고객 후기`}
                    className={styles.reviewsTestimonialArticle}
                  >
                    <div className={styles.reviewsTestimonialContent}>
                      <p className={styles.reviewsStars} aria-label="별점 5점">
                        ★★★★★
                      </p>
                      <blockquote>{review.body}</blockquote>
                    </div>
                    <span className={styles.reviewsDivider} aria-hidden="true" />
                    <footer className={styles.reviewsTestimonialMeta}>
                      <p>{review.name}</p>
                      <span>{review.company}</span>
                    </footer>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <CtaSection
        secondaryAction={{ label: "정찰제 가격 보기", href: "/#services" }}
        titleLines={[
          "많은 기업들이 씨브레인을 선택한 이유,",
          "이제 직접 경험해 보세요.",
        ]}
      />
    </>
  );
}
