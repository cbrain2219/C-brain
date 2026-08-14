import Image from "next/image";
import Link from "next/link";

import { FIXED_PRICE_ACTION } from "../../_components/ContactActionButtons";
import { CtaSection } from "../../_components/CtaSection";
import { JsonLdScript } from "../../_components/JsonLdScript";
import {
  type FeaturedCustomerInterview,
  getCustomerReviewPageData,
  reviewHeroImage,
  reviewPlayLargeIcon,
  reviewPlaySmallIcon,
  reviewQuoteMarkIcon,
} from "../../_content/customerReviews";
import { createPageMetadata } from "../../_content/seo";
import { createStaticPageStructuredData } from "../../_content/structured-data";
import styles from "../../page.module.css";
import { CustomerTestimonialList } from "./CustomerTestimonialList";

export const metadata = createPageMetadata("reviews");

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

function InterviewThumbnail({
  alt,
  sizes,
  thumbnail,
  videoUrl,
}: {
  alt: string;
  sizes: string;
  thumbnail: string;
  videoUrl?: string;
}) {
  return videoUrl ? (
    <video
      aria-hidden="true"
      className={styles.reviewsMediaVideo}
      muted
      playsInline
      preload="metadata"
      src={`${videoUrl}#t=0.001`}
    />
  ) : (
    <Image
      alt={alt}
      className={styles.reviewsMediaImage}
      fill
      sizes={sizes}
      src={thumbnail}
    />
  );
}

function FeaturedInterview({
  featuredCustomerInterview,
}: {
  featuredCustomerInterview: FeaturedCustomerInterview;
}) {
  return (
    <article
      aria-label={`${featuredCustomerInterview.title} 대표 인터뷰`}
      className={styles.reviewsFeatured}
    >
      <div className={styles.reviewsFeaturedText}>
        <div className={styles.reviewsFeaturedSummary}>
          <div className={styles.reviewsFeaturedQuoteGroup}>
            <span className={styles.reviewsQuoteMark} aria-hidden="true">
              <Image
                alt=""
                className={styles.reviewsQuoteMarkImage}
                fill
                sizes="27px"
                src={reviewQuoteMarkIcon}
              />
            </span>
            <div className={styles.reviewsFeaturedCopy}>
              <h3 className={styles.reviewsFeaturedTitle}>
                {featuredCustomerInterview.headlineLines.map((line, index) => (
                  <span
                    key={`${featuredCustomerInterview.id}-headline-${index}`}
                  >
                    {line}
                  </span>
                ))}
              </h3>
              <p className={styles.reviewsFeaturedDescription}>
                {featuredCustomerInterview.description}
              </p>
            </div>
          </div>
          <span
            aria-hidden="true"
            className={styles.reviewsFeaturedDivider}
          />
        </div>
        <footer className={styles.reviewsFeaturedMeta}>
          <p>{featuredCustomerInterview.company}</p>
          <p>{featuredCustomerInterview.projectName}</p>
        </footer>
      </div>
      <figure className={styles.reviewsFeaturedMedia}>
        <Link
          aria-label={`${featuredCustomerInterview.title} 상세 보기`}
          className={styles.reviewsFeaturedMediaLink}
          href={`/reviews/${featuredCustomerInterview.detailSlug}`}
        >
          <InterviewThumbnail
            alt={featuredCustomerInterview.videoAlt}
            sizes="(min-width: 1440px) 530px, (min-width: 1080px) 530px, (min-width: 640px) 600px, 350px"
            thumbnail={featuredCustomerInterview.thumbnail}
            videoUrl={featuredCustomerInterview.videoUrl}
          />
          <span className={styles.reviewsMediaOverlay} aria-hidden="true" />
          <PlayButton size="large" />
        </Link>
      </figure>
    </article>
  );
}

export default async function CustomerReviewsPage() {
  const {
    customerInterviews,
    customerTestimonials,
    featuredCustomerInterview,
  } = await getCustomerReviewPageData();
  const additionalCustomerInterviews = customerInterviews.filter(
    (interview) => interview.id !== featuredCustomerInterview?.id,
  );

  return (
    <>
      <JsonLdScript
        data={createStaticPageStructuredData("reviews", {
          pageType: "CollectionPage",
        })}
      />
      <section className={styles.reviewsPageHero}>
        <Image
          alt="씨브레인 편집디자인 팀이 고객 브로슈어 시안을 함께 검토하는 사무실 장면"
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
              제조·병원·교육·바이오·IT·부동산·공공기관 등 다양한 업종의 기업
              고객님들이 직접 전하는 씨브레인 제작 경험을 들어보세요.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.reviewsMain}>
        <div className={styles.reviewsContent}>
          <section
            aria-labelledby="customer-interview-heading"
            className={`${styles.reviewsSectionBlock} ${styles.reviewsInterviewSection}`}
          >
            <div className={styles.reviewsInterviewLead}>
              <div className={styles.reviewsSectionHeading}>
                <p className={styles.reviewsBadge}>고객 인터뷰</p>
                <div className={styles.reviewsSectionCopy}>
                  <h2 id="customer-interview-heading">
                    실제 인터뷰 영상으로 확인하세요
                  </h2>
                  <p className={styles.reviewsSectionDescription}>
                    씨브레인을 선택한 고객들이 직접 이야기합니다.
                  </p>
                </div>
              </div>

              {featuredCustomerInterview ? (
                <FeaturedInterview
                  featuredCustomerInterview={featuredCustomerInterview}
                />
              ) : null}
            </div>

            {additionalCustomerInterviews.length > 0 ? (
              <ul className={styles.reviewsInterviewGrid}>
                {additionalCustomerInterviews.map((interview) => {
                  const titleId = `customer-interview-${interview.id}-title`;

                  return (
                    <li
                      className={styles.reviewsInterviewCard}
                      key={interview.id}
                    >
                      <article
                        aria-labelledby={titleId}
                        className={styles.reviewsInterviewArticle}
                      >
                        <Link
                          aria-label={`${interview.title} 상세 보기`}
                          className={styles.reviewsInterviewLink}
                          href={`/reviews/${interview.detailSlug}`}
                        >
                          <figure className={styles.reviewsInterviewMedia}>
                            <InterviewThumbnail
                              alt={interview.videoAlt}
                              sizes="(min-width: 1120px) 530px, (min-width: 640px) calc((100vw - 60px) / 2), calc(100vw - 40px)"
                              thumbnail={interview.thumbnail}
                              videoUrl={interview.videoUrl}
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
                              <h3 id={titleId}>
                                {interview.company} — 씨브레인 고객 인터뷰
                              </h3>
                              <blockquote>
                                &quot;{interview.quote}&quot;
                              </blockquote>
                            </div>
                            <footer className={styles.reviewsCardMeta}>
                              {interview.meta}
                            </footer>
                          </div>
                        </Link>
                      </article>
                    </li>
                  );
                })}
              </ul>
            ) : featuredCustomerInterview ? null : (
              <p className={styles.contentEmptyState} role="status">
                등록된 고객 인터뷰가 없습니다.
              </p>
            )}
          </section>

          <section
            aria-labelledby="customer-review-heading"
            className={`${styles.reviewsSectionBlock} ${styles.reviewsTestimonialSection}`}
          >
            <div className={styles.reviewsSectionHeading}>
              <p className={styles.reviewsBadge}>고객 리뷰</p>
              <h2 id="customer-review-heading">실제 고객의 생생한 후기</h2>
            </div>

            {customerTestimonials.length > 0 ? (
              <CustomerTestimonialList testimonials={customerTestimonials} />
            ) : (
              <p className={styles.contentEmptyState} role="status">
                등록된 고객 후기가 없습니다.
              </p>
            )}
          </section>
        </div>
      </section>

      <CtaSection
        secondaryAction={FIXED_PRICE_ACTION}
        titleLines={[
          "많은 기업들이 씨브레인을 선택한 이유,",
          "이제 직접 경험해 보세요.",
        ]}
      />
    </>
  );
}
