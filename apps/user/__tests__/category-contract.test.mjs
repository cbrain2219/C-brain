import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paths = {
  blogCategories: new URL(
    "../app/(site)/blog/_constants/blogCategories.ts",
    import.meta.url,
  ),
  blogTypes: new URL("../app/(site)/blog/_types/blog.ts", import.meta.url),
  complaintSubmission: new URL(
    "../app/(site)/report/complaintSubmission.ts",
    import.meta.url,
  ),
  landingServices: new URL(
    "../app/_components/ServicesSection.tsx",
    import.meta.url,
  ),
  order: new URL("../app/_content/order.ts", import.meta.url),
  portfolio: new URL("../app/_content/portfolio.ts", import.meta.url),
  services: new URL("../app/_content/services.ts", import.meta.url),
};

test("portfolio uses shared portfolio-only categories without changing the product category contract", async () => {
  const entries = await Promise.all(
    Object.entries(paths).map(async ([name, path]) => [
      name,
      await readFile(path, "utf8"),
    ]),
  );
  const sources = Object.fromEntries(entries);

  assert.match(
    sources.portfolio,
    /portfolioCategories as sharedPortfolioCategories/,
  );
  assert.match(
    sources.portfolio,
    /export const portfolioCategories = sharedPortfolioCategories/,
  );
  assert.match(sources.portfolio, /getSharedPortfolioCategory\(type\)\?\.id/);
  assert.match(sources.order, /import type \{ ProductCategoryId \}/);
  assert.match(
    sources.order,
    /Partial<Record<ProductOptionSectionKey, string>>/,
  );
  assert.match(
    sources.services,
    /satisfies Record<[\s\S]*?ProductCategoryId/,
  );
  assert.match(sources.services, /createServiceItems/);
  assert.match(sources.blogTypes, /export type BlogCategory = string/);
  assert.match(
    sources.blogCategories,
    /getBlogCategoryOptions\(posts\.map\(\(post\) => post\.category\)\)/,
  );
  assert.match(sources.blogCategories, /blogAllCategory/);
  assert.match(
    sources.complaintSubmission,
    /export const serviceOptions = productTypes/,
  );
  assert.match(
    sources.landingServices,
    /services: readonly ServiceItem\[\]/,
  );
  assert.doesNotMatch(
    sources.services,
    /package-shopping-bag|photo-shoot|id: "etc"/,
  );
  assert.match(sources.order, /id: "package-shopping-bag"/);
  assert.match(sources.order, /id: "photo-shoot"/);
  assert.match(sources.order, /id: "etc"/);
  assert.match(sources.portfolio, /"package-shopping-bag": "package"/);
  assert.match(sources.portfolio, /"photo-shoot": "photo"/);
});
