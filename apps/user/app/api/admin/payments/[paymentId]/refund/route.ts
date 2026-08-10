import { finishRefund, reserveRefund } from "@repo/supabase";

import {
  adminPaymentCorsHeaders,
  adminPaymentOptions,
  authorizeAdminPaymentRequest,
} from "../../../../../../lib/adminPaymentAuth";
import {
  cancelNicepayPayment,
  findNicepayCancellation,
  getNicepayConfig,
  isUuid,
  NicepayRejectedError,
  retrieveNicepayPayment,
  verifyNicepayPayment,
  type NicepayConfig,
  type NicepayPayment,
} from "../../../../../../lib/nicepay";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ paymentId: string }> };

type RefundRequest = {
  amount: number;
  reason: string;
  requestId: string;
};

type Reservation = Awaited<ReturnType<typeof reserveRefund>>;

function json(request: Request, body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    headers: adminPaymentCorsHeaders(request),
    status,
  });
}

function providerRefundOrderId(requestId: string) {
  return `refund-${requestId}`;
}

function parseRefundRequest(value: unknown): RefundRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  const amount = input.amount;
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";

  if (
    typeof input.requestId !== "string" ||
    !isUuid(input.requestId) ||
    typeof amount !== "number" ||
    !Number.isSafeInteger(amount) ||
    amount < 1 ||
    amount > 999_999_999_999 ||
    reason.length < 1 ||
    reason.length > 100
  ) {
    return null;
  }

  return { amount, reason, requestId: input.requestId };
}

function providerTimestamp(value: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return null;
  return new Date(value).toISOString();
}

function hasExpectedCancellation(
  payment: NicepayPayment,
  reservation: Reservation,
  config: NicepayConfig,
  expectedOrderIds: readonly string[],
) {
  if (
    reservation.payment.balanceAmount === null ||
    !reservation.payment.nicepayTid
  ) {
    return false;
  }

  const expectedBalance =
    reservation.payment.balanceAmount - reservation.amount;

  return Boolean(
    payment.resultCode === "0000" &&
    payment.balanceAmt === expectedBalance &&
    (expectedBalance === 0
      ? payment.status === "cancelled"
      : payment.status === "partialCancelled") &&
    findNicepayCancellation(payment, reservation.amount) &&
    expectedOrderIds.some((orderId) =>
      verifyNicepayPayment(
        payment,
        {
          amount: reservation.payment.amount,
          orderId,
          tid: reservation.payment.nicepayTid!,
        },
        config.secretKey,
      ),
    ),
  );
}

async function finishSucceeded(
  requestId: string,
  amount: number,
  payment: NicepayPayment,
  client: Parameters<typeof finishRefund>[0],
) {
  const cancellation = findNicepayCancellation(payment, amount);
  if (!cancellation) throw new Error("Missing NICEPAY cancellation evidence.");

  return finishRefund(client, {
    balanceAmount: payment.balanceAmt,
    nicepayCancelledTid: cancellation.tid,
    receiptUrl: cancellation.receiptUrl,
    refundedAt: providerTimestamp(cancellation.cancelledAt)!,
    requestId,
    resultCode: payment.resultCode,
    resultMessage: payment.resultMsg,
    status: "succeeded",
  });
}

async function finishFailed(
  reservation: Reservation,
  requestId: string,
  client: Parameters<typeof finishRefund>[0],
  resultCode: string,
  resultMessage: string,
) {
  await finishRefund(client, {
    balanceAmount: reservation.payment.balanceAmount,
    nicepayCancelledTid: null,
    receiptUrl: null,
    refundedAt: null,
    requestId,
    resultCode,
    resultMessage,
    status: "failed",
  });
}

async function lookupCancellation(
  reservation: Reservation,
  config: NicepayConfig,
  refundOrderId: string,
) {
  if (!reservation.payment.nicepayTid) return null;

  try {
    const payment = await retrieveNicepayPayment(
      config,
      reservation.payment.nicepayTid,
    );

    return payment &&
      hasExpectedCancellation(payment, reservation, config, [
        reservation.payment.providerOrderId,
        refundOrderId,
      ])
      ? payment
      : null;
  } catch {
    return null;
  }
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: "Invalid JSON." }, 400);
  }

  const input = parseRefundRequest(body);
  if (!input) return json(request, { error: "Invalid refund request." }, 400);
  const refundOrderId = providerRefundOrderId(input.requestId);

  let config: NicepayConfig;
  try {
    config = getNicepayConfig();
  } catch {
    return json(request, { error: "Payment configuration error." }, 500);
  }

  let reservation: Reservation;
  try {
    reservation = await reserveRefund(authorization.client, {
      amount: input.amount,
      paymentId,
      providerRefundOrderId: refundOrderId,
      reason: input.reason,
      requestId: input.requestId,
      requestedBy: authorization.userId,
    });
  } catch {
    return json(request, { error: "Refund cannot be reserved." }, 409);
  }

  if (reservation.status === "succeeded") {
    return json(request, {
      refundableAmount: reservation.payment.balanceAmount ?? 0,
      refundedAmount: reservation.amount,
      status: "succeeded",
    });
  }

  if (reservation.status === "failed") {
    return json(
      request,
      { error: "Refund was previously rejected.", status: "failed" },
      409,
    );
  }

  // Never issue the same cancellation twice. A concurrent or previously
  // unresolved request can only recover its result through provider lookup.
  if (!reservation.shouldExecute) {
    const recovered = await lookupCancellation(
      reservation,
      config,
      refundOrderId,
    );
    if (recovered) {
      const result = await finishSucceeded(
        input.requestId,
        reservation.amount,
        recovered,
        authorization.client,
      );
      return json(request, {
        refundableAmount: result.refundableAmount,
        refundedAmount: result.refundedAmount,
        status: "succeeded",
      });
    }

    return json(
      request,
      {
        error:
          "NICEPAY did not return a final refund result. Retry the same request.",
      },
      503,
    );
  }

  if (
    !reservation.payment.nicepayTid ||
    reservation.payment.balanceAmount === null
  ) {
    await finishFailed(
      reservation,
      input.requestId,
      authorization.client,
      "MISSING_TID",
      "Approved payment transaction is unavailable.",
    );
    return json(
      request,
      { error: "Payment cannot be refunded.", status: "failed" },
      409,
    );
  }

  if (
    input.amount < reservation.payment.balanceAmount &&
    reservation.payment.canPartCancel === false
  ) {
    await finishFailed(
      reservation,
      input.requestId,
      authorization.client,
      "PARTIAL_CANCEL_UNAVAILABLE",
      "This card does not support partial cancellation.",
    );
    return json(
      request,
      { error: "Partial cancellation is unavailable.", status: "failed" },
      409,
    );
  }

  try {
    const payment = await cancelNicepayPayment(
      config,
      reservation.payment.nicepayTid,
      {
        amount: input.amount,
        currentBalance: reservation.payment.balanceAmount,
        orderId: refundOrderId,
        reason: input.reason,
      },
    );

    if (
      payment &&
      hasExpectedCancellation(payment, reservation, config, [
        reservation.payment.providerOrderId,
        refundOrderId,
      ])
    ) {
      const result = await finishSucceeded(
        input.requestId,
        reservation.amount,
        payment,
        authorization.client,
      );
      return json(request, {
        refundableAmount: result.refundableAmount,
        refundedAmount: result.refundedAmount,
        status: "succeeded",
      });
    }

    if (payment) {
      if (payment.resultCode !== "0000") {
        await finishFailed(
          reservation,
          input.requestId,
          authorization.client,
          payment.resultCode,
          payment.resultMsg,
        );
        return json(
          request,
          { error: "NICEPAY rejected the refund.", status: "failed" },
          409,
        );
      }
    }
  } catch (error) {
    if (error instanceof NicepayRejectedError) {
      await finishFailed(
        reservation,
        input.requestId,
        authorization.client,
        error.resultCode,
        error.resultMessage,
      );
      return json(
        request,
        { error: "NICEPAY rejected the refund.", status: "failed" },
        409,
      );
    }
  }

  const recovered = await lookupCancellation(
    reservation,
    config,
    refundOrderId,
  );
  if (recovered) {
    const result = await finishSucceeded(
      input.requestId,
      reservation.amount,
      recovered,
      authorization.client,
    );
    return json(request, {
      refundableAmount: result.refundableAmount,
      refundedAmount: result.refundedAmount,
      status: "succeeded",
    });
  }

  return json(
    request,
    {
      error:
        "NICEPAY did not return a final refund result. Retry the same request.",
    },
    503,
  );
}
