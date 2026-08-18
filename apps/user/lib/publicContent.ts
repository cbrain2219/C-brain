import "server-only";

import {
  createOrderProductCatalog,
  getPublicAssetUrl,
  listPublishedProducts,
  listPublishedPortfolioItems,
  listPublishedPosts,
} from "@repo/supabase";
import { connection } from "next/server";
import { cache } from "react";

import type { PublicManagedContent } from "../components/ManagedContent";
import { mapBlogRows } from "../app/(site)/blog/_data/blogPosts";
import { mapPortfolioRows } from "../app/_content/portfolio";
import { createPublicUserSupabaseClient } from "./supabase";

export type PublishedBlogPostSource = PublicManagedContent & {
  id: string;
  slug: string;
};

export type PublishedPortfolioItemSource = PublicManagedContent & {
  id: string;
  slug: string;
};

async function loadPublishedBlogContent() {
  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return { posts: [], sources: [] };

    const rows = await listPublishedPosts(client, "blog");

    return {
      posts: mapBlogRows(rows, (path) => getPublicAssetUrl(client, path)),
      sources: rows.map((row) => ({
        content: row.content,
        contentAssetScope: row.content_asset_scope,
        contentAuthoringMode: row.content_authoring_mode,
        contentMode: row.content_mode,
        entity: "blog" as const,
        id: row.id,
        slug: row.slug,
        title: row.title,
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

async function loadPublishedPortfolioContent() {
  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return { items: [], sources: [] };

    const rows = await listPublishedPortfolioItems(client);

    return {
      items: mapPortfolioRows(rows, (path) => getPublicAssetUrl(client, path)),
      sources: rows.map((row) => ({
        content: row.content,
        contentAssetScope: row.content_asset_scope,
        contentAuthoringMode: row.content_authoring_mode,
        contentMode: row.content_mode,
        entity: "portfolio" as const,
        id: row.id,
        slug: row.slug,
        title: row.title,
      })),
    };
  } catch (error) {
    console.error("Failed to load public content.", error);
    return { items: [], sources: [] };
  }
}

const getPublishedPortfolioContent = cache(loadPublishedPortfolioContent);

async function loadPublishedPortfolioItems() {
  return (await getPublishedPortfolioContent()).items;
}

async function loadPublishedPortfolioItemSource(slug: string) {
  const { sources } = await getPublishedPortfolioContent();

  return sources.find((item) => item.slug === slug);
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
export const getPublishedPortfolioItemSource = cache(
  loadPublishedPortfolioItemSource,
);
export const getPublishedOrderProducts = cache(loadPublishedOrderProducts);
