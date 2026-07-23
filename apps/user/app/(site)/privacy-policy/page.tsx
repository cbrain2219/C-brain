import { JsonLdScript } from "../../_components/JsonLdScript";
import { createPageMetadata } from "../../_content/seo";
import { createStaticPageStructuredData } from "../../_content/structured-data";
import styles from "../privacy-collection/page.module.css";

export const metadata = createPageMetadata("privacyPolicy");

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.legalPage}>
      <JsonLdScript data={createStaticPageStructuredData("privacyPolicy")} />
      <section className={styles.legalSection}>
        <p className={styles.legalKicker}>개인정보 처리방침</p>
        <h1>개인정보 처리방침</h1>
        <div className={styles.legalBody}>
          <p>
            씨브레인은 고객의 개인정보를 안전하게 관리하며, 주문 상담과 제작
            진행에 필요한 범위 안에서만 이용합니다.
          </p>
          <p>
            개인정보의 열람, 정정, 삭제 요청은 고객센터 또는 카카오톡 상담
            채널을 통해 접수할 수 있습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
