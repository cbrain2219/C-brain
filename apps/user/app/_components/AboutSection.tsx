import { Icon } from "../../components/Icon";
import styles from "../page.module.css";

const reasons = [
  {
    icon: "calendar",
    title: "26년+ 실전 업력",
    description:
      "2000년부터 홍보물 분야에만 집중. 누적된 노하우가 결과물의 퀄리티를 보장합니다.",
  },
  {
    icon: "user-profile-circle",
    title: "1:1 전담 디자이너 매칭",
    description:
      "담당 디자이너가 처음부터 끝까지 책임 진행. 중간에 담당자가 바뀌지 않습니다.",
  },
  {
    icon: "star",
    title: "기획·디자인·인쇄 원스톱",
    description:
      "기획부터 인쇄·납품까지 한 곳에서 완결. 별도 인쇄소·에이전시가 필요 없습니다.",
  },
  {
    icon: "truck",
    title: "전국 납품 대응",
    description:
      "박람회, 공공기관, 기업 행사 일정에 맞춰 소량부터 대량까지 유연하게 대응합니다.",
  },
] as const;

const clients = [
  "KINTEX",
  "나라장터",
  "AXIS",
  "TMES",
  "MAXST",
  "SBA",
  "SHINLIM",
  "CLOUD",
  "BIO-LAB",
  "WOLF",
  "SEONGNAM",
  "BRAND-X",
];

export function AboutSection() {
  return (
    <section className={styles.aboutSection} id="about">
      <div className={styles.sectionInner}>
        <div className={styles.aboutHeader}>
          <p className={styles.sectionKicker}>씨브레인(C-Brain) 소개</p>
          <h2 className={styles.sectionTitle}>
            1,200여 기업이 씨브레인을 선택한 이유
          </h2>
          <p className={styles.aboutDescription}>
            씨브레인은 2000년 설립 이후 26년간 전국 1,200여 곳과의
            파트너십과 4,000건 이상의 제작 실적을 보유한 브로슈어 · 카탈로그
            및 각종 홍보물 기획 · 디자인 · 인쇄 원스톱 제작 전문 기업입니다.
          </p>
        </div>

        <div className={styles.reasonGrid}>
          {reasons.map((reason) => (
            <article className={styles.reasonItem} key={reason.title}>
              <span className={styles.reasonIcon}>
                <Icon name={reason.icon} size={18} />
              </span>
              <div>
                <h3>{reason.title}</h3>
                <p>{reason.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div aria-label="협력 고객사" className={styles.clientLogoPanel}>
          {clients.map((client) => (
            <span className={styles.clientLogo} key={client}>
              {client}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
