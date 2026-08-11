import "server-only";

import {
  getPublicAssetUrl,
  listPublishedPortfolioItems,
  listPublishedPosts,
} from "@repo/supabase";
import { cache } from "react";

import { mapBlogRows } from "../app/(site)/blog/_data/blogPosts";
import { mapPortfolioRows } from "../app/_content/portfolio";
import { createPublicUserSupabaseClient } from "./supabase";

async function loadPublishedBlogPosts() {
  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return [];

    const rows = await listPublishedPosts(client, "blog");

    return mapBlogRows(rows, (path) => getPublicAssetUrl(client, path));
  } catch (error) {
    console.error("Failed to load public content.", error);
    return [];
  }
}

async function loadPublishedPortfolioItems() {
  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return [];

    const rows = await listPublishedPortfolioItems(client);

    return mapPortfolioRows(rows, (path) => getPublicAssetUrl(client, path));
  } catch (error) {
    console.error("Failed to load public content.", error);
    return [];
  }
}

export const getPublishedBlogPosts = cache(loadPublishedBlogPosts);
export const getPublishedPortfolioItems = cache(loadPublishedPortfolioItems);
