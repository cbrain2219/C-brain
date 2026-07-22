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

const { createPost, listPublishedPosts, reorderPosts } = await import(
  "../src/content.ts"
);
const { createSignedFileUpload, createStoragePath, getFileInfo } = await import(
  "../src/files.ts"
);
const { createInquiryAttachment } = await import("../src/inquiries.ts");
const { getLowestProductUnitPrice, listPublishedProducts } = await import(
  "../src/products.ts"
);
const {
  listPublishedPortfolioItems,
  reorderPortfolioItems,
} = await import("../src/portfolio.ts");
const { listPublishedReviews, reorderReviews } = await import(
  "../src/reviews.ts"
);

function createFakeClient(dataByTable = {}) {
  const calls = [];
  const client = {
    auth: {
      async getUser() {
        return { data: { user: { id: "admin-id" } }, error: null };
      },
    },
    from(table) {
      const chain = {
        delete() {
          calls.push({ method: "delete", table });
          return chain;
        },
        eq(column, value) {
          calls.push({ column, method: "eq", table, value });
          return chain;
        },
        insert(value) {
          calls.push({ method: "insert", table, value });
          return chain;
        },
        order(column, options) {
          calls.push({ column, method: "order", options, table });
          return chain;
        },
        select(columns) {
          calls.push({ columns, method: "select", table });
          return chain;
        },
        single() {
          calls.push({ method: "single", table });
          return Promise.resolve({
            data:
              dataByTable[table] ??
              (table === "profiles"
                ? { id: "admin-id", role: "admin" }
                : { id: `${table}-id` }),
            error: null,
          });
        },
        then(resolve, reject) {
          return Promise.resolve({
            data: dataByTable[table] ?? [],
            error: null,
          }).then(resolve, reject);
        },
        update(value) {
          calls.push({ method: "update", table, value });
          return chain;
        },
      };

      return chain;
    },
    async rpc(name, args) {
      calls.push({ args, method: "rpc", name });
      return { data: null, error: null };
    },
  };

  return { calls, client };
}

function orderCalls(calls, table) {
  return calls
    .filter((call) => call.method === "order" && call.table === table)
    .map(({ column, options }) => [column, options]);
}

test("published content queries use stable display ordering", async () => {
  const { calls, client } = createFakeClient();

  await listPublishedPosts(client, "notice");
  await listPublishedPortfolioItems(client);
  await listPublishedReviews(client);
  await listPublishedProducts(client);

  for (const table of ["posts", "portfolio_items", "reviews", "products"]) {
    assert.deepEqual(orderCalls(calls, table), [
      ["sort_order", { ascending: true }],
      ["id", { ascending: true }],
    ]);
  }
  assert.ok(
    calls.some(
      (call) =>
        call.method === "select" &&
        call.table === "products" &&
        call.columns === "id, name, sort_order, type, unit_prices",
    ),
  );
  assert.ok(
    calls.some(
      (call) =>
        call.method === "eq" &&
        call.table === "posts" &&
        call.column === "kind" &&
        call.value === "notice",
    ),
  );
  assert.ok(
    calls.some(
      (call) =>
        call.method === "eq" &&
        call.table === "products" &&
        call.column === "status" &&
        call.value === "published",
    ),
  );
});

test("product pricing uses the lowest valid unit price", () => {
  assert.equal(
    getLowestProductUnitPrice({
      "0:0:0": 160000,
      "0:0:1": 120000,
      invalid: "100000",
      negative: -1,
    }),
    120000,
  );
  assert.equal(getLowestProductUnitPrice({}), null);
  assert.equal(getLowestProductUnitPrice([]), null);
});

test("post and attachment mutations pass payloads unchanged", async () => {
  const { calls, client } = createFakeClient();
  const post = {
    content: "content",
    kind: "blog",
    slug: "post",
    title: "Post",
    type: "guide",
  };
  const attachment = {
    bucket: "private-attachments",
    content_type: "image/png",
    file_name: "proof.png",
    file_size: 123,
    inquiry_id: "inquiry-id",
    path: "complaints/proof.png",
  };

  await createPost(client, post);
  await createInquiryAttachment(client, attachment);

  assert.deepEqual(
    calls.find((call) => call.method === "insert" && call.table === "posts")
      ?.value,
    post,
  );
  assert.deepEqual(
    calls.find(
      (call) =>
        call.method === "insert" && call.table === "inquiry_attachments",
    )?.value,
    attachment,
  );
});

test("reorder helpers call the matching atomic RPC contract", async () => {
  const { calls, client } = createFakeClient();

  await reorderPosts(client, "blog", ["post-a", "post-b"]);
  await reorderPortfolioItems(client, ["portfolio-a"]);
  await reorderReviews(client, ["review-a", "review-b"]);

  assert.deepEqual(
    calls.filter((call) => call.method === "rpc"),
    [
      {
        args: { post_ids: ["post-a", "post-b"], post_kind: "blog" },
        method: "rpc",
        name: "reorder_posts",
      },
      {
        args: { portfolio_item_ids: ["portfolio-a"] },
        method: "rpc",
        name: "reorder_portfolio_items",
      },
      {
        args: { review_ids: ["review-a", "review-b"] },
        method: "rpc",
        name: "reorder_reviews",
      },
    ],
  );
});

test("storage paths discard unsafe path and extension characters", () => {
  const path = createStoragePath("complaints/../proofs", "invoice.P N G");
  const extensionlessPath = createStoragePath("complaints", "README");

  assert.match(
    path,
    /^complaints\/proofs\/[0-9a-f-]{36}\.png$/,
  );
  assert.match(extensionlessPath, /^complaints\/[0-9a-f-]{36}\.bin$/);
  assert.doesNotMatch(path, /\.\.|\s/);
});

test("signed upload and file info helpers use the requested private path", async () => {
  const calls = [];
  const client = {
    storage: {
      from(bucket) {
        return {
          async createSignedUploadUrl(path) {
            calls.push({ bucket, method: "createSignedUploadUrl", path });
            return { data: { path, token: "signed-token" }, error: null };
          },
          async info(path) {
            calls.push({ bucket, method: "info", path });
            return {
              data: { contentType: "image/png", path, size: 123 },
              error: null,
            };
          },
        };
      },
    },
  };

  assert.equal(
    (
      await createSignedFileUpload(
        client,
        "private-attachments",
        "inquiry-submissions/id/proof.png",
      )
    ).token,
    "signed-token",
  );
  assert.equal(
    (
      await getFileInfo(
        client,
        "private-attachments",
        "inquiry-submissions/id/proof.png",
      )
    ).size,
    123,
  );
  assert.deepEqual(calls, [
    {
      bucket: "private-attachments",
      method: "createSignedUploadUrl",
      path: "inquiry-submissions/id/proof.png",
    },
    {
      bucket: "private-attachments",
      method: "info",
      path: "inquiry-submissions/id/proof.png",
    },
  ]);
});
