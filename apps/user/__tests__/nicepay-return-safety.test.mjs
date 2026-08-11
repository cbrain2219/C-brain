import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routePath = new URL(
  "../app/api/payments/nicepay/return/route.ts",
  import.meta.url,
);

test("unverified authentication callbacks never write a failed ledger state", async () => {
  const route = await readFile(routePath, "utf8");
  const failureBranch = route.slice(
    route.indexOf('if (authResultCode !== "0000")'),
    route.indexOf("const callback = parseNicepayAuthCallback"),
  );
  const invalidCallbackBranch = route.slice(
    route.indexOf("if (\n    !callback ||"),
    route.indexOf("const expectedPayment"),
  );

  assert.match(failureBranch, /return redirect\(\)/);
  assert.doesNotMatch(failureBranch, /recordPayment|finishPayment/);
  assert.match(invalidCallbackBranch, /return redirect\(\)/);
  assert.doesNotMatch(invalidCallbackBranch, /recordPayment|finishPayment/);
  assert.doesNotMatch(route, /recordFailedAttempt/);
});

test("an unverified callback TID is never persisted for recovery", async () => {
  const route = await readFile(routePath, "utf8");
  const unknownRecorder = route.slice(
    route.indexOf("async function recordUnknownApproval"),
    route.indexOf("async function tryNetCancel"),
  );

  assert.match(unknownRecorder, /nicepayTid: null/);
  assert.doesNotMatch(unknownRecorder, /tid: string|nicepayTid: tid/);
});

test("net-cancel authenticates the provider response TID, not the callback TID", async () => {
  const route = await readFile(routePath, "utf8");
  const netCancel = route.slice(
    route.indexOf("async function tryNetCancel"),
    route.indexOf("export async function POST"),
  );

  assert.match(netCancel, /tid: payment\.tid/);
  assert.match(netCancel, /payment\.resultCode !== "0000"/);
  assert.match(netCancel, /payment\.status !== "cancelled"/);
  assert.match(netCancel, /payment\.balanceAmt !== 0/);
  assert.doesNotMatch(netCancel, /tid: tid[,\s}]/);
  assert.match(netCancel, /recordUnknownNetCancel\(client, order, payment\)/);
  assert.ok(
    netCancel.indexOf("markNetCancelRequested(client, order)") <
      netCancel.indexOf("netCancelNicepayPayment"),
  );
  assert.match(netCancel, /return "not_started"/);
  assert.match(netCancel, /return "pending"/);
});
