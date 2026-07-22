import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { TableInsert, TableRow, TableUpdate } from "./types.ts";

type PostKind = TableRow<"posts">["kind"];

export async function listPublishedPosts(
  client: CBrainSupabaseClient,
  kind: PostKind,
) {
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("kind", kind)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function getPublishedPost(
  client: CBrainSupabaseClient,
  kind: PostKind,
  slug: string,
) {
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("kind", kind)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function listAdminPosts(
  client: CBrainSupabaseClient,
  kind: PostKind,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("kind", kind)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function getAdminPost(
  client: CBrainSupabaseClient,
  id: string,
  kind?: PostKind,
) {
  await requireAdmin(client);

  let query = client.from("posts").select("*").eq("id", id);

  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query.single();

  return unwrapSupabaseData(data, error);
}

export async function createPost(
  client: CBrainSupabaseClient,
  input: TableInsert<"posts">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("posts")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function updatePost(
  client: CBrainSupabaseClient,
  id: string,
  input: TableUpdate<"posts">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("posts")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function deletePost(client: CBrainSupabaseClient, id: string) {
  await requireAdmin(client);

  const { error } = await client.from("posts").delete().eq("id", id);

  assertSupabaseSuccess(error);
}

export async function reorderPosts(
  client: CBrainSupabaseClient,
  kind: PostKind,
  postIds: readonly string[],
) {
  await requireAdmin(client);

  const { error } = await client.rpc("reorder_posts", {
    post_ids: [...postIds],
    post_kind: kind,
  });

  assertSupabaseSuccess(error);
}
