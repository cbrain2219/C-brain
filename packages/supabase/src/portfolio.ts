import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { TableInsert, TableRow, TableUpdate } from "./types.ts";

const publicPortfolioColumns =
  "id, client_name, content, content_mode, content_authoring_mode, content_asset_scope, created_at, images, pinned, published_at, show_on_landing, slug, sort_order, status, title, type, view_count";

/**
 * Deliberately narrow anonymous/public projection. Admin callers use the
 * full-row helpers below; no public `select("*")` API exists.
 */
export type PublicPortfolioRecord = Pick<
  TableRow<"portfolio_items">,
  | "client_name"
  | "content"
  | "content_asset_scope"
  | "content_authoring_mode"
  | "content_mode"
  | "created_at"
  | "id"
  | "images"
  | "pinned"
  | "published_at"
  | "show_on_landing"
  | "slug"
  | "sort_order"
  | "status"
  | "title"
  | "type"
  | "view_count"
>;

export async function listPublishedPortfolioItems(
  client: CBrainSupabaseClient,
) {
  const { data, error } = await client
    .from("portfolio_items")
    .select(publicPortfolioColumns)
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return unwrapSupabaseData(data, error) as PublicPortfolioRecord[];
}

export async function getPublishedPortfolioItem(
  client: CBrainSupabaseClient,
  slug: string,
) {
  const { data, error } = await client
    .from("portfolio_items")
    .select(publicPortfolioColumns)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PublicPortfolioRecord | null;
}

export async function listAdminPortfolioItems(client: CBrainSupabaseClient) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("portfolio_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function getAdminPortfolioItem(
  client: CBrainSupabaseClient,
  id: string,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("portfolio_items")
    .select("*")
    .eq("id", id)
    .single();

  return unwrapSupabaseData(data, error);
}

export async function createPortfolioItem(
  client: CBrainSupabaseClient,
  input: TableInsert<"portfolio_items">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("portfolio_items")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function updatePortfolioItem(
  client: CBrainSupabaseClient,
  id: string,
  input: TableUpdate<"portfolio_items">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("portfolio_items")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function deletePortfolioItem(
  client: CBrainSupabaseClient,
  id: string,
) {
  await requireAdmin(client);

  const { error } = await client.from("portfolio_items").delete().eq("id", id);

  assertSupabaseSuccess(error);
}

export async function reorderPortfolioItems(
  client: CBrainSupabaseClient,
  portfolioItemIds: readonly string[],
) {
  await requireAdmin(client);

  const { error } = await client.rpc("reorder_portfolio_items", {
    portfolio_item_ids: [...portfolioItemIds],
  });

  assertSupabaseSuccess(error);
}
