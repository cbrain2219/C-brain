import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  createAdminSupabaseClient,
  getOrderResultByPublicToken,
} from "@repo/supabase";

import { createNoIndexMetadata } from "../../../../_content/seo";
import { OrderPaymentResult } from "../../../order/OrderPaymentResult";

export const metadata: Metadata = createNoIndexMetadata({
  title: "결제 결과 | C-Brain",
});

type PaymentResultPageProps = {
  params: Promise<{ publicToken: string }>;
};

export default async function PaymentResultPage({
  params,
}: PaymentResultPageProps) {
  const { publicToken } = await params;
  const result = await getOrderResultByPublicToken(
    createAdminSupabaseClient(),
    publicToken,
  );

  if (!result) notFound();

  const primaryHref = result.channel === "site" ? "/order" : "/";
  const primaryLabel =
    result.channel === "site" ? "다른 제품 주문하기" : "홈으로";

  if (result.status === "open") {
    return (
      <OrderPaymentResult
        contentHeight={true}
        data={{ failureReason: "결제가 정상적으로 완료되지 않았습니다." }}
        failureRetryHref={primaryHref}
        failureRetryLabel="다시 결제하기"
        showProgress={result.channel === "site"}
        variant="failure"
      />
    );
  }

  if (result.status === "payment_pending") {
    return (
      <OrderPaymentResult
        contentHeight={true}
        failureRetryHref={primaryHref}
        failureRetryLabel="홈으로"
        showProgress={result.channel === "site"}
        variant="pending"
      />
    );
  }

  const statusLabel =
    result.status === "partially_refunded"
      ? "부분환불 완료"
      : result.status === "refunded"
        ? "환불 완료"
        : null;

  return (
    <OrderPaymentResult
      data={{
        companyName: "C-Brain",
        detailRows: [
          { label: "주문명", value: result.orderName },
          ...(statusLabel ? [{ label: "결제 상태", value: statusLabel }] : []),
        ],
        paymentMethod: result.paymentMethod ?? "카드",
        totalPrice: result.totalAmount,
      }}
      showProgress={result.channel === "site"}
      successPrimaryHref={primaryHref}
      successPrimaryLabel={primaryLabel}
      variant="success"
    />
  );
}
