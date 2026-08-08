import Link from "next/link";

import styles from "../not-found.module.css";

export function NotFoundContent() {
  return (
    <section aria-labelledby="not-found-title" className={styles.section}>
      <div className={styles.content}>
        <div aria-hidden="true" className={styles.visual}>
          <span className={styles.code}>404</span>
        </div>
        <div className={styles.message}>
          <h1
            className={`${styles.title} pretendard-bold-24`}
            id="not-found-title"
          >
            페이지를 찾을 수 없습니다.
          </h1>
          <p className={`${styles.description} pretendard-medium-16`}>
            요청하신 페이지가 존재하지 않거나 주소가 변경되었습니다.
          </p>
        </div>
        <Link
          className={`${styles.homeLink} pretendard-bold-14`}
          href="/"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </section>
  );
}
