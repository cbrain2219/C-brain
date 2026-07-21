import Image from "next/image";

import { Icon } from "../../../components/Icon";
import { PartnerLogoCloud } from "../../_components/PartnerLogoCloud";
import {
  companyChannels,
  companyHistorySummary,
  companyInfoRows,
  companyMetrics,
  companyReasons,
  companyTimelineCompact,
  companyTimelineDesktop,
} from "../../_content/company";
import styles from "./page.module.css";

function SectionBadge({ children }: { children: string }) {
  return (
    <p className={styles.sectionBadge}>
      <span>{children}</span>
    </p>
  );
}

type TimelineTextPart =
  | string
  | { readonly text: string; readonly strong: true };

function renderTimelineText(text: string | readonly TimelineTextPart[]) {
  const parts = Array.isArray(text) ? text : [text];

  return parts.map((part, index) => {
    if (typeof part === "string") {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return <strong key={`${part.text}-${index}`}>{part.text}</strong>;
  });
}

function HistoryTimeline({
  items,
  variant,
}: {
  items: typeof companyTimelineDesktop | typeof companyTimelineCompact;
  variant: "desktop" | "compact";
}) {
  return (
    <ol
      className={`${styles.timeline} ${
        variant === "desktop" ? styles.timelineDesktop : styles.timelineCompact
      }`}
    >
      {items.map((item, index) => (
        <li
          className={styles.timelineItem}
          key={`${variant}-${item.year}-${index}`}
        >
          <time>{item.year}</time>
          <span aria-hidden="true" className={styles.timelineDot} />
          <div className={styles.timelineBody}>
            <p>
              {renderTimelineText(item.title)}
              {"detail" in item ? (
                <span className={styles.timelineDetail}>{item.detail}</span>
              ) : null}
            </p>
            {"tag" in item ? (
              <span className={styles.timelineTag}>
                <span>{item.tag}</span>
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function AboutPage() {
  return (
    <>
      <section className={styles.hero}>
        <Image
          alt=""
          className={styles.heroImage}
          fill
          priority
          sizes="100vw"
          src="/figma-assets/company-hero-office.png"
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.heroBadge}>
              <span>홍보물 기획 · 디자인 · 인쇄 원스톱 전문 회사</span>
            </p>
            <div className={styles.heroTextBlock}>
              <h1>
                <span className={styles.heroTitleLead}>
                  씨브레인(C-Brain)은
                </span>
                <span className={styles.heroTitleLine}>
                  <span className={styles.heroTitleAccent}>
                    브로슈어·카탈로그
                    <span className={styles.heroTitleDesktopSeparator}>·</span>
                    <br className={styles.heroTitleMobileBreak} />
                    각종 홍보물 제작
                  </span>
                  <span className={styles.heroTitlePlain}>
                    디자인 전문 회사입니다.
                  </span>
                </span>
              </h1>
              <p className={styles.heroDescription}>
                <span
                  className={`${styles.heroDescriptionLine} ${styles.heroDescriptionLineDesktop}`}
                >
                  경기도 성남시 소재 · 2000년 설립 이후 26년간 전국 1,200여
                  기업과 함께해 온
                </span>
                <span
                  className={`${styles.heroDescriptionLine} ${styles.heroDescriptionLineDesktop}`}
                >
                  브로슈어·브로셔·카탈로그·리플렛·팜플렛·포스터 및 각종 홍보물
                  기획·디자인·인쇄 원스톱 전문 기업입니다.
                </span>
                <span
                  className={`${styles.heroDescriptionLine} ${styles.heroDescriptionLineMobile}`}
                >
                  경기도 성남시 소재 · 2000년 설립 이후 26년간
                </span>
                <span
                  className={`${styles.heroDescriptionLine} ${styles.heroDescriptionLineMobile}`}
                >
                  전국 1,200여 기업과 함께해 온
                </span>
                <span
                  className={`${styles.heroDescriptionLine} ${styles.heroDescriptionLineMobile}`}
                >
                  브로슈어·브로셔·카탈로그·리플렛·팜플렛·포스터 및
                </span>
                <span
                  className={`${styles.heroDescriptionLine} ${styles.heroDescriptionLineMobile}`}
                >
                  각종 홍보물 기획·디자인·인쇄 원스톱 전문 기업입니다.
                </span>
              </p>
            </div>
          </div>

          <div
            className={styles.heroMetricPanel}
            aria-label="씨브레인 주요 지표"
          >
            {companyMetrics.map((metric) => (
              <article className={styles.heroMetric} key={metric.label}>
                <div className={styles.heroMetricMain}>
                  <p>{metric.label}</p>
                  <strong>{metric.value}</strong>
                </div>
                <span className={styles.heroMetricDescription}>
                  {metric.description}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.introSection}>
        <div className={styles.sectionInner}>
          <div className={styles.introGrid}>
            <div className={styles.introCopy}>
              <SectionBadge>회사 소개</SectionBadge>
              <h2>
                씨브레인(C-Brain)은
                <span>어떤 회사인가요?</span>
              </h2>
              <div className={styles.bodyCopy}>
                <p>
                  {
                    "씨브레인(C-Brain)은 2000년 설립 이후 26년간 전국 1,200여 곳과의 파트너십과 "
                  }
                  <br className={styles.desktopBreak} />
                  {
                    "4,000건 이상의 제작 실적을 보유한 브로슈어(브로셔)·카탈로그(카달로그) 및 "
                  }
                  <br className={styles.desktopBreak} />
                  {"각종 홍보물 기획·디자인·인쇄 "}
                  <br className={styles.mobileBreak} />
                  {"원스톱 제작 전문 기업입니다."}
                </p>
                <p>
                  {
                    "전시회·박람회 홍보물 제작이 필요한 많은 기업이 경기도 성남시 중원구에 위치한 씨브레인을 선택해 왔으며, "
                  }
                  <br className={styles.mobileBreak} />
                  {"정부조달기술진흥협회·킨텍스 코리아나라장터엑스포와 "}
                  <br className={styles.mobileBreak} />
                  {"15년 연속 대형 박람회를 협업한 경험을 바탕으로 "}
                  <br className={styles.mobileBreak} />
                  {
                    "브로슈어·카탈로그·리플렛·팜플렛·포스터 등 다양한 홍보물을 소량부터 대량까지 원스톱으로 제공하고 있습니다."
                  }
                </p>
                <p>
                  {
                    "26년간 제조·병원·교육·바이오·IT·부동산·공공기관 등 다양한 산업군과 함께해 왔으며, "
                  }
                  <br className={styles.desktopBreak} />
                  {"수도권은 물론 전국 납품이 가능합니다."}
                </p>
              </div>
            </div>

            <div className={styles.introMedia} aria-label="씨브레인 작업 현장">
              <div className={styles.introMediaLarge}>
                <Image
                  alt="씨브레인 디자이너가 화이트보드에 브로슈어 기획 및 레이아웃 전략을 정리하는 모습"
                  fill
                  sizes="(min-width: 1200px) 420px, (min-width: 700px) 55vw, 100vw"
                  src="/images/cbrain-about-planning-process-large.webp"
                />
              </div>
              <div className={styles.introMediaSmall}>
                <Image
                  alt="씨브레인 팀원들이 함께 모니터 화면을 보며 디자인을 검토하는 협업 모습"
                  fill
                  sizes="(min-width: 1200px) 200px, 50vw"
                  src="/images/cbrain-about-team-collaboration.webp"
                />
              </div>
              <div className={styles.introMediaSmall}>
                <Image
                  alt="씨브레인이 보유한 여성기업 인증, 한국디자인진흥원 산업디자인전문회사 인증, 중소기업 인증 현판"
                  fill
                  sizes="(min-width: 1200px) 200px, 50vw"
                  src="/images/cbrain-about-certifications.webp"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.reasonSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeading}>
            <SectionBadge>왜 씨브레인인가</SectionBadge>
            <div className={styles.reasonHeadingText}>
              <h2>1,200여 기업이 씨브레인을 선택한 이유</h2>
              <p>오직 홍보물에만 26년을 쏟아온 결과입니다.</p>
            </div>
          </div>

          <div className={styles.reasonGrid}>
            {companyReasons.map((reason) => (
              <article className={styles.reasonCard} key={reason.title}>
                <span>{reason.label}</span>
                <div className={styles.reasonCardBody}>
                  <h3>{reason.title}</h3>
                  <p>{reason.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.partnerSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeading}>
            <SectionBadge>주요 고객사 & 협력사</SectionBadge>
            <h2>
              다양한 산업군의 기업들이
              <span>씨브레인을 선택했습니다</span>
            </h2>
          </div>

          <PartnerLogoCloud
            ariaLabel="씨브레인 고객사 로고"
            variant="company"
          />
        </div>
      </section>

      <section className={styles.historySection}>
        <div className={styles.historyInner}>
          <div className={styles.historyHeading}>
            <SectionBadge>연혁</SectionBadge>
            <h2>고객과 함께 쌓아온 26년</h2>
            <p>2000년 창립부터 현재까지, 씨브레인이 걸어온 길입니다.</p>
          </div>

          <div className={styles.historyContent}>
            <div className={styles.historyCallout}>
              <strong>주요 협력 이력 요약</strong>
              <ul>
                {companyHistorySummary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <HistoryTimeline items={companyTimelineDesktop} variant="desktop" />
            <HistoryTimeline items={companyTimelineCompact} variant="compact" />
          </div>
        </div>
      </section>

      <section className={styles.channelSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeading}>
            <SectionBadge>채널</SectionBadge>
            <h2>씨브레인 채널</h2>
          </div>

          <div className={styles.channelGrid}>
            {companyChannels.map((channel) => (
              <a
                className={styles.channelCard}
                href={channel.href}
                key={channel.title}
              >
                <span className={styles.channelMain}>
                  <span className={styles.channelIcon}>
                    <Icon name={channel.icon} size={24} />
                  </span>
                  <span className={styles.channelText}>
                    <strong>{channel.title}</strong>
                    <span>{channel.description}</span>
                  </span>
                </span>
                <span className={styles.channelLink}>
                  바로가기
                  <Icon name="channel-arrow-right" size={16} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.infoSection}>
        <div className={styles.sectionInner}>
          <div className={styles.infoGrid}>
            <div className={styles.infoContent}>
              <SectionBadge>회사 정보</SectionBadge>
              <div className={styles.infoBody}>
                <h2>씨브레인 공식 정보</h2>
                <dl className={styles.infoList}>
                  {companyInfoRows.map((row) => (
                    <div className={styles.infoRow} key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>
                        {Array.isArray(row.value)
                          ? row.value.map((line) => (
                              <span key={line}>{line}</span>
                            ))
                          : row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className={styles.mapWrap}>
              <Image
                alt="경기도 성남시 중원구 사기막골로 99 씨브레인 위치 지도"
                fill
                sizes="(min-width: 1400px) 670px, (min-width: 1100px) 530px, (min-width: 700px) 600px, 100vw"
                src="/figma-assets/company-map.png"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
