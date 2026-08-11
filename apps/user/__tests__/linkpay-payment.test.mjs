import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const orderRoutePath = new URL(
  "../app/api/linkpay/[publicToken]/order/route.ts",
  import.meta.url,
);
test("LinkPay checkout creates an independent server-side payment", async () => {
  const orderRoute = await readFile(orderRoutePath, "utf8");

  assert.match(orderRoute, /createLinkPayCheckout/);
  assert.match(orderRoute, /createNicepayCheckoutRequest/);
  assert.match(orderRoute, /checkoutRequestId/);
  assert.match(orderRoute, /let requestBody: unknown/);
  assert.match(orderRoute, /requestBody = await request\.json\(\)/);
  assert.match(orderRoute, /status: 400/);
  assert.match(orderRoute, /privacyCollection !== true/);
  assert.match(orderRoute, /disabled_at !== null/);
  assert.match(orderRoute, /status: 503/);
  assert.ok(
    orderRoute.indexOf("config = getNicepayConfig()") <
      orderRoute.indexOf("createLinkPayCheckout(client"),
    "NICEPAY configuration must be checked before creating a checkout",
  );
  assert.doesNotMatch(orderRoute, /link\.status === "paid"/);
  assert.doesNotMatch(orderRoute, /getOrCreatePaymentOrder/);
});
