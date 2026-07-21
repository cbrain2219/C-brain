import { SectionLayout } from "../../components/SectionLayout";
import styles from "../page.module.css";
import { PartnerLogoCloud } from "./PartnerLogoCloud";

const reviews = [
  {
    body: "씨브레인에 카탈로그 제작할 때 당사의 브로슈어 니즈를 정확하게 파악해서 만족스러운 결과물이 나왔습니다. 9월 전시회를 앞두고 시간이 많지 않은 상황에서 빠른 인쇄를 해주셔서 감사했습니다.",
    name: "최수* 책임님",
    company: "서진인스텍 · 제조업 · 경기도 성남",
  },
  {
    body: "씨브레인의 가장 큰 장점은 가독성 있는 브로슈어 디자인입니다. 빠른 피드백과 원하는 방향을 신속하게 파악하여 효율적인 커뮤니케이션과 고품질 브로셔 디자인으로 만족스러운 결과물을 얻을 수 있었습니다.",
    name: "김윤* 팀장님",
    company: "나인벨 헬스케어 · 헬스케어/제조업 · 경기도 성남",
  },
  {
    body: "씨브레인에 학생들의 졸업 작품 완료 보고서 인쇄 제작을 의뢰했습니다. 표지와 내지의 퀄리티가 정말 좋았고, 인쇄는 3일 만에 완성되었습니다. 시간적으로나 퀄리티 측면에서 지난해보다 매우 만족스럽게 진행되었습니다.",
    name: "김현* 교수님",
    company: "청강문화산업대학교 · 교육기관 · 경기도 이천",
  },
] as const;

export function CustomerReviewSection() {
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

      <PartnerLogoCloud />
    </SectionLayout>
  );
}
