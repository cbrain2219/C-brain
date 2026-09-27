import "server-only";

import {
  createOrderProductCatalog,
  getPublicAssetUrl,
  getPublishedPost,
  getPublishedPortfolioItem as getPortfolioRow,
  listPublishedProducts,
  listPublishedPortfolioSummaries,
  listPublishedPostSummaries,
} from "@repo/supabase";
import { connection } from "next/server";
import { cache } from "react";

import type { PublicManagedContent } from "../components/ManagedContent";
import { mapBlogRows } from "../app/(site)/blog/_data/blogPosts";
import { mapPortfolioRows } from "../app/_content/portfolio";
import { createPublicUserSupabaseClient } from "./supabase";
import { readCachedPublicContent } from "./publicContentCache";

export type PublishedBlogPostSource = PublicManagedContent & {
  id: string;
  slug: string;
};

export type PublishedPortfolioItemSource = PublicManagedContent & {
  id: string;
  slug: string;
};

async function loadPublishedBlogPosts() {
  const client = createPublicUserSupabaseClient();
  if (!client) return [];

  try {
    return await readCachedPublicContent("blog", null, async () =>
      mapBlogRows(await listPublishedPostSummaries(client, "blog"), (path) =>
        getPublicAssetUrl(client, path),
      ),
    );
  } catch (error) {
    console.error("Failed to load public blog summaries.", error);
    return [];
  }
}

async function loadPublishedBlogDetail(slug: string) {
  const client = createPublicUserSupabaseClient();
  if (!client) return null;

  try {
    return await readCachedPublicContent("blog", slug, async () => {
      const row = await getPublishedPost(client, "blog", slug);
      if (!row) return null;
      return {
        post: mapBlogRows([row], (path) => getPublicAssetUrl(client, path))[0],
        source: {
          content: row.content,
          contentAssetScope: row.content_asset_scope,
          contentAuthoringMode: row.content_authoring_mode,
          contentMode: row.content_mode,
          entity: "blog" as const,
          id: row.id,
          slug: row.slug,
          title: row.title,
        } satisfies PublishedBlogPostSource,
      };
    });
  } catch (error) {
    console.error("Failed to load public blog detail.", error);
    return null;
  }
}

const getPublishedBlogDetail = cache(loadPublishedBlogDetail);

async function loadPublishedBlogPostSource(slug: string) {
  return (await getPublishedBlogDetail(slug))?.source;
}

async function loadPublishedPortfolioItems() {
  const client = createPublicUserSupabaseClient();
  if (!client) return [];

  try {
    return await readCachedPublicContent("portfolio", null, async () =>
      mapPortfolioRows(await listPublishedPortfolioSummaries(client), (path) =>
        getPublicAssetUrl(client, path),
      ),
    );
  } catch (error) {
    console.error("Failed to load public portfolio summaries.", error);
    return [];
  }
}

async function loadPublishedPortfolioDetail(slug: string) {
  const client = createPublicUserSupabaseClient();
  if (!client) return null;

  try {
    return await readCachedPublicContent("portfolio", slug, async () => {
      const row = await getPortfolioRow(client, slug);
      if (!row) return null;
      const item = mapPortfolioRows([row], (path) =>
        getPublicAssetUrl(client, path),
      )[0];
      if (!item) return null;
      return {
        item,
        source: {
          content: row.content,
          contentAssetScope: row.content_asset_scope,
          contentAuthoringMode: row.content_authoring_mode,
          contentMode: row.content_mode,
          entity: "portfolio" as const,
          id: row.id,
          slug: row.slug,
          title: row.title,
        } satisfies PublishedPortfolioItemSource,
      };
    });
  } catch (error) {
    console.error("Failed to load public portfolio detail.", error);
    return null;
  }
}

const getPublishedPortfolioDetail = cache(loadPublishedPortfolioDetail);

async function loadPublishedPortfolioItemSource(slug: string) {
  return (await getPublishedPortfolioDetail(slug))?.source;
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
export const getPublishedBlogPost = cache(
  async (slug: string) => (await getPublishedBlogDetail(slug))?.post,
);
export const getPublishedBlogPostSource = cache(loadPublishedBlogPostSource);
export const getPublishedPortfolioItems = cache(loadPublishedPortfolioItems);
export const getPublishedPortfolioItem = cache(
  async (slug: string) => (await getPublishedPortfolioDetail(slug))?.item,
);
export const getPublishedPortfolioItemSource = cache(
  loadPublishedPortfolioItemSource,
);
export const getPublishedOrderProducts = cache(loadPublishedOrderProducts);
