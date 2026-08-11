import { requireAdmin } from "./auth.ts";
import { assertSupabaseSuccess, unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { TableInsert, TableUpdate } from "./types.ts";

export type PaymentLinkInput = Pick<
  TableInsert<"payment_links">,
  | "amount"
  | "category"
  | "client_name"
  | "page_quantity"
  | "paper"
  | "payment_name"
  | "service"
>;

export type PaymentLinkUpdate = Pick<
  TableUpdate<"payment_links">,
  | "amount"
  | "category"
  | "client_name"
  | "disabled_at"
  | "page_quantity"
  | "paper"
  | "payment_name"
  | "service"
>;

export async function listAdminPaymentLinks(client: CBrainSupabaseClient) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("payment_links")
    .select("*")
    .order("created_at", { ascending: false });

  return unwrapSupabaseData(data, error);
}

export async function getAdminPaymentLink(
  client: CBrainSupabaseClient,
  id: string,
) {
  await requireAdmin(client);

  const [{ data: link, error: linkError }, { data: orders, error: ordersError }] =
    await Promise.all([
      client.from("payment_links").select("*").eq("id", id).single(),
      client.from("orders").select("id").eq("payment_link_id", id).limit(1),
    ]);

  const paymentLink = unwrapSupabaseData(link, linkError);
  if (ordersError) throw new Error(ordersError.message);

  return { ...paymentLink, hasOrders: (orders?.length ?? 0) > 0 };
}

export async function createPaymentLink(
  client: CBrainSupabaseClient,
  input: PaymentLinkInput,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("payment_links")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function updatePaymentLink(
  client: CBrainSupabaseClient,
  id: string,
  input: PaymentLinkUpdate,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("payment_links")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function deletePaymentLink(
  client: CBrainSupabaseClient,
  id: string,
) {
  await requireAdmin(client);

  const { error } = await client.from("payment_links").delete().eq("id", id);

  assertSupabaseSuccess(error);
}

export async function getPublicPaymentLink(
  client: CBrainSupabaseClient,
  publicToken: string,
) {
  const { data, error } = await client
    .from("payment_links")
    .select("*")
    .eq("public_token", publicToken)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
