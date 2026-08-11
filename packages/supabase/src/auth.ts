import type { User } from "@supabase/supabase-js";

import type { CBrainSupabaseClient } from "./server.ts";

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

export async function requireAdmin(
  client: CBrainSupabaseClient,
): Promise<User> {
  const user = await requireUser(client);

  if (user.app_metadata?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return user;
}
