import type { Metadata } from "next";

import { createNoIndexMetadata } from "../../../../_content/seo";
import { OrderPaymentResult } from "../../OrderPaymentResult";

export const metadata: Metadata = createNoIndexMetadata({
  path: "/order/success/preview",
  title: "결제 완료 미리보기 | C-Brain",
});

export default function OrderPaymentSuccessPreviewPage() {
  return (
    <OrderPaymentResult
      data={{
        companyName: "씨브레인",
        paymentMethod: "카드",
        summary: {
          categoryLabel: "브로슈어·카탈로그",
          pageLabel: "8p",
          paperLabel: "일반지 (스노우지 유광)",
          quantityLabel: "500부",
          serviceLabel: "디자인 + 인쇄",
          totalPrice: 520000,
        },
      }}
      variant="success"
    />
  );
}
