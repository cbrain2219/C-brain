import {
  createAdminSupabaseClient,
  finishPayment,
  getPaymentByProviderOrderId,
  type CBrainSupabaseClient,
  type PaymentWithOrder,
} from "@repo/supabase";

import {
  approveNicepayPayment,
  getNicepayConfig,
  netCancelNicepayPayment,
  parseNicepayAuthCallback,
  retrieveNicepayPayment,
  verifyNicepayAuthCallback,
  verifyNicepayPayment,
  type NicepayConfig,
  type NicepayPayment,
} from "../../../../../lib/nicepay";
import { notifyNewPaidPayment } from "../../../../../lib/paymentAlimtalk";

export const runtime = "nodejs";

function resultRedirect(config: NicepayConfig, publicToken: string) {
  return new Response(null, {
    headers: {
      "Cache-Control": "no-store",
      Location: new URL(
        `/payment/result/${publicToken}`,
        config.siteUrl,
      ).toString(),
    },
    status: 303,
  });
}

function toProviderTimestamp(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isAuthenticPayment(
  payment: NicepayPayment | null,
  expected: { amount: number; orderId: string; tid: string },
  config: NicepayConfig,
): payment is NicepayPayment {
  return Boolean(
    payment && verifyNicepayPayment(payment, expected, config.secretKey),
  );
}

async function recordPayment(
  client: CBrainSupabaseClient,
  order: PaymentWithOrder,
  input: {
    balanceAmount: number | null;
    canPartCancel: boolean | null;
    cancelledAt: string | null;
    nicepayTid: string | null;
    paidAt: string | null;
    payMethod: string | null;
    receiptUrl: string | null;
    resultCode: string | null;
    resultMessage: string | null;
    status: "paid" | "failed" | "expired" | "unknown";
  },
) {
  return finishPayment(client, {
    amount: order.amount,
    balanceAmount: input.balanceAmount,
    canPartCancel: input.canPartCancel,
    cancelledAt: input.cancelledAt,
    nicepayTid: input.nicepayTid,
    paidAt: input.paidAt,
    payMethod: input.payMethod,
    providerOrderId: order.providerOrderId,
    receiptUrl: input.receiptUrl,
    resultCode: input.resultCode,
    resultMessage: input.resultMessage,
    status: input.status,
  });
}

async function recordProviderPayment(
  client: CBrainSupabaseClient,
  order: PaymentWithOrder,
  payment: NicepayPayment,
  status: "paid" | "failed" | "expired" | "unknown",
) {
  return recordPayment(client, order, {
    balanceAmount: payment.balanceAmt,
    canPartCancel: payment.card?.canPartCancel ?? null,
    cancelledAt: toProviderTimestamp(payment.cancelledAt),
    nicepayTid: payment.tid,
    paidAt: toProviderTimestamp(payment.paidAt),
    payMethod: payment.payMethod,
    receiptUrl: payment.receiptUrl,
    resultCode: payment.resultCode,
    resultMessage: payment.resultMsg,
    status,
  });
}

async function recordUnknownApproval(
  client: CBrainSupabaseClient,
  order: PaymentWithOrder,
) {
  try {
    await recordPayment(client, order, {
      balanceAmount: null,
      canPartCancel: null,
      cancelledAt: null,
      // The authentication callback signature does not bind its TID. Store a
      // TID only after a signed provider response has authenticated it.
      nicepayTid: null,
      paidAt: null,
      payMethod: null,
      receiptUrl: null,
      resultCode: "APPROVAL_UNKNOWN",
      resultMessage: "결제 승인 결과를 확인 중입니다.",
      status: "unknown",
    });
  } catch {
    // Preserve a concurrent, more certain callback or webhook result.
  }
}

async function recordUnknownNetCancel(
  client: CBrainSupabaseClient,
  order: PaymentWithOrder,
  payment: NicepayPayment,
) {
  try {
    await recordPayment(client, order, {
      balanceAmount: null,
      canPartCancel: payment.card?.canPartCancel ?? null,
      cancelledAt: toProviderTimestamp(payment.cancelledAt),
      nicepayTid: payment.tid,
      paidAt: null,
      payMethod: payment.payMethod,
      receiptUrl: payment.receiptUrl,
      resultCode: "NET_CANCEL_PERSISTENCE_UNKNOWN",
      resultMessage: "망취소 완료 후 원장 반영을 확인 중입니다.",
      status: "unknown",
    });
  } catch {
    // A signed cancellation webhook can recover by TID or original order ID.
  }
}

async function markNetCancelRequested(
  client: CBrainSupabaseClient,
  order: PaymentWithOrder,
) {
  try {
    await recordPayment(client, order, {
      balanceAmount: null,
      canPartCancel: null,
      cancelledAt: null,
      nicepayTid: null,
      paidAt: null,
      payMethod: null,
      receiptUrl: null,
      resultCode: "NET_CANCEL_REQUESTED",
      resultMessage: "승인 복구를 위해 망취소를 요청합니다.",
      status: "unknown",
    });
    return true;
  } catch {
    return false;
  }
}

type NetCancelOutcome = "cancelled" | "not_started" | "pending";

async function tryNetCancel(
  client: CBrainSupabaseClient,
  config: NicepayConfig,
  order: PaymentWithOrder,
): Promise<NetCancelOutcome> {
  // A durable marker is the causality proof used by webhook recovery. Never
  // issue a provider net-cancel if the marker could not be persisted first.
  if (!(await markNetCancelRequested(client, order))) return "not_started";

  let payment: NicepayPayment | null;

  try {
    payment = await netCancelNicepayPayment(
      config,
      order.providerOrderId,
    );
  } catch {
    return "pending";
  }

  if (
    !payment ||
    !isAuthenticPayment(
      payment,
      {
        amount: order.amount,
        orderId: order.providerOrderId,
        // Unlike the browser callback, the response signature binds this TID.
        tid: payment.tid,
      },
      config,
    ) ||
    payment.resultCode !== "0000" ||
    payment.status !== "cancelled" ||
    payment.balanceAmt !== 0
  ) {
    return "pending";
  }

  try {
    await recordPayment(client, order, {
      balanceAmount: payment.balanceAmt,
      canPartCancel: payment.card?.canPartCancel ?? null,
      cancelledAt: toProviderTimestamp(payment.cancelledAt),
      nicepayTid: payment.tid,
      paidAt: null,
      payMethod: payment.payMethod,
      receiptUrl: payment.receiptUrl,
      resultCode: "NET_CANCELLED",
      resultMessage: payment.resultMsg,
      status: "failed",
    });
  } catch {
    await recordUnknownNetCancel(client, order, payment);
  }

  return "cancelled";
}

async function recoverApproval(
  client: CBrainSupabaseClient,
  config: NicepayConfig,
  order: PaymentWithOrder,
) {
  const outcome = await tryNetCancel(client, config, order);
  if (outcome === "not_started") await recordUnknownApproval(client, order);
}

export async function POST(request: Request) {
  let config: NicepayConfig;

  try {
    config = getNicepayConfig();
  } catch {
    return new Response("Payment configuration error.", { status: 500 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return new Response("Invalid payment callback.", { status: 400 });
  }

  const providerOrderId = formData.get("orderId");
  if (typeof providerOrderId !== "string" || !providerOrderId) {
    return new Response("Invalid payment callback.", { status: 400 });
  }

  const client = createAdminSupabaseClient();
  const order = await getPaymentByProviderOrderId(client, providerOrderId);
  if (!order) return new Response("Payment not found.", { status: 404 });

  const redirect = () => resultRedirect(config, order.order.publicToken);
  if (["paid", "partial_cancelled", "cancelled"].includes(order.status)) {
    return redirect();
  }

  const authResultCode = formData.get("authResultCode");
  if (authResultCode !== "0000") {
    return redirect();
  }

  const callback = parseNicepayAuthCallback(formData);
  if (
    !callback ||
    !verifyNicepayAuthCallback(
      callback,
      {
        amount: order.amount,
        clientKey: config.clientKey,
        orderId: order.providerOrderId,
      },
      config.secretKey,
    )
  ) {
    return redirect();
  }

  const expectedPayment = {
    amount: order.amount,
    orderId: order.providerOrderId,
    tid: callback.tid,
  };
  let payment: NicepayPayment | null = null;

  try {
    payment = await approveNicepayPayment(config, callback.tid, order.amount);
  } catch {
    // The retrieval fallback below distinguishes a transport failure from a
    // provider approval that has already completed.
  }

  if (!isAuthenticPayment(payment, expectedPayment, config)) {
    try {
      const retrievedPayment = await retrieveNicepayPayment(
        config,
        callback.tid,
      );
      if (isAuthenticPayment(retrievedPayment, expectedPayment, config)) {
        payment = retrievedPayment;
      }
    } catch {
      // Net-cancel and an unknown ledger state are the safe final fallback.
    }
  }

  if (!isAuthenticPayment(payment, expectedPayment, config)) {
    await recoverApproval(client, config, order);
    return redirect();
  }

  if (payment.status === "paid" && payment.resultCode === "0000") {
    if (!toProviderTimestamp(payment.paidAt)) {
      await recoverApproval(client, config, order);
      return redirect();
    }

    try {
      const finishedPayment = await recordProviderPayment(
        client,
        order,
        payment,
        "paid",
      );
      await notifyNewPaidPayment(order, finishedPayment);
    } catch {
      await recordUnknownApproval(client, order);
    }
    return redirect();
  }

  if (payment.status === "failed" || payment.status === "expired") {
    await recordProviderPayment(client, order, payment, payment.status);
    return redirect();
  }

  await recoverApproval(client, config, order);
  return redirect();
}
