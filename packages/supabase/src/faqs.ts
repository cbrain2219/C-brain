import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { TableInsert, TableUpdate } from "./types.ts";

export async function listPublishedFaqs(client: CBrainSupabaseClient) {
  const { data, error } = await client
    .from("faqs")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function listAdminFaqs(client: CBrainSupabaseClient) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true });

  return unwrapSupabaseData(data, error);
}

export async function createFaq(
  client: CBrainSupabaseClient,
  input: TableInsert<"faqs">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("faqs")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function updateFaq(
  client: CBrainSupabaseClient,
  id: string,
  input: TableUpdate<"faqs">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("faqs")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function deleteFaq(client: CBrainSupabaseClient, id: string) {
  await requireAdmin(client);

  const { error } = await client.from("faqs").delete().eq("id", id);

  assertSupabaseSuccess(error);
}
