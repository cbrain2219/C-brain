import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import test from "node:test";

const checkoutRoutePath = new URL(
  "../app/api/orders/checkout/route.ts",
  import.meta.url,
);
const paymentPath = new URL("../app/(site)/order/payment.ts", import.meta.url);
const orderPagePath = new URL(
  "../app/(site)/order/OrderPageContent.tsx",
  import.meta.url,
);
const orderPageClientPath = new URL(
  "../app/(site)/order/OrderPageClient.tsx",
  import.meta.url,
);
const flowSectionPath = new URL(
  "../app/(site)/order/OrderFlowSection.tsx",
  import.meta.url,
);
const customerInfoPath = new URL(
  "../app/(site)/order/OrderCustomerInfoStep.tsx",
  import.meta.url,
);

async function importPaymentModule() {
  const source = (await readFile(paymentPath, "utf8")).replace(
    /import \{\n {2}parseNicepayCheckoutRequest,\n {2}type NicepayCheckoutRequest,\n\} from "\.\.\/\.\.\/\.\.\/lib\/paymentCheckout";/,
    "const parseNicepayCheckoutRequest = (value) => value;",
  );
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

test("site checkout recalculates catalog pricing and keeps provider fields server-owned", async () => {
  const [routeSource, paymentSource] = await Promise.all([
    readFile(checkoutRoutePath, "utf8"),
    readFile(paymentPath, "utf8"),
  ]);

  assert.match(routeSource, /getPublishedProduct/);
  assert.match(routeSource, /createOrderProductCatalogItem/);
  assert.match(routeSource, /calculateProductSelection/);
  assert.match(
    routeSource,
    /calculation\.totalPrice !== selection\.quotedTotal/,
  );
  assert.match(routeSource, /const amount = calculation\.totalPrice/);
  assert.match(routeSource, /createSiteCheckout/);
  assert.match(routeSource, /createNicepayCheckoutRequest/);
  assert.match(routeSource, /status: 503/);
  assert.ok(
    routeSource.indexOf("config = getNicepayConfig()") <
      routeSource.indexOf("createSiteCheckout(client"),
    "NICEPAY configuration must be checked before creating a checkout",
  );
  assert.doesNotMatch(routeSource, /payload\.amount/);
  assert.doesNotMatch(routeSource, /payload\.totalPrice/);
  assert.match(paymentSource, /fetch\("\/api\/orders\/checkout"/);
  assert.match(paymentSource, /checkoutRequestId/);
  assert.match(paymentSource, /selection:/);
  assert.doesNotMatch(paymentSource, /totalPrice/);
});

test("site checkout reuses one browser request id and delegates NICEPAY loading", async () => {
  const [pageSource, pageClientSource, flowSectionSource, customerInfoSource] = await Promise.all(
    [
      readFile(orderPagePath, "utf8"),
      readFile(orderPageClientPath, "utf8"),
      readFile(flowSectionPath, "utf8"),
      readFile(customerInfoPath, "utf8"),
    ],
  );

  assert.match(pageSource, /getPublishedOrderProducts/);
  assert.match(pageSource, /<OrderPageClient/);
  assert.match(pageClientSource, /paymentSubmissionInFlightRef/);
  assert.match(
    pageClientSource,
    /if \(paymentSubmissionInFlightRef\.current\) return/,
  );
  assert.match(pageClientSource, /setIsPaymentSubmitting\(true\)/);
  assert.match(pageClientSource, /releasePaymentSubmission/);
  assert.match(pageClientSource, /crypto\.randomUUID/);
  assert.match(pageClientSource, /checkoutRequest\?\.payloadKey === payloadKey/);
  assert.match(pageClientSource, /isPaymentSubmitting=\{isPaymentSubmitting\}/);
  assert.match(pageClientSource, /requestNicepayPayment/);
  assert.doesNotMatch(pageClientSource, /pay\.nicepay\.co\.kr\/v1\/js/);
  assert.doesNotMatch(pageClientSource, /AUTHNICE\.requestPay/);
  assert.match(flowSectionSource, /isPaymentSubmitting: boolean/);
  assert.match(
    flowSectionSource,
    /isPaymentSubmitting=\{isPaymentSubmitting\}/,
  );
  assert.match(customerInfoSource, /aria-busy=\{isPaymentSubmitting\}/);
  assert.match(customerInfoSource, /disabled=\{isPaymentSubmitting\}/);
});

test("site checkout request IDs are reused only for identical checkout payloads", async () => {
  const { getOrderCheckoutPayloadKey } = await importPaymentModule();
  const payload = {
    agreements: { privacyCollection: true, privacyPolicy: true },
    customer: {
      customerCompany: "씨브레인",
      customerEmail: "contact@example.com",
      customerName: "홍길동",
      customerPhone: "010-1234-5678",
    },
    summary: {
      ids: {
        hasPlanning: false,
        optionValues: { pageCount: "8", paper: "스노우지" },
        productId: "11111111-1111-4111-8111-111111111111",
        quantity: 500,
        quotedTotal: 520000,
        serviceId: "brochure-catalog",
        variant: "브로슈어 · 카탈로그",
      },
    },
  };
  const originalKey = getOrderCheckoutPayloadKey(payload);

  assert.equal(originalKey, getOrderCheckoutPayloadKey({ ...payload }));
  assert.notEqual(
    originalKey,
    getOrderCheckoutPayloadKey({
      ...payload,
      customer: { ...payload.customer, customerEmail: "new@example.com" },
    }),
  );
  assert.notEqual(
    originalKey,
    getOrderCheckoutPayloadKey({
      ...payload,
      agreements: { ...payload.agreements, privacyPolicy: false },
    }),
  );
  assert.notEqual(
    originalKey,
    getOrderCheckoutPayloadKey({
      ...payload,
      summary: {
        ...payload.summary,
        ids: { ...payload.summary.ids, quantity: 1000 },
      },
    }),
  );
});
