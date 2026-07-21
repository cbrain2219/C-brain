import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "./env.js";
import type { PublicSupabaseEnv } from "./env.js";
import type { Database } from "./types.js";

export function createBrowserSupabaseClient(
  env: PublicSupabaseEnv = getPublicSupabaseEnv(),
) {
  return createBrowserClient<Database>(env.url, env.publishableKey);
}
