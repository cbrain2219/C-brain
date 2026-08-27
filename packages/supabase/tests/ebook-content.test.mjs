import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

const initialSchemaPath = new URL(
  "../../../supabase/initial_admin_content.sql",
  import.meta.url,
);
const migrationPath = new URL(
  "../../../supabase/migrations/20260826115728_create_ebooks.sql",
  import.meta.url,
);
const typesPath = new URL("../src/types.ts", import.meta.url);

test("E-books use a dedicated minimal table with public read and admin write access", async () => {
  const [initialSchema, migration, types] = await Promise.all([
    readFile(initialSchemaPath, "utf8"),
    readFile(migrationPath, "utf8"),
    readFile(typesPath, "utf8"),
  ]);

  assert.match(migration, /create table if not exists public\.ebooks/i);
  assert.match(migration, /embed_url text not null/i);
  assert.match(migration, /check \(embed_url ~ '\^https:\/\//i);
  assert.match(migration, /slug text not null unique/i);
  assert.match(migration, /status text not null default 'published'/i);
  assert.doesNotMatch(migration, /public\.publish_status/i);
  assert.doesNotMatch(migration, /public\.is_admin/i);
  assert.match(migration, /auth\.jwt\(\).*app_metadata.*role/is);
  assert.match(migration, /to anon\s+using \(status = 'published'\)/i);
  assert.match(
    migration,
    /revoke all privileges on table public\.ebooks\s+from public, anon, authenticated/i,
  );
  assert.match(
    migration,
    /grant select \(embed_url, seo_description, slug, status, title\)/i,
  );
  assert.match(migration, /notify pgrst, 'reload schema'/);
  assert.match(initialSchema, /create table public\.ebooks/i);
  assert.match(initialSchema, /check \(kind in \('blog', 'notice'\)\)/);
  assert.doesNotMatch(initialSchema, /check \(kind in \([^)]*'ebook'/);
  assert.match(types, /ebooks: \{/);
  assert.match(types, /post_kind: "blog" \| "notice";/);
});
