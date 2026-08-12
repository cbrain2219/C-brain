# Fixed Product Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin product types the single six-category contract used by admin authoring and the public portfolio, order, blog, and complaint surfaces.

**Architecture:** Add a dependency-free category registry under `@repo/supabase`, because the values are the canonical `products.product_type` domain contract and both apps already consume that workspace package. Public features derive their labels and IDs from that registry; legacy spelling and the old portfolio banner ID are accepted only at read/query boundaries. Blog keeps `전체` as a filter control, while its actual category choices are the six product categories.

**Tech Stack:** TypeScript 5/6, React 19, Next.js 16 App Router, Vite, Node test runner, Turborepo

## Global Constraints

- The fixed category order is `브로슈어 · 카탈로그`, `리플렛 · 팜플렛`, `포스터 · 전단지`, `배너 · 족자 · 현수막`, `명함 · 봉투`, `로고`.
- `전체` is not a product category; it remains only as the blog list's all-items filter.
- Do not add a database migration or rewrite existing rows for this UI/domain-contract change.
- Preserve legacy labels without spaces around `·` and the old `banner-book` portfolio query ID at read boundaries.
- Follow `design.md`; this change must not introduce new typography, icon, asset, spacing, or focus behavior.
- Do not leave Figma MCP asset URLs in `apps` or `packages`.

---

### Task 1: Create the canonical six-category contract

**Files:**

- Create: `packages/supabase/src/categories.ts`
- Modify: `packages/supabase/package.json`
- Modify: `packages/supabase/src/index.ts`
- Modify: `apps/admin/src/pages/productFormUi.ts`
- Create: `packages/supabase/tests/categories.test.mjs`

**Interfaces:**

- Produces: `productCategories`, `productTypes`, `ProductCategory`, `ProductCategoryId`, `ProductType`, `getProductCategory`, `getProductCategoryLabel`, and `isProductType` from `@repo/supabase/categories`.
- Consumes: no runtime dependencies.

- [x] **Step 1: Write the failing shared-contract test**

```js
test("product categories are fixed to the admin order and normalize legacy values", () => {
  assert.deepEqual(productTypes, [
    "브로슈어 · 카탈로그",
    "리플렛 · 팜플렛",
    "포스터 · 전단지",
    "배너 · 족자 · 현수막",
    "명함 · 봉투",
    "로고",
  ]);
  assert.equal(getProductCategory("브로슈어·카탈로그")?.id, "brochure-catalog");
  assert.equal(getProductCategory("banner-book")?.id, "banner-display");
  assert.equal(getProductCategory("기타"), undefined);
});
```

- [x] **Step 2: Run the contract test and confirm it fails before implementation**

Run: `pnpm --filter @repo/supabase test`

Expected: FAIL because `@repo/supabase/categories` does not exist.

- [x] **Step 3: Implement the dependency-free registry and package export**

```ts
export const productCategories = [
  { id: "brochure-catalog", label: "브로슈어 · 카탈로그" },
  { id: "leaflet-pamphlet", label: "리플렛 · 팜플렛" },
  { id: "poster-flyer", label: "포스터 · 전단지" },
  { id: "banner-display", label: "배너 · 족자 · 현수막" },
  { id: "business-card-envelope", label: "명함 · 봉투" },
  { id: "logo", label: "로고" },
] as const;

export type ProductCategory = (typeof productCategories)[number];
export type ProductCategoryId = ProductCategory["id"];
export type ProductType = ProductCategory["label"];

export const productTypes = productCategories.map(
  ({ label }) => label,
) as readonly ProductType[];
```

Add normalized label and legacy-ID lookup helpers, expose `./categories` from `packages/supabase/package.json`, and re-export the shared `productTypes`/`ProductType` from `productFormUi.ts` so current admin callers keep their API.

- [x] **Step 4: Run the shared package test and type check**

Run: `pnpm --filter @repo/supabase test && pnpm --filter @repo/supabase check-types`

Expected: PASS.

### Task 2: Drive all public category surfaces from the shared contract

**Files:**

- Modify: `apps/user/app/_content/portfolio.ts`
- Modify: `apps/user/app/_content/order.ts`
- Modify: `apps/user/app/_content/services.ts`
- Modify: `apps/user/app/_components/ServicesSection.tsx`
- Modify: `apps/user/app/(site)/blog/_types/blog.ts`
- Modify: `apps/user/app/(site)/blog/_constants/blogCategories.ts`
- Modify: `apps/user/app/(site)/blog/_data/blogPosts.ts`
- Modify: `apps/user/app/(site)/complaint/complaintSubmission.ts`
- Modify: `apps/user/__tests__/portfolio-content.test.mjs`
- Modify: `apps/user/__tests__/order-page.test.mjs`
- Modify: `apps/user/__tests__/blog-page.test.mjs`
- Modify: `apps/user/__tests__/complaint-page.test.mjs`
- Modify: `apps/user/__tests__/services-section.test.mjs`

**Interfaces:**

- Consumes: the category registry from Task 1.
- Produces: six portfolio chips, six order cards, six complaint service options, and six blog category values plus the separate `전체` filter.

- [x] **Step 1: Add or update failing public contract assertions**

```js
assert.deepEqual(
  portfolioCategories.map(({ label }) => label),
  productTypes,
);
assert.equal(services.length, 6);
assert.deepEqual(BLOG_CATEGORY_VALUES, productTypes);
assert.deepEqual(serviceOptions, productTypes);
```

Also assert that `패키지 · 쇼핑백`, `촬영`, and `기타` no longer occur in the category source arrays, while `BLOG_CATEGORIES` starts with `전체` and then contains the six product labels.

- [x] **Step 2: Run the focused user tests and confirm the old 9/4-value contracts fail**

Run: `pnpm --filter user test`

Expected: FAIL on the old category-array expectations.

- [x] **Step 3: Refactor portfolio, order, complaint, and blog data sources**

Use `productCategories` for portfolio IDs/labels, make `PortfolioCategoryId` an alias of `ProductCategoryId`, and normalize stored types through `getProductCategory`. Remove `package-shopping-bag`, `photo-shoot`, and `etc` from order/service registrations. Make both landing and order service-card grids consume the same six-item `services` collection. Make complaint `serviceOptions` reference `productTypes`. Make blog category values reference `productTypes`, normalize known legacy labels when rows are mapped, and preserve unknown historic blog types only in the `전체` result rather than inventing a misleading product category.

- [x] **Step 4: Run the user tests and type check**

Run: `pnpm --filter user test && pnpm --filter user check-types`

Expected: PASS.

### Task 3: Fix admin authoring options and verify the complete change

**Files:**

- Modify: `apps/admin/src/pages/PortfolioFormPage.tsx`
- Modify: `apps/admin/src/pages/BlogFormPage.tsx`
- Modify: `apps/admin/tests/productFormUi.test.mjs`
- Create: `apps/admin/tests/contentCategoryForms.test.mjs`

**Interfaces:**

- Consumes: `productTypes` and `isProductType` from Task 1.
- Produces: fixed six-option admin portfolio/blog type selectors that cannot create new arbitrary categories.

- [x] **Step 1: Add failing admin assertions for shared fixed options**

```js
assert.match(portfolioSource, /options=\{productTypes\}/);
assert.match(blogSource, /options=\{productTypes\}/);
assert.doesNotMatch(portfolioSource, /allowCustomValue/);
assert.doesNotMatch(blogSource, /allowCustomValue/);
```

- [x] **Step 2: Run admin tests and confirm the dynamic/custom option contracts fail**

Run: `pnpm --filter admin test`

Expected: FAIL until both forms consume the shared list.

- [x] **Step 3: Replace dynamic type accumulation with the fixed registry**

Import `productTypes` and `isProductType` from `@repo/supabase/categories`. Remove `defaultPortfolioTypes`, `portfolioTypes`, `blogTypes`, and custom-value accumulation. Keep legacy values readable while editing, but require a canonical product type before saving.

- [x] **Step 4: Run repository verification**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter admin test
pnpm --filter user test
pnpm check-types
pnpm lint
pnpm --filter user build
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: all tests, checks, lint, and build pass; the final `rg` command returns no matches.

- [x] **Step 5: Perform responsive visual QA**

Run the user app locally and inspect `/`, `/portfolio`, `/order`, `/blog`, and `/complaint` at desktop and mobile widths. Confirm six category choices appear in the canonical order, blog additionally shows `전체`, horizontal category rails remain usable, the complaint select contains six options, and no layout regression is introduced.
