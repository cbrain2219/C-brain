import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

const migrationUrl = new URL(
  "../../../supabase/migrations/20260722000000_create_payment_links.sql",
  import.meta.url,
);
const typesUrl = new URL("../src/types.ts", import.meta.url);

test("payment links migration defines the minimal admin contract", async () => {
  const [migration, types] = await Promise.all([
    readFile(migrationUrl, "utf8"),
    readFile(typesUrl, "utf8"),
  ]);

  for (const field of [
    "payment_link_status",
    "payment_links",
    "public_token",
    "client_name",
    "payment_name",
    "amount",
    "status",
  ]) {
    assert.match(migration, new RegExp(`\\b${field}\\b`));
    assert.match(types, new RegExp(`\\b${field}\\b`));
  }

  assert.match(migration, /check \(amount between 1 and 999999999999\)/);
  assert.match(
    migration,
    /alter table public\.payment_links enable row level security/,
  );
  assert.match(migration, /create policy "admins select payment links"/);
  assert.match(migration, /create policy "admins insert payment links"/);
  assert.match(migration, /create policy "admins update payment links"/);
  assert.match(
    migration,
    /revoke insert, update on public\.payment_links from authenticated;/,
  );
  assert.match(
    migration,
    /grant select on public\.payment_links to authenticated;/,
  );
  assert.match(
    migration,
    /grant insert \(client_name, payment_name, amount\)\s+on public\.payment_links to authenticated;/,
  );
  assert.match(
    migration,
    /grant update \(client_name, payment_name, amount\)\s+on public\.payment_links to authenticated;/,
  );
  assert.match(
    migration,
    /grant all on public\.payment_links to service_role;/,
  );
  assert.doesNotMatch(
    migration,
    /grant (?:insert|update) on public\.payment_links to authenticated;/,
  );
  assert.doesNotMatch(migration, /anon/);
  assert.doesNotMatch(migration, /delete payment links/);
  assert.match(types, /payment_link_status: "pending" \| "paid"/);
});
