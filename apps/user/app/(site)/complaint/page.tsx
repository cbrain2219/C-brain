import styles from "../../page.module.css";
import { JsonLdScript } from "../../_components/JsonLdScript";
import { createPageMetadata } from "../../_content/seo";
import { createStaticPageStructuredData } from "../../_content/structured-data";
import { ComplaintForm } from "./ComplaintForm";

export const metadata = createPageMetadata("complaint");

export default function ComplaintPage() {
  return (
    <>
      <JsonLdScript
        data={createStaticPageStructuredData("complaint", {
          pageType: "ContactPage",
        })}
      />
      <section className={styles.complaintSection}>
        <div className={styles.complaintInner}>
          <div className={styles.complaintIntro}>
            <h1>씨브레인 불편 접수</h1>
            <p>
              <span>서비스 이용 중 불편했던 점을 알려주세요.</span>
              <span>
                접수된 내용은 대표가 직접 확인하며, 영업일 기준 1~2일 내 기재해
                주신 문자 및 이메일로 답변드립니다.
              </span>
            </p>
          </div>

          <ComplaintForm />
        </div>
      </section>
    </>
  );
}
