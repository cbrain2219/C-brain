import { isProductType } from "./categories.ts";
import { createOrderProductCatalogItem } from "./productCatalog.ts";
import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type {
  Json,
  TableInsert,
  TableRow,
  TableUpdate,
} from "./types.ts";

export type ProductRecord = TableRow<"products">;
export type ProductInsert = Pick<
  TableInsert<"products">,
  "configuration" | "product_type" | "status"
>;
export type ProductUpdate = Pick<
  TableUpdate<"products">,
  "configuration" | "product_type" | "status"
>;

export type PublicProduct = Pick<
  ProductRecord,
  "configuration" | "id" | "product_type" | "sort_order"
>;

function isJsonObject(value: Json | undefined): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getLowestProductUnitPrice(configuration: Json | undefined) {
  if (!isJsonObject(configuration)) return null;

  const rowsBySelection = configuration.priceRowsBySelection;

  if (!isJsonObject(rowsBySelection)) return null;

  let lowestPrice: number | null = null;

  for (const rows of Object.values(rowsBySelection)) {
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      if (!isJsonObject(row)) continue;

      const unitPrice = row.unitPrice;

      if (
        typeof unitPrice === "number" &&
        Number.isFinite(unitPrice) &&
        unitPrice >= 0 &&
        (lowestPrice === null || unitPrice < lowestPrice)
      ) {
        lowestPrice = unitPrice;
      }
    }
  }

  return lowestPrice;
}

export function getLowestProductPrice(configuration: Json, productType: string) {
  if (!isProductType(productType)) return null;

  return (
    createOrderProductCatalogItem({
      configuration,
      id: "price-preview",
      product_type: productType,
      sort_order: 0,
    })?.startingPrice ?? null
  );
}

export async function listPublishedProducts(client: CBrainSupabaseClient) {
  const { data, error } = await client
    .from("products")
    .select("id, configuration, product_type, sort_order")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function getPublishedProduct(
  client: CBrainSupabaseClient,
  id: string,
) {
  const { data, error } = await client
    .from("products")
    .select("id, configuration, product_type, sort_order")
    .eq("status", "published")
    .eq("id", id)
    .maybeSingle();

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
  input: ProductInsert,
) {
  await requireAdmin(client);

  const { data: firstProduct, error: sortOrderError } = await client
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (sortOrderError) throw new Error(sortOrderError.message);

  const { data, error } = await client
    .from("products")
    .insert({
      ...input,
      sort_order: (firstProduct?.sort_order ?? 0) - 1,
    })
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function updateProduct(
  client: CBrainSupabaseClient,
  id: string,
  input: ProductUpdate,
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
