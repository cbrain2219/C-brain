import {
  finishPayment,
  finishRefund,
  getPaymentById,
  listRefundsByPaymentId,
  type FinishPaymentInput,
  type PaymentWithOrder,
} from "@repo/supabase";

import {
  adminPaymentCorsHeaders,
  adminPaymentOptions,
  authorizeAdminPaymentRequest,
} from "../../../../../../lib/adminPaymentAuth";
import {
  findNicepayCancellation,
  getNicepayConfig,
  isUuid,
  retrieveNicepayPayment,
  verifyNicepayPayment,
  type NicepayPayment,
} from "../../../../../../lib/nicepay";
import { notifyNewPaidPayment } from "../../../../../../lib/paymentAlimtalk";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ paymentId: string }> };

function json(request: Request, body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    headers: adminPaymentCorsHeaders(request),
    status,
  });
}

function providerTimestamp(value: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return null;
  return new Date(value).toISOString();
}

function paymentInput(
  payment: PaymentWithOrder,
  overrides: Partial<{
    balanceAmount: number | null;
    cancelledAt: string | null;
    canPartCancel: boolean | null;
    nicepayTid: string | null;
    paidAt: string | null;
    payMethod: string | null;
    receiptUrl: string | null;
    resultCode: string | null;
    resultMessage: string | null;
  }> & { status: FinishPaymentInput["status"] },
): FinishPaymentInput {
  return {
    amount: payment.amount,
    balanceAmount:
      overrides.balanceAmount === undefined
        ? payment.balanceAmount
        : overrides.balanceAmount,
    canPartCancel:
      overrides.canPartCancel === undefined
        ? payment.canPartCancel
        : overrides.canPartCancel,
    cancelledAt:
      overrides.cancelledAt === undefined
        ? payment.cancelledAt
        : overrides.cancelledAt,
    nicepayTid:
      overrides.nicepayTid === undefined
        ? payment.nicepayTid
        : overrides.nicepayTid,
    paidAt: overrides.paidAt === undefined ? payment.paidAt : overrides.paidAt,
    payMethod:
      overrides.payMethod === undefined
        ? payment.payMethod
        : overrides.payMethod,
    providerOrderId: payment.providerOrderId,
    receiptUrl:
      overrides.receiptUrl === undefined
        ? payment.receiptUrl
        : overrides.receiptUrl,
    resultCode:
      overrides.resultCode === undefined
        ? payment.resultCode
        : overrides.resultCode,
    resultMessage:
      overrides.resultMessage === undefined
        ? payment.resultMessage
        : overrides.resultMessage,
    status: overrides.status,
  };
}

function isAuthenticProviderPayment(
  provider: NicepayPayment,
  payment: PaymentWithOrder,
  secretKey: string,
  expectedOrderId = payment.providerOrderId,
) {
  return verifyNicepayPayment(
    provider,
    {
      amount: payment.amount,
      orderId: expectedOrderId,
      tid: payment.nicepayTid!,
    },
    secretKey,
  );
}

async function markUnexpectedCancellation(
  payment: PaymentWithOrder,
  client: Parameters<typeof finishPayment>[0],
) {
  await finishPayment(
    client,
    paymentInput(payment, {
      resultCode: "UNEXPECTED_CANCELLATION",
      resultMessage: "Unexpected NICEPAY cancellation requires manual review.",
      status: "unknown",
    }),
  );
}

export function OPTIONS(request: Request) {
  return adminPaymentOptions(request);
}

export async function POST(request: Request, { params }: RouteContext) {
  const authorization = await authorizeAdminPaymentRequest(request);
  if ("response" in authorization) return authorization.response;

  const { paymentId } = await params;
  if (!isUuid(paymentId))
    return json(request, { error: "Invalid payment." }, 400);

  let payment: PaymentWithOrder | null;
  try {
    payment = await getPaymentById(authorization.client, paymentId);
  } catch {
    return json(request, { error: "Payment lookup failed." }, 500);
  }

  if (!payment) return json(request, { error: "Payment not found." }, 404);
  if (!payment.nicepayTid) return json(request, { status: "unknown" }, 202);

  let config: ReturnType<typeof getNicepayConfig>;
  try {
    config = getNicepayConfig();
  } catch {
    return json(request, { error: "Payment configuration error." }, 500);
  }

  let provider: NicepayPayment | null;
  try {
    provider = await retrieveNicepayPayment(config, payment.nicepayTid);
  } catch {
    return json(request, { status: "unknown" }, 202);
  }

  if (!provider) {
    return json(request, { status: "unknown" }, 202);
  }

  if (provider.status === "paid" && provider.resultCode === "0000") {
    // A paid reconciliation always belongs to the original payment order.
    if (!isAuthenticProviderPayment(provider, payment, config.secretKey)) {
      return json(request, { status: "unknown" }, 202);
    }

    if (payment.status !== "unknown") {
      return payment.status === "paid"
        ? json(request, { status: "resolved" })
        : json(request, { status: "unknown" }, 202);
    }

    if (provider.balanceAmt !== provider.amount || !provider.paidAt) {
      return json(request, { status: "unknown" }, 202);
    }

    const finishedPayment = await finishPayment(
      authorization.client,
      paymentInput(payment, {
        balanceAmount: provider.balanceAmt,
        canPartCancel: provider.card?.canPartCancel ?? null,
        cancelledAt: null,
        nicepayTid: provider.tid,
        paidAt: providerTimestamp(provider.paidAt),
        payMethod: provider.payMethod,
        receiptUrl: provider.receiptUrl,
        resultCode: provider.resultCode,
        resultMessage: provider.resultMsg,
        status: "paid",
      }),
    );
    await notifyNewPaidPayment(payment, finishedPayment);
    return json(request, { status: "resolved" });
  }

  if (!["partialCancelled", "cancelled"].includes(provider.status)) {
    if (!isAuthenticProviderPayment(provider, payment, config.secretKey)) {
      return json(request, { status: "unknown" }, 202);
    }
    return json(request, { status: "unknown" }, 202);
  }

  if (payment.balanceAmount === null || provider.resultCode !== "0000") {
    return json(request, { status: "unknown" }, 202);
  }

  let refunds;
  try {
    refunds = await listRefundsByPaymentId(authorization.client, payment.id);
  } catch {
    return json(request, { error: "Refund lookup failed." }, 500);
  }

  const succeededAmount = refunds
    .filter((refund) => refund.status === "succeeded")
    .reduce((total, refund) => total + refund.amount, 0);

  if (succeededAmount !== payment.amount - payment.balanceAmount) {
    return json(request, { status: "unknown" }, 202);
  }

  const balanceReduction = payment.balanceAmount - provider.balanceAmt;
  if (
    balanceReduction < 0 ||
    provider.balanceAmt < 0 ||
    (provider.balanceAmt === 0
      ? provider.status !== "cancelled"
      : provider.status !== "partialCancelled")
  ) {
    return json(request, { status: "unknown" }, 202);
  }
  const usesOriginalOrderId = provider.orderId === payment.providerOrderId;
  const reservations = refunds.filter(
    (refund) =>
      (refund.status === "requested" || refund.status === "unknown") &&
      refund.amount === balanceReduction &&
      (usesOriginalOrderId ||
        refund.providerRefundOrderId === provider.orderId),
  );
  const reservation = reservations.length === 1 ? reservations[0] : null;

  // Retrieval by payment TID can return either the original payment order or
  // the order ID supplied for a cancellation. Never trust another order ID.
  const expectedCancellationOrderId = usesOriginalOrderId
    ? payment.providerOrderId
    : reservation?.providerRefundOrderId;
  if (
    !expectedCancellationOrderId ||
    !isAuthenticProviderPayment(
      provider,
      payment,
      config.secretKey,
      expectedCancellationOrderId,
    )
  ) {
    return json(request, { status: "unknown" }, 202);
  }

  if (balanceReduction === 0) return json(request, { status: "resolved" });

  const cancellation = reservation
    ? findNicepayCancellation(provider, reservation.amount)
    : null;
  const cancelledAt = providerTimestamp(cancellation?.cancelledAt ?? null);

  if (
    !reservation ||
    (!usesOriginalOrderId &&
      reservation.providerRefundOrderId !== provider.orderId) ||
    !cancelledAt ||
    !cancellation
  ) {
    await markUnexpectedCancellation(payment, authorization.client);
    return json(request, { status: "unknown" }, 202);
  }

  await finishRefund(authorization.client, {
    balanceAmount: provider.balanceAmt,
    nicepayCancelledTid: cancellation.tid,
    receiptUrl: cancellation.receiptUrl,
    refundedAt: cancelledAt,
    requestId: reservation.requestId,
    resultCode: provider.resultCode,
    resultMessage: provider.resultMsg,
    status: "succeeded",
  });

  return json(request, { status: "resolved" });
}
