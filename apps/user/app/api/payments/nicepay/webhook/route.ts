import {
  createAdminSupabaseClient,
  finishPayment,
  finishRefund,
  getPaymentByNicepayTid,
  getPaymentByProviderOrderId,
  listRefundsByPaymentId,
  type PaymentWithOrder,
} from "@repo/supabase";

import {
  findLatestNicepayCancellation,
  getNicepayConfig,
  parseNicepayPayment,
  retrieveNicepayPayment,
  verifyNicepayPayment,
  type NicepayPayment,
} from "../../../../../lib/nicepay";
import { notifyNewPaidPayment } from "../../../../../lib/paymentAlimtalk";

export const runtime = "nodejs";

const acknowledge = () =>
  new Response("OK", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
    status: 200,
  });

function toProviderTimestamp(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function recordPayment(
  client: ReturnType<typeof createAdminSupabaseClient>,
  order: PaymentWithOrder,
  payment: NicepayPayment,
  status: "paid" | "failed" | "expired" | "unknown",
) {
  return finishPayment(client, {
    amount: order.amount,
    balanceAmount: payment.balanceAmt,
    canPartCancel: payment.card?.canPartCancel ?? null,
    cancelledAt: toProviderTimestamp(payment.cancelledAt),
    nicepayTid: payment.tid,
    paidAt: toProviderTimestamp(payment.paidAt),
    payMethod: payment.payMethod,
    providerOrderId: order.providerOrderId,
    receiptUrl: payment.receiptUrl,
    resultCode: payment.resultCode,
    resultMessage: payment.resultMsg,
    status,
  });
}

async function recordUnexpectedCancellation(
  client: ReturnType<typeof createAdminSupabaseClient>,
  order: PaymentWithOrder,
) {
  return finishPayment(client, {
    amount: order.amount,
    // Do not copy an unaccounted provider balance into the local ledger.
    balanceAmount: order.balanceAmount,
    canPartCancel: order.canPartCancel,
    cancelledAt: order.cancelledAt,
    nicepayTid: order.nicepayTid,
    paidAt: order.paidAt,
    payMethod: order.payMethod,
    providerOrderId: order.providerOrderId,
    receiptUrl: order.receiptUrl,
    resultCode: "UNEXPECTED_CANCELLATION",
    resultMessage: "Unexpected NICEPAY cancellation requires manual review.",
    status: "unknown",
  });
}

async function recordNetCancelledPayment(
  client: ReturnType<typeof createAdminSupabaseClient>,
  order: PaymentWithOrder,
  payment: NicepayPayment,
) {
  return finishPayment(client, {
    amount: order.amount,
    balanceAmount: 0,
    canPartCancel: payment.card?.canPartCancel ?? null,
    cancelledAt: toProviderTimestamp(payment.cancelledAt),
    nicepayTid: payment.tid,
    paidAt: null,
    payMethod: payment.payMethod,
    providerOrderId: order.providerOrderId,
    receiptUrl: payment.receiptUrl,
    resultCode: "NET_CANCELLED",
    resultMessage: payment.resultMsg,
    status: "failed",
  });
}

function hasSucceededCancellation(
  refunds: Awaited<ReturnType<typeof listRefundsByPaymentId>>,
  cancelledTid: string,
) {
  return refunds.some(
    (refund) =>
      refund.status === "succeeded" &&
      refund.nicepayCancelledTid === cancelledTid,
  );
}

function isRecordedNetCancel(
  order: Pick<
    PaymentWithOrder,
    "nicepayTid" | "providerOrderId" | "resultCode" | "status"
  >,
  payment: Pick<
    NicepayPayment,
    "balanceAmt" | "orderId" | "resultCode" | "status" | "tid"
  >,
) {
  return (
    order.status === "failed" &&
    order.resultCode === "NET_CANCELLED" &&
    order.nicepayTid === payment.tid &&
    order.providerOrderId === payment.orderId &&
    payment.resultCode === "0000" &&
    payment.status === "cancelled" &&
    payment.balanceAmt === 0
  );
}

function isRecoverableNetCancel(
  order: Pick<
    PaymentWithOrder,
    "nicepayTid" | "providerOrderId" | "resultCode" | "status"
  >,
  payment: Pick<
    NicepayPayment,
    "balanceAmt" | "orderId" | "resultCode" | "status" | "tid"
  >,
) {
  return (
    order.status === "unknown" &&
    (order.resultCode === "NET_CANCEL_REQUESTED" ||
      order.resultCode === "NET_CANCEL_PERSISTENCE_UNKNOWN") &&
    (order.nicepayTid === null || order.nicepayTid === payment.tid) &&
    order.providerOrderId === payment.orderId &&
    payment.resultCode === "0000" &&
    payment.status === "cancelled" &&
    payment.balanceAmt === 0
  );
}

async function reconcileCancellationWebhook(
  client: ReturnType<typeof createAdminSupabaseClient>,
  order: PaymentWithOrder,
  payment: NicepayPayment,
) {
  // Approval-recovery net-cancel is not a customer refund. Its signed result
  // was already persisted as a failed payment, so a later webhook is a no-op.
  if (isRecordedNetCancel(order, payment)) return;

  if (isRecoverableNetCancel(order, payment)) {
    await recordNetCancelledPayment(client, order, payment);
    return;
  }

  const cancellation = findLatestNicepayCancellation(payment);
  if (!cancellation) {
    await recordUnexpectedCancellation(client, order);
    return;
  }

  const refunds = await listRefundsByPaymentId(client, order.id);

  // A delayed retry carries the balance from its original cancellation. Its
  // cancellation TID is the durable idempotency key, so do not compare that
  // stale balance with the current payment snapshot.
  if (hasSucceededCancellation(refunds, cancellation.tid)) return;

  if (
    payment.resultCode !== "0000" ||
    order.balanceAmount === null ||
    !toProviderTimestamp(cancellation.cancelledAt) ||
    (payment.status === "cancelled" && payment.balanceAmt !== 0) ||
    (payment.status === "partialCancelled" && payment.balanceAmt === 0)
  ) {
    await recordUnexpectedCancellation(client, order);
    return;
  }

  const succeededAmount = refunds
    .filter((refund) => refund.status === "succeeded")
    .reduce((total, refund) => total + refund.amount, 0);
  const balanceReduction = order.balanceAmount - payment.balanceAmt;

  if (
    succeededAmount !== order.amount - order.balanceAmount ||
    balanceReduction < 0
  ) {
    await recordUnexpectedCancellation(client, order);
    return;
  }

  // A delivery after the matching refund was persisted has no new ledger work.
  if (balanceReduction === 0) return;

  const usesOriginalOrderId = payment.orderId === order.providerOrderId;
  const matches = refunds.filter(
    (refund) =>
      (refund.status === "requested" || refund.status === "unknown") &&
      refund.amount === balanceReduction &&
      (usesOriginalOrderId || refund.providerRefundOrderId === payment.orderId),
  );
  const refund = matches.length === 1 ? matches[0] : null;
  const cancelledAt = toProviderTimestamp(cancellation.cancelledAt);

  if (!refund || !cancelledAt || cancellation.amount !== refund.amount) {
    await recordUnexpectedCancellation(client, order);
    return;
  }

  await finishRefund(client, {
    balanceAmount: payment.balanceAmt,
    nicepayCancelledTid: cancellation.tid,
    receiptUrl: cancellation.receiptUrl,
    refundedAt: cancelledAt,
    requestId: refund.requestId,
    resultCode: payment.resultCode,
    resultMessage: payment.resultMsg,
    status: "succeeded",
  });
}

export async function POST(request: Request) {
  let config;

  try {
    config = getNicepayConfig();
  } catch {
    return new Response("Payment configuration error.", { status: 500 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON.", { status: 400 });
  }

  const payment = parseNicepayPayment(body);
  if (
    !payment ||
    !verifyNicepayPayment(
      payment,
      {
        amount: payment.amount,
        orderId: payment.orderId,
        tid: payment.tid,
      },
      config.secretKey,
    )
  ) {
    return new Response("Invalid signature.", { status: 400 });
  }

  const client = createAdminSupabaseClient();
  const isCancellation =
    payment.status === "partialCancelled" || payment.status === "cancelled";
  let order = isCancellation
    ? await getPaymentByNicepayTid(client, payment.tid)
    : await getPaymentByProviderOrderId(client, payment.orderId);

  if (!order && isCancellation) {
    order = await getPaymentByProviderOrderId(client, payment.orderId);
  }

  // Refund cancellations resolve by original TID. Approval-recovery net-cancel
  // may fall back to the original provider order ID if its first DB write failed.
  if (!order) return acknowledge();

  if (
    payment.amount !== order.amount ||
    (order.nicepayTid !== null && order.nicepayTid !== payment.tid)
  ) {
    return new Response("Payment mismatch.", { status: 400 });
  }

  if (isCancellation) {
    try {
      await reconcileCancellationWebhook(client, order, payment);
    } catch {
      return new Response("Payment persistence failed.", { status: 500 });
    }

    return acknowledge();
  }

  let trustedPayment = payment;
  if (order.nicepayTid === null) {
    try {
      const retrieved = await retrieveNicepayPayment(config, payment.tid);
      if (
        !retrieved ||
        !verifyNicepayPayment(
          retrieved,
          {
            amount: order.amount,
            orderId: order.providerOrderId,
            tid: payment.tid,
          },
          config.secretKey,
        )
      ) {
        return new Response("Payment verification failed.", { status: 400 });
      }
      trustedPayment = retrieved;
    } catch {
      return new Response("Payment lookup failed.", { status: 503 });
    }
  }

  if (
    trustedPayment.status === "paid" &&
    trustedPayment.resultCode !== "0000"
  ) {
    return new Response("Invalid paid result.", { status: 400 });
  }

  try {
    if (trustedPayment.status === "paid") {
      if (!toProviderTimestamp(trustedPayment.paidAt)) {
        return new Response("Invalid paid timestamp.", { status: 400 });
      }
      const finishedPayment = await recordPayment(
        client,
        order,
        trustedPayment,
        "paid",
      );
      await notifyNewPaidPayment(order, finishedPayment);
    } else if (
      trustedPayment.status === "failed" ||
      trustedPayment.status === "expired"
    ) {
      await recordPayment(client, order, trustedPayment, trustedPayment.status);
    } else if (trustedPayment.status === "ready") {
      await recordPayment(client, order, trustedPayment, "unknown");
    }
  } catch {
    return new Response("Payment persistence failed.", { status: 500 });
  }

  return acknowledge();
}
