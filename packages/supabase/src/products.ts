import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { Json, TableInsert, TableRow, TableUpdate } from "./types.ts";

export type PublicProduct = Pick<
  TableRow<"products">,
  "id" | "name" | "sort_order" | "type" | "unit_prices"
>;

export function getLowestProductUnitPrice(unitPrices: Json) {
  if (
    typeof unitPrices !== "object" ||
    unitPrices === null ||
    Array.isArray(unitPrices)
  ) {
    return null;
  }

  let lowestPrice: number | null = null;

  for (const value of Object.values(unitPrices)) {
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      (lowestPrice === null || value < lowestPrice)
    ) {
      lowestPrice = value;
    }
  }

  return lowestPrice;
}

export async function listPublishedProducts(client: CBrainSupabaseClient) {
  const { data, error } = await client
    .from("products")
    .select("id, name, sort_order, type, unit_prices")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function listAdminProducts(client: CBrainSupabaseClient) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function getAdminProduct(
  client: CBrainSupabaseClient,
  id: string,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  return unwrapSupabaseData(data, error);
}

export async function createProduct(
  client: CBrainSupabaseClient,
  input: TableInsert<"products">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("products")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function updateProduct(
  client: CBrainSupabaseClient,
  id: string,
  input: TableUpdate<"products">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("products")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function deleteProduct(client: CBrainSupabaseClient, id: string) {
  await requireAdmin(client);

  const { error } = await client.from("products").delete().eq("id", id);

  assertSupabaseSuccess(error);
}

export async function reorderProducts(
  client: CBrainSupabaseClient,
  productIds: readonly string[],
) {
  await requireAdmin(client);

  const { error } = await client.rpc("reorder_products", {
    product_ids: [...productIds],
  });

  if (error) throw error;
}
