import { unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { Json, OrderChannel, OrderStatus, PaymentStatus, TableRow } from "./types.ts";

export type CheckoutCustomer = {
  name: string;
  company: string | null;
  phone: string;
  email: string;
};

export type CheckoutAgreements = {
  privacyCollection: boolean;
  privacyPolicy: boolean;
};

export type CheckoutSession = {
  orderId: string;
  orderPublicToken: string;
  paymentId: string;
  providerOrderId: string;
  amount: number;
  orderName: string;
};

type CheckoutInput = {
  checkoutRequestId: string;
  customer: CheckoutCustomer;
  agreements: CheckoutAgreements;
  customerLabel: string;
  privacyAgreedAt?: string;
};

export type CreateSiteCheckoutInput = CheckoutInput & {
  amount: number;
  itemSnapshot: Json;
  orderName: string;
};

export type CreateLinkPayCheckoutInput = CheckoutInput & {
  publicToken: string;
};

export type PaymentRow = {
  id: string;
  orderId: string;
  providerOrderId: string;
  amount: number;
  balanceAmount: number | null;
  status: PaymentStatus;
  nicepayTid: string | null;
  resultCode: string | null;
  resultMessage: string | null;
  payMethod: string | null;
  receiptUrl: string | null;
  canPartCancel: boolean | null;
  paidAt: string | null;
  cancelledAt: string | null;
};

export type PaymentWithOrder = PaymentRow & {
  order: {
    buyerCompany: string | null;
    buyerEmail: string;
    buyerName: string;
    buyerPhone: string;
    id: string;
    publicToken: string;
    channel: OrderChannel;
    itemSnapshot: Json;
    orderName: string;
    orderNumber: string;
    amount: number;
    status: OrderStatus;
  };
};

export type RefundRow = {
  id: string;
  paymentId: string;
  requestId: string;
  amount: number;
  status: import("./types.ts").RefundStatus;
  providerRefundOrderId: string;
  nicepayCancelledTid: string | null;
  resultCode: string | null;
  resultMessage: string | null;
  receiptUrl: string | null;
  requestedAt: string;
  refundedAt: string | null;
};

export type SafeOrderResult = {
  channel: OrderChannel;
  orderName: string;
  paymentMethod: string | null;
  status: OrderStatus;
  totalAmount: number;
};

export type FinishPaymentInput = {
  providerOrderId: string;
  status: "paid" | "failed" | "expired" | "unknown";
  amount: number;
  balanceAmount: number | null;
  nicepayTid: string | null;
  resultCode: string | null;
  resultMessage: string | null;
  payMethod: string | null;
  receiptUrl: string | null;
  canPartCancel: boolean | null;
  paidAt: string | null;
  cancelledAt: string | null;
};

const successfulOrderStatuses = new Set<OrderStatus>([
  "paid",
  "partially_refunded",
  "refunded",
]);

const successfulPaymentStatuses = new Set<PaymentStatus>([
  "paid",
  "partial_cancelled",
  "cancelled",
]);

type CheckoutRpcRow = {
  amount: number;
  order_id: string;
  order_name: string;
  order_public_token: string;
  payment_id: string;
  provider_order_id: string;
};

function providerOrderIdFrom(checkoutRequestId: string) {
  const compactId = checkoutRequestId.replaceAll("-", "");

  if (!/^[0-9a-fA-F]{32}$/.test(compactId)) {
    throw new Error("checkoutRequestId must be a UUID.");
  }

  return `CB${compactId}`;
}

function privacyAgreedAt(input: CheckoutInput) {
  if (!input.agreements.privacyCollection || !input.agreements.privacyPolicy) {
    throw new Error("Required privacy agreements are missing.");
  }

  return input.privacyAgreedAt ?? new Date().toISOString();
}

function checkoutSession(row: CheckoutRpcRow): CheckoutSession {
  return {
    amount: row.amount,
    orderId: row.order_id,
    orderName: row.order_name,
    orderPublicToken: row.order_public_token,
    paymentId: row.payment_id,
    providerOrderId: row.provider_order_id,
  };
}

function paymentRow(row: TableRow<"payments">): PaymentRow {
  return {
    amount: row.amount,
    balanceAmount: row.balance_amount,
    canPartCancel: row.can_part_cancel,
    cancelledAt: row.cancelled_at,
    id: row.id,
    nicepayTid: row.nicepay_tid,
    orderId: row.order_id,
    paidAt: row.paid_at,
    payMethod: row.pay_method,
    providerOrderId: row.provider_order_id,
    receiptUrl: row.receipt_url,
    resultCode: row.result_code,
    resultMessage: row.result_message,
    status: row.status,
  };
}

export async function createSiteCheckout(
  client: CBrainSupabaseClient,
  input: CreateSiteCheckoutInput,
): Promise<CheckoutSession> {
  const { customer } = input;
  const { data, error } = await client
    .rpc("create_site_checkout", {
      p_amount: input.amount,
      p_buyer_company: customer.company,
      p_buyer_email: customer.email,
      p_buyer_name: customer.name,
      p_buyer_phone: customer.phone,
      p_checkout_request_id: input.checkoutRequestId,
      p_customer_label: input.customerLabel,
      p_item_snapshot: input.itemSnapshot,
      p_order_name: input.orderName,
      p_privacy_agreed_at: privacyAgreedAt(input),
      p_provider_order_id: providerOrderIdFrom(input.checkoutRequestId),
    })
    .single();

  return checkoutSession(unwrapSupabaseData(data, error));
}

export async function createLinkPayCheckout(
  client: CBrainSupabaseClient,
  input: CreateLinkPayCheckoutInput,
): Promise<CheckoutSession> {
  const { customer } = input;
  const { data, error } = await client
    .rpc("create_linkpay_checkout", {
      p_buyer_company: customer.company,
      p_buyer_email: customer.email,
      p_buyer_name: customer.name,
      p_buyer_phone: customer.phone,
      p_checkout_request_id: input.checkoutRequestId,
      p_customer_label: input.customerLabel,
      p_privacy_agreed_at: privacyAgreedAt(input),
      p_provider_order_id: providerOrderIdFrom(input.checkoutRequestId),
      p_public_token: input.publicToken,
    })
    .single();

  return checkoutSession(unwrapSupabaseData(data, error));
}

export async function finishPayment(
  client: CBrainSupabaseClient,
  input: FinishPaymentInput,
): Promise<PaymentRow> {
  const { data, error } = await client
    .rpc("finish_payment", {
      p_amount: input.amount,
      p_balance_amount: input.balanceAmount,
      p_can_part_cancel: input.canPartCancel,
      p_cancelled_at: input.cancelledAt,
      p_nicepay_tid: input.nicepayTid,
      p_paid_at: input.paidAt,
      p_pay_method: input.payMethod,
      p_provider_order_id: input.providerOrderId,
      p_receipt_url: input.receiptUrl,
      p_result_code: input.resultCode,
      p_result_message: input.resultMessage,
      p_status: input.status,
    })
    .single();

  return paymentRow(unwrapSupabaseData(data, error));
}

export async function getPaymentByProviderOrderId(
  client: CBrainSupabaseClient,
  providerOrderId: string,
): Promise<PaymentWithOrder | null> {
  return getPaymentWithOrder(client, "provider_order_id", providerOrderId);
}

export async function getPaymentById(
  client: CBrainSupabaseClient,
  paymentId: string,
): Promise<PaymentWithOrder | null> {
  return getPaymentWithOrder(client, "id", paymentId);
}

export async function getPaymentByNicepayTid(
  client: CBrainSupabaseClient,
  nicepayTid: string,
): Promise<PaymentWithOrder | null> {
  return getPaymentWithOrder(client, "nicepay_tid", nicepayTid);
}

async function getPaymentWithOrder(
  client: CBrainSupabaseClient,
  column: "id" | "nicepay_tid" | "provider_order_id",
  value: string,
): Promise<PaymentWithOrder | null> {
  const { data, error } = await client
    .from("payments")
    .select(
      "*, orders!inner(id, public_token, channel, order_name, order_number, amount, status, item_snapshot, buyer_name, buyer_company, buyer_phone, buyer_email)",
    )
    .eq(column, value)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return paymentWithOrder(
    data as TableRow<"payments"> & {
      orders: Pick<
        TableRow<"orders">,
        | "amount"
        | "buyer_company"
        | "buyer_email"
        | "buyer_name"
        | "buyer_phone"
        | "channel"
        | "id"
        | "item_snapshot"
        | "order_name"
        | "order_number"
        | "public_token"
        | "status"
      >;
    },
  );
}

function paymentWithOrder(
  joined: TableRow<"payments"> & {
    orders: Pick<
      TableRow<"orders">,
      | "amount"
      | "buyer_company"
      | "buyer_email"
      | "buyer_name"
      | "buyer_phone"
      | "channel"
      | "id"
      | "item_snapshot"
      | "order_name"
      | "order_number"
      | "public_token"
      | "status"
    >;
  },
): PaymentWithOrder {
  return {
    ...paymentRow(joined),
    order: {
      amount: joined.orders.amount,
      buyerCompany: joined.orders.buyer_company,
      buyerEmail: joined.orders.buyer_email,
      buyerName: joined.orders.buyer_name,
      buyerPhone: joined.orders.buyer_phone,
      channel: joined.orders.channel,
      id: joined.orders.id,
      itemSnapshot: joined.orders.item_snapshot,
      orderName: joined.orders.order_name,
      orderNumber: joined.orders.order_number,
      publicToken: joined.orders.public_token,
      status: joined.orders.status,
    },
  };
}

export async function listRefundsByPaymentId(
  client: CBrainSupabaseClient,
  paymentId: string,
): Promise<RefundRow[]> {
  const { data, error } = await client
    .from("refunds")
    .select("*")
    .eq("payment_id", paymentId)
    .order("requested_at", { ascending: true });

  const refunds = unwrapSupabaseData(data, error);

  return refunds.map((refund) => ({
    amount: refund.amount,
    id: refund.id,
    nicepayCancelledTid: refund.nicepay_cancelled_tid,
    paymentId: refund.payment_id,
    providerRefundOrderId: refund.provider_refund_order_id,
    receiptUrl: refund.receipt_url,
    refundedAt: refund.refunded_at,
    requestId: refund.request_id,
    requestedAt: refund.requested_at,
    resultCode: refund.result_code,
    resultMessage: refund.result_message,
    status: refund.status,
  }));
}

export async function getOrderResultByPublicToken(
  client: CBrainSupabaseClient,
  publicToken: string,
): Promise<SafeOrderResult | null> {
  const { data, error } = await client
    .from("orders")
    .select("channel, order_name, status, amount, payments(pay_method, status)")
    .eq("public_token", publicToken)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const order = data as Pick<
    TableRow<"orders">,
    "amount" | "channel" | "order_name" | "status"
  > & {
    payments: Pick<TableRow<"payments">, "pay_method" | "status">[];
  };

  const paymentMethod = successfulOrderStatuses.has(order.status)
    ? (order.payments.find((payment) => successfulPaymentStatuses.has(payment.status))
        ?.pay_method ?? null)
    : null;

  return {
    channel: order.channel,
    orderName: order.order_name,
    paymentMethod,
    status: order.status,
    totalAmount: order.amount,
  };
}
