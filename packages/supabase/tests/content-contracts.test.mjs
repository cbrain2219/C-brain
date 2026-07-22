import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

const migrationUrl = new URL(
  "../../../supabase/migrations/20260721000003_create_admin_content.sql",
  import.meta.url,
);
const typesUrl = new URL("../src/types.ts", import.meta.url);

const [migration, types] = await Promise.all([
  readFile(migrationUrl, "utf8"),
  readFile(typesUrl, "utf8"),
]);

function assertContains(source, values) {
  values.forEach((value) => {
    assert.match(source, new RegExp(`\\b${value}\\b`), `missing ${value}`);
  });
}

test("migration declares the content and complaint contracts", () => {
  assertContains(migration, [
    "posts",
    "portfolio_items",
    "reviews",
    "inquiries",
    "inquiry_attachments",
    "post_kind",
    "review_kind",
    "content_mode",
    "inquiry_status",
  ]);

  assertContains(migration, [
    "kind",
    "type",
    "content_mode",
    "thumbnail_alt",
    "seo_description",
    "images",
    "video_path",
    "complaint_type",
    "phone_verified",
    "privacy_agreed_at",
    "file_size",
    "content_type",
    "sort_order",
  ]);
});

test("migration restricts public reads and admin mutations with RLS", () => {
  assert.match(
    migration,
    /create policy "public select published products"[\s\S]*to anon[\s\S]*using \(status = 'published'\)/,
  );
  assert.match(
    migration,
    /grant select \(id, name, status, type, unit_prices, sort_order\)[\s\S]*on public\.products to anon/,
  );
  assert.doesNotMatch(
    migration,
    /grant select on public\.products[^;]*to anon/,
  );
  assert.match(migration, /alter table public\.posts enable row level security/);
  assert.match(
    migration,
    /create policy "public select published posts"[\s\S]*using \(status = 'published'\)/,
  );
  assert.match(
    migration,
    /create policy "public select published portfolio items"[\s\S]*using \(status = 'published'\)/,
  );
  assert.match(
    migration,
    /create policy "public select published reviews"[\s\S]*using \(status = 'published'\)/,
  );
  assertContains(migration, [
    "admins manage posts",
    "admins manage portfolio items",
    "admins manage reviews",
    "admins select inquiries",
    "admins update inquiries",
    "admins select inquiry attachments",
  ]);
  assert.doesNotMatch(migration, /create policy "admins manage inquiries"/);
  assert.doesNotMatch(
    migration,
    /create policy "admins manage inquiry attachments"/,
  );
});

test("migration provisions public and private storage policies", () => {
  assert.match(migration, /'public-assets'[\s\S]*true/);
  assert.match(migration, /'private-attachments'[\s\S]*false/);
  assert.doesNotMatch(migration, /create policy "public read public assets"/);
  assert.match(migration, /create policy "admins read private attachments"/);
});

test("review drafts may keep partial fields without weakening publish validation", () => {
  assert.match(migration, /company text not null,/);
  assert.match(migration, /reviews_published_company_check/);
  assert.doesNotMatch(
    migration,
    /company text not null check \(char_length\(trim\(company\)\) > 0\)/,
  );
});

test("rerunning the migration preserves administrator-defined ordering", () => {
  assert.doesNotMatch(migration, /with ordered_posts as/);
  assert.doesNotMatch(migration, /with ordered_portfolio_items as/);
  assert.doesNotMatch(migration, /with ordered_reviews as/);
});

test("reorder RPCs validate complete, duplicate-free ID lists", () => {
  assertContains(migration, [
    "reorder_posts",
    "reorder_portfolio_items",
    "reorder_reviews",
    "cardinality",
  ]);
  assert.equal((migration.match(/count\(distinct /g) ?? []).length, 3);
  assert.match(migration, /where post\.kind = \$1/);
  assert.equal((migration.match(/lock table public\./g) ?? []).length, 3);
});

test("TypeScript mirrors enums, tables, fields, and RPC arguments", () => {
  assertContains(types, [
    "content_mode",
    "post_kind",
    "review_kind",
    "received",
    "processing",
    "resolved",
    "posts",
    "portfolio_items",
    "reviews",
    "inquiries",
    "inquiry_attachments",
    "thumbnail_alt",
    "images",
    "video_path",
    "complaint_type",
    "file_size",
    "reorder_posts",
    "post_ids",
    "reorder_portfolio_items",
    "portfolio_item_ids",
    "reorder_reviews",
    "review_ids",
  ]);
});
