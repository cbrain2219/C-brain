import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "./env.ts";
import type { PublicSupabaseEnv } from "./env.ts";
import type { Database } from "./types.ts";

export function createBrowserSupabaseClient(
  env: PublicSupabaseEnv = getPublicSupabaseEnv(),
) {
  return createBrowserClient<Database>(env.url, env.publishableKey);
}
