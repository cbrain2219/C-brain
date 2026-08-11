import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loaderPath = new URL("../lib/publicContent.ts", import.meta.url);
const supabasePath = new URL("../lib/supabase.ts", import.meta.url);

test("public content loader uses the published Supabase boundary", async () => {
  const [source, supabaseSource] = await Promise.all([
    readFile(loaderPath, "utf8"),
    readFile(supabasePath, "utf8"),
  ]);

  assert.match(source, /import "server-only"/);
  assert.match(source, /createPublicUserSupabaseClient/);
  assert.doesNotMatch(source, /createUserSupabaseClient/);
  assert.match(source, /listPublishedPosts\(client, "blog"\)/);
  assert.match(source, /listPublishedPortfolioItems\(client\)/);
  assert.match(source, /getPublicAssetUrl\(client, path\)/);
  assert.match(source, /mapBlogRows/);
  assert.match(source, /mapPortfolioRows/);
  assert.match(source, /export const getPublishedBlogPosts = cache/);
  assert.match(source, /export const getPublishedPortfolioItems = cache/);
  assert.match(source, /if \(!client\) return \[\]/);
  assert.match(source, /catch \(error\)/);
  assert.match(source, /return \[\]/);

  assert.doesNotMatch(
    source,
    /import\s*\{[^}]*\b(?:blogPosts|featuredPortfolioItems|portfolioItems)\b/,
  );
  assert.doesNotMatch(source, /SUPABASE_SECRET_KEY|service[_-]?role/i);
  assert.doesNotMatch(source, /useEffect|useState|fetch\(/);
  assert.match(supabaseSource, /export function createPublicUserSupabaseClient/);
  assert.match(supabaseSource, /getAll: \(\) => \[\]/);
});
