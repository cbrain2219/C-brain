import type { Metadata } from "next";

import { ReviewRequestForm } from "./ReviewRequestForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  description: "씨브레인과 함께한 경험을 남겨주세요.",
  robots: {
    follow: false,
    index: false,
  },
  title: "후기 등록 요청 | C-Brain",
};

export default function ReviewRequestPage() {
  return (
    <div className={styles.pageBackground}>
      <ReviewRequestForm />
    </div>
  );
}
