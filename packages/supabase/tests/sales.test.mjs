import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

const loader = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".js") && context.parentURL?.includes("/packages/supabase/src/")) {
    return nextResolve(specifier.slice(0, -3) + ".ts", context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts")) {
    const { readFile } = await import("node:fs/promises");
    const { stripTypeScriptTypes } = await import("node:module");
    return {
      format: "module",
      shortCircuit: true,
      source: stripTypeScriptTypes(await readFile(new URL(url), "utf8"), { mode: "transform" }),
    };
  }
  return nextLoad(url, context);
}`;

register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url);

const {
  calculateEstimatedSettlement,
  getAdminSalesDashboard,
  getExpectedSettlementDate,
  normalizeProduct,
} = await import("../src/sales.ts");

const KST_AUGUST_RANGE = {
  from: "2026-08-09T15:00:00.000Z",
  to: "2026-08-19T15:00:00.000Z",
  today: "2026-08-18",
};

function payment(overrides = {}) {
  const { orders: orderOverrides, ...paymentOverrides } = overrides;

  return {
    amount: 10_000,
    balance_amount: 10_000,
    can_part_cancel: true,
    created_at: "2026-08-10T03:00:00.000Z",
    id: "payment-1",
    paid_at: "2026-08-10T03:00:00.000Z",
    receipt_url: "https://pay.example/receipt/1",
    status: "paid",
    ...paymentOverrides,
    orders: {
      channel: "site",
      customer_label: "홍길동",
      item_snapshot: {
        service: { id: "brochure", label: "브로슈어" },
      },
      order_name: "브로슈어 제작",
      ...orderOverrides,
    },
  };
}

function createSalesClient(rows, { onPage } = {}) {
  const calls = [];

  return {
    calls,
    client: {
      auth: {
        async getUser() {
          return {
            data: { user: { app_metadata: { role: "admin" } } },
            error: null,
          };
        },
      },
      from(table) {
        assert.equal(table, "payments");

        const state = { channel: null, cursor: null, from: null, to: null };
        const query = {
          eq(column, value) {
            if (column === "orders.channel") state.channel = value;
            return query;
          },
          gte(_column, value) {
            state.from = value;
            return query;
          },
          in() {
            return query;
          },
          lt(_column, value) {
            state.to = value;
            return query;
          },
          limit(count) {
            calls.push({ ...state, count });
            const matchingRows = rows
              .filter(
                (row) =>
                  Date.parse(row.paid_at) >= Date.parse(state.from) &&
                  Date.parse(row.paid_at) < Date.parse(state.to),
              )
              .filter(
                (row) =>
                  state.channel === null || row.orders.channel === state.channel,
              )
              .filter(
                (row) =>
                  state.cursor === null ||
                  Date.parse(row.paid_at) > Date.parse(state.cursor.paidAt) ||
                  (Date.parse(row.paid_at) ===
                    Date.parse(state.cursor.paidAt) &&
                    row.id > state.cursor.id),
              )
              .sort(
                (left, right) =>
                  Date.parse(left.paid_at) - Date.parse(right.paid_at) ||
                  left.id.localeCompare(right.id),
              );
            const data = matchingRows.slice(0, count);

            onPage?.({ data, rows, state: { ...state } });

            return Promise.resolve({ data, error: null });
          },
          or(filters) {
            const cursor =
              /^paid_at\.gt\.(.*),and\(paid_at\.eq\.(.*),id\.gt\.(.*)\)$/.exec(
                filters,
              );

            assert.ok(cursor);
            assert.equal(cursor[1], cursor[2]);
            state.cursor = { id: cursor[3], paidAt: cursor[1] };
            return query;
          },
          order() {
            return query;
          },
          select() {
            return query;
          },
        };

        return query;
      },
    },
  };
}

async function loadDashboard(rows, options = {}) {
  const { calls, client } = createSalesClient(rows, options);
  const dashboard = await getAdminSalesDashboard(client, {
    channel: "all",
    ...KST_AUGUST_RANGE,
    ...options.input,
  });

  return { calls, dashboard };
}

test("estimated settlement applies the card fee and VAT with integer won rounding", () => {
  assert.deepEqual(calculateEstimatedSettlement(10_000), {
    cardFee: 319,
    settlementAmount: 9_681,
  });
  assert.deepEqual(calculateEstimatedSettlement(7_000), {
    cardFee: 223,
    settlementAmount: 6_777,
  });
  assert.deepEqual(calculateEstimatedSettlement(5_000), {
    cardFee: 160,
    settlementAmount: 4_840,
  });
  assert.deepEqual(calculateEstimatedSettlement(0), {
    cardFee: 0,
    settlementAmount: 0,
  });
});

test("expected settlement skips Korea's 2026 Liberation Day substitute holiday", async () => {
  assert.equal(
    await getExpectedSettlementDate("2026-08-10T03:00:00.000Z"),
    "2026-08-18",
  );
});

test("settlement dates use KST dates, cross the year boundary, and skip weekend payments", async () => {
  assert.equal(
    await getExpectedSettlementDate("2026-08-09T15:30:00.000Z"),
    "2026-08-18",
  );
  assert.equal(
    await getExpectedSettlementDate("2026-12-30T03:00:00.000Z"),
    "2027-01-07",
  );
  assert.equal(
    await getExpectedSettlementDate("2026-08-08T03:00:00.000Z"),
    "2026-08-14",
  );
});

test("normalizes site services and LinkPay categories while safely falling back", () => {
  assert.deepEqual(
    normalizeProduct(
      "site",
      { service: { id: " brochure ", label: " 브로슈어 " } },
      "payment-1",
      "주문명",
    ),
    { productId: "brochure", productLabel: "브로슈어" },
  );
  assert.deepEqual(
    normalizeProduct(
      "linkpay",
      { category: "  컨설팅  " },
      "payment-2",
      "주문명",
    ),
    { productId: "linkpay:컨설팅", productLabel: "컨설팅" },
  );
  assert.deepEqual(
    normalizeProduct("site", null, "payment-3", "안전한 주문명"),
    { productId: "unknown:payment-3", productLabel: "안전한 주문명" },
  );
  assert.deepEqual(
    normalizeProduct(
      "site",
      { service: { id: " ", label: "브로슈어" } },
      "payment-4",
      "안전한 주문명",
    ),
    { productId: "unknown:payment-4", productLabel: "안전한 주문명" },
  );
});

test("consolidates verified payments with current refund projections", async () => {
  const { dashboard } = await loadDashboard([
    payment({ id: "paid", can_part_cancel: null }),
    payment({
      id: "partial",
      balance_amount: 7_000,
      status: "partial_cancelled",
    }),
    payment({
      id: "full",
      balance_amount: 0,
      receipt_url: "https://pay.example/receipt/full",
      status: "cancelled",
    }),
  ]);

  assert.deepEqual(
    dashboard.transactions.map((transaction) => ({
      cardFee: transaction.cardFee,
      canPartCancel: transaction.canPartCancel,
      id: transaction.id,
      receiptUrl: transaction.receiptUrl,
      refundableAmount: transaction.refundableAmount,
      settlementAmount: transaction.settlementAmount,
      status: transaction.status,
      transactionAmount: transaction.transactionAmount,
    })),
    [
      {
        cardFee: 0,
        canPartCancel: true,
        id: "full",
        receiptUrl: null,
        refundableAmount: 0,
        settlementAmount: 0,
        status: "refund-complete",
        transactionAmount: 10_000,
      },
      {
        cardFee: 319,
        canPartCancel: null,
        id: "paid",
        receiptUrl: "https://pay.example/receipt/1",
        refundableAmount: 10_000,
        settlementAmount: 9_681,
        status: "scheduled",
        transactionAmount: 10_000,
      },
      {
        cardFee: 223,
        canPartCancel: true,
        id: "partial",
        receiptUrl: "https://pay.example/receipt/1",
        refundableAmount: 7_000,
        settlementAmount: 6_777,
        status: "partial-refund",
        transactionAmount: 10_000,
      },
    ],
  );
});

test("returns table transactions newest first with stable ID ordering for ties", async () => {
  const { dashboard } = await loadDashboard([
    payment({ id: "same-day-b" }),
    payment({ id: "same-day-a" }),
    payment({
      id: "newest",
      paid_at: "2026-08-11T03:00:00.000Z",
    }),
  ]);

  assert.deepEqual(
    dashboard.transactions.map(({ id }) => id),
    ["newest", "same-day-a", "same-day-b"],
  );
});

test("uses the provider balance when payment status updates lag behind", async () => {
  const { dashboard } = await loadDashboard([
    payment({ balance_amount: 0, id: "zero-balance" }),
    payment({ balance_amount: 7_000, id: "reduced-balance" }),
  ]);

  assert.deepEqual(
    dashboard.transactions.map(
      ({ cardFee, id, settlementAmount, status }) => ({
        cardFee,
        id,
        settlementAmount,
        status,
      }),
    ),
    [
      {
        cardFee: 223,
        id: "reduced-balance",
        settlementAmount: 6_777,
        status: "partial-refund",
      },
      {
        cardFee: 0,
        id: "zero-balance",
        settlementAmount: 0,
        status: "refund-complete",
      },
    ],
  );
});

test("fails rather than inventing a partially refunded payment balance", async () => {
  await assert.rejects(
    loadDashboard([
      payment({
        balance_amount: null,
        id: "missing-balance",
        status: "partial_cancelled",
      }),
    ]),
    /partially refunded but has no finite balance amount/,
  );
});

test("validates malformed partial refunds that appear only in the monthly summary window", async () => {
  await assert.rejects(
    loadDashboard([
      payment({
        balance_amount: null,
        id: "monthly-missing-balance",
        paid_at: "2026-08-02T03:00:00.000Z",
        status: "partial_cancelled",
      }),
    ]),
    /partially refunded but has no finite balance amount/,
  );
});

test("monthly summary deducts current-month partial and full refunds", async () => {
  const { dashboard } = await loadDashboard([
    payment({ id: "paid", amount: 10_000 }),
    payment({
      amount: 7_000,
      balance_amount: 4_000,
      id: "partial",
      status: "partial_cancelled",
    }),
    payment({
      amount: 5_000,
      balance_amount: 0,
      id: "full",
      status: "cancelled",
    }),
    payment({
      amount: 99_000,
      id: "july",
      paid_at: "2026-07-31T14:00:00.000Z",
    }),
  ]);

  assert.deepEqual(dashboard.summary, {
    monthlyPaymentAmount: 14_000,
    monthlyPaymentCount: 3,
    monthlyVisitorCount: null,
    scheduledSettlementAmount: 13_553,
    settlementDate: "2026-08-18",
  });
});

test("applies the selected channel to transactions and every summary window", async () => {
  const { dashboard } = await loadDashboard(
    [
      payment({ id: "site-payment" }),
      payment({
        amount: 20_000,
        balance_amount: 20_000,
        id: "linkpay-payment",
        orders: {
          channel: "linkpay",
          item_snapshot: { category: "컨설팅" },
        },
      }),
    ],
    { input: { channel: "site" } },
  );

  assert.deepEqual(
    dashboard.transactions.map(({ id }) => id),
    ["site-payment"],
  );
  assert.deepEqual(dashboard.summary, {
    monthlyPaymentAmount: 10_000,
    monthlyPaymentCount: 1,
    monthlyVisitorCount: null,
    scheduledSettlementAmount: 9_681,
    settlementDate: "2026-08-18",
  });
});

test("keeps a historical table range independent from current-month summaries", async () => {
  const { calls, dashboard } = await loadDashboard(
    [
      payment({
        amount: 5_000,
        balance_amount: 5_000,
        id: "historical",
        paid_at: "2026-07-02T03:00:00.000Z",
      }),
      payment({ id: "settles-today" }),
      payment({
        amount: 20_000,
        balance_amount: 20_000,
        id: "settles-tomorrow",
        paid_at: "2026-08-11T03:00:00.000Z",
      }),
    ],
    {
      input: {
        from: "2026-07-01T15:00:00.000Z",
        to: "2026-07-03T15:00:00.000Z",
      },
    },
  );

  assert.deepEqual(
    dashboard.transactions.map(({ id }) => id),
    ["historical"],
  );
  assert.equal(dashboard.summary.monthlyPaymentAmount, 30_000);
  assert.equal(dashboard.summary.monthlyPaymentCount, 2);
  assert.equal(dashboard.summary.scheduledSettlementAmount, 9_681);
  assert.equal(calls.length, 2);
});

test("paginates stable payment queries beyond the configured page size", async () => {
  const rows = Array.from({ length: 101 }, (_, index) =>
    payment({ id: `payment-${String(index).padStart(3, "0")}` }),
  );
  let inserted = false;
  const { calls, dashboard } = await loadDashboard(rows, {
    onPage({ data, rows: mutableRows, state }) {
      if (!inserted && state.cursor === null && data.length === 100) {
        inserted = true;
        mutableRows.push(payment({ id: "payment-050a" }));
      }
    },
  });

  assert.equal(dashboard.transactions.length, 101);
  assert.equal(new Set(dashboard.transactions.map(({ id }) => id)).size, 101);
  assert.ok(!dashboard.transactions.some(({ id }) => id === "payment-050a"));
  assert.equal(dashboard.summary.monthlyPaymentCount, 101);
  assert.equal(dashboard.summary.monthlyPaymentAmount, 1_010_000);
  assert.equal(calls.filter((call) => call.cursor !== null).length, 1);
});

test("today's batch includes only payments whose exact settlement date is today", async () => {
  const { dashboard } = await loadDashboard([
    payment({ id: "settles-today" }),
    payment({
      id: "settles-tomorrow",
      paid_at: "2026-08-11T03:00:00.000Z",
    }),
  ]);

  assert.equal(dashboard.summary.scheduledSettlementAmount, 9_681);
});

test("window membership compares PostgREST timestamp offsets as instants", async () => {
  const { dashboard } = await loadDashboard([
    payment({
      id: "inclusive-start",
      paid_at: "2026-08-09T15:00:00+00:00",
    }),
    payment({
      id: "exclusive-end",
      paid_at: "2026-08-19T15:00:00+00:00",
    }),
  ]);

  assert.deepEqual(
    dashboard.transactions.map(({ id }) => id),
    ["inclusive-start"],
  );
  assert.equal(dashboard.summary.scheduledSettlementAmount, 9_681);
});

test("a non-business today has no settlement candidate query", async () => {
  const { calls, dashboard } = await loadDashboard([], {
    input: { today: "2026-08-17" },
  });

  assert.equal(dashboard.summary.scheduledSettlementAmount, 0);
  assert.equal(calls.length, 1);
});
