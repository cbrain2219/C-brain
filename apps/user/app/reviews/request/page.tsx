import type { Metadata } from "next";

import { createNoIndexMetadata } from "../../_content/seo";
import { ReviewRequestForm } from "./ReviewRequestForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  ...createNoIndexMetadata({
    description:
      "씨브레인과 함께한 경험, 편하게 들려주세요! 여러분의 솔직한 이야기가 저희에게 큰 힘이 됩니다.",
    includeSocial: true,
    path: "/reviews/request",
    title: "후기 남기기 | 씨브레인",
  }),
  icons: {
    icon: "/cbrain-favicon.ico",
  },
};

export default function ReviewRequestPage() {
  return (
    <div className={styles.pageBackground}>
      <ReviewRequestForm />
    </div>
  );
}
