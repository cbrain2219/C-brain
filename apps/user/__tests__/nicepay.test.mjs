import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import process from "node:process";
import test from "node:test";

const modulePath = new URL("../lib/nicepay.ts", import.meta.url);
const checkoutModulePath = new URL(
  "../lib/paymentCheckout.ts",
  import.meta.url,
);

async function importNicepayModule() {
  const source = await readFile(modulePath, "utf8");
  const ts = await import("typescript");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}

async function importPaymentCheckoutModule() {
  const source = await readFile(checkoutModulePath, "utf8");
  const ts = await import("typescript");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}

test("NICEPAY signatures use the documented field order and timing-safe checks", async () => {
  const {
    createNicepaySignature,
    parseNicepayAuthCallback,
    verifyNicepayAuthCallback,
  } = await importNicepayModule();
  const formData = new FormData();
  const signature =
    "ee2c345281e236e84fbe3685d2eebd5e5fcd7f480c3a2f13b2628d0e5ab1be63";

  for (const [key, value] of Object.entries({
    amount: "120000",
    authResultCode: "0000",
    authResultMsg: "인증 성공",
    authToken: "auth-token",
    clientId: "client-key",
    orderId: "LPORDER",
    signature,
    tid: "tid",
  })) {
    formData.set(key, value);
  }

  const callback = parseNicepayAuthCallback(formData);

  assert.equal(
    createNicepaySignature(["token", "client", "1004"], "secret"),
    "9ea1a6011963571e22738c184b982ea32510e86856a717a8bfe5e4d0f158ff2e",
  );
  assert.ok(callback);
  assert.equal(
    verifyNicepayAuthCallback(
      callback,
      { amount: 120000, clientKey: "client-key", orderId: "LPORDER" },
      "secret-key",
    ),
    true,
  );
  assert.equal(
    verifyNicepayAuthCallback(
      callback,
      { amount: 120001, clientKey: "client-key", orderId: "LPORDER" },
      "secret-key",
    ),
    false,
  );
});

test("NICEPAY payment responses reject tampered amount and signature", async () => {
  const { parseNicepayPayment, verifyNicepayPayment } =
    await importNicepayModule();
  const payment = parseNicepayPayment({
    amount: 120000,
    balanceAmt: 120000,
    cancelledAt: "0",
    cancels: [],
    card: { canPartCancel: true },
    ediDate: "2026-07-23T12:00:00.000+0900",
    orderId: "LPORDER",
    paidAt: "2026-07-23T12:00:00.000+0900",
    payMethod: "card",
    receiptUrl: "https://example.com/receipt",
    resultCode: "0000",
    resultMsg: "정상 처리되었습니다.",
    signature:
      "d61081bd25eb2f4841defe5c6e270c52608ae9137b85d5a1fea426ffe8e0c425",
    status: "paid",
    tid: "tid",
  });

  assert.ok(payment);
  assert.equal(payment.balanceAmt, 120000);
  assert.equal(payment.card.canPartCancel, true);
  assert.equal(payment.cancelledAt, null);
  assert.equal(
    verifyNicepayPayment(
      payment,
      { amount: 120000, orderId: "LPORDER", tid: "tid" },
      "secret-key",
    ),
    true,
  );
  assert.equal(
    verifyNicepayPayment(
      payment,
      { amount: 120001, orderId: "LPORDER", tid: "tid" },
      "secret-key",
    ),
    false,
  );
  assert.equal(parseNicepayPayment({ ...payment, signature: "not-hex" }), null);
});

test("NICEPAY payment parser and cancellation request retain refund fields", async () => {
  const {
    cancelNicepayPayment,
    findLatestNicepayCancellation,
    findNicepayCancellation,
    parseNicepayPayment,
  } =
    await importNicepayModule();
  const parsed = parseNicepayPayment({
    amount: "10000",
    balanceAmt: "6000",
    cancelledAt: "2026-08-09T12:00:00.000+0900",
    cancelledTid: "cancel-tid",
    cancels: [
      {
        amount: "4000",
        cancelledAt: "2026-08-09T12:00:00.000+0900",
        reason: "고객 요청",
        receiptUrl: "https://example.com/cancel-receipt",
        tid: "cancel-tid",
      },
    ],
    card: { canPartCancel: true },
    ediDate: "2026-08-09T12:00:00.000+0900",
    orderId: "REFUNDORDER",
    paidAt: "0",
    payMethod: "card",
    receiptUrl: "https://example.com/receipt",
    resultCode: "0000",
    resultMsg: "정상 처리되었습니다.",
    signature: "a".repeat(64),
    status: "partialCancelled",
    tid: "original-tid",
  });

  assert.ok(parsed);
  assert.equal(parsed.balanceAmt, 6000);
  assert.equal(parsed.cancelledTid, "cancel-tid");
  assert.equal(parsed.card.canPartCancel, true);
  assert.equal(parsed.cancels[0].amount, 4000);
  assert.equal(parsed.paidAt, null);
  assert.equal(parsed.cancelledAt, "2026-08-09T12:00:00.000+0900");
  assert.equal(findLatestNicepayCancellation(parsed).tid, "cancel-tid");
  assert.equal(findNicepayCancellation(parsed, 4000).tid, "cancel-tid");

  const retrieved = parseNicepayPayment({
    ...parsed,
    cancelledTid: null,
  });
  assert.equal(findLatestNicepayCancellation(retrieved).tid, "cancel-tid");
  assert.equal(findNicepayCancellation(retrieved, 4000).tid, "cancel-tid");

  const originalFetch = globalThis.fetch;
  const requestBodies = [];
  globalThis.fetch = async (_url, init) => {
    requestBodies.push(JSON.parse(String(init.body)));
    return new Response(
      JSON.stringify({
        amount: 10000,
        balanceAmt: 6000,
        cancels: [],
        ediDate: "2026-08-09T12:00:00.000+0900",
        orderId: "REFUNDORDER",
        resultCode: "0000",
        resultMsg: "정상 처리되었습니다.",
        signature: "a".repeat(64),
        status: "partialCancelled",
        tid: "original-tid",
      }),
      { status: 200 },
    );
  };

  const config = {
    apiBaseUrl: "https://example.com",
    clientKey: "client-key",
    mode: "sandbox",
    secretKey: "secret-key",
    siteUrl: new URL("https://example.com"),
  };

  try {
    await cancelNicepayPayment(config, "original-tid", {
      amount: 110000,
      currentBalance: 110000,
      orderId: "FULLREFUND",
      originalAmount: 110000,
      reason: "고객 요청",
    });
    await cancelNicepayPayment(config, "original-tid", {
      amount: 55555,
      currentBalance: 110000,
      orderId: "PARTIALREFUND-1",
      originalAmount: 110000,
      reason: "고객 요청",
    });
    await cancelNicepayPayment(config, "original-tid", {
      amount: 50000,
      currentBalance: 54445,
      orderId: "PARTIALREFUND-2",
      originalAmount: 110000,
      reason: "고객 요청",
    });
    await cancelNicepayPayment(config, "original-tid", {
      amount: 4445,
      currentBalance: 4445,
      orderId: "PARTIALREFUND-3",
      originalAmount: 110000,
      reason: "고객 요청",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requestBodies[0].cancelAmt, undefined);
  assert.equal(requestBodies[1].cancelAmt, 55555);
  assert.equal(requestBodies[2].cancelAmt, 50000);
  assert.equal(requestBodies[3].cancelAmt, 4445);
  assert.equal(requestBodies[3].orderId, "PARTIALREFUND-3");
});

test("NICEPAY cancellation exposes an explicit rejection without another request", async () => {
  const { cancelNicepayPayment, NicepayRejectedError } =
    await importNicepayModule();
  const originalFetch = globalThis.fetch;
  let requestCount = 0;

  globalThis.fetch = async () => {
    requestCount += 1;
    return new Response(
      JSON.stringify({
        resultCode: "2030",
        resultMsg: "부분취소 불가 거래",
      }),
      { status: 400 },
    );
  };

  try {
    await assert.rejects(
      cancelNicepayPayment(
        {
          apiBaseUrl: "https://example.com",
          clientKey: "client-key",
          mode: "sandbox",
          secretKey: "secret-key",
          siteUrl: new URL("https://example.com"),
        },
        "original-tid",
        {
          amount: 4000,
          currentBalance: 10000,
          orderId: "PARTIALREFUND",
          originalAmount: 10000,
          reason: "고객 요청",
        },
      ),
      (error) =>
        error instanceof NicepayRejectedError &&
        error.resultCode === "2030" &&
        error.resultMessage === "부분취소 불가 거래",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requestCount, 1);
});

test("NICEPAY config is allowlisted and goods names fit the provider byte limit", async () => {
  const { createNicepayAuthorization, getNicepayConfig } =
    await importNicepayModule();
  const { toNicepayGoodsName } = await importPaymentCheckoutModule();
  const previous = {
    clientKey: process.env.NEXT_PUBLIC_NICEPAY_CLIENT_KEY,
    mode: process.env.NICEPAY_MODE,
    secretKey: process.env.NICEPAY_SECRET_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  };

  process.env.NICEPAY_MODE = "sandbox";
  process.env.NEXT_PUBLIC_NICEPAY_CLIENT_KEY = "client-key";
  process.env.NICEPAY_SECRET_KEY = "secret-key";
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";

  try {
    const config = getNicepayConfig();
    const goodsName = toNicepayGoodsName("가".repeat(20));

    assert.equal(config.apiBaseUrl, "https://sandbox-api.nicepay.co.kr");
    assert.equal(
      createNicepayAuthorization(config),
      `Basic ${Buffer.from("client-key:secret-key").toString("base64")}`,
    );
    assert.ok(Buffer.byteLength(goodsName, "utf8") <= 40);
    assert.ok(goodsName.length > 0);
  } finally {
    for (const [name, value] of Object.entries({
      NEXT_PUBLIC_NICEPAY_CLIENT_KEY: previous.clientKey,
      NICEPAY_MODE: previous.mode,
      NICEPAY_SECRET_KEY: previous.secretKey,
      NEXT_PUBLIC_SITE_URL: previous.siteUrl,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("NICEPAY browser checkout requests accept only the canonical return endpoint", async () => {
  const { isNicepayCheckoutRequest, parseNicepayCheckoutRequest } =
    await importPaymentCheckoutModule();
  const valid = {
    amount: 120000,
    clientId: "client-key",
    goodsName: "브로슈어 제작",
    method: "card",
    orderId: "CBORDER",
    returnUrl: "https://cbrain.kr/api/payments/nicepay/return",
  };

  assert.deepEqual(parseNicepayCheckoutRequest(valid), valid);
  assert.equal(isNicepayCheckoutRequest(valid), true);
  assert.equal(
    parseNicepayCheckoutRequest({
      ...valid,
      returnUrl: "http://cbrain.kr/api/payments/nicepay/return",
    }),
    null,
  );
  assert.equal(
    parseNicepayCheckoutRequest({
      ...valid,
      returnUrl: "http://localhost:3000/api/payments/nicepay/return",
    }).method,
    "card",
  );
  assert.equal(parseNicepayCheckoutRequest({ ...valid, amount: 0 }), null);
  assert.equal(parseNicepayCheckoutRequest({ ...valid, method: "bank" }), null);
  assert.equal(parseNicepayCheckoutRequest({ ...valid, goodsName: " " }), null);
  assert.equal(
    parseNicepayCheckoutRequest({
      ...valid,
      returnUrl: "https://cbrain.kr/api/payments/nicepay/return/other",
    }),
    null,
  );
});

test("a failed dynamically loaded NICEPAY SDK script is removed before retrying", async () => {
  const { requestNicepayPayment } = await importPaymentCheckoutModule();
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  let createdScriptCount = 0;
  let failedScriptRemoved = false;
  let currentScript = null;
  let requestPayCount = 0;

  const createScript = () => {
    const listeners = new Map();
    const script = {
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      async: false,
      dataset: {},
      remove() {
        failedScriptRemoved = true;
        currentScript = null;
      },
      src: "",
      trigger(type) {
        listeners.get(type)?.();
      },
    };

    return script;
  };

  globalThis.window = {};
  globalThis.document = {
    createElement() {
      createdScriptCount += 1;
      currentScript = createScript();
      return currentScript;
    },
    head: {
      append(script) {
        if (createdScriptCount === 1) {
          script.trigger("error");
          return;
        }

        globalThis.window.AUTHNICE = {
          requestPay() {
            requestPayCount += 1;
          },
        };
        script.trigger("load");
      },
    },
    querySelector() {
      return currentScript;
    },
  };

  const request = {
    amount: 120000,
    clientId: "client-key",
    goodsName: "브로슈어 제작",
    method: "card",
    orderId: "CBORDER",
    returnUrl: "https://cbrain.kr/api/payments/nicepay/return",
  };

  try {
    await assert.rejects(
      requestNicepayPayment(request, () => {}),
      /could not be loaded/,
    );
    await requestNicepayPayment(request, () => {});
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }

  assert.equal(failedScriptRemoved, true);
  assert.equal(createdScriptCount, 2);
  assert.equal(requestPayCount, 1);
});
