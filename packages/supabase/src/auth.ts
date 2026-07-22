import type { User } from "@supabase/supabase-js";

import { unwrapSupabaseData } from "./result.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { TableRow } from "./types.ts";

export async function getCurrentUser(client: CBrainSupabaseClient) {
  const { data, error } = await client.auth.getUser();

  if (error) return null;

  return data.user;
}

export async function requireUser(client: CBrainSupabaseClient): Promise<User> {
  const user = await getCurrentUser(client);

  if (!user) throw new Error("Authentication required.");

  return user;
}

export async function getCurrentProfile(client: CBrainSupabaseClient) {
  const user = await getCurrentUser(client);

  if (!user) return null;

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function requireAdmin(
  client: CBrainSupabaseClient,
): Promise<TableRow<"profiles">> {
  const user = await requireUser(client);

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .eq("role", "admin")
    .single();
  const profile = unwrapSupabaseData(data, error);

  if (profile.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return profile;
}
