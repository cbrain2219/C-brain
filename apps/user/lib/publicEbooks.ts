import "server-only";

import { getPublishedEbook } from "@repo/supabase";
import { cache } from "react";

import { createPublicUserSupabaseClient } from "./supabase";

async function loadPublicEbook(slug: string) {
  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return null;

    return await getPublishedEbook(client, slug);
  } catch (error) {
    console.error("Failed to load public E-book.", error);
    return null;
  }
}

export const getPublicEbook = cache(loadPublicEbook);
