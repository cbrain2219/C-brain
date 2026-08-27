import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { TableInsert, TableRow, TableUpdate } from "./types.ts";

const publicEbookColumns =
  "embed_url, og_image_alt, og_image_path, seo_description, slug, status, title";

export type PublicEbookRecord = Pick<
  TableRow<"ebooks">,
  | "embed_url"
  | "og_image_alt"
  | "og_image_path"
  | "seo_description"
  | "slug"
  | "status"
  | "title"
>;

export async function getPublishedEbook(
  client: CBrainSupabaseClient,
  slug: string,
) {
  const { data, error } = await client
    .from("ebooks")
    .select(publicEbookColumns)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PublicEbookRecord | null;
}

export async function listAdminEbooks(client: CBrainSupabaseClient) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("ebooks")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function getAdminEbook(client: CBrainSupabaseClient, id: string) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("ebooks")
    .select("*")
    .eq("id", id)
    .single();

  return unwrapSupabaseData(data, error);
}

export async function createEbook(
  client: CBrainSupabaseClient,
  input: TableInsert<"ebooks">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("ebooks")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function updateEbook(
  client: CBrainSupabaseClient,
  id: string,
  input: TableUpdate<"ebooks">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("ebooks")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function deleteEbook(client: CBrainSupabaseClient, id: string) {
  await requireAdmin(client);

  const { error } = await client.from("ebooks").delete().eq("id", id);

  assertSupabaseSuccess(error);
}
