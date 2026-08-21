import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { TableInsert, TableRow, TableUpdate } from "./types.ts";

const publicReviewColumns =
  "id, company_name, content, content_mode, content_authoring_mode, content_asset_scope, created_at, kind, manager_name, product_type, project_deliverable, project_usage, published_at, rating, seo_description, show_on_landing, slug, sort_order, status, title, video_alt, video_path, view_count, youtube_video_id";

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
  | "product_type"
  | "project_deliverable"
  | "project_usage"
  | "published_at"
  | "rating"
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

export type ReviewSubmissionDraftInput = Pick<
  TableInsert<"reviews">,
  | "company_name"
  | "content"
  | "content_authoring_mode"
  | "content_json"
  | "content_mode"
  | "content_schema_version"
  | "manager_name"
  | "product_type"
  | "rating"
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

export async function createReviewSubmissionDraft(
  client: CBrainSupabaseClient,
  input: ReviewSubmissionDraftInput,
) {
  const submittedAt = new Date().toISOString();
  const { data, error } = await client
    .from("reviews")
    .insert({
      ...input,
      created_at: submittedAt,
      kind: "testimonial",
      published_at: submittedAt,
      show_on_landing: false,
      status: "draft",
    })
    .select("id, status")
    .single();

  return unwrapSupabaseData(data, error);
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

  const { data: firstReview, error: sortOrderError } = await client
    .from("reviews")
    .select("sort_order")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (sortOrderError) throw new Error(sortOrderError.message);

  const { data, error } = await client
    .from("reviews")
    .insert({
      ...input,
      sort_order: (firstReview?.sort_order ?? 0) - 1,
    })
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
