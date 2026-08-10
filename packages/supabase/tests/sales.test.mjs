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

const { summarizeSalesEvents } = await import("../src/sales.ts");

test("sales summary uses only verified payments and successful refunds", () => {
  assert.deepEqual(
    summarizeSalesEvents([
      { amount: 10000, channel: "site", kind: "payment", status: "paid" },
      { amount: 7000, channel: "linkpay", kind: "payment", status: "paid" },
      { amount: 4000, channel: "site", kind: "refund", status: "succeeded" },
      { amount: 9000, channel: "site", kind: "payment", status: "unknown" },
    ]),
    {
      grossSalesAmount: 17000,
      paymentCount: 2,
      refundedAmount: 4000,
      netSalesAmount: 13000,
    },
  );
});

test("sales summary includes post-cancellation payments only once", () => {
  assert.deepEqual(
    summarizeSalesEvents([
      { amount: 10000, kind: "payment", status: "partial_cancelled" },
      { amount: 6000, kind: "payment", status: "cancelled" },
      { amount: 10000, kind: "refund", status: "failed" },
    ]),
    {
      grossSalesAmount: 16000,
      paymentCount: 2,
      refundedAmount: 0,
      netSalesAmount: 16000,
    },
  );
});
