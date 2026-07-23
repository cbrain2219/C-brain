import type { MetadataRoute } from "next";

import { createRobotsRules } from "./_content/robots";

export default function robots(): MetadataRoute.Robots {
  return createRobotsRules();
}
