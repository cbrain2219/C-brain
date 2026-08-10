import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

const migrationUrl = new URL(
  "../../../supabase/migrations/20260810021018_create_reusable_unified_payment_ledger.sql",
  import.meta.url,
);
const typesUrl = new URL("../src/types.ts", import.meta.url);

const types = await readFile(typesUrl, "utf8");

test("TypeScript defines the reusable payment ledger contract", () => {
  for (const type of [
    "order_channel",
    "order_status",
    "payment_status",
    "refund_status",
    "payment_links",
    "orders",
    "payments",
    "refunds",
    "create_site_checkout",
    "create_linkpay_checkout",
    "finish_payment",
    "reserve_refund",
    "finish_refund",
  ]) {
    assert.match(types, new RegExp(`\\b${type}\\b`));
  }
});

test("ledger migration defines the SQL contract", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  for (const contract of [
    "create table public.payment_links",
    "create table public.orders",
    "create table public.payments",
    "create table public.refunds",
    "create function public.create_site_checkout",
    "create function public.create_linkpay_checkout",
    "create function public.finish_payment",
    "create function public.reserve_refund",
    "create function public.finish_refund",
  ]) {
    assert.match(migration, new RegExp(contract.replaceAll(".", "\\.")));
  }

  assert.doesNotMatch(migration, /create table public\.sales/);
  assert.doesNotMatch(migration, /create (?:materialized )?view public\.sales/);
  assert.doesNotMatch(
    migration,
    /create type public\.payment_link_status[\s\S]*paid/,
  );
  assert.doesNotMatch(migration, /payment_link_id uuid not null unique/);
  assert.doesNotMatch(migration, /public\.is_admin\(\)/);
  assert.match(
    migration,
    /auth\.jwt\(\) -> 'app_metadata' ->> 'role'/,
  );
});
