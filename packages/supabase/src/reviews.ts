import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { TableInsert, TableUpdate } from "./types.ts";

export async function listPublishedReviews(client: CBrainSupabaseClient) {
  const { data, error } = await client
    .from("reviews")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function getPublishedReview(
  client: CBrainSupabaseClient,
  slug: string,
) {
  const { data, error } = await client
    .from("reviews")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function listAdminReviews(client: CBrainSupabaseClient) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("reviews")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function getAdminReview(
  client: CBrainSupabaseClient,
  id: string,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single();

  return unwrapSupabaseData(data, error);
}

export async function createReview(
  client: CBrainSupabaseClient,
  input: TableInsert<"reviews">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("reviews")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function updateReview(
  client: CBrainSupabaseClient,
  id: string,
  input: TableUpdate<"reviews">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("reviews")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function deleteReview(client: CBrainSupabaseClient, id: string) {
  await requireAdmin(client);

  const { error } = await client.from("reviews").delete().eq("id", id);

  assertSupabaseSuccess(error);
}

export async function reorderReviews(
  client: CBrainSupabaseClient,
  reviewIds: readonly string[],
) {
  await requireAdmin(client);

  const { error } = await client.rpc("reorder_reviews", {
    review_ids: [...reviewIds],
  });

  assertSupabaseSuccess(error);
}
