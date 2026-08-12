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
    "../app/(site)/complaint/complaintSubmission.ts",
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

test("public category surfaces consume the shared six-category contract", async () => {
  const entries = await Promise.all(
    Object.entries(paths).map(async ([name, path]) => [
      name,
      await readFile(path, "utf8"),
    ]),
  );
  const sources = Object.fromEntries(entries);

  assert.match(
    sources.portfolio,
    /import \{[\s\S]*?productCategories[\s\S]*?\} from "@repo\/supabase\/categories"/,
  );
  assert.match(
    sources.portfolio,
    /export const portfolioCategories = productCategories/,
  );
  assert.match(sources.order, /import type \{ ProductCategoryId \}/);
  assert.match(
    sources.order,
    /satisfies Record<ProductCategoryId, AdminOrderProduct>/,
  );
  assert.match(sources.services, /productCategories/);
  assert.match(sources.blogTypes, /productTypes as BLOG_CATEGORY_VALUES/);
  assert.match(
    sources.blogCategories,
    /\["전체", \.\.\.BLOG_CATEGORY_VALUES\]/,
  );
  assert.match(
    sources.complaintSubmission,
    /export const serviceOptions = productTypes/,
  );
  assert.match(
    sources.landingServices,
    /import \{ services \} from "\.\.\/_content\/services"/,
  );
  assert.doesNotMatch(
    [sources.order, sources.services, sources.portfolio].join("\n"),
    /package-shopping-bag|photo-shoot|id: "etc"/,
  );
});
