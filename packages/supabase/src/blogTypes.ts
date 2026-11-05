import { requireAdmin } from "./auth.ts";
import { blogAllCategory, normalizeBlogCategory } from "./categories.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";

export type BlogTypeDeletionResult = "deleted" | "blocked_published" | "blocked_draft";

function mutationType(value: string) {
  const type = normalizeBlogCategory(value);
  if (!type || type === blogAllCategory) throw new Error("Invalid blog type.");
  return type;
}

export async function listDeletedBlogTypes(client: CBrainSupabaseClient) {
  const { data, error } = await client
    .from("blog_type_deletions")
    .select("type_key")
    .order("type_key", { ascending: true });
  return unwrapSupabaseData(data, error).map((row) => row.type_key);
}

export async function deleteBlogType(
  client: CBrainSupabaseClient,
  value: string,
): Promise<BlogTypeDeletionResult> {
  await requireAdmin(client);
  const { data, error } = await client.rpc("delete_blog_type", {
    target_type: mutationType(value),
  });
  assertSupabaseSuccess(error);
  if (data !== "deleted" && data !== "blocked_published" && data !== "blocked_draft") {
    throw new Error("Unexpected blog type deletion result.");
  }
  return data;
}

export async function restoreBlogType(client: CBrainSupabaseClient, value: string) {
  await requireAdmin(client);
  const { error } = await client.rpc("restore_blog_type", {
    target_type: mutationType(value),
  });
  assertSupabaseSuccess(error);
}
