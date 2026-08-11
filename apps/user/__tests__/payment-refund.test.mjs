import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authPath = new URL("../lib/adminPaymentAuth.ts", import.meta.url);
const refundRoutePath = new URL(
  "../app/api/admin/payments/[paymentId]/refund/route.ts",
  import.meta.url,
);
const reconcileRoutePath = new URL(
  "../app/api/admin/payments/[paymentId]/reconcile/route.ts",
  import.meta.url,
);
const webhookRoutePath = new URL(
  "../app/api/payments/nicepay/webhook/route.ts",
  import.meta.url,
);

test("admin payment routes authenticate the admin origin before service-role work", async () => {
  const auth = await readFile(authPath, "utf8");

  assert.match(auth, /origin !== adminOrigin/);
  assert.match(auth, /\^Bearer \(\[\^\\s,\]\+\)\$/);
  assert.match(auth, /publishableClient\.auth\.getUser\(token\)/);
  assert.match(auth, /user\.app_metadata\.role !== "admin"/);
  assert.ok(
    auth.indexOf("auth.getUser(token)") <
      auth.indexOf("createAdminSupabaseClient()"),
  );
  assert.match(auth, /Access-Control-Allow-Methods": "OPTIONS, POST"/);
  assert.match(
    auth,
    /Access-Control-Allow-Headers": "Authorization, Content-Type"/,
  );
});

test("refund, reconciliation, and webhook preserve ledger reservations", async () => {
  const [refundRoute, reconcileRoute, webhookRoute] = await Promise.all([
    readFile(refundRoutePath, "utf8"),
    readFile(reconcileRoutePath, "utf8"),
    readFile(webhookRoutePath, "utf8"),
  ]);

  assert.match(refundRoute, /reserveRefund/);
  assert.match(refundRoute, /cancelNicepayPayment/);
  assert.match(refundRoute, /error instanceof NicepayRejectedError/);
  assert.match(refundRoute, /finishRefund/);
  assert.match(refundRoute, /retrieveNicepayPayment/);
  assert.match(refundRoute, /PARTIAL_CANCEL_UNAVAILABLE/);
  assert.match(refundRoute, /reservation\.shouldExecute/);
  assert.match(
    refundRoute,
    /const refundOrderId = providerRefundOrderId\(input\.requestId\)/,
  );
  assert.match(
    refundRoute,
    /const payment = await cancelNicepayPayment[\s\S]*hasExpectedCancellation\([\s\S]*reservation\.payment\.providerOrderId,\s*refundOrderId/,
  );
  assert.match(refundRoute, /expectedOrderIds\.some/);
  assert.match(refundRoute, /receiptUrl: cancellation\.receiptUrl/);
  assert.match(
    refundRoute,
    /expectedBalance === 0[\s\S]*payment\.status === "cancelled"/,
  );
  assert.doesNotMatch(refundRoute, /finishUnknown|status: "unknown"/);
  assert.match(refundRoute, /Retry the same request/);
  const cancellationStart = refundRoute.indexOf(
    "const payment = await cancelNicepayPayment",
  );
  const rejectionHandler = refundRoute.indexOf(
    "error instanceof NicepayRejectedError",
    cancellationStart,
  );
  const recoveryLookup = refundRoute.indexOf(
    "const recovered = await lookupCancellation",
    rejectionHandler,
  );
  assert.ok(cancellationStart < rejectionHandler);
  assert.ok(rejectionHandler < recoveryLookup);
  assert.match(reconcileRoute, /getPaymentById/);
  assert.match(reconcileRoute, /listRefundsByPaymentId/);
  assert.match(reconcileRoute, /finishPayment/);
  assert.match(reconcileRoute, /finishRefund/);
  assert.match(reconcileRoute, /receiptUrl: cancellation\.receiptUrl/);
  assert.match(
    reconcileRoute,
    /provider\.balanceAmt === 0[\s\S]*provider\.status !== "cancelled"/,
  );
  assert.match(reconcileRoute, /Unexpected NICEPAY cancellation/);
  assert.match(webhookRoute, /reconcileCancellationWebhook/);
  assert.match(webhookRoute, /getPaymentByNicepayTid\(client, payment\.tid\)/);
  assert.match(
    webhookRoute,
    /getPaymentByProviderOrderId\(client, payment\.orderId\)/,
  );
  assert.match(webhookRoute, /listRefundsByPaymentId/);
  assert.match(webhookRoute, /finishRefund/);
  assert.match(webhookRoute, /receiptUrl: cancellation\.receiptUrl/);
  assert.match(
    webhookRoute,
    /refund\.providerRefundOrderId === payment\.orderId/,
  );
  assert.match(webhookRoute, /recordUnexpectedCancellation/);
  assert.match(webhookRoute, /return acknowledge\(\)/);
});
