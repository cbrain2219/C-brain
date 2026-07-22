import { requireAdmin } from "./auth.ts";
import { unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { InquiryStatus, TableInsert, TableUpdate } from "./types.ts";

export async function createInquiry(
  client: CBrainSupabaseClient,
  input: TableInsert<"inquiries">,
) {
  const { data, error } = await client
    .from("inquiries")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function listAdminInquiries(client: CBrainSupabaseClient) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("inquiries")
    .select("*, inquiry_attachments(*)")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  return unwrapSupabaseData(data, error);
}

export async function getAdminInquiry(
  client: CBrainSupabaseClient,
  id: string,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("inquiries")
    .select("*, inquiry_attachments(*)")
    .eq("id", id)
    .single();

  return unwrapSupabaseData(data, error);
}

export async function createInquiryAttachment(
  client: CBrainSupabaseClient,
  input: TableInsert<"inquiry_attachments">,
) {
  const { data, error } = await client
    .from("inquiry_attachments")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function createInquiryAttachments(
  client: CBrainSupabaseClient,
  inputs: TableInsert<"inquiry_attachments">[],
) {
  if (inputs.length === 0) return [];

  const { data, error } = await client
    .from("inquiry_attachments")
    .insert(inputs)
    .select("*");

  return unwrapSupabaseData(data, error);
}

export async function updateInquiry(
  client: CBrainSupabaseClient,
  id: string,
  input: TableUpdate<"inquiries">,
) {
  await requireAdmin(client);

  const { data, error } = await client
    .from("inquiries")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function updateInquiryStatus(
  client: CBrainSupabaseClient,
  id: string,
  status: InquiryStatus,
) {
  return updateInquiry(client, id, { status });
}
