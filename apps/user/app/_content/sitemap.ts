import type { MetadataRoute } from "next";

import {
  getPageUrl,
  pageSeo,
  type StaticPageSeoEntry,
  type StaticPageSeoKey,
} from "./seo.ts";

type SitemapEntry = MetadataRoute.Sitemap[number];
type SitemapChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

type SitemapRouteOptions = {
  changeFrequency: SitemapChangeFrequency;
  lastModified?: Date | string;
  priority: number;
};

export type SitemapDynamicRoute = SitemapRouteOptions & {
  path: StaticPageSeoEntry["path"] | `/${string}`;
};

export const sitemapStaticPageKeys = [
  "home",
  "about",
  "portfolio",
  "reviews",
  "blog",
  "notice",
  "faq",
  "order",
  "complaint",
  "terms",
  "privacyPolicy",
  "privacyCollection",
  "refundPolicy",
] as const satisfies readonly StaticPageSeoKey[];

type SitemapStaticPageKey = (typeof sitemapStaticPageKeys)[number];

const sitemapStaticPageOptions: Record<
  SitemapStaticPageKey,
  SitemapRouteOptions
> = {
  home: { changeFrequency: "weekly", priority: 1 },
  about: { changeFrequency: "monthly", priority: 0.8 },
  portfolio: { changeFrequency: "weekly", priority: 0.9 },
  reviews: { changeFrequency: "weekly", priority: 0.8 },
  blog: { changeFrequency: "weekly", priority: 0.85 },
  notice: { changeFrequency: "weekly", priority: 0.7 },
  faq: { changeFrequency: "monthly", priority: 0.75 },
  order: { changeFrequency: "weekly", priority: 0.85 },
  complaint: { changeFrequency: "yearly", priority: 0.35 },
  terms: { changeFrequency: "yearly", priority: 0.2 },
  privacyPolicy: { changeFrequency: "yearly", priority: 0.2 },
  privacyCollection: { changeFrequency: "yearly", priority: 0.2 },
  refundPolicy: { changeFrequency: "yearly", priority: 0.2 },
};

function createSitemapEntry({
  changeFrequency,
  lastModified,
  path,
  priority,
}: SitemapDynamicRoute): SitemapEntry {
  return {
    changeFrequency,
    lastModified,
    priority,
    url: getPageUrl(path).toString(),
  };
}

export function createSitemapEntries(
  dynamicRoutes: readonly SitemapDynamicRoute[] = [],
): MetadataRoute.Sitemap {
  const staticRoutes = sitemapStaticPageKeys.map((pageKey) =>
    createSitemapEntry({
      path: pageSeo[pageKey].path,
      ...sitemapStaticPageOptions[pageKey],
    }),
  );
  const entriesByUrl = new Map<string, SitemapEntry>();

  for (const entry of [
    ...staticRoutes,
    ...dynamicRoutes.map(createSitemapEntry),
  ]) {
    if (!entriesByUrl.has(entry.url)) {
      entriesByUrl.set(entry.url, entry);
    }
  }

  return [...entriesByUrl.values()];
}
