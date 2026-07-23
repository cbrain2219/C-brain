import { JsonLdScript } from "../../_components/JsonLdScript";
import { createPageMetadata } from "../../_content/seo";
import { createStaticPageStructuredData } from "../../_content/structured-data";
import styles from "./page.module.css";

export const metadata = createPageMetadata("privacyCollection");

export default function PrivacyCollectionPage() {
  return (
    <main className={styles.legalPage}>
      <JsonLdScript data={createStaticPageStructuredData("privacyCollection")} />
      <section className={styles.legalSection}>
        <p className={styles.legalKicker}>개인정보 수집 및 이용 안내</p>
        <h1>개인정보 수집 및 이용 안내</h1>
        <div className={styles.legalBody}>
          <p>
            씨브레인은 주문 상담, 결제 확인, 제작 일정 안내를 위해 이름,
            연락처, 이메일, 회사명을 수집합니다.
          </p>
          <p>
            수집된 정보는 상담 및 주문 처리 목적에만 사용하며, 관련 법령과
            개인정보 처리방침에 따라 보관 및 파기합니다.
          </p>
        </div>
      </section>
    </main>
  );
}
