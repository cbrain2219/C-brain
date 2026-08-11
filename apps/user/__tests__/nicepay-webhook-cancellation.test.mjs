import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import test from "node:test";

const webhookRoutePath = new URL(
  "../app/api/payments/nicepay/webhook/route.ts",
  import.meta.url,
);

async function importWebhookHelpers() {
  const source = await readFile(webhookRoutePath, "utf8");
  const moduleSource = source
    .replace(
      /import \{[\s\S]*?\} from "@repo\/supabase";/,
      "const createAdminSupabaseClient = () => ({});\nconst finishPayment = () => ({});\nconst finishRefund = () => ({});\nconst getPaymentByNicepayTid = () => ({});\nconst getPaymentByProviderOrderId = () => ({});\nconst listRefundsByPaymentId = () => ([]);",
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/nicepay";/,
      "const findLatestNicepayCancellation = () => null;\nconst getNicepayConfig = () => ({});\nconst parseNicepayPayment = () => null;\nconst retrieveNicepayPayment = () => null;\nconst verifyNicepayPayment = () => false;",
    );
  const ts = await import("typescript");
  const { outputText } = ts.transpileModule(moduleSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return {
    source,
    module: await import(
      `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
    ),
  };
}

test("a delayed partial-refund webhook is idempotent after a later full refund", async () => {
  const { module, source } = await importWebhookHelpers();
  const partialCancellation = {
    balanceAmt: 6000,
    cancelledTid: "partial-cancelled-tid",
  };
  const refunds = [
    {
      amount: 4000,
      nicepayCancelledTid: partialCancellation.cancelledTid,
      status: "succeeded",
    },
    {
      amount: 6000,
      nicepayCancelledTid: "full-cancelled-tid",
      status: "succeeded",
    },
  ];

  // The current ledger is fully refunded (balance 0), while the delayed first
  // webhook correctly still reports its original balance of 6,000.
  assert.equal(
    module.hasSucceededCancellation(refunds, partialCancellation.cancelledTid),
    true,
  );

  const reconciliation = source.slice(
    source.indexOf("async function reconcileCancellationWebhook"),
    source.indexOf("export async function POST"),
  );
  assert.ok(
    reconciliation.indexOf(
      "hasSucceededCancellation(refunds, cancellation.tid)",
    ) < reconciliation.indexOf("payment.balanceAmt !== 0"),
  );
  assert.ok(
    reconciliation.indexOf(
      "hasSucceededCancellation(refunds, cancellation.tid)",
    ) < reconciliation.indexOf("payment.balanceAmt === 0"),
  );
  assert.ok(
    reconciliation.indexOf(
      "hasSucceededCancellation(refunds, cancellation.tid)",
    ) < reconciliation.indexOf("const balanceReduction"),
  );
});

test("a delayed net-cancel webhook is not treated as a customer refund", async () => {
  const { module } = await importWebhookHelpers();

  assert.equal(
    module.isRecordedNetCancel(
      {
        nicepayTid: "signed-provider-tid",
        providerOrderId: "original-order",
        resultCode: "NET_CANCELLED",
        status: "failed",
      },
      {
        balanceAmt: 0,
        orderId: "original-order",
        resultCode: "0000",
        status: "cancelled",
        tid: "signed-provider-tid",
      },
    ),
    true,
  );
});

test("a net-cancel webhook recovers a missing first ledger write", async () => {
  const { module, source } = await importWebhookHelpers();

  assert.equal(
    module.isRecoverableNetCancel(
      {
        nicepayTid: null,
        providerOrderId: "original-order",
        resultCode: "NET_CANCEL_REQUESTED",
        status: "unknown",
      },
      {
        balanceAmt: 0,
        orderId: "original-order",
        resultCode: "0000",
        status: "cancelled",
        tid: "signed-provider-tid",
      },
    ),
    true,
  );
  assert.match(
    source,
    /!order && isCancellation[\s\S]*getPaymentByProviderOrderId\(client, payment\.orderId\)/,
  );
});

test("an external cancellation without a net-cancel marker stays unresolved", async () => {
  const { module } = await importWebhookHelpers();

  assert.equal(
    module.isRecoverableNetCancel(
      {
        nicepayTid: null,
        providerOrderId: "original-order",
        resultCode: "APPROVAL_UNKNOWN",
        status: "unknown",
      },
      {
        balanceAmt: 0,
        orderId: "original-order",
        resultCode: "0000",
        status: "cancelled",
        tid: "signed-provider-tid",
      },
    ),
    false,
  );
});

test("a signed full-refund webhook may use the original payment order ID", async () => {
  const { source } = await importWebhookHelpers();
  const reconciliation = source.slice(
    source.indexOf("async function reconcileCancellationWebhook"),
    source.indexOf("export async function POST"),
  );

  assert.match(
    reconciliation,
    /const usesOriginalOrderId = payment\.orderId === order\.providerOrderId/,
  );
  assert.match(
    reconciliation,
    /refund\.amount === balanceReduction &&\s*\(usesOriginalOrderId \|\|\s*refund\.providerRefundOrderId === payment\.orderId\)/,
  );
  assert.match(
    reconciliation,
    /const refund = matches\.length === 1 \? matches\[0\] : null/,
  );
});
