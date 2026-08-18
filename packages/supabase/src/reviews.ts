import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { TableInsert, TableRow, TableUpdate } from "./types.ts";

const publicReviewColumns =
  "id, company_name, content, content_mode, content_authoring_mode, content_asset_scope, created_at, kind, manager_name, project_deliverable, project_usage, published_at, seo_description, show_on_landing, slug, sort_order, status, title, video_alt, video_path, view_count, youtube_video_id";

/**
 * Deliberately narrow anonymous/public projection. Admin callers use the
 * full-row helpers below; no public `select("*")` API exists.
 */
export type PublicReviewRecord = Pick<
  TableRow<"reviews">,
  | "company_name"
  | "content"
  | "content_asset_scope"
  | "content_authoring_mode"
  | "content_mode"
  | "created_at"
  | "id"
  | "kind"
  | "manager_name"
  | "project_deliverable"
  | "project_usage"
  | "published_at"
  | "seo_description"
  | "show_on_landing"
  | "slug"
  | "sort_order"
  | "status"
  | "title"
  | "video_alt"
  | "video_path"
  | "view_count"
  | "youtube_video_id"
>;

export async function listPublishedReviews(client: CBrainSupabaseClient) {
  const { data, error } = await client
    .from("reviews")
    .select(publicReviewColumns)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return unwrapSupabaseData(data, error) as PublicReviewRecord[];
}

export async function getPublishedReview(
  client: CBrainSupabaseClient,
  slug: string,
) {
  const { data, error } = await client
    .from("reviews")
    .select(publicReviewColumns)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PublicReviewRecord | null;
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
