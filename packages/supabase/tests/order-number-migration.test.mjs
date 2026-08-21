import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

const migrationUrl = new URL(
  "../../../supabase/migrations/20260821055833_add_eight_digit_order_numbers.sql",
  import.meta.url,
);

test("order-number migration backfills and protects eight-digit display IDs", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /add column order_number text/i);
  assert.match(sql, /pg_advisory_xact_lock\s*\(/i);
  assert.match(sql, /floor\s*\(\s*10000000 \+ random\(\) \* 90000000\s*\)/i);
  assert.match(sql, /create unique index orders_order_number_idx/i);
  assert.match(sql, /update public\.orders[\s\S]*generate_order_number\(\)/i);
  assert.match(sql, /order_number ~ '\^\[0-9\]\{8\}\$'/i);
  assert.match(sql, /alter column order_number set not null/i);
  assert.match(
    sql,
    /revoke execute on function public\.generate_order_number\(\)[\s\S]*from public, anon, authenticated/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.generate_order_number\(\)[\s\S]*to service_role/i,
  );
  assert.doesNotMatch(sql, /alter\s+(?:table\s+)?public\.payments/i);
});
