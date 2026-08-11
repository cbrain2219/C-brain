import { unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { PaymentStatus, RefundStatus } from "./types.ts";

export type ReservedRefund = {
  id: string;
  status: RefundStatus;
  shouldExecute: boolean;
  amount: number;
  payment: {
    id: string;
    amount: number;
    balanceAmount: number | null;
    nicepayTid: string | null;
    canPartCancel: boolean | null;
    providerOrderId: string;
  };
};

export type ReserveRefundInput = {
  paymentId: string;
  requestId: string;
  providerRefundOrderId: string;
  amount: number;
  reason: string;
  requestedBy: string;
};

export type FinishedRefund = {
  status: RefundStatus;
  refundedAmount: number;
  refundableAmount: number;
  paymentStatus: PaymentStatus;
};

export type FinishRefundInput = {
  requestId: string;
  status: RefundStatus;
  balanceAmount: number | null;
  nicepayCancelledTid: string | null;
  resultCode: string | null;
  resultMessage: string | null;
  receiptUrl: string | null;
  refundedAt: string | null;
};

export async function reserveRefund(
  client: CBrainSupabaseClient,
  input: ReserveRefundInput,
): Promise<ReservedRefund> {
  const { data, error } = await client
    .rpc("reserve_refund", {
      p_amount: input.amount,
      p_payment_id: input.paymentId,
      p_provider_refund_order_id: input.providerRefundOrderId,
      p_reason: input.reason,
      p_request_id: input.requestId,
      p_requested_by: input.requestedBy,
    })
    .single();
  const refund = unwrapSupabaseData(data, error);

  return {
    amount: refund.amount,
    id: refund.refund_id,
    payment: {
      amount: refund.payment_amount,
      balanceAmount: refund.payment_balance_amount,
      canPartCancel: refund.can_part_cancel,
      id: refund.payment_id,
      nicepayTid: refund.nicepay_tid,
      providerOrderId: refund.provider_order_id,
    },
    status: refund.refund_status,
    shouldExecute: refund.should_execute,
  };
}

export async function finishRefund(
  client: CBrainSupabaseClient,
  input: FinishRefundInput,
): Promise<FinishedRefund> {
  const { data, error } = await client
    .rpc("finish_refund", {
      p_balance_amount: input.balanceAmount,
      p_nicepay_cancelled_tid: input.nicepayCancelledTid,
      p_receipt_url: input.receiptUrl,
      p_refunded_at: input.refundedAt,
      p_request_id: input.requestId,
      p_result_code: input.resultCode,
      p_result_message: input.resultMessage,
      p_status: input.status,
    })
    .single();
  const refund = unwrapSupabaseData(data, error);

  return {
    paymentStatus: refund.payment_status,
    refundableAmount: refund.refundable_amount,
    refundedAmount: refund.refunded_amount,
    status: refund.status,
  };
}
