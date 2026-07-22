import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "./env.ts";
import type { Database } from "./types.ts";

export type SupabaseCookie = {
  name: string;
  value: string;
};

export type SupabaseCookieStore = {
  getAll: () => SupabaseCookie[];
  set?: (name: string, value: string, options: CookieOptions) => void;
};

export type CBrainSupabaseClient = ReturnType<
  typeof createServerClient<Database>
>;

export function createServerSupabaseClient(
  cookieStore: SupabaseCookieStore,
): CBrainSupabaseClient {
  const { publishableKey, url } = getPublicSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (!cookieStore.set) return;

        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set?.(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; Route Handlers and proxy can.
        }
      },
    },
  });
}
