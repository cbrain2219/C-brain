import "server-only";

import { getPublicAssetUrl, getPublishedEbook } from "@repo/supabase";
import { cache } from "react";

import { createPublicUserSupabaseClient } from "./supabase";

async function loadPublicEbook(slug: string) {
  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return null;

    const ebook = await getPublishedEbook(client, slug);

    if (!ebook) return null;

    return {
      ...ebook,
      og_image_url: ebook.og_image_path
        ? getPublicAssetUrl(client, ebook.og_image_path)
        : null,
    };
  } catch (error) {
    console.error("Failed to load public E-book.", error);
    return null;
  }
}

export const getPublicEbook = cache(loadPublicEbook);
