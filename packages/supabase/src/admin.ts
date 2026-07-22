import { createClient } from "@supabase/supabase-js";

import { getServerSupabaseEnv } from "./env.ts";
import type { CBrainSupabaseClient } from "./server.ts";
import type { Database } from "./types.ts";

export function createAdminSupabaseClient(): CBrainSupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("Admin Supabase client can only be created on the server.");
  }

  const { secretKey, url } = getServerSupabaseEnv();

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown as CBrainSupabaseClient;
}
