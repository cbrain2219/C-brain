import type Holidays from "date-holidays";

import { requireAdmin } from "./auth.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { Json, OrderChannel, PaymentStatus, TableRow } from "./types.ts";

export type SalesChannel = "all" | OrderChannel;

export type SalesTransactionStatus =
  | "partial-refund"
  | "refund-complete"
  | "scheduled"
  | "settled";

export type SalesSummary = {
  monthlyPaymentAmount: number;
  monthlyPaymentCount: number;
  monthlyVisitorCount: number | null;
  scheduledSettlementAmount: number;
  settlementDate: string;
};

export type SalesTransaction = {
  cardFee: number;
  canPartCancel: boolean | null;
  channel: OrderChannel;
  customerLabel: string;
  id: string;
  occurredAt: string;
  orderName: string;
  paymentId: string;
  productId: string;
  productLabel: string;
  receiptUrl: string | null;
  refundableAmount: number;
  settlementAmount: number;
  settlementDate: string;
  status: SalesTransactionStatus;
  transactionAmount: number;
};

export type SalesDashboardData = {
  summary: SalesSummary;
  transactions: readonly SalesTransaction[];
};

export type GetAdminSalesDashboardInput = {
  channel: SalesChannel;
  from: string;
  to: string;
  today: string;
};

const CARD_FEE_RATE = 0.029;
const CARD_FEE_VAT_MULTIPLIER = 1.1;
const KST_TIME_ZONE = "Asia/Seoul";
const SALES_PAGE_SIZE = 100;
const SETTLEMENT_BUSINESS_DAYS = 5;
const SETTLEMENT_CALENDAR_LAST_YEAR = 2050;
const verifiedPaymentStatuses: readonly PaymentStatus[] = [
  "paid",
  "partial_cancelled",
  "cancelled",
];

const kstDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: KST_TIME_ZONE,
  year: "numeric",
});

let koreanHolidayCalendarPromise: Promise<Holidays> | undefined;

type OrderSalesFields = Pick<
  TableRow<"orders">,
  "channel" | "customer_label" | "item_snapshot" | "order_name"
>;

type PaymentSalesFields = Pick<
  TableRow<"payments">,
  | "amount"
  | "balance_amount"
  | "can_part_cancel"
  | "created_at"
  | "id"
  | "paid_at"
  | "receipt_url"
  | "status"
> & { orders: OrderSalesFields };

type ProductIdentity = {
  productId: string;
  productLabel: string;
};

type SalesPaymentWindow = {
  from: string;
  to: string;
};

function getKoreanHolidayCalendar(): Promise<Holidays> {
  if (!koreanHolidayCalendarPromise) {
    koreanHolidayCalendarPromise = import("date-holidays")
      .then(
        ({ default: Holidays }) =>
          new Holidays("KR", {
            timezone: KST_TIME_ZONE,
            types: ["public", "bank"],
          }),
      )
      .catch((error: unknown) => {
        koreanHolidayCalendarPromise = undefined;
        throw error;
      });
  }

  return koreanHolidayCalendarPromise;
}

function isRecord(value: unknown): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimmedString(value: Json | undefined): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed || null;
}

export function normalizeProduct(
  channel: OrderChannel,
  snapshot: Json,
  paymentId: string,
  orderName: string,
): ProductIdentity {
  if (channel === "site" && isRecord(snapshot) && isRecord(snapshot.service)) {
    const productId = trimmedString(snapshot.service.id);
    const productLabel = trimmedString(snapshot.service.label);

    if (productId && productLabel) return { productId, productLabel };
  }

  if (channel === "linkpay" && isRecord(snapshot)) {
    const category = trimmedString(snapshot.category);

    if (category) {
      return { productId: `linkpay:${category}`, productLabel: category };
    }
  }

  return { productId: `unknown:${paymentId}`, productLabel: orderName };
}

function assertSettlementCalendarDate(date: string): void {
  const year = Number(date.slice(0, 4));

  if (year > SETTLEMENT_CALENDAR_LAST_YEAR) {
    throw new Error(
      `Settlement calendar supports Korean holidays through ${SETTLEMENT_CALENDAR_LAST_YEAR}.`,
    );
  }
}

function isValidKstDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const dateParts = date.split("-");
  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]);
  const day = Number(dateParts[2]);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  return (
    calendarDate.getUTCFullYear() === year &&
    calendarDate.getUTCMonth() === month - 1 &&
    calendarDate.getUTCDate() === day
  );
}

function requireKstDate(date: string): string {
  if (!isValidKstDate(date)) {
    throw new Error(`Expected an ISO KST date, received: ${date}`);
  }

  assertSettlementCalendarDate(date);
  return date;
}

function kstDateFromInstant(instant: string): string {
  const date = new Date(instant);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Expected a valid payment instant, received: ${instant}`);
  }

  const parts = kstDateFormatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  const kstDate = `${values.year}-${values.month}-${values.day}`;

  return requireKstDate(kstDate);
}

function addKstDays(date: string, days: number): string {
  const dateParts = requireKstDate(date).split("-");
  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]);
  const day = Number(dateParts[2]);
  const calendarDate = new Date(Date.UTC(year, month - 1, day + days));
  const next = `${calendarDate.getUTCFullYear()}-${String(
    calendarDate.getUTCMonth() + 1,
  ).padStart(2, "0")}-${String(calendarDate.getUTCDate()).padStart(2, "0")}`;

  return requireKstDate(next);
}

function kstNoonDate(date: string): Date {
  return new Date(`${requireKstDate(date)}T12:00:00+09:00`);
}

function kstMidnightInstant(date: string): string {
  return new Date(`${requireKstDate(date)}T00:00:00+09:00`).toISOString();
}

async function isKoreanBusinessDay(date: string): Promise<boolean> {
  const kstNoon = kstNoonDate(date);
  const day = kstNoon.getUTCDay();

  if (day === 0 || day === 6) return false;

  const holidays = await getKoreanHolidayCalendar();
  return holidays.isHoliday(kstNoon) === false;
}

async function previousKoreanBusinessDay(date: string): Promise<string> {
  let candidate = addKstDays(date, -1);

  while (!(await isKoreanBusinessDay(candidate))) {
    candidate = addKstDays(candidate, -1);
  }

  return candidate;
}

async function firstBusinessDayOfSettlementWindow(today: string): Promise<string> {
  let candidate = today;
  let counted = 0;

  while (counted < SETTLEMENT_BUSINESS_DAYS) {
    if (await isKoreanBusinessDay(candidate)) counted += 1;
    if (counted < SETTLEMENT_BUSINESS_DAYS) candidate = addKstDays(candidate, -1);
  }

  return candidate;
}

export function calculateEstimatedSettlement(currentAmount: number): {
  cardFee: number;
  settlementAmount: number;
} {
  const cardFee = Math.round(
    currentAmount * CARD_FEE_RATE * CARD_FEE_VAT_MULTIPLIER,
  );

  return { cardFee, settlementAmount: currentAmount - cardFee };
}

export async function getExpectedSettlementDate(paidAt: string): Promise<string> {
  let candidate = kstDateFromInstant(paidAt);
  let counted = 0;

  while (counted < SETTLEMENT_BUSINESS_DAYS) {
    candidate = addKstDays(candidate, 1);

    if (await isKoreanBusinessDay(candidate)) counted += 1;
  }

  return candidate;
}

function currentAmountForPayment(payment: PaymentSalesFields): number {
  if (!Number.isFinite(payment.amount)) {
    throw new Error(`Payment ${payment.id} has an invalid amount.`);
  }

  const isFullRefund = payment.status === "cancelled" || payment.balance_amount === 0;

  if (isFullRefund) return 0;

  if (
    payment.status === "partial_cancelled" &&
    !Number.isFinite(payment.balance_amount)
  ) {
    throw new Error(
      `Payment ${payment.id} is partially refunded but has no finite balance amount.`,
    );
  }

  const currentAmount = payment.balance_amount ?? payment.amount;

  if (!Number.isFinite(currentAmount)) {
    throw new Error(`Payment ${payment.id} has an invalid balance amount.`);
  }

  return currentAmount;
}

async function toSalesTransaction(
  payment: PaymentSalesFields,
  today: string,
  settlementDateCache: Map<string, Promise<string>>,
): Promise<SalesTransaction> {
  const currentAmount = currentAmountForPayment(payment);
  const isFullRefund = currentAmount === 0;
  const occurredAt = payment.paid_at ?? payment.created_at;
  const occurredOn = kstDateFromInstant(occurredAt);
  let settlementDatePromise = settlementDateCache.get(occurredOn);

  if (!settlementDatePromise) {
    settlementDatePromise = getExpectedSettlementDate(occurredAt);
    settlementDateCache.set(occurredOn, settlementDatePromise);
  }

  const settlementDate = await settlementDatePromise;
  const { cardFee, settlementAmount } = calculateEstimatedSettlement(currentAmount);
  const { productId, productLabel } = normalizeProduct(
    payment.orders.channel,
    payment.orders.item_snapshot,
    payment.id,
    payment.orders.order_name,
  );

  let status: SalesTransactionStatus;
  if (isFullRefund) {
    status = "refund-complete";
  } else if (
    currentAmount < payment.amount ||
    payment.status === "partial_cancelled"
  ) {
    status = "partial-refund";
  } else if (settlementDate < today) {
    status = "settled";
  } else {
    status = "scheduled";
  }

  return {
    canPartCancel: payment.can_part_cancel,
    cardFee,
    channel: payment.orders.channel,
    customerLabel: payment.orders.customer_label,
    id: payment.id,
    occurredAt,
    orderName: payment.orders.order_name,
    paymentId: payment.id,
    productId,
    productLabel,
    receiptUrl: isFullRefund ? null : payment.receipt_url,
    refundableAmount: currentAmount,
    settlementAmount,
    settlementDate,
    status,
    transactionAmount: payment.amount,
  };
}

async function listSalesPayments(
  client: CBrainSupabaseClient,
  channel: SalesChannel,
  from: string,
  to: string,
): Promise<PaymentSalesFields[]> {
  const payments: PaymentSalesFields[] = [];
  let cursor: Pick<PaymentSalesFields, "id" | "paid_at"> | null = null;

  for (;;) {
    let query = client
      .from("payments")
      .select(
        "id, amount, balance_amount, can_part_cancel, status, paid_at, created_at, receipt_url, orders!inner(channel, customer_label, item_snapshot, order_name)",
      )
      .in("status", verifiedPaymentStatuses)
      .gte("paid_at", from)
      .lt("paid_at", to)
      .order("paid_at", { ascending: true })
      .order("id", { ascending: true });

    if (channel !== "all") query = query.eq("orders.channel", channel);
    if (cursor?.paid_at) {
      query = query.or(
        `paid_at.gt.${cursor.paid_at},and(paid_at.eq.${cursor.paid_at},id.gt.${cursor.id})`,
      );
    }

    const { data, error } = await query.limit(SALES_PAGE_SIZE);

    if (error) throw new Error(error.message);

    const page = (data ?? []) as PaymentSalesFields[];
    payments.push(...page);

    if (page.length < SALES_PAGE_SIZE) return payments;

    const lastPayment = page.at(-1);

    if (!lastPayment?.paid_at) {
      throw new Error("Verified sales payment is missing its paid_at cursor.");
    }

    cursor = { id: lastPayment.id, paid_at: lastPayment.paid_at };
  }
}

function mergePaymentWindows(
  windows: readonly SalesPaymentWindow[],
): SalesPaymentWindow[] {
  const sortedWindows = windows
    .filter((window) => window.from < window.to)
    .sort((left, right) => left.from.localeCompare(right.from));
  const mergedWindows: SalesPaymentWindow[] = [];

  for (const window of sortedWindows) {
    const current = mergedWindows.at(-1);

    if (!current || window.from > current.to) {
      mergedWindows.push({ ...window });
      continue;
    }

    if (window.to > current.to) current.to = window.to;
  }

  return mergedWindows;
}

function paymentIsInWindow(
  payment: PaymentSalesFields,
  window: SalesPaymentWindow,
): boolean {
  if (payment.paid_at === null) return false;

  const paidAt = Date.parse(payment.paid_at);
  const from = Date.parse(window.from);
  const to = Date.parse(window.to);

  if ([paidAt, from, to].some(Number.isNaN)) {
    throw new Error(`Sales payment ${payment.id} has an invalid date window.`);
  }

  return paidAt >= from && paidAt < to;
}

function monthWindow(today: string): { from: string; to: string } {
  const monthStart = `${today.slice(0, 7)}-01`;

  return {
    from: kstMidnightInstant(monthStart),
    to: kstMidnightInstant(addKstDays(monthStart, 32).slice(0, 7) + "-01"),
  };
}

export async function getAdminSalesDashboard(
  client: CBrainSupabaseClient,
  input: GetAdminSalesDashboardInput,
): Promise<SalesDashboardData> {
  await requireAdmin(client);

  const today = requireKstDate(input.today);
  const monthlyWindow = monthWindow(today);
  const todayIsBusinessDay = await isKoreanBusinessDay(today);
  const candidateWindow = todayIsBusinessDay
    ? await (async () => {
        const firstBusinessDay = await firstBusinessDayOfSettlementWindow(today);
        const previousBusinessDay = await previousKoreanBusinessDay(firstBusinessDay);

        return {
          from: kstMidnightInstant(previousBusinessDay),
          to: kstMidnightInstant(firstBusinessDay),
        };
      })()
    : null;

  const paymentWindows = mergePaymentWindows([
    { from: input.from, to: input.to },
    monthlyWindow,
    ...(candidateWindow ? [candidateWindow] : []),
  ]);
  const paymentPages = await Promise.all(
    paymentWindows.map((window) =>
      listSalesPayments(client, input.channel, window.from, window.to),
    ),
  );
  const payments = [
    ...new Map(
      paymentPages.flat().map((payment) => [payment.id, payment]),
    ).values(),
  ];
  const selectedWindow = { from: input.from, to: input.to };
  const selectedPayments = payments.filter((payment) =>
    paymentIsInWindow(payment, selectedWindow),
  );
  const monthlyPayments = payments.filter((payment) =>
    paymentIsInWindow(payment, monthlyWindow),
  );
  const candidatePayments = candidateWindow
    ? payments.filter((payment) => paymentIsInWindow(payment, candidateWindow))
    : [];

  for (const payment of [
    ...selectedPayments,
    ...monthlyPayments,
    ...candidatePayments,
  ]) {
    currentAmountForPayment(payment);
  }

  const settlementDateCache = new Map<string, Promise<string>>();
  const transactionCache = new Map<string, Promise<SalesTransaction>>();
  const getTransaction = (payment: PaymentSalesFields) => {
    let transaction = transactionCache.get(payment.id);

    if (!transaction) {
      transaction = toSalesTransaction(payment, today, settlementDateCache);
      transactionCache.set(payment.id, transaction);
    }

    return transaction;
  };

  const [selectedTransactions, candidateTransactions] = await Promise.all([
    Promise.all(selectedPayments.map(getTransaction)),
    Promise.all(candidatePayments.map(getTransaction)),
  ]);
  const transactions = selectedTransactions.sort(
    (left, right) =>
      right.occurredAt.localeCompare(left.occurredAt) ||
      left.id.localeCompare(right.id),
  );
  const scheduledSettlementAmount = candidateTransactions.reduce(
    (total, transaction) =>
      transaction.settlementDate === today
        ? total + transaction.settlementAmount
        : total,
    0,
  );

  return {
    summary: {
      monthlyPaymentAmount: monthlyPayments.reduce(
        (total, payment) => total + currentAmountForPayment(payment),
        0,
      ),
      monthlyPaymentCount: monthlyPayments.length,
      monthlyVisitorCount: null,
      scheduledSettlementAmount,
      settlementDate: today,
    },
    transactions,
  };
}
