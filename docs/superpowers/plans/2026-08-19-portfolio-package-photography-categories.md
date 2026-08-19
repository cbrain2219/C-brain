# Portfolio Package and Photography Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `패키지 · 쇼핑백` and `촬영` as portfolio-only categories in the admin form and both user-facing portfolio category rails, in the requested order.

**Architecture:** Keep `productCategories` unchanged so order, product, complaint, and blog category contracts are unaffected. Add the two entries to the shared `portfolioCategories` registry in `@repo/supabase/categories`; the admin form and both user portfolio surfaces already consume that registry, so they update without duplicating category data.

**Tech Stack:** TypeScript, React, Next.js, Vite, Node test runner, pnpm workspace

**Spec:** User-provided category order captured below; UI behavior must continue to follow `design.md`.

## Global Constraints

- Final portfolio order must be `브로슈어 · 카탈로그`, `리플렛 · 팜플렛`, `포스터 · 전단지`, `배너 · 족자 · 현수막`, `명함 · 봉투`, `로고`, `패키지 · 쇼핑백`, `촬영`, `기타`.
- Use stable IDs `package-shopping-bag` and `photo-shoot`.
- Do not add these entries to `productCategories`, `productTypes`, order categories, or blog defaults.
- Keep the user category adapter in `apps/user/app/_content/portfolio.ts` backed by the shared registry; do not create a second list.
- Do not add Figma asset URLs or change visual tokens, spacing, typography, icons, or assets.
- Work in the current user-authorized workspace and leave the implementation uncommitted unless the user separately requests a commit.

---

### Task 1: Define and test the portfolio-only category contract

**Files:**
- Modify: `packages/supabase/tests/categories.test.mjs`
- Modify: `packages/supabase/src/categories.ts`

**Interfaces:**
- Consumes: existing `productCategories`, `productTypes`, and portfolio lookup/type-guard helpers.
- Produces: `portfolioCategories` and `portfolioTypes` containing `package-shopping-bag` / `패키지 · 쇼핑백` and `photo-shoot` / `촬영` before `other` / `기타`.

- [x] **Step 1: Write the failing category registry test**

Update the portfolio category expectation to:

```js
assert.deepEqual(portfolioTypes, [
  ...productTypes,
  "패키지 · 쇼핑백",
  "촬영",
  "기타",
]);
assert.deepEqual(
  portfolioCategories.map(({ id }) => id),
  [
    ...productCategories.map(({ id }) => id),
    "package-shopping-bag",
    "photo-shoot",
    "other",
  ],
);
assert.equal(getPortfolioCategory("패키지·쇼핑백")?.id, "package-shopping-bag");
assert.equal(getPortfolioCategoryLabel("photo-shoot"), "촬영");
assert.equal(isPortfolioType("촬영"), true);
assert.equal(isProductType("촬영"), false);
```

- [x] **Step 2: Run the registry test and confirm it fails**

Run:

```bash
pnpm --filter @repo/supabase exec node --experimental-strip-types --test tests/categories.test.mjs
```

Expected: FAIL because the shared portfolio registry does not yet contain the two new entries.

- [x] **Step 3: Add the minimal shared registry entries**

Define the portfolio-only entries between the spread product categories and `기타`:

```ts
export const portfolioCategories = [
  ...productCategories,
  { id: "package-shopping-bag", label: "패키지 · 쇼핑백" },
  { id: "photo-shoot", label: "촬영" },
  { id: "other", label: "기타" },
] as const;
```

- [x] **Step 4: Run the registry test and confirm it passes**

Run:

```bash
pnpm --filter @repo/supabase exec node --experimental-strip-types --test tests/categories.test.mjs
```

Expected: all category tests PASS and the six product categories remain unchanged.

---

### Task 2: Keep user/admin consumers synchronized and verify the rendered order

**Files:**
- Modify: `apps/user/__tests__/category-contract.test.mjs`
- Verify: `apps/user/app/_content/portfolio.ts`
- Verify: `apps/user/app/_components/PortfolioSection.tsx`
- Verify: `apps/user/app/(site)/portfolio/PortfolioGallery.tsx`
- Verify: `apps/admin/src/pages/PortfolioFormPage.tsx`

**Interfaces:**
- Consumes: `portfolioCategories`, `portfolioTypes`, and `PortfolioCategoryId` from `@repo/supabase/categories`.
- Produces: the requested category options and order in the admin portfolio type combobox, landing portfolio chips, and portfolio listing tabs.

- [x] **Step 1: Update the user contract test description without adding a duplicate list**

Rename the contract test to:

```js
test("portfolio uses shared portfolio-only categories without changing the product category contract", async () => {
```

Keep the assertions that `apps/user/app/_content/portfolio.ts` re-exports `sharedPortfolioCategories` and that order/service/user adapter sources do not hardcode `package-shopping-bag` or `photo-shoot`.

- [x] **Step 2: Run consumer contract tests**

Run:

```bash
pnpm --filter user exec node --test __tests__/category-contract.test.mjs __tests__/portfolio-page.test.mjs
pnpm --filter admin exec node --experimental-strip-types --test tests/contentCategoryForms.test.mjs
```

Expected: PASS, proving both user surfaces and the admin form continue to consume the shared registry.

- [x] **Step 3: Run type checks and workspace-level category tests**

Run:

```bash
pnpm --filter @repo/supabase check-types
pnpm --filter user check-types
pnpm --filter admin build
```

Expected: all commands exit successfully.

- [x] **Step 4: Verify the live user and admin surfaces**

On `http://localhost:3000/`, verify the portfolio chip order contains `로고`, `패키지 · 쇼핑백`, `촬영`, `기타`. On `http://localhost:3000/portfolio`, verify the same tab order and the empty state when either new category has no entries. On the running admin portfolio create/edit form, verify both labels are selectable from the type combobox.

- [x] **Step 5: Run final repository checks**

Run:

```bash
git diff --check
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: `git diff --check` succeeds and the Figma URL scan returns no matches.
