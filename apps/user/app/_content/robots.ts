import type { MetadataRoute } from "next";

import { getPageUrl } from "./seo.ts";

export const robotsDisallowedPaths = [
  "/api/",
  "/order/success",
  "/order/fail",
  "/linkpay/",
] as const;

export function createRobotsRules(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: [...robotsDisallowedPaths],
      userAgent: "*",
    },
    sitemap: getPageUrl("/sitemap.xml").toString(),
  };
}
