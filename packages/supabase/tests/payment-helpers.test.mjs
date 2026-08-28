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
  createLinkPayCheckout,
  createSiteCheckout,
  finishPayment,
  getPaymentByNicepayTid,
  getOrderResultByPublicToken,
} = await import("../src/payments.ts");
const { finishRefund, reserveRefund } = await import("../src/refunds.ts");

function fakeRpcClient(rows) {
  const calls = [];
  return {
    calls,
    client: {
      rpc(name, args) {
        calls.push({ args, name });
        return {
          single: async () => ({ data: rows[name], error: null }),
        };
      },
    },
  };
}

function fakePaymentLookupClient(payment) {
  const calls = [];
  const chain = {
    eq(column, value) {
      calls.push({ column, method: "eq", value });
      return chain;
    },
    maybeSingle: async () => ({ data: payment, error: null }),
    select(columns) {
      calls.push({ columns, method: "select" });
      return chain;
    },
  };

  return {
    calls,
    client: { from: () => chain },
  };
}

const customer = {
  company: null,
  email: "buyer@example.com",
  name: "구매자",
  phone: "01012345678",
};
const agreements = { privacyCollection: true, privacyPolicy: true };
const checkoutRequestId = "a0db2cc8-155c-4e48-bd8c-94933ea031ab";

test("checkout wrappers use the request UUID as a stable provider order ID", async () => {
  const { calls, client } = fakeRpcClient({
    create_linkpay_checkout: {
      amount: 12000,
      order_id: "link-order",
      order_name: "링크 결제",
      order_public_token: "link-public-order",
      payment_id: "link-payment",
      provider_order_id: "CBa0db2cc8155c4e48bd8c94933ea031ab",
    },
    create_site_checkout: {
      amount: 20000,
      order_id: "site-order",
      order_name: "사이트 결제",
      order_public_token: "site-public-order",
      payment_id: "site-payment",
      provider_order_id: "CBa0db2cc8155c4e48bd8c94933ea031ab",
    },
  });

  await createSiteCheckout(client, {
    agreements,
    amount: 20000,
    checkoutRequestId,
    customer,
    customerLabel: "구매자",
    itemSnapshot: { channel: "site" },
    orderName: "사이트 결제",
    privacyAgreedAt: "2026-08-09T00:00:00.000Z",
  });
  await createLinkPayCheckout(client, {
    agreements,
    checkoutRequestId,
    customer,
    customerLabel: "구매자",
    privacyAgreedAt: "2026-08-09T00:00:00.000Z",
    publicToken: "a84fd7cc-7d61-42f3-89bd-39d607bb9de2",
  });

  assert.deepEqual(calls.map(({ name }) => name), [
    "create_site_checkout",
    "create_linkpay_checkout",
  ]);
  assert.equal(
    calls[0].args.p_provider_order_id,
    "CBa0db2cc8155c4e48bd8c94933ea031ab",
  );
  assert.equal(calls[0].args.p_provider_order_id, calls[1].args.p_provider_order_id);
  assert.equal(calls[1].args.p_public_token, "a84fd7cc-7d61-42f3-89bd-39d607bb9de2");
});

test("payment and refund wrappers call the five ledger RPCs with normalized results", async () => {
  const { calls, client } = fakeRpcClient({
    finish_payment: {
      amount: 20000,
      balance_amount: 20000,
      can_part_cancel: true,
      cancelled_at: null,
      created_at: "2026-08-09T00:00:00.000Z",
      id: "payment-id",
      nicepay_tid: "tid",
      order_id: "order-id",
      paid_at: "2026-08-09T00:00:00.000Z",
      pay_method: "card",
      provider_order_id: "CBorder",
      receipt_url: null,
      result_code: "0000",
      result_message: "ok",
      status: "paid",
      updated_at: "2026-08-09T00:00:00.000Z",
    },
    finish_refund: {
      payment_status: "partial_cancelled",
      refundable_amount: 16000,
      refunded_amount: 4000,
      status: "succeeded",
    },
    reserve_refund: {
      amount: 4000,
      can_part_cancel: true,
      nicepay_tid: "tid",
      payment_amount: 20000,
      payment_balance_amount: 20000,
      payment_id: "payment-id",
      provider_order_id: "CBorder",
      refund_id: "refund-id",
      refund_status: "requested",
      should_execute: true,
    },
  });

  const payment = await finishPayment(client, {
    amount: 20000,
    balanceAmount: 20000,
    canPartCancel: true,
    cancelledAt: null,
    nicepayTid: "tid",
    paidAt: "2026-08-09T00:00:00.000Z",
    payMethod: "card",
    providerOrderId: "CBorder",
    receiptUrl: null,
    resultCode: "0000",
    resultMessage: "ok",
    status: "paid",
  });
  const reserved = await reserveRefund(client, {
    amount: 4000,
    paymentId: "payment-id",
    providerRefundOrderId: "CBrefund",
    reason: "customer request",
    requestId: "7f8d8e00-4d52-4b84-8e9d-0baaf1e46342",
    requestedBy: "admin-id",
  });
  const finished = await finishRefund(client, {
    balanceAmount: 16000,
    nicepayCancelledTid: "cancelled-tid",
    receiptUrl: null,
    refundedAt: "2026-08-09T00:00:00.000Z",
    requestId: "7f8d8e00-4d52-4b84-8e9d-0baaf1e46342",
    resultCode: "2001",
    resultMessage: "cancelled",
    status: "succeeded",
  });

  assert.equal(payment.providerOrderId, "CBorder");
  assert.equal(reserved.payment.balanceAmount, 20000);
  assert.equal(reserved.shouldExecute, true);
  assert.deepEqual(finished, {
    paymentStatus: "partial_cancelled",
    refundableAmount: 16000,
    refundedAmount: 4000,
    status: "succeeded",
  });
  assert.deepEqual(calls.map(({ name }) => name), [
    "finish_payment",
    "reserve_refund",
    "finish_refund",
  ]);
});

test("existing refund reservations do not claim another provider call", async () => {
  const { client } = fakeRpcClient({
    reserve_refund: {
      amount: 4000,
      can_part_cancel: true,
      nicepay_tid: "tid",
      payment_amount: 20000,
      payment_balance_amount: 20000,
      payment_id: "payment-id",
      provider_order_id: "CBorder",
      refund_id: "refund-id",
      refund_status: "requested",
      should_execute: false,
    },
  });

  const reserved = await reserveRefund(client, {
    amount: 4000,
    paymentId: "payment-id",
    providerRefundOrderId: "CBrefund",
    reason: "customer request",
    requestId: "7f8d8e00-4d52-4b84-8e9d-0baaf1e46342",
    requestedBy: "admin-id",
  });

  assert.equal(reserved.shouldExecute, false);
});

test("NICEPAY TID lookup resolves the original payment and its order", async () => {
  const { calls, client } = fakePaymentLookupClient({
    amount: 20000,
    balance_amount: 16000,
    can_part_cancel: true,
    cancelled_at: null,
    created_at: "2026-08-09T00:00:00.000Z",
    id: "payment-id",
    nicepay_tid: "original-tid",
    order_id: "order-id",
    orders: {
      amount: 20000,
      channel: "linkpay",
      id: "order-id",
      order_name: "링크 결제",
      order_number: "58310427",
      public_token: "order-public-token",
      status: "partially_refunded",
    },
    paid_at: "2026-08-09T00:00:00.000Z",
    pay_method: "card",
    provider_order_id: "CB-original-order",
    receipt_url: null,
    result_code: "0000",
    result_message: "ok",
    status: "partial_cancelled",
    updated_at: "2026-08-09T00:00:00.000Z",
  });

  const payment = await getPaymentByNicepayTid(client, "original-tid");

  assert.equal(payment?.id, "payment-id");
  assert.equal(payment?.order.orderNumber, "58310427");
  assert.equal(payment?.order.publicToken, "order-public-token");
  assert.match(
    calls.find((call) => call.method === "select").columns,
    /\border_number\b/,
  );
  assert.deepEqual(calls.find((call) => call.method === "eq"), {
    column: "nicepay_tid",
    method: "eq",
    value: "original-tid",
  });
});

test("order results use the successful payment method rather than an earlier failed attempt", async () => {
  const { client } = fakePaymentLookupClient({
    amount: 20000,
    buyer_company: "고객사",
    channel: "site",
    item_snapshot: {
      channel: "site",
      options: [{ key: "size", label: "사이즈", value: "A4" }],
      planning: { amount: 10000, included: true, label: "기획" },
      product: { id: "brochure", label: "브로슈어" },
      quantity: { label: "500부", value: 500 },
      service: { id: "brochure", label: "브로슈어" },
      variant: { id: "16p", label: "16p" },
    },
    order_name: "사이트 결제",
    payments: [
      { pay_method: null, status: "failed" },
      { pay_method: "card", status: "paid" },
    ],
    status: "paid",
  });

  const result = await getOrderResultByPublicToken(client, "order-public-token");

  assert.equal(result?.paymentMethod, "card");
  assert.deepEqual(result?.itemSummary, {
    categoryLabel: "브로슈어",
    companyName: "고객사",
    optionRows: [
      { label: "상품 종류", value: "16p" },
      { label: "사이즈", value: "A4" },
      { label: "수량", value: "500부" },
    ],
    serviceLabel: "디자인 + 인쇄 + 기획",
  });
});

test("linkpay order results expose only display-safe payment details", async () => {
  const { client } = fakePaymentLookupClient({
    amount: 50000,
    channel: "linkpay",
    item_snapshot: {
      amount: 50000,
      category: "브로슈어",
      channel: "linkpay",
      clientName: "노코더스",
      pageQuantity: "16p / 500부",
      paper: "일반지",
      paymentLinkId: "private-link-id",
      paymentName: "노코더스 브로슈어 결제",
      service: "디자인 + 인쇄 + 기획",
    },
    order_name: "노코더스 브로슈어 결제",
    payments: [{ pay_method: "card", status: "paid" }],
    status: "paid",
  });

  const result = await getOrderResultByPublicToken(client, "order-public-token");

  assert.deepEqual(result?.itemSummary, {
    categoryLabel: null,
    companyName: "노코더스",
    optionRows: [
      { label: "용지", value: "일반지" },
      { label: "페이지 수", value: "16p" },
      { label: "수량", value: "500부" },
    ],
    serviceLabel: "디자인 + 인쇄 + 기획",
  });
  assert.doesNotMatch(
    JSON.stringify(result?.itemSummary),
    /private-link-id/,
  );
});
