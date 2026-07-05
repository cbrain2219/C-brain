import styles from "./page.module.css";

const colorTokens = [
  {
    name: "브랜드",
    items: [
      { token: "--color-brand-50", value: "#f2f7ff" },
      { token: "--color-brand-100", value: "#adccff" },
      { token: "--color-brand-200", value: "#75a6ff" },
      { token: "--color-brand-300", value: "#3d82f5" },
      { token: "--color-brand-400", value: "#1a71f8" },
      { token: "--color-brand-500", value: "#0360ef" },
      { token: "--color-brand-600", value: "#0148b3" },
      { token: "--color-brand-700", value: "#14264d" },
      { token: "--color-brand-800", value: "#0d1a33" },
      { token: "--color-brand-900", value: "#081021" },
    ],
  },
  {
    name: "그레이",
    items: [
      { token: "--color-gray-50", value: "#f6f8fb" },
      { token: "--color-gray-100", value: "#e9ecf2" },
      { token: "--color-gray-200", value: "#d1d7e2" },
      { token: "--color-gray-300", value: "#a9b1c1" },
      { token: "--color-gray-400", value: "#848da0" },
      { token: "--color-gray-500", value: "#5e677a" },
      { token: "--color-gray-600", value: "#3f4759" },
      { token: "--color-gray-700", value: "#262c3a" },
      { token: "--color-gray-800", value: "#1b1f2a" },
      { token: "--color-gray-900", value: "#0f1219" },
    ],
  },
  {
    name: "오류",
    items: [
      { token: "--color-error-50", value: "#fef5f5" },
      { token: "--color-error-100", value: "#feebeb" },
      { token: "--color-error-200", value: "#fdd6d6" },
      { token: "--color-error-300", value: "#f98585" },
      { token: "--color-error-400", value: "#f75c5c" },
      { token: "--color-error-500", value: "#f53333" },
      { token: "--color-error-600", value: "#c42929" },
      { token: "--color-error-700", value: "#931f1f" },
      { token: "--color-error-800", value: "#621414" },
      { token: "--color-error-900", value: "#310a0a" },
    ],
  },
  {
    name: "경고",
    items: [
      { token: "--color-warning-50", value: "#fffbf4" },
      { token: "--color-warning-100", value: "#fff6e9" },
      { token: "--color-warning-200", value: "#ffeed2" },
      { token: "--color-warning-300", value: "#ffdda5" },
      { token: "--color-warning-400", value: "#ffc362" },
      { token: "--color-warning-500", value: "#ffa91f" },
      { token: "--color-warning-600", value: "#b87b17" },
      { token: "--color-warning-700", value: "#8a5c12" },
      { token: "--color-warning-800", value: "#5d3e0c" },
      { token: "--color-warning-900", value: "#2e1e06" },
    ],
  },
  {
    name: "성공",
    items: [
      { token: "--color-success-50", value: "#f4fcf7" },
      { token: "--color-success-100", value: "#eaf9ee" },
      { token: "--color-success-200", value: "#d5f4de" },
      { token: "--color-success-300", value: "#abe8bc" },
      { token: "--color-success-400", value: "#6bd78a" },
      { token: "--color-success-500", value: "#2cc658" },
      { token: "--color-success-600", value: "#239e46" },
      { token: "--color-success-700", value: "#1a7735" },
      { token: "--color-success-800", value: "#124f23" },
      { token: "--color-success-900", value: "#092812" },
    ],
  },
  {
    name: "안내",
    items: [
      { token: "--color-info-50", value: "#f6fafe" },
      { token: "--color-info-100", value: "#ecf5fe" },
      { token: "--color-info-200", value: "#d9ecfd" },
      { token: "--color-info-300", value: "#b4d9fb" },
      { token: "--color-info-400", value: "#7bbdf8" },
      { token: "--color-info-500", value: "#43a0f5" },
      { token: "--color-info-600", value: "#3680c4" },
      { token: "--color-info-700", value: "#286093" },
      { token: "--color-info-800", value: "#1b4062" },
      { token: "--color-info-900", value: "#0d2031" },
    ],
  },
];

export default function ColorPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Design System Color</h1>

      <section className={styles.section}>Figma 기준 색상 토큰을 프로젝트 토큰으로 매핑한 검증 페이지입니다.</section>

      <div className={styles.groupGrid}>
        {colorTokens.map((group) => (
          <article key={group.name} className={styles.group}>
            <h2 className={styles.groupTitle}>{group.name}</h2>
            <div className={styles.rowGrid}>
              {group.items.map((token) => (
                <div key={token.token} className={styles.tokenItem}>
                  <div
                    className={styles.swatch}
                    style={{ backgroundColor: `var(${token.token})` }}
                    aria-label={`${group.name} ${token.token}`}
                  />
                  <div className={styles.tokenMeta}>
                    <p className={styles.tokenName}>{token.token}</p>
                    <p className={styles.tokenValue}>{token.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
