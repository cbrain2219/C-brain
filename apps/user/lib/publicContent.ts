import "server-only";

import {
  createOrderProductCatalog,
  getPublicAssetUrl,
  listPublishedProducts,
  listPublishedPortfolioItems,
  listPublishedPosts,
  type TableRow,
} from "@repo/supabase";
import { connection } from "next/server";
import { cache } from "react";

import { mapBlogRows } from "../app/(site)/blog/_data/blogPosts";
import { mapPortfolioRows } from "../app/_content/portfolio";
import { createPublicUserSupabaseClient } from "./supabase";

export type PublishedBlogPostSource = Pick<
  TableRow<"posts">,
  "content" | "content_mode" | "id" | "slug"
>;

async function loadPublishedBlogContent() {
  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return { posts: [], sources: [] };

    const rows = await listPublishedPosts(client, "blog");

    return {
      posts: mapBlogRows(rows, (path) => getPublicAssetUrl(client, path)),
      sources: rows.map(({ content, content_mode, id, slug }) => ({
        content,
        content_mode,
        id,
        slug,
      })),
    };
  } catch (error) {
    console.error("Failed to load public content.", error);
    return { posts: [], sources: [] };
  }
}

const getPublishedBlogContent = cache(loadPublishedBlogContent);

async function loadPublishedBlogPosts() {
  return (await getPublishedBlogContent()).posts;
}

async function loadPublishedBlogPostSource(slug: string) {
  const { sources } = await getPublishedBlogContent();

  return sources.find((post) => post.slug === slug);
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

async function loadPublishedOrderProducts() {
  await connection();

  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return [];

    return createOrderProductCatalog(await listPublishedProducts(client));
  } catch (error) {
    console.error("Failed to load published products.", error);
    return [];
  }
}

export const getPublishedBlogPosts = cache(loadPublishedBlogPosts);
export const getPublishedBlogPostSource = cache(loadPublishedBlogPostSource);
export const getPublishedPortfolioItems = cache(loadPublishedPortfolioItems);
export const getPublishedOrderProducts = cache(loadPublishedOrderProducts);
