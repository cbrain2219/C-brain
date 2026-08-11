import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const reconcileRoutePath = new URL(
  "../app/api/admin/payments/[paymentId]/reconcile/route.ts",
  import.meta.url,
);

test("manual reconciliation accepts NICEPAY's original order ID only for one matching refund", async () => {
  const route = await readFile(reconcileRoutePath, "utf8");

  assert.match(
    route,
    /const usesOriginalOrderId = provider\.orderId === payment\.providerOrderId/,
  );
  assert.match(
    route,
    /refund\.amount === balanceReduction &&\s*\(usesOriginalOrderId \|\|\s*refund\.providerRefundOrderId === provider\.orderId\)/,
  );
  assert.match(
    route,
    /const reservation = reservations\.length === 1 \? reservations\[0\] : null/,
  );
  assert.match(
    route,
    /usesOriginalOrderId\s*\? payment\.providerOrderId\s*:\s*reservation\?\.providerRefundOrderId/,
  );
  assert.match(
    route,
    /!expectedCancellationOrderId\s*\|\|\s*!isAuthenticProviderPayment\([\s\S]*expectedCancellationOrderId/,
  );
  assert.match(
    route,
    /!reservation\s*\|\|\s*\(!usesOriginalOrderId &&\s*reservation\.providerRefundOrderId !== provider\.orderId\)/,
  );
  assert.match(
    route,
    /provider\.status === "paid"[\s\S]*?isAuthenticProviderPayment\(provider, payment, config\.secretKey\)/,
  );
});
