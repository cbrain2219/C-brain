import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { register } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));

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

const { createPost, getPublishedPost, listPublishedPosts, reorderPosts } =
  await import("../src/content.ts");
const { requireAdmin } = await import("../src/auth.ts");
const { createSignedFileUpload, createStoragePath, getFileInfo } =
  await import("../src/files.ts");
const {
  createComplaint,
  createComplaintAttachments,
  createInquiryAttachment,
  getAdminComplaint,
  listAdminComplaints,
  updateComplaintStatus,
} = await import("../src/inquiries.ts");
const {
  createPaymentLink,
  deletePaymentLink,
  listAdminPaymentLinks,
} = await import("../src/paymentLinks.ts");
const {
  createProduct,
  deleteProduct,
  getAdminProduct,
  getPublishedProduct,
  getLowestProductUnitPrice,
  listPublishedProducts,
  updateProduct,
} = await import("../src/products.ts");
const {
  getPublishedPortfolioItem,
  listPublishedPortfolioItems,
  reorderPortfolioItems,
} =
  await import("../src/portfolio.ts");
const { getPublishedReview, listPublishedReviews, reorderReviews } =
  await import("../src/reviews.ts");

function createFakeClient(dataByTable = {}, selectResponse) {
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
      let selectedColumns;
      const selectionResult = (single) =>
        selectResponse?.({ columns: selectedColumns, single, table }) ?? {
          data: dataByTable[table] ?? (single ? null : []),
          error: null,
        };
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
          return Promise.resolve(selectionResult(true));
        },
        select(columns) {
          selectedColumns = columns;
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
          return Promise.resolve(selectionResult(false)).then(resolve, reject);
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
        data: null,
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

  assert.deepEqual(orderCalls(calls, "portfolio_items"), [
    ["pinned", { ascending: false }],
    ["sort_order", { ascending: true }],
    ["id", { ascending: true }],
  ]);

  for (const table of ["posts", "reviews", "products"]) {
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
        call.columns === "id, configuration, product_type, sort_order",
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

test("public managed-content list and detail queries exactly match canonical anon grants", async () => {
  const { calls, client } = createFakeClient();

  await Promise.all([
    listPublishedPosts(client, "blog"),
    getPublishedPost(client, "notice", "notice-slug"),
    listPublishedPortfolioItems(client),
    getPublishedPortfolioItem(client, "portfolio-slug"),
    listPublishedReviews(client),
    getPublishedReview(client, "review-slug"),
  ]);

  const expectedColumns = {
    portfolio_items: [
      "id",
      "client_name",
      "content",
      "content_mode",
      "content_authoring_mode",
      "content_asset_scope",
      "created_at",
      "images",
      "pinned",
      "published_at",
      "show_on_landing",
      "slug",
      "sort_order",
      "status",
      "title",
      "type",
      "view_count",
    ],
    posts: [
      "id",
      "kind",
      "status",
      "slug",
      "title",
      "type",
      "content",
      "content_mode",
      "content_authoring_mode",
      "content_asset_scope",
      "created_at",
      "excerpt",
      "featured",
      "pinned",
      "published_at",
      "seo_description",
      "show_as_banner",
      "show_on_landing",
      "sort_order",
      "thumbnail_alt",
      "thumbnail_path",
      "view_count",
    ],
    reviews: [
      "id",
      "company_name",
      "content",
      "content_mode",
      "content_authoring_mode",
      "content_asset_scope",
      "created_at",
      "kind",
      "manager_name",
      "project_deliverable",
      "project_usage",
      "published_at",
      "seo_description",
      "show_on_landing",
      "slug",
      "sort_order",
      "status",
      "title",
      "video_alt",
      "video_path",
      "view_count",
      "youtube_video_id",
    ],
  };
  const baseline = await readFile(
    resolve(testDirectory, "../../../supabase/initial_admin_content.sql"),
    "utf8",
  );
  const grants = new Map(
    [...baseline.matchAll(
      /grant select \(([\s\S]*?)\) on public\.(posts|portfolio_items|reviews) to anon;/gu,
    )].map((match) => [match[2], match[1]]),
  );

  for (const [table, expected] of Object.entries(expectedColumns)) {
    const selections = calls.filter(
      (call) => call.method === "select" && call.table === table,
    );
    assert.equal(selections.length, 2);

    for (const selection of selections) {
      assert.deepEqual(selection.columns.split(", "), expected);
    }

    const grant = grants.get(table);
    assert.ok(grant, `missing canonical anon grant for ${table}`);
    const grantColumns = grant
      .split(",")
      .map((column) => column.trim())
      .filter(Boolean);
    assert.deepEqual([...expected].sort(), grantColumns.sort());
  }
});

test("public projections surface database errors without a fallback query", async () => {
  const { calls, client } = createFakeClient({}, () => ({
    data: null,
    error: { code: "42501", message: "permission denied" },
  }));

  await Promise.all([
    assert.rejects(listPublishedPosts(client, "notice"), /permission denied/),
    assert.rejects(getPublishedPost(client, "notice", "post-slug"), /permission denied/),
    assert.rejects(listPublishedPortfolioItems(client), /permission denied/),
    assert.rejects(
      getPublishedPortfolioItem(client, "portfolio-slug"),
      /permission denied/,
    ),
    assert.rejects(listPublishedReviews(client), /permission denied/),
    assert.rejects(getPublishedReview(client, "review-slug"), /permission denied/),
  ]);

  assert.equal(calls.filter((call) => call.method === "select").length, 6);
});

test("product pricing reads only valid print unit prices", () => {
  const poster = {
    priceRowsBySelection: {
      "0:0:0": [
        { quantity: 100, unitPrice: 600 },
        { quantity: 200, unitPrice: 350 },
        { quantity: 300, unitPrice: null },
      ],
      invalid: [{ quantity: 1, unitPrice: "100" }],
    },
  };

  assert.equal(getLowestProductUnitPrice(poster), 350);
  assert.equal(getLowestProductUnitPrice({}), null);
  assert.equal(getLowestProductUnitPrice([]), null);
});

test("product helpers use the JSONB product contract", async () => {
  const product = {
    configuration: { variants: { "브로슈어 · 카탈로그": {} } },
    created_at: "2026-08-07T00:00:00.000Z",
    id: "product-id",
    product_type: "브로슈어 · 카탈로그",
    sort_order: 1,
    status: "draft",
  };
  const { calls, client } = createFakeClient({ products: product });
  const input = {
    configuration: product.configuration,
    product_type: product.product_type,
    status: "draft",
  };

  assert.deepEqual(await getAdminProduct(client, product.id), product);
  assert.deepEqual(await getPublishedProduct(client, product.id), product);
  assert.deepEqual(await createProduct(client, input), product);
  assert.deepEqual(
    await updateProduct(client, product.id, {
      configuration: product.configuration,
      status: "published",
    }),
    product,
  );
  await deleteProduct(client, product.id);

  assert.ok(calls.some((call) => call.method === "insert"));
  assert.ok(calls.some((call) => call.method === "update"));
  assert.ok(calls.some((call) => call.method === "delete"));
  assert.ok(
    calls.some(
      (call) =>
        call.method === "eq" &&
        call.table === "products" &&
        call.column === "status" &&
        call.value === "published",
    ),
  );
  assert.ok(
    calls.some(
      (call) =>
        call.method === "eq" &&
        call.table === "products" &&
        call.column === "id" &&
        call.value === product.id,
    ),
  );
  assert.ok(calls.some((call) => call.method === "maybeSingle"));
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

test("complaint admin helpers use only the current complaint tables", async () => {
  const complaint = {
    complaint_attachments: [],
    complaint_type: "기타",
    content: "내용",
    created_at: "2026-08-07T00:00:00.000Z",
    email: null,
    id: "complaint-id",
    name: "고객",
    phone: "01012345678",
    phone_verified: true,
    privacy_agreed_at: "2026-08-07T00:00:00.000Z",
    service: "브로슈어",
    status: "received",
  };
  const { calls, client } = createFakeClient({ complaints: complaint });

  await listAdminComplaints(client);
  assert.deepEqual(await getAdminComplaint(client, complaint.id), complaint);
  await updateComplaintStatus(client, complaint.id, "resolved");

  assert.ok(calls.some((call) => call.table === "complaints"));
  assert.ok(
    calls.some(
      (call) =>
        call.method === "select" &&
        call.table === "complaints" &&
        call.columns === "*, complaint_attachments(*)",
    ),
  );
  assert.ok(
    calls.some(
      (call) =>
        call.method === "update" &&
        call.table === "complaints" &&
        call.value.status === "resolved",
    ),
  );
  assert.equal(calls.some((call) => call.table === "inquiries"), false);
});

test("complaint submission helpers write only the current complaint tables", async () => {
  const complaint = {
    complaint_type: "불친절한 서비스",
    content: "상담 과정에서 불편했습니다.",
    email: "customer@example.com",
    name: "고객",
    phone: "01012345678",
    phone_verified: false,
    privacy_agreed_at: "2026-08-08T00:00:00.000Z",
    service: "로고",
    status: "received",
  };
  const attachment = {
    bucket_id: "private-attachments",
    complaint_id: "complaint-id",
    content_type: "image/png",
    file_size: 123,
    object_path: "complaints/complaint-id/proof.png",
    original_file_name: "proof.png",
  };
  const { calls, client } = createFakeClient();

  await createComplaint(client, complaint);
  await createComplaintAttachments(client, [attachment]);
  assert.deepEqual(await createComplaintAttachments(client, []), []);

  assert.deepEqual(
    calls.find(
      (call) => call.method === "insert" && call.table === "complaints",
    )?.value,
    complaint,
  );
  assert.deepEqual(
    calls.find(
      (call) =>
        call.method === "insert" && call.table === "complaint_attachments",
    )?.value,
    [attachment],
  );
  assert.equal(
    calls.filter(
      (call) =>
        call.method === "insert" && call.table === "complaint_attachments",
    ).length,
    1,
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
