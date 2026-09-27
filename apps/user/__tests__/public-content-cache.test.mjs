import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

async function load(path, imports) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    Response,
    Buffer,
    process: {
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
        ADMIN_APP_URL: "http://localhost:5174",
      },
    },
    console: { error() {} },
    require: (name) =>
      name === "server-only" ? {} : (imports[name] ?? require(name)),
  });
  return exports;
}

async function setup() {
  const entries = new Map();
  const calls = [];
  const rows = new Map(
    ["a", "b"].map((slug) => [
      slug,
      {
        id: slug,
        slug,
        title: slug,
        content: `${slug} body`,
        content_mode: "html",
        content_authoring_mode: "wysiwyg",
        content_asset_scope: slug,
      },
    ]),
  );
  let failList = false;
  const nextCache = {
    unstable_cache(read, keyParts, options) {
      assert.equal(options.revalidate, 86400);
      return async (...args) => {
        const key = JSON.stringify([keyParts, args]);
        if (entries.has(key)) return entries.get(key).value;
        const value = await read(...args);
        entries.set(key, { value, tags: options.tags });
        return value;
      };
    },
  };
  let cacheHelpers = {};
  try {
    cacheHelpers = await load("../lib/publicContentCache.ts", {
      "next/cache": nextCache,
    });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const data = await load("../lib/publicContent.ts", {
    react: { cache: (fn) => fn }, // separate React requests share only the Next data cache
    "next/server": { connection: async () => {} },
    "./publicContentCache": cacheHelpers,
    "./supabase": { createPublicUserSupabaseClient: () => ({}) },
    "../app/(site)/blog/_data/blogPosts": { mapBlogRows: (rows) => rows },
    "../app/_content/portfolio": { mapPortfolioRows: (rows) => rows },
    "@repo/supabase": {
      getPublicAssetUrl: (_, path) => path,
      listPublishedPosts: async () => {
        calls.push("all-bodies");
        return [...rows.values()];
      },
      listPublishedPostSummaries: async () => {
        calls.push("blog-list");
        if (failList) throw Error("database unavailable");
        return [...rows.values()].map(({ content, ...row }) => ({
          ...row,
          content_preview: content,
        }));
      },
      getPublishedPost: async (_, kind, slug) => {
        calls.push(`blog:${slug}`);
        return rows.get(slug) ?? null;
      },
      listPublishedPortfolioSummaries: async () => {
        calls.push("portfolio-list");
        return [];
      },
      getPublishedPortfolioItem: async (_, slug) => {
        calls.push(`portfolio:${slug}`);
        return null;
      },
    },
  });
  const invalidate = (tag) => {
    for (const [key, entry] of entries)
      if (entry.tags.includes(tag)) entries.delete(key);
  };
  return {
    data,
    calls,
    rows,
    invalidate,
    cacheHelpers,
    failList: (value) => {
      failList = value;
    },
  };
}

test("public lists and individual bodies are shared across requests and invalidated separately", async () => {
  const { data, calls, rows, invalidate, cacheHelpers } = await setup();
  assert.equal(typeof data.getPublishedBlogPost, "function");
  await data.getPublishedBlogPosts();
  await data.getPublishedBlogPost("a");
  await data.getPublishedBlogPostSource("a");
  await data.getPublishedBlogPost("b");
  await data.getPublishedBlogPosts();
  await data.getPublishedBlogPost("b");
  assert.deepEqual(calls, ["blog-list", "blog:a", "blog:b"]);

  rows.set("a", { ...rows.get("a"), content: "updated" });
  invalidate(cacheHelpers.publicContentListTag("blog"));
  invalidate(cacheHelpers.publicContentDetailTag("blog", "a"));
  assert.equal((await data.getPublishedBlogPostSource("a")).content, "updated");
  await data.getPublishedBlogPosts();
  await data.getPublishedBlogPost("b");
  assert.deepEqual(calls, [
    "blog-list",
    "blog:a",
    "blog:b",
    "blog:a",
    "blog-list",
  ]);
});

test("temporary database failure does not cache an empty list for a day", async () => {
  const { data, calls, failList } = await setup();
  failList(true);
  assert.equal((await data.getPublishedBlogPosts()).length, 0);
  failList(false);
  assert.equal((await data.getPublishedBlogPosts()).length, 2);
  await data.getPublishedBlogPosts();
  assert.deepEqual(calls, ["blog-list", "blog-list"]);
});

test("large HTML is compressed within Next's cache limit and restored without content changes", async () => {
  let stored;
  let reads = 0;
  const helpers = await load("../lib/publicContentCache.ts", {
    "next/cache": {
      unstable_cache: (read) => async () => {
        if (stored === undefined) {
          stored = await read();
          assert(Buffer.byteLength(JSON.stringify(stored)) < 2 * 1024 * 1024);
        }
        return stored;
      },
    },
  });
  const content =
    "<p>원본 HTML 😀</p><style>" + ".a{color:red}".repeat(190000) + "</style>";
  const read = async () => {
    reads += 1;
    return { content };
  };
  assert.equal(
    (await helpers.readCachedPublicContent("blog", "large", read)).content,
    content,
  );
  assert.equal(
    (await helpers.readCachedPublicContent("blog", "large", read)).content,
    content,
  );
  assert.equal(reads, 1);
});

test("publishing, deleting and changing slugs refresh only the affected detail keys", async () => {
  const { data, rows, invalidate, cacheHelpers } = await setup();
  assert.equal(typeof data.getPublishedBlogPost, "function");
  assert.equal(await data.getPublishedBlogPost("new"), undefined);
  rows.set("new", { ...rows.get("a"), slug: "new" });
  invalidate(cacheHelpers.publicContentDetailTag("blog", "new"));
  assert.equal((await data.getPublishedBlogPost("new")).slug, "new");
  rows.delete("new");
  invalidate(cacheHelpers.publicContentDetailTag("blog", "new"));
  assert.equal(await data.getPublishedBlogPost("new"), undefined);
  assert.notEqual(
    cacheHelpers.publicContentDetailTag("blog", "a"),
    cacheHelpers.publicContentDetailTag("portfolio", "a"),
  );
});

test("content revalidation requires an admin and expires only its list and supplied slugs", async () => {
  let user = { id: "admin", app_metadata: { role: "admin" } };
  const auth = await load("../lib/adminPaymentAuth.ts", {
    "@repo/supabase": {
      createServerSupabaseClient: () => ({
        auth: {
          getUser: async (token) => ({
            data: { user: token === "valid" ? user : null },
            error: null,
          }),
        },
      }),
      createAdminSupabaseClient: () => ({}),
    },
  });
  const tags = [];
  const helpers = await load("../lib/publicContentCache.ts", {
    "next/cache": {},
  });
  const route = await load("../app/api/admin/content/revalidate/route.ts", {
    "../../../../../lib": { ...auth, ...helpers },
    "next/cache": {
      revalidateTag: (tag, profile) => {
        assert.equal(profile.expire, 0);
        tags.push(tag);
      },
    },
  });
  const input = { entity: "blog", slugs: ["old-slug", "new-slug"] };
  const request = (
    body = input,
    token = "valid",
    origin = "http://localhost:5174",
  ) =>
    new Request("http://localhost/api/admin/content/revalidate", {
      method: "POST",
      headers: {
        origin,
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  assert.equal((await route.POST(request(input, "invalid"))).status, 401);
  assert.equal(
    (await route.POST(request(input, "valid", "http://other.example"))).status,
    403,
  );
  user = { ...user, app_metadata: { role: "user" } };
  assert.equal((await route.POST(request())).status, 403);
  user = { ...user, app_metadata: { role: "admin" } };
  for (const body of [
    null,
    {},
    { entity: "payments", slugs: [] },
    { entity: "blog", slugs: ["a", "b", "c"] },
    { entity: "blog", slugs: [null] },
  ]) {
    assert.equal((await route.POST(request(body))).status, 400);
  }
  assert.deepEqual(tags, []);
  const result = await route.POST(request());
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.deepEqual(tags, [
    helpers.publicContentListTag("blog"),
    helpers.publicContentDetailTag("blog", "old-slug"),
    helpers.publicContentDetailTag("blog", "new-slug"),
  ]);
  tags.length = 0;
  assert.equal(
    (await route.POST(request({ entity: "portfolio", slugs: [] }))).status,
    200,
  );
  assert.deepEqual(tags, [helpers.publicContentListTag("portfolio")]);
});
