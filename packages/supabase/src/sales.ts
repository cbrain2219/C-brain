import { requireAdmin } from "./auth.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type {
  OrderChannel,
  PaymentStatus,
  RefundStatus,
  TableRow,
} from "./types.ts";

export type SalesChannel = "all" | OrderChannel;

export type SalesSummary = {
  grossSalesAmount: number;
  paymentCount: number;
  refundedAmount: number;
  netSalesAmount: number;
};

export type SalesEvent = {
  id: string;
  kind: "payment" | "refund";
  status: PaymentStatus | RefundStatus;
  channel: OrderChannel;
  amount: number;
  occurredAt: string | null;
  paymentId: string;
  orderName: string;
  customerLabel: string;
  receiptUrl: string | null;
  refundableAmount: number | null;
};

export type SalesDashboardData = {
  summary: SalesSummary;
  events: readonly SalesEvent[];
};

export type GetAdminSalesDashboardInput = {
  channel: SalesChannel;
  from: string;
  to: string;
};

const completedPaymentStatuses = new Set<PaymentStatus>([
  "paid",
  "partial_cancelled",
  "cancelled",
]);

export function summarizeSalesEvents(
  events: readonly Pick<SalesEvent, "amount" | "kind" | "status">[],
): SalesSummary {
  let grossSalesAmount = 0;
  let paymentCount = 0;
  let refundedAmount = 0;

  for (const event of events) {
    if (
      event.kind === "payment" &&
      completedPaymentStatuses.has(event.status as PaymentStatus)
    ) {
      grossSalesAmount += event.amount;
      paymentCount += 1;
    }

    if (event.kind === "refund" && event.status === "succeeded") {
      refundedAmount += event.amount;
    }
  }

  return {
    grossSalesAmount,
    netSalesAmount: grossSalesAmount - refundedAmount,
    paymentCount,
    refundedAmount,
  };
}

type OrderSalesFields = Pick<
  TableRow<"orders">,
  "channel" | "customer_label" | "order_name"
>;

type PaymentSalesFields = Pick<
  TableRow<"payments">,
  | "amount"
  | "balance_amount"
  | "created_at"
  | "id"
  | "paid_at"
  | "receipt_url"
  | "status"
> & { orders: OrderSalesFields };

type RefundSalesFields = Pick<
  TableRow<"refunds">,
  | "amount"
  | "id"
  | "payment_id"
  | "receipt_url"
  | "refunded_at"
  | "requested_at"
  | "status"
> & {
  payments: Pick<TableRow<"payments">, "balance_amount"> & {
    orders: OrderSalesFields;
  };
};

export async function getAdminSalesDashboard(
  client: CBrainSupabaseClient,
  input: GetAdminSalesDashboardInput,
): Promise<SalesDashboardData> {
  await requireAdmin(client);

  let paymentsQuery = client
    .from("payments")
    .select(
      "id, amount, balance_amount, status, paid_at, created_at, receipt_url, orders!inner(channel, customer_label, order_name)",
    )
    .in("status", ["paid", "partial_cancelled", "cancelled"])
    .gte("paid_at", input.from)
    .lt("paid_at", input.to);
  let refundsQuery = client
    .from("refunds")
    .select(
      "id, payment_id, amount, status, refunded_at, requested_at, receipt_url, payments!inner(balance_amount, orders!inner(channel, customer_label, order_name))",
    )
    .eq("status", "succeeded")
    .gte("refunded_at", input.from)
    .lt("refunded_at", input.to);

  if (input.channel !== "all") {
    paymentsQuery = paymentsQuery.eq("orders.channel", input.channel);
    refundsQuery = refundsQuery.eq("payments.orders.channel", input.channel);
  }

  const [
    { data: paymentData, error: paymentsError },
    { data: refundData, error: refundsError },
  ] = await Promise.all([paymentsQuery, refundsQuery]);

  if (paymentsError) throw new Error(paymentsError.message);
  if (refundsError) throw new Error(refundsError.message);

  const paymentEvents: SalesEvent[] = (paymentData as PaymentSalesFields[]).map(
    (payment) => ({
      amount: payment.amount,
      channel: payment.orders.channel,
      customerLabel: payment.orders.customer_label,
      id: payment.id,
      kind: "payment",
      occurredAt: payment.paid_at ?? payment.created_at,
      orderName: payment.orders.order_name,
      paymentId: payment.id,
      receiptUrl: payment.receipt_url,
      refundableAmount: payment.balance_amount,
      status: payment.status,
    }),
  );
  const refundEvents: SalesEvent[] = (refundData as RefundSalesFields[]).map(
    (refund) => ({
      amount: refund.amount,
      channel: refund.payments.orders.channel,
      customerLabel: refund.payments.orders.customer_label,
      id: refund.id,
      kind: "refund",
      occurredAt: refund.refunded_at ?? refund.requested_at,
      orderName: refund.payments.orders.order_name,
      paymentId: refund.payment_id,
      receiptUrl: refund.receipt_url,
      refundableAmount: refund.payments.balance_amount,
      status: refund.status,
    }),
  );
  const events = [...paymentEvents, ...refundEvents].sort((left, right) =>
    (right.occurredAt ?? "").localeCompare(left.occurredAt ?? ""),
  );

  return { events, summary: summarizeSalesEvents(events) };
}
