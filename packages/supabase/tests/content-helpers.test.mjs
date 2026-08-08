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

const { createPost, listPublishedPosts, reorderPosts } =
  await import("../src/content.ts");
const { requireAdmin } = await import("../src/auth.ts");
const { createSignedFileUpload, createStoragePath, getFileInfo } =
  await import("../src/files.ts");
const { createInquiryAttachment } = await import("../src/inquiries.ts");
const {
  completePaymentOrder,
  createPaymentLink,
  deletePaymentLink,
  getOrCreatePaymentOrder,
  getPaymentOrderByOrderId,
  getPublicPaymentLink,
  listAdminPaymentLinks,
  updatePaymentOrder,
} = await import("../src/paymentLinks.ts");
const { getLowestProductUnitPrice, listPublishedProducts } =
  await import("../src/products.ts");
const { listPublishedPortfolioItems, reorderPortfolioItems } =
  await import("../src/portfolio.ts");
const { listPublishedReviews, reorderReviews } =
  await import("../src/reviews.ts");

function createFakeClient(dataByTable = {}) {
  const calls = [];
  const client = {
    auth: {
      async getUser() {
        return {
          data: {
            user: { app_metadata: { role: "admin" }, id: "admin-id" },
          },
          error: null,
        };
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
        maybeSingle() {
          calls.push({ method: "maybeSingle", table });
          return Promise.resolve({
            data: dataByTable[table] ?? null,
            error: null,
          });
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
    rpc(name, args) {
      calls.push({ args, method: "rpc", name });
      const result = {
        data:
          name === "get_or_create_payment_order"
            ? (dataByTable.payment_orders ?? { id: "payment-order-id" })
            : null,
        error: null,
      };

      return {
        single() {
          calls.push({ method: "single", rpc: name });
          return Promise.resolve(result);
        },
        then(resolve, reject) {
          return Promise.resolve(result).then(resolve, reject);
        },
      };
    },
  };

  return { calls, client };
}

test("admin authorization uses app metadata without a profiles query", async () => {
  const { calls, client } = createFakeClient();

  await requireAdmin(client);

  assert.equal(calls.some((call) => call.table === "profiles"), false);
});

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

  assert.match(path, /^complaints\/proofs\/[0-9a-f-]{36}\.png$/);
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

test("payment link helpers use admin-scoped newest-first access", async () => {
  const { calls, client } = createFakeClient({ payment_links: [] });
  const input = {
    amount: 120000,
    category: "브로슈어",
    client_name: "테스트 고객사",
    page_quantity: "12p / 500부",
    paper: "일반지",
    payment_name: "브로슈어 제작비",
    service: "디자인",
  };

  await listAdminPaymentLinks(client);
  await createPaymentLink(client, input);
  await deletePaymentLink(client, "payment-link-id");

  assert.deepEqual(orderCalls(calls, "payment_links"), [
    ["created_at", { ascending: false }],
  ]);
  assert.deepEqual(
    calls.find(
      (call) => call.method === "insert" && call.table === "payment_links",
    )?.value,
    input,
  );
  assert.ok(
    calls.some(
      (call) => call.method === "delete" && call.table === "payment_links",
    ),
  );
  assert.ok(
    calls.some(
      (call) =>
        call.method === "eq" &&
        call.table === "payment_links" &&
        call.column === "id" &&
        call.value === "payment-link-id",
    ),
  );
});

test("payment order helpers use server-only lookup and atomic RPC contracts", async () => {
  const paymentLink = { id: "payment-link-id", public_token: "public-token" };
  const paymentOrder = {
    id: "payment-order-id",
    order_id: "LPORDER",
    payment_link_id: paymentLink.id,
  };
  const { calls, client } = createFakeClient({
    payment_links: paymentLink,
    payment_orders: paymentOrder,
  });

  await getPublicPaymentLink(client, paymentLink.public_token);
  await getPaymentOrderByOrderId(client, paymentOrder.order_id);
  await getOrCreatePaymentOrder(client, paymentLink.public_token);
  await completePaymentOrder(client, {
    amount: 120000,
    nicepayTid: "nicepay-tid",
    orderId: paymentOrder.order_id,
    paidAt: "2026-07-23T00:00:00.000Z",
    payMethod: "card",
    receiptUrl: "https://example.com/receipt",
    resultCode: "0000",
    resultMessage: "정상 처리되었습니다.",
  });
  await updatePaymentOrder(client, paymentOrder.order_id, {
    provider_status: "failed",
    result_code: "9999",
  });

  assert.ok(
    calls.some(
      (call) =>
        call.method === "eq" &&
        call.table === "payment_links" &&
        call.column === "public_token" &&
        call.value === paymentLink.public_token,
    ),
  );
  assert.ok(
    calls.some(
      (call) =>
        call.method === "eq" &&
        call.table === "payment_orders" &&
        call.column === "order_id" &&
        call.value === paymentOrder.order_id,
    ),
  );
  assert.deepEqual(
    calls
      .filter((call) => call.method === "rpc")
      .map(({ args, name }) => ({
        args,
        name,
      })),
    [
      {
        args: { p_public_token: paymentLink.public_token },
        name: "get_or_create_payment_order",
      },
      {
        args: {
          p_amount: 120000,
          p_nicepay_tid: "nicepay-tid",
          p_order_id: paymentOrder.order_id,
          p_paid_at: "2026-07-23T00:00:00.000Z",
          p_pay_method: "card",
          p_receipt_url: "https://example.com/receipt",
          p_result_code: "0000",
          p_result_message: "정상 처리되었습니다.",
        },
        name: "complete_payment_order",
      },
    ],
  );
});
