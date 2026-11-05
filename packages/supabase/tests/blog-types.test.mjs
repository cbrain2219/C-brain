import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteBlogType,
  listDeletedBlogTypes,
  restoreBlogType,
} from "../src/blogTypes.ts";

function fakeClient({ role = "admin", result = "deleted", error = null } = {}) {
  const calls = [];
  return {
    calls,
    auth: {
      getUser: async () => ({ data: { user: { app_metadata: { role } } }, error: null }),
    },
    from(table) {
      calls.push(["from", table]);
      return {
        select(columns) {
          calls.push(["select", columns]);
          return {
            order: async () => ({ data: [{ type_key: "로고" }], error }),
          };
        },
      };
    },
    async rpc(name, args) {
      calls.push([name, args]);
      return { data: result, error };
    },
  };
}

test("the shared deletion list only reads type keys", async () => {
  const client = fakeClient({ role: "user" });
  assert.deepEqual(await listDeletedBlogTypes(client), ["로고"]);
  assert.deepEqual(client.calls, [["from", "blog_type_deletions"], ["select", "type_key"]]);
});

test("deletion preserves each server decision and normalizes type aliases", async () => {
  for (const result of ["deleted", "blocked_published", "blocked_draft"]) {
    const client = fakeClient({ result });
    assert.equal(await deleteBlogType(client, " brochure-catalog "), result);
    assert.deepEqual(client.calls, [["delete_blog_type", { target_type: "브로슈어 · 카탈로그" }]]);
  }
});

test("only administrators can delete or restore types", async () => {
  const client = fakeClient({ role: "user" });
  await assert.rejects(deleteBlogType(client, "로고"), /Admin access required/);
  await assert.rejects(restoreBlogType(client, "로고"), /Admin access required/);
  assert.deepEqual(client.calls, []);
});

test("empty and filter-only values never reach the mutation RPC", async () => {
  for (const type of [" ", "전체"]) {
    const client = fakeClient();
    await assert.rejects(deleteBlogType(client, type));
    await assert.rejects(restoreBlogType(client, type));
    assert.deepEqual(client.calls, []);
  }
});

test("restoration uses the same canonical type as deletion", async () => {
  const client = fakeClient({ result: null });
  await restoreBlogType(client, "브로슈어·카탈로그");
  assert.deepEqual(client.calls, [["restore_blog_type", { target_type: "브로슈어 · 카탈로그" }]]);
});

test("database failures and unknown decisions cannot become successful deletions", async () => {
  const client = fakeClient({ error: { message: "database unavailable" } });
  await assert.rejects(deleteBlogType(client, "로고"), /database unavailable/);
  await assert.rejects(restoreBlogType(client, "로고"), /database unavailable/);
  await assert.rejects(listDeletedBlogTypes(client), /database unavailable/);
  await assert.rejects(deleteBlogType(fakeClient({ result: "unknown" }), "로고"));
});
