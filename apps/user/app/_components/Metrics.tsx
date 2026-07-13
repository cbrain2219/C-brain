import styles from "../page.module.css";

const metrics = [
  { label: "업력", value: "26년", description: "2000년 씨브레인 설립" },
  {
    label: "누적 고객사",
    value: "1,200곳+",
    description: "전국 기업 · 공공기관",
  },
  {
    label: "누적 제작 건수",
    value: "4,000건+",
    description: "브로슈어 · 카탈로그 · 리플렛 등",
  },
  {
    label: "대형 박람회 협력",
    value: "15년 연속",
    description: "킨텍스 · 나라장터 엑스포",
  },
];

export function Metrics() {
  return (
    <section aria-label="씨브레인 주요 지표" className={styles.metrics}>
      <div className={styles.metricGrid}>
        {metrics.map((metric) => (
          <article className={styles.metricItem} key={metric.label}>
            <div className={styles.metricMain}>
              <p className={styles.metricLabel}>{metric.label}</p>
              <strong className={styles.metricValue}>{metric.value}</strong>
            </div>
            <p className={styles.metricDescription}>{metric.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
