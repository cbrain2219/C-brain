# Grouped Product Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ten subtype-level product rows with six category-level product rows while preserving every subtype's options and prices inside the existing segmented detail UI.

**Architecture:** `public.products` becomes one row per fixed `product_type`. Each row stores all of its editable configurations under `configuration.variants`, keyed by the existing display name for that variant (for example, `포스터` and `전단지`); a small category-level form state wraps the existing per-variant `ProductUiDraft` so switching segmented buttons never discards unsaved input. A transactional data migration keeps one existing UUID per category, nests all ten existing configurations into six rows, rejects mixed statuses or unexpected data, and removes the obsolete top-level `product_subtype` column.

**Tech Stack:** React 19, TypeScript 6, Vite 8, React Router 7, Supabase JS 2, PostgreSQL JSONB/RLS, Node test runner, pnpm 9

## Global Constraints

- The admin list has exactly six product rows in `productTypes` order after a fresh seed: `브로슈어 · 카탈로그`, `리플렛 · 팜플렛`, `포스터 · 전단지`, `배너 · 족자 · 현수막`, `명함 · 봉투`, and `로고`.
- A product row has one shared `draft | published` status, one `sort_order`, one detail route, and one whole-product delete action.
- Partial publication is not supported. Publishing a product validates every required variant, including variants not currently selected in the segmented control.
- Draft saving remains permissive: incomplete options and blank numeric values may be saved as `null`, exactly as the current draft flow allows.
- The existing segmented selector remains the detail-page interaction. It switches the active in-memory variant; it does not load, save, publish, or delete a second database row.
- The list price is the lowest non-negative configured unit price across every variant. If no unit price exists, use the lowest design/print estimate across every variant. Render a found value with Korean thousands separators and the `원~` suffix, for example `130,000원~`; render no value as `-`.
- Deleting a product deletes the single category row and therefore all nested variants.
- Apply the same model to every compound category: `포스터/전단지`, `배너/족자/현수막`, and `명함/봉투`. Do not special-case only poster/flyer.
- Preserve all existing option values, price rows, service estimates, unknown top-level configuration keys, and unknown keys inside each known variant configuration.
- Do not add a new form engine, state library, schema library, context provider, or UI component library.
- Keep `productFormUi.ts` responsible for one variant's profiles/defaults/calculations; put category-level state in one small adjacent module rather than expanding the already large profile file.
- Follow `design.md`: keep Pretendard GOV typography, current segmented-control CSS, parent `gap` spacing, existing focus behavior, and SVG icon rules. This feature adds no new icon or asset.
- Do not add Figma MCP URLs. The final `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages` check must return no matches.
- The user order app is out of scope. It remains on its current hardcoded single category card; DB-backed user ordering requires its own later plan.
- Do not run migrations, seeds, destructive SQL, `db push`, or schema reset against production during implementation.
- Existing uncommitted work in this worktree belongs to the user. Do not reset, revert, overwrite, or commit unrelated changes.

## Execution Preconditions

1. Finish or safely checkpoint the in-progress admin JSONB CRUD work recorded in `docs/superpowers/plans/2026-08-07-admin-product-jsonb-crud.md`. This plan builds on its `product_type`, `product_subtype`, `configuration`, `status`, and `sort_order` contract.
2. Reconcile the linked project's migration history before creating the grouping migration. The repository's tracked historical migrations still describe the older product columns, while `supabase/initial_admin_content.sql` describes the current remote contract. Run the current CLI's non-destructive remote inspection first; `db pull` creates a local migration file that must be reviewed:

   ```bash
   pnpm dlx supabase --version
   pnpm dlx supabase migration list --linked
   pnpm dlx supabase db pull current_admin_schema --linked --yes
   ```

   Review the generated schema reconciliation migration before continuing. If it drops product data or cannot reproduce the current `product_type/product_subtype/configuration` schema on a disposable database, stop and correct that migration-history gap as a separate change.

3. Confirm that no foreign key references `public.products`. The repository currently contains no such reference, but the linked database must be checked before four subtype rows are removed:

   ```sql
   select
     conrelid::regclass as referencing_table,
     conname
   from pg_constraint
   where contype = 'f'
     and confrelid = 'public.products'::regclass;
   ```

   Expected: zero rows.

4. Save a private pre-migration snapshot outside the repository. Never commit production row data:

   ```sql
   select jsonb_pretty(
     jsonb_agg(to_jsonb(product_row) order by product_row.sort_order, product_row.id)
   )
   from public.products as product_row;
   ```

## Target Data Contract

One simple category uses its own category name as the sole variant key:

```json
{
  "product_type": "브로슈어 · 카탈로그",
  "status": "draft",
  "configuration": {
    "variants": {
      "브로슈어 · 카탈로그": {
        "optionValues": {},
        "priceRowsBySelection": {},
        "serviceEstimatesBySelection": {}
      }
    }
  }
}
```

One compound category keeps every subtype configuration under the same row:

```json
{
  "product_type": "포스터 · 전단지",
  "status": "published",
  "configuration": {
    "variants": {
      "포스터": {
        "optionValues": {},
        "priceRowsBySelection": {},
        "serviceEstimatesBySelection": {}
      },
      "전단지": {
        "optionValues": {},
        "priceRowsBySelection": {},
        "serviceEstimatesBySelection": {}
      }
    }
  }
}
```

The exact required keys are:

| `product_type`         | Required `configuration.variants` keys |
| ---------------------- | -------------------------------------- |
| `브로슈어 · 카탈로그`  | `브로슈어 · 카탈로그`                  |
| `리플렛 · 팜플렛`      | `리플렛 · 팜플렛`                      |
| `포스터 · 전단지`      | `포스터`, `전단지`                     |
| `배너 · 족자 · 현수막` | `배너`, `족자`, `현수막`               |
| `명함 · 봉투`          | `명함`, `봉투`                         |
| `로고`                 | `로고`                                 |

## File Responsibility Map

- `apps/admin/src/pages/productFormUi.ts`: keep per-variant profiles, defaults, price keys, and option mutation logic; export the variant identity helpers needed by the group wrapper.
- `apps/admin/src/pages/productFormGroup.ts`: new category-level form state; create all required variant drafts, switch the active segmented button, and replace only the active variant draft.
- `apps/admin/src/pages/productFormPersistence.ts`: parse and serialize the grouped JSONB contract; validate every variant before publishing.
- `apps/admin/src/pages/ProductFormFields.tsx`: render the existing category combobox and segmented selector against `ProductFormDraft`, then delegate field editing to the active `ProductUiDraft`.
- `apps/admin/src/pages/ProductFormUiPage.tsx`: load, save, publish, and delete one grouped row.
- `apps/admin/src/pages/productData.ts`: map one grouped record to one list row and format the lowest price with `~`.
- `apps/admin/src/pages/ProductPage.tsx`: show one category name column per DB row and keep current filters, detail link, status, and drag ordering.
- `packages/supabase/src/products.ts`: expose the grouped record contract and compute prices across `configuration.variants`.
- `packages/supabase/src/types.ts`: remove the obsolete `product_subtype` field from generated-style table types.
- `supabase/initial_admin_content.sql`: define the fresh-schema one-row-per-type constraint.
- `supabase/seed_products.sql`: retain the ten spreadsheet configurations as seed source data but aggregate them into six inserted rows.
- `supabase/migrations/*_group_product_variants.sql`: forward-only, transactional migration for the existing ten rows.

---

### Task 1: Add a Category-Level Form State Without Rewriting Variant Logic

**Files:**

- Create: `apps/admin/src/pages/productFormGroup.ts`
- Create: `apps/admin/tests/productFormGroup.test.mjs`
- Modify: `apps/admin/src/pages/productFormUi.ts`
- Test: `apps/admin/tests/productFormUi.test.mjs`

**Interfaces:**

- Consumes: existing `ProductType`, `ProductSubtype`, `ProductUiDraft`, `createProductUiDraft`, and `productSubtypeOptions`
- Produces: `ProductVariant`, `getProductVariants(productType)`, `ProductFormDraft`, `createProductFormDraft(productType?)`, `changeProductFormType(draft, productType)`, `selectProductFormVariant(draft, variant)`, `getActiveProductUiDraft(draft)`, and `replaceActiveProductUiDraft(draft, nextVariantDraft)`

- [ ] **Step 1: Write failing tests for exact category membership and state preservation**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  changeProductFormType,
  createProductFormDraft,
  getActiveProductUiDraft,
  replaceActiveProductUiDraft,
  selectProductFormVariant,
} from "../src/pages/productFormGroup.ts";

test("compound products own every configured variant in display order", () => {
  const draft = createProductFormDraft("포스터 · 전단지");

  assert.equal(draft.activeVariant, "포스터");
  assert.deepEqual(Object.keys(draft.variants), ["포스터", "전단지"]);
});

test("switching segmented variants preserves unsaved values", () => {
  let draft = createProductFormDraft("포스터 · 전단지");
  const poster = getActiveProductUiDraft(draft);

  draft = replaceActiveProductUiDraft(draft, {
    ...poster,
    optionValues: { ...poster.optionValues, size: ["수정한 포스터 크기"] },
  });
  draft = selectProductFormVariant(draft, "전단지");
  assert.deepEqual(getActiveProductUiDraft(draft).optionValues.size, [
    "A4(210x297mm)",
  ]);

  draft = selectProductFormVariant(draft, "포스터");
  assert.deepEqual(getActiveProductUiDraft(draft).optionValues.size, [
    "수정한 포스터 크기",
  ]);
});

test("changing category replaces the complete variant set", () => {
  const poster = createProductFormDraft("포스터 · 전단지");
  const display = changeProductFormType(poster, "배너 · 족자 · 현수막");

  assert.equal(display.activeVariant, "배너");
  assert.deepEqual(Object.keys(display.variants), ["배너", "족자", "현수막"]);
});
```

- [ ] **Step 2: Run the focused test and verify the missing module failure**

Run:

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test tests/productFormGroup.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `productFormGroup.ts`.

- [ ] **Step 3: Export the existing variant identity instead of duplicating subtype rules**

Add to `productFormUi.ts`:

```ts
export type ProductVariant = ProductType | ProductSubtype;

export function getProductVariants(
  productType: ProductType,
): readonly ProductVariant[] {
  const subtypes = productSubtypeOptions[
    productType
  ] as readonly ProductSubtype[];

  return subtypes.length > 0 ? subtypes : [productType];
}
```

Replace the current private `type ProductVariant = ProductType | ProductSubtype` declaration with this exported declaration; do not maintain two definitions.

- [ ] **Step 4: Implement the minimal category wrapper around existing drafts**

Create `productFormGroup.ts`:

```ts
import {
  createProductUiDraft,
  getProductVariants,
  productSubtypeOptions,
} from "./productFormUi.ts";
import type {
  ProductSubtype,
  ProductType,
  ProductUiDraft,
  ProductVariant,
} from "./productFormUi.ts";

export type ProductFormDraft = {
  activeVariant: ProductVariant | "";
  productType: ProductType | "";
  variants: Partial<Record<ProductVariant, ProductUiDraft>>;
};

export function createProductFormDraft(
  productType: ProductType | "" = "",
): ProductFormDraft {
  if (!productType) {
    return { activeVariant: "", productType: "", variants: {} };
  }

  const subtypeOptions = productSubtypeOptions[
    productType
  ] as readonly ProductSubtype[];
  const variantNames = getProductVariants(productType);
  const variants = Object.fromEntries(
    variantNames.map((variant) => {
      const subtype = subtypeOptions.includes(variant as ProductSubtype)
        ? (variant as ProductSubtype)
        : "";

      return [variant, createProductUiDraft(productType, subtype)];
    }),
  ) as Partial<Record<ProductVariant, ProductUiDraft>>;

  return {
    activeVariant: variantNames[0] ?? "",
    productType,
    variants,
  };
}

export function changeProductFormType(
  _draft: ProductFormDraft,
  productType: ProductType,
) {
  return createProductFormDraft(productType);
}

export function selectProductFormVariant(
  draft: ProductFormDraft,
  variant: ProductVariant,
) {
  if (!draft.variants[variant])
    throw new Error("지원하지 않는 상품 세부 유형입니다.");

  return { ...draft, activeVariant: variant };
}

export function getActiveProductUiDraft(draft: ProductFormDraft) {
  const active = draft.activeVariant
    ? draft.variants[draft.activeVariant]
    : undefined;

  if (!active) throw new Error("상품 유형을 선택해주세요.");

  return active;
}

export function replaceActiveProductUiDraft(
  draft: ProductFormDraft,
  nextVariantDraft: ProductUiDraft,
) {
  if (!draft.activeVariant) throw new Error("상품 유형을 선택해주세요.");

  return {
    ...draft,
    variants: {
      ...draft.variants,
      [draft.activeVariant]: nextVariantDraft,
    },
  };
}
```

- [ ] **Step 5: Run focused and existing per-variant tests**

Run:

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test \
  tests/productFormGroup.test.mjs \
  tests/productFormUi.test.mjs
```

Expected: PASS. Existing price matrices, option removal, and headings remain unchanged.

- [ ] **Step 6: Commit the pure state boundary after authorization**

```bash
git add \
  apps/admin/src/pages/productFormUi.ts \
  apps/admin/src/pages/productFormGroup.ts \
  apps/admin/tests/productFormUi.test.mjs \
  apps/admin/tests/productFormGroup.test.mjs
git commit -m "refactor(admin): group product variant form state"
```

---

### Task 2: Parse, Validate, and Serialize One Product with All Variants

**Files:**

- Modify: `apps/admin/src/pages/productFormPersistence.ts`
- Modify: `apps/admin/tests/productFormPersistence.test.mjs`

**Interfaces:**

- Consumes: Task 1's `ProductFormDraft`, `getProductVariants`, `createProductFormDraft`, and existing per-variant JSON readers/serializers
- Produces: `toProductFormDraft(product)`, `getProductValidationMessage(draft, status)`, and `toProductWriteInput(draft, status, originalConfiguration?)`

- [ ] **Step 1: Replace subtype-row fixtures with grouped-record failure tests**

Use a fixture with both poster and flyer variants:

```js
function groupedProductRecord(overrides = {}) {
  return {
    configuration: {
      futureGroupFlag: true,
      variants: {
        포스터: {
          futureVariantFlag: "keep-me",
          optionValues: {
            size: ["A1(594x841mm)"],
            paper: ["일반지(아트지)"],
            thickness: ["얇은"],
            coating: ["무광"],
          },
          priceRowsBySelection: {
            "0:0:0:0": [{ quantity: 100, unitPrice: 520000 }],
          },
          serviceEstimatesBySelection: {
            "": { designPrintEstimate: 250000, planningEstimate: 200000 },
          },
        },
        전단지: {
          optionValues: {
            size: ["A4(210x297mm)"],
            paper: ["일반지(아트지)"],
            thickness: ["얇은"],
            side: ["단면"],
          },
          priceRowsBySelection: {
            "0:0:0:0": [{ quantity: 100, unitPrice: 130000 }],
          },
          serviceEstimatesBySelection: {
            0: { designPrintEstimate: 100000, planningEstimate: 60000 },
          },
        },
      },
    },
    created_at: "2026-08-07T00:00:00.000Z",
    id: "poster-flyer-id",
    product_type: "포스터 · 전단지",
    sort_order: 3,
    status: "draft",
    ...overrides,
  };
}

test("grouped JSONB round trips every variant and future key", () => {
  const record = groupedProductRecord();
  const draft = toProductFormDraft(record);
  const input = toProductWriteInput(draft, "draft", record.configuration);

  assert.deepEqual(Object.keys(draft.variants), ["포스터", "전단지"]);
  assert.deepEqual(input, {
    configuration: record.configuration,
    product_type: "포스터 · 전단지",
    status: "draft",
  });
});

test("publishing validates inactive variants", () => {
  const draft = toProductFormDraft(groupedProductRecord());
  draft.variants.전단지.optionValues.side[0] = "";

  assert.equal(
    getProductValidationMessage(draft, "published"),
    "전단지: 모든 상품 옵션을 입력해주세요.",
  );
});

test("missing or unknown variant keys are rejected", () => {
  const missing = groupedProductRecord();
  delete missing.configuration.variants.전단지;

  assert.throws(() => toProductFormDraft(missing), {
    message: "상품 설정의 세부 유형을 확인해주세요.",
  });
});
```

- [ ] **Step 2: Run the focused persistence test and verify old-flat-contract failures**

Run:

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test tests/productFormPersistence.test.mjs
```

Expected: FAIL because `toProductFormDraft` is missing and `ProductWriteInput` still requires `product_subtype`.

- [ ] **Step 3: Extract the existing flat variant reader and writer into internal helpers**

Keep the current numeric and object guards. Change the current record-level reader into:

```ts
function toVariantUiDraft(
  productType: ProductType,
  productSubtype: ProductSubtype | "",
  configuration: Json,
): ProductUiDraft {
  const object = requireJsonObject(configuration);
  const baseDraft = createProductUiDraft(productType, productSubtype);
  const optionValues =
    object.optionValues === undefined
      ? baseDraft.optionValues
      : readOptionValues(object.optionValues);
  const selectedOptionIndexes: ProductUiDraft["selectedOptionIndexes"] = {};

  for (const key of Object.keys(optionValues) as ProductOptionSectionKey[]) {
    selectedOptionIndexes[key] = 0;
  }

  return {
    ...baseDraft,
    optionValues,
    priceRowsBySelection:
      object.priceRowsBySelection === undefined
        ? baseDraft.priceRowsBySelection
        : readPriceRows(object.priceRowsBySelection),
    selectedOptionIndexes,
    serviceEstimatesBySelection:
      object.serviceEstimatesBySelection === undefined
        ? baseDraft.serviceEstimatesBySelection
        : readServiceEstimates(object.serviceEstimatesBySelection),
  };
}
```

Add a matching `serializeVariantDraft(draft, originalVariant?)` that preserves `originalVariant` keys and replaces only `optionValues`, `priceRowsBySelection`, and `serviceEstimatesBySelection`.

- [ ] **Step 4: Implement exact grouped parsing**

```ts
export function toProductFormDraft(product: ProductRecord): ProductFormDraft {
  if (!isProductType(product.product_type)) {
    throw new Error("지원하지 않는 상품 유형입니다.");
  }

  const configuration = requireJsonObject(product.configuration);
  const storedVariants = requireJsonObject(configuration.variants);
  const variantNames = getProductVariants(product.product_type);

  if (
    Object.keys(storedVariants).length !== variantNames.length ||
    variantNames.some((variant) => storedVariants[variant] === undefined)
  ) {
    throw new Error("상품 설정의 세부 유형을 확인해주세요.");
  }

  const draft = createProductFormDraft(product.product_type);

  for (const variant of variantNames) {
    const subtype =
      variant === product.product_type ? "" : (variant as ProductSubtype);
    draft.variants[variant] = toVariantUiDraft(
      product.product_type,
      subtype,
      storedVariants[variant],
    );
  }

  return draft;
}
```

- [ ] **Step 5: Validate every required variant and serialize one write payload**

Keep the current per-variant validation body as an internal `getVariantValidationMessage`. Implement the public group validation and payload:

```ts
export type ProductWriteInput = Required<
  Pick<ProductInsert, "configuration" | "product_type" | "status">
>;

export function getProductValidationMessage(
  draft: ProductFormDraft,
  status: ProductStatus,
) {
  if (!draft.productType || !isProductType(draft.productType)) {
    return "상품 유형을 선택해주세요.";
  }

  for (const variant of getProductVariants(draft.productType)) {
    const variantDraft = draft.variants[variant];

    if (!variantDraft) return "상품 설정의 세부 유형을 확인해주세요.";

    const message = getVariantValidationMessage(variantDraft, status);

    if (message) return `${variant}: ${message}`;
  }

  return null;
}

export function toProductWriteInput(
  draft: ProductFormDraft,
  status: ProductStatus,
  originalConfiguration?: Json,
): ProductWriteInput {
  const validationMessage = getProductValidationMessage(draft, status);

  if (validationMessage) throw new Error(validationMessage);
  if (!draft.productType) throw new Error("상품 유형을 선택해주세요.");

  const original = isJsonObject(originalConfiguration)
    ? originalConfiguration
    : {};
  const originalVariants = isJsonObject(original.variants)
    ? original.variants
    : {};
  const variants = Object.fromEntries(
    getProductVariants(draft.productType).map((variant) => [
      variant,
      serializeVariantDraft(
        draft.variants[variant]!,
        originalVariants[variant],
      ),
    ]),
  );

  return {
    configuration: { ...original, variants },
    product_type: draft.productType,
    status,
  };
}
```

- [ ] **Step 6: Run persistence and group-state tests**

Run:

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test \
  tests/productFormGroup.test.mjs \
  tests/productFormPersistence.test.mjs
```

Expected: PASS, including inactive-variant publication validation and future-key preservation.

- [ ] **Step 7: Commit the grouped persistence boundary after authorization**

```bash
git add \
  apps/admin/src/pages/productFormPersistence.ts \
  apps/admin/tests/productFormPersistence.test.mjs
git commit -m "refactor(admin): persist grouped product variants"
```

---

### Task 3: Update the Supabase Type Contract and Lowest-Price Helper

**Files:**

- Modify: `packages/supabase/src/types.ts`
- Modify: `packages/supabase/src/products.ts`
- Modify: `packages/supabase/tests/content-helpers.test.mjs`
- Modify: `packages/supabase/tests/content-contracts.test.mjs`

**Interfaces:**

- Consumes: target `products` row with `configuration`, `id`, `product_type`, `sort_order`, `status`, and `created_at`
- Produces: subtype-free `ProductRecord`, `ProductInsert`, `ProductUpdate`, `PublicProduct`, and `getLowestProductPrice(configuration)` across all nested variants

- [ ] **Step 1: Write failing helper and source-contract assertions**

```js
assert.equal(
  getLowestProductPrice({
    variants: {
      포스터: {
        priceRowsBySelection: {
          poster: [{ quantity: 100, unitPrice: 520000 }],
        },
        serviceEstimatesBySelection: {},
      },
      전단지: {
        priceRowsBySelection: {
          flyer: [{ quantity: 100, unitPrice: 130000 }],
        },
        serviceEstimatesBySelection: {},
      },
    },
  }),
  130000,
);

assert.doesNotMatch(typesSource, /product_subtype/);
```

Update the `listPublishedProducts` fake-client expectation to require this exact select:

```text
id, configuration, product_type, sort_order
```

- [ ] **Step 2: Run package tests and verify old flat-price/subtype failures**

Run:

```bash
pnpm --filter @repo/supabase test
```

Expected: FAIL because the helper looks directly under `configuration.priceRowsBySelection` and the table type still contains `product_subtype`.

- [ ] **Step 3: Remove `product_subtype` from generated-style product types and payload picks**

Use this table shape in `types.ts`:

```ts
products: {
  Row: {
    configuration: Json
    created_at: string
    id: string
    product_type: string
    sort_order: number
    status: ProductStatus
  }
  Insert: {
    configuration?: Json
    created_at?: string
    id?: string
    product_type: string
    sort_order?: number
    status?: ProductStatus
  }
  Update: {
    configuration?: Json
    created_at?: string
    id?: string
    product_type?: string
    sort_order?: number
    status?: ProductStatus
  }
  Relationships: []
}
```

Update `products.ts`:

```ts
export type ProductInsert = Pick<
  TableInsert<"products">,
  "configuration" | "product_type" | "status"
>;
export type ProductUpdate = Pick<
  TableUpdate<"products">,
  "configuration" | "product_type" | "status"
>;
export type PublicProduct = Pick<
  ProductRecord,
  "configuration" | "id" | "product_type" | "sort_order"
>;
```

- [ ] **Step 4: Aggregate the lowest price across nested variants**

Keep the existing unit-price traversal and move the current estimate traversal into a private per-variant helper:

```ts
function getLowestVariantEstimate(configuration: Json | undefined) {
  if (!isJsonObject(configuration)) return null;

  const estimatesBySelection = configuration.serviceEstimatesBySelection;

  if (!isJsonObject(estimatesBySelection)) return null;

  let lowestPrice: number | null = null;

  for (const estimate of Object.values(estimatesBySelection)) {
    if (!isJsonObject(estimate)) continue;

    const designPrintEstimate = estimate.designPrintEstimate;

    if (
      typeof designPrintEstimate === "number" &&
      Number.isFinite(designPrintEstimate) &&
      designPrintEstimate >= 0 &&
      (lowestPrice === null || designPrintEstimate < lowestPrice)
    ) {
      lowestPrice = designPrintEstimate;
    }
  }

  return lowestPrice;
}

function getLowestVariantPrice(configuration: Json | undefined) {
  if (!isJsonObject(configuration)) return null;

  const unitPrice = getLowestProductUnitPrice(configuration);

  return unitPrice ?? getLowestVariantEstimate(configuration);
}

export function getLowestProductPrice(configuration: Json) {
  if (!isJsonObject(configuration) || !isJsonObject(configuration.variants)) {
    return null;
  }

  let lowestPrice: number | null = null;

  for (const variant of Object.values(configuration.variants)) {
    const price = getLowestVariantPrice(variant);

    if (price !== null && (lowestPrice === null || price < lowestPrice)) {
      lowestPrice = price;
    }
  }

  return lowestPrice;
}
```

Do not add recursion: the schema has one known `variants` level.

- [ ] **Step 5: Remove subtype from the public select**

```ts
.select('id, configuration, product_type, sort_order')
```

Keep the existing published-status predicate and stable `sort_order`, then `id`, ordering.

- [ ] **Step 6: Run package tests, type checking, and lint**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
```

Expected: PASS.

- [ ] **Step 7: Commit the API contract after authorization**

```bash
git add \
  packages/supabase/src/types.ts \
  packages/supabase/src/products.ts \
  packages/supabase/tests/content-helpers.test.mjs \
  packages/supabase/tests/content-contracts.test.mjs
git commit -m "refactor(supabase): expose grouped products"
```

---

### Task 4: Keep the Existing Detail UI While Saving All Segmented Variants Together

**Files:**

- Modify: `apps/admin/src/pages/ProductFormFields.tsx`
- Modify: `apps/admin/src/pages/ProductFormUiPage.tsx`
- Modify: `apps/admin/tests/productFormFields.test.mjs`
- Modify: `apps/admin/tests/productFormUiPage.test.mjs`
- Verify unchanged: `apps/admin/src/pages/ProductFormFields.css`

**Interfaces:**

- Consumes: Task 1's `ProductFormDraft` helpers and Task 2's grouped persistence functions
- Produces: unchanged visual segmented control with one whole-product load/save/publish/delete lifecycle

- [ ] **Step 1: Update source-contract tests before touching JSX**

Require the fields component to use grouped state:

```js
assert.match(source, /type ProductFormDraft/);
assert.match(source, /getActiveProductUiDraft\(draft\)/);
assert.match(source, /selectProductFormVariant\(draft, variant\)/);
assert.match(source, /replaceActiveProductUiDraft\(draft, nextVariantDraft\)/);
assert.doesNotMatch(source, /changeProductUiSubtype\(/);
```

Require the page to load and save grouped rows:

```js
assert.match(
  pageSource,
  /createProductFormDraft\(['"]브로슈어 · 카탈로그['"]\)/,
);
assert.match(pageSource, /toProductFormDraft\(product\)/);
assert.doesNotMatch(pageSource, /product_subtype/);
assert.match(pageSource, /deleteProduct\(supabase, productId\)/);
```

- [ ] **Step 2: Run the focused UI source tests and verify failure**

Run:

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test \
  tests/productFormFields.test.mjs \
  tests/productFormUiPage.test.mjs
```

Expected: FAIL because both components still use one `ProductUiDraft`.

- [ ] **Step 3: Adapt `ProductFormFields` at the component boundary only**

Change its public props to:

```ts
type ProductFormFieldsProps = {
  draft: ProductFormDraft;
  onChange: (nextDraft: ProductFormDraft) => void;
};
```

Inside the component:

```ts
const activeDraft = getActiveProductUiDraft(draft);
const updateActiveDraft = (nextVariantDraft: ProductUiDraft) =>
  onChange(replaceActiveProductUiDraft(draft, nextVariantDraft));
```

Use `activeDraft` and `updateActiveDraft` for the existing option, price, and service section renderers. In `TypeSelection`:

- derive the segmented labels with `getProductVariants(draft.productType)`;
- render the segment only when the category owns more than one variant;
- mark `draft.activeVariant === variant` as selected;
- call `selectProductFormVariant(draft, variant)` on change;
- call `changeProductFormType(draft, value)` from the type combobox.

Do not modify `ProductFormFields.css`; the current selector classes and dimensions already satisfy the approved UI.

- [ ] **Step 4: Change the page state and identity comparison to category level**

Use:

```ts
function createInitialFormDraft(): ProductFormDraft {
  return createProductFormDraft("브로슈어 · 카탈로그");
}
```

Load with `toProductFormDraft(product)`. Preserve unknown configuration keys only when:

```ts
const keepsProductIdentity = loadedProduct?.product_type === draft.productType;
```

Continue to call one `createProduct`, `updateProduct`, or `deleteProduct` operation. Update duplicate-key handling from `products_product_type_product_subtype_key` to `products_product_type_key` and show `이미 등록된 상품 유형입니다.`.

- [ ] **Step 5: Add a component-level regression for inactive input preservation**

The pure state test in Task 1 is the behavioral source of truth. Extend the source test to ensure the JSX switches group state rather than rebuilding a variant:

```js
assert.doesNotMatch(source, /createProductUiDraft\([^)]*variant/);
assert.doesNotMatch(source, /changeProductUiSubtype/);
```

- [ ] **Step 6: Run all admin tests and build**

Run:

```bash
pnpm --filter admin test
pnpm --filter admin build
pnpm --filter admin lint
```

Expected: PASS. The existing segmented-control CSS assertions remain unchanged.

- [ ] **Step 7: Commit the detail-page integration after authorization**

```bash
git add \
  apps/admin/src/pages/ProductFormFields.tsx \
  apps/admin/src/pages/ProductFormUiPage.tsx \
  apps/admin/tests/productFormFields.test.mjs \
  apps/admin/tests/productFormUiPage.test.mjs
git commit -m "feat(admin): edit grouped product variants"
```

---

### Task 5: Render Six Product Rows and the Lowest Group Price

**Files:**

- Modify: `apps/admin/src/pages/productData.ts`
- Modify: `apps/admin/src/pages/ProductPage.tsx`
- Modify: `apps/admin/tests/productData.test.mjs`

**Interfaces:**

- Consumes: Task 3's grouped `ProductRecord` and `getLowestProductPrice`
- Produces: one `ProductListRow` per category with `<price>원~`, one detail link, one status, and one reorder ID

- [ ] **Step 1: Write the grouped list-row failure test**

```js
test("grouped product list uses its category name and lowest variant price", () => {
  const row = toProductListRow({
    configuration: {
      variants: {
        포스터: {
          optionValues: {},
          priceRowsBySelection: {
            poster: [{ quantity: 100, unitPrice: 520000 }],
          },
          serviceEstimatesBySelection: {},
        },
        전단지: {
          optionValues: {},
          priceRowsBySelection: {
            flyer: [{ quantity: 100, unitPrice: 130000 }],
          },
          serviceEstimatesBySelection: {},
        },
      },
    },
    created_at: "2026-08-07T00:00:00.000Z",
    id: "poster-flyer",
    product_type: "포스터 · 전단지",
    sort_order: 3,
    status: "published",
  });

  assert.equal(row.name, "포스터 · 전단지");
  assert.equal(row.type, "포스터 · 전단지");
  assert.equal(row.price, "130,000원~");
  assert.equal(row.detailHref, "/products/poster-flyer");
});
```

- [ ] **Step 2: Run the focused data test and verify failure**

Run:

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test tests/productData.test.mjs
```

Expected: FAIL because fixtures still require `product_subtype` and price text lacks `~`.

- [ ] **Step 3: Map the row directly from the category record**

```ts
return {
  createdAt: formatAdminDate(product.created_at),
  detailHref: "/products/" + product.id,
  id: product.id,
  name: product.product_type,
  price:
    lowestPrice === null
      ? "-"
      : new Intl.NumberFormat("ko-KR").format(lowestPrice) + "원~",
  status: product.status,
  type: product.product_type,
};
```

- [ ] **Step 4: Remove the now-duplicate `유형` display column**

Keep these list columns in `ProductPage.tsx`:

1. `상태`
2. `상품명` — renders the single category name
3. `등록일자`
4. `상품가`
5. `상세`

Keep the existing type filter backed by `row.type`; removing the visible duplicate column does not remove filtering. Keep the existing detail link, status renderer, loading/error states, and drag behavior. `reorderProducts` now naturally receives six category IDs.

- [ ] **Step 5: Run admin data tests and build**

Run:

```bash
pnpm --filter admin test
pnpm --filter admin build
```

Expected: PASS.

- [ ] **Step 6: Commit the six-row list after authorization**

```bash
git add \
  apps/admin/src/pages/productData.ts \
  apps/admin/src/pages/ProductPage.tsx \
  apps/admin/tests/productData.test.mjs
git commit -m "feat(admin): list grouped products"
```

---

### Task 6: Migrate Ten Existing Rows into Six Without Losing Configuration

**Files:**

- Create via Supabase CLI: `supabase/migrations/*_group_product_variants.sql`
- Create: `packages/supabase/tests/product-grouping-contract.test.mjs`
- Modify: `supabase/initial_admin_content.sql`
- Modify: `supabase/seed_products.sql`
- Modify: `apps/admin/tests/productFormPersistence.test.mjs`

**Interfaces:**

- Consumes: the current ten-row `(product_type, product_subtype)` contract and exact ten spreadsheet-backed configurations
- Produces: six rows unique by `product_type`, each with exact required `configuration.variants` keys and preserved variant data

- [ ] **Step 1: Write the migration, baseline, and seed contract test first**

Create a Node source-contract test that finds the CLI-generated migration by suffix:

```js
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const migrationsUrl = new URL("../../../supabase/migrations/", import.meta.url);
const migrationName = (await readdir(migrationsUrl)).find((name) =>
  name.endsWith("_group_product_variants.sql"),
);

assert.ok(migrationName, "group product variants migration is missing");

const migration = await readFile(new URL(migrationName, migrationsUrl), "utf8");
const baseline = await readFile(
  new URL("../../../supabase/initial_admin_content.sql", import.meta.url),
  "utf8",
);
const seed = await readFile(
  new URL("../../../supabase/seed_products.sql", import.meta.url),
  "utf8",
);

test("product schema stores one row per type", () => {
  assert.match(migration, /begin;/i);
  assert.match(migration, /jsonb_build_object\('variants'/i);
  assert.match(migration, /drop column product_subtype/i);
  assert.match(migration, /unique \(product_type\)/i);
  assert.match(migration, /commit;/i);
  assert.doesNotMatch(baseline, /product_subtype/);
  assert.match(baseline, /unique \(product_type\)/);
  assert.match(seed, /on conflict \(product_type\)/i);
});
```

- [ ] **Step 2: Run the contract test and verify the missing migration failure**

Run:

```bash
pnpm --filter @repo/supabase test
```

Expected: FAIL with `group product variants migration is missing`.

- [ ] **Step 3: Generate the migration filename using the installed CLI**

Run:

```bash
pnpm dlx supabase migration new group_product_variants
```

Expected: the CLI prints one new path matching `supabase/migrations/*_group_product_variants.sql`. Use that exact generated path; do not rename it.

- [ ] **Step 4: Implement the guarded transactional migration**

Put this SQL into the generated migration:

```sql
begin;

do $$
declare
  referencing_constraint text;
begin
  select constraint_row.conname
  into referencing_constraint
  from pg_constraint as constraint_row
  where constraint_row.contype = 'f'
    and constraint_row.confrelid = 'public.products'::regclass
  limit 1;

  if referencing_constraint is not null then
    raise exception
      'products is referenced by foreign key %, migrate references before grouping',
      referencing_constraint;
  end if;

  if exists (
    select 1
    from public.products
    where product_type not in (
      '브로슈어 · 카탈로그',
      '리플렛 · 팜플렛',
      '포스터 · 전단지',
      '배너 · 족자 · 현수막',
      '명함 · 봉투',
      '로고'
    )
  ) then
    raise exception 'unsupported product type exists';
  end if;

  if exists (
    select 1
    from public.products
    group by product_type
    having count(distinct status) > 1
  ) then
    raise exception 'product variants have mixed statuses';
  end if;
end
$$;

create temporary table grouped_products on commit drop as
with source_rows as (
  select
    product.id,
    product.product_type,
    coalesce(nullif(btrim(product.product_subtype), ''), product.product_type)
      as variant_name,
    product.status,
    product.configuration,
    product.sort_order
  from public.products as product
),
aggregated as (
  select
    source.product_type,
    (array_agg(source.id order by source.sort_order, source.id))[1]
      as survivor_id,
    (array_agg(source.status order by source.sort_order, source.id))[1]
      as status,
    min(source.sort_order) as first_sort_order,
    jsonb_object_agg(
      source.variant_name,
      source.configuration
      order by source.sort_order, source.id
    ) as variants
  from source_rows as source
  group by source.product_type
)
select
  aggregated.product_type,
  aggregated.survivor_id,
  aggregated.status,
  row_number() over (
    order by aggregated.first_sort_order, aggregated.product_type
  )::bigint as next_sort_order,
  aggregated.variants
from aggregated;

do $$
begin
  if (select count(*) from grouped_products) <> 6 then
    raise exception 'expected exactly six grouped products';
  end if;

  if exists (
    with expected(product_type, variant_names) as (
      values
        ('브로슈어 · 카탈로그', array['브로슈어 · 카탈로그']::text[]),
        ('리플렛 · 팜플렛', array['리플렛 · 팜플렛']::text[]),
        ('포스터 · 전단지', array['포스터', '전단지']::text[]),
        ('배너 · 족자 · 현수막', array['배너', '족자', '현수막']::text[]),
        ('명함 · 봉투', array['명함', '봉투']::text[]),
        ('로고', array['로고']::text[])
    )
    select 1
    from expected
    left join grouped_products as grouped
      on grouped.product_type = expected.product_type
    where grouped.product_type is null
       or (
         select count(*)
         from jsonb_object_keys(grouped.variants)
       ) <> cardinality(expected.variant_names)
       or not (grouped.variants ?& expected.variant_names)
  ) then
    raise exception 'grouped product variants do not match the fixed catalog';
  end if;
end
$$;

update public.products as product
set
  configuration = jsonb_build_object('variants', grouped.variants),
  sort_order = grouped.next_sort_order,
  status = grouped.status
from grouped_products as grouped
where product.id = grouped.survivor_id;

delete from public.products as product
using grouped_products as grouped
where product.product_type = grouped.product_type
  and product.id <> grouped.survivor_id;

alter table public.products
  drop constraint if exists products_product_type_product_subtype_key;

alter table public.products
  drop column product_subtype;

alter table public.products
  add constraint products_product_type_key unique (product_type);

select setval(
  pg_get_serial_sequence('public.products', 'sort_order'),
  coalesce((select max(sort_order) from public.products), 0) + 1,
  false
);

do $$
begin
  if (select count(*) from public.products) <> 6
     or exists (
       select 1
       from public.products
       where jsonb_typeof(configuration -> 'variants') is distinct from 'object'
     ) then
    raise exception 'grouped product migration verification failed';
  end if;
end
$$;

commit;
```

- [ ] **Step 5: Update the fresh-schema baseline**

Change only the product definition in `initial_admin_content.sql`:

```sql
create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_type text not null,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  configuration jsonb not null default '{"variants": {}}'::jsonb
    check (
      jsonb_typeof(configuration) = 'object'
      and configuration ? 'variants'
      and jsonb_typeof(configuration -> 'variants') = 'object'
    ),
  sort_order bigint generated by default as identity,
  created_at timestamptz not null default now(),
  unique (product_type)
);
```

Leave the existing RLS policies, explicit grants, status/sort index, and reorder RPC unchanged; they operate on rows and IDs, not subtypes.

- [ ] **Step 6: Make the seed aggregate ten source configurations into six rows**

Keep the ten large spreadsheet configuration objects so no matrix is manually rewritten. Rename the opening `$products$` tag to `$variants$` and the closing `$products$::jsonb` tag to `$variants$::jsonb`; retain each source object's `product_subtype`. Rename the current `seed` CTE and `product` record alias to `variant_seed` and `variant`, then replace the SQL beginning immediately after the closing dollar tag with:

```sql
  ) as variant(
    product_type text,
    product_subtype text,
    status text,
    sort_order bigint,
    configuration jsonb
  )
),
grouped_seed as (
  select
    variant.product_type,
    (array_agg(variant.status order by variant.sort_order))[1] as status,
    min(variant.sort_order) as first_sort_order,
    jsonb_build_object(
      'variants',
      jsonb_object_agg(
        coalesce(nullif(variant.product_subtype, ''), variant.product_type),
        variant.configuration
        order by variant.sort_order
      )
    ) as configuration
  from variant_seed as variant
  group by variant.product_type
),
ordered_seed as (
  select
    grouped.product_type,
    grouped.status,
    row_number() over (
      order by grouped.first_sort_order, grouped.product_type
    )::bigint as sort_order,
    grouped.configuration
  from grouped_seed as grouped
)
insert into public.products (
  product_type,
  status,
  sort_order,
  configuration
)
select
  product_type,
  status,
  sort_order,
  configuration
from ordered_seed
on conflict (product_type) do update
set configuration = excluded.configuration;
```

The conflict update intentionally preserves administrator-controlled status and ordering, matching current seed behavior.

Replace the seed's final flat-configuration summary query with the grouped summary query:

```sql
-- Expected result after the initial run: 6 / 98 / 17.
select
  count(*) as product_count,
  sum(variant_counts.price_count) as price_selection_count,
  sum(variant_counts.service_count) as service_selection_count
from public.products as product
cross join lateral (
  select
    sum((
      select count(*)
      from jsonb_object_keys(variant.value -> 'priceRowsBySelection')
    )) as price_count,
    sum((
      select count(*)
      from jsonb_object_keys(variant.value -> 'serviceEstimatesBySelection')
    )) as service_count
  from jsonb_each(product.configuration -> 'variants') as variant
) as variant_counts
where product.product_type = any(array[
  '브로슈어 · 카탈로그',
  '리플렛 · 팜플렛',
  '포스터 · 전단지',
  '배너 · 족자 · 현수막',
  '명함 · 봉투',
  '로고'
]::text[]);
```

- [ ] **Step 7: Update seed round-trip and aggregate assertions**

In `productFormPersistence.test.mjs`, parse the renamed dollar tag and group the ten source variant objects in display order:

```js
const seededVariantsJson = seedSql.match(
  /\$variants\$\n([\s\S]*?)\n\$variants\$/,
)?.[1];

assert.ok(seededVariantsJson, "seed_products.sql variant payload is missing");

const seededVariants = JSON.parse(seededVariantsJson);
const groupedSeedProducts = Array.from(
  seededVariants
    .reduce((groups, variant) => {
      const current = groups.get(variant.product_type) ?? {
        configuration: { variants: {} },
        product_type: variant.product_type,
        sort_order: variant.sort_order,
        status: variant.status,
      };
      const variantName = variant.product_subtype || variant.product_type;

      current.configuration.variants[variantName] = variant.configuration;
      current.sort_order = Math.min(current.sort_order, variant.sort_order);
      groups.set(variant.product_type, current);

      return groups;
    }, new Map())
    .values(),
).sort((left, right) => left.sort_order - right.sort_order);

assert.equal(seededVariants.length, 10);
assert.equal(groupedSeedProducts.length, 6);
assert.deepEqual(
  Object.keys(
    groupedSeedProducts.find(
      (product) => product.product_type === "포스터 · 전단지",
    ).configuration.variants,
  ),
  ["포스터", "전단지"],
);
```

Round-trip each of the six grouped records through `toProductFormDraft` and `toProductWriteInput` and require exact configuration equality.

- [ ] **Step 8: Run SQL/source contracts and application tests**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter admin test
pnpm --filter admin build
git diff --check
```

Expected: PASS.

- [ ] **Step 9: Commit the migration and baseline after authorization**

```bash
git add \
  supabase/migrations/*_group_product_variants.sql \
  supabase/initial_admin_content.sql \
  supabase/seed_products.sql \
  packages/supabase/tests/product-grouping-contract.test.mjs \
  apps/admin/tests/productFormPersistence.test.mjs
git commit -m "feat(db): group product variants"
```

---

### Task 7: Verify the Full Story and Prepare a Controlled Deployment

**Files:**

- Modify only if verification exposes a defect in Tasks 1–6 files

**Interfaces:**

- Verifies: six-row list, category-level status/delete/reorder, segmented editing, all-variant publish validation, exact data preservation, RLS, and rollback readiness

- [ ] **Step 1: Run the complete static verification suite**

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
pnpm --filter admin test
pnpm --filter admin build
pnpm --filter admin lint
git diff --check
rg "product_subtype" apps/admin packages/supabase
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected:

- all pnpm commands pass;
- both `rg` commands return no matches and exit with status 1;
- `git diff --check` prints nothing.

- [ ] **Step 2: Apply the migration only to a disposable copy of the current ten-row database**

Provision the disposable database from the reconciled current schema and the private ten-row snapshot captured before implementation. Do not use a linked production project. Apply the grouping migration, then run:

```sql
select
  product_type,
  status,
  sort_order,
  jsonb_object_keys(configuration -> 'variants') as variant
from public.products
order by sort_order, variant;
```

Expected: six product rows expanded to ten expected variant names, with one shared status per category.

- [ ] **Step 3: Verify configuration counts before and after migration**

Before migration, record:

```sql
select
  count(*) as product_rows,
  sum((
    select count(*)
    from jsonb_object_keys(configuration -> 'priceRowsBySelection')
  )) as price_selection_count,
  sum((
    select count(*)
    from jsonb_object_keys(configuration -> 'serviceEstimatesBySelection')
  )) as service_selection_count
from public.products;
```

Expected for the current seed: `10`, `98`, `17`.

After migration, record:

```sql
select
  count(*) as product_rows,
  sum(variant_counts.price_count) as price_selection_count,
  sum(variant_counts.service_count) as service_selection_count
from public.products as product
cross join lateral (
  select
    sum((
      select count(*)
      from jsonb_object_keys(variant.value -> 'priceRowsBySelection')
    )) as price_count,
    sum((
      select count(*)
      from jsonb_object_keys(variant.value -> 'serviceEstimatesBySelection')
    )) as service_count
  from jsonb_each(product.configuration -> 'variants') as variant
) as variant_counts;
```

Expected: `6`, `98`, `17`. A mismatch is a release blocker.

- [ ] **Step 4: Run manual admin scenarios in the development environment**

Verify these exact scenarios:

1. The list shows six rows and no duplicate visible category/type column.
2. `포스터 · 전단지` shows the lowest configured value as `130,000원~` for the current seed.
3. Opening its detail route shows `포스터` and `전단지` segmented buttons.
4. Edit a poster value, switch to flyer, edit a flyer value, switch back, and confirm the poster edit remains before saving.
5. Save one draft, reload the route, and confirm both edits remain.
6. Blank one inactive flyer's required option and attempt to publish while poster is selected; publishing must be rejected with a flyer-prefixed message.
7. Restore the value, publish once, and confirm the list has one published row.
8. Reorder the six unfiltered rows and reload; ordering must persist.
9. In the disposable environment only, delete one compound product and confirm the single row and every nested variant disappear together.

- [ ] **Step 5: Recheck Supabase security and performance advisors**

Run against the disposable or approved development database:

```bash
pnpm dlx supabase db advisors --linked --type security --level warn
pnpm dlx supabase db advisors --linked --type performance --level warn
```

Expected: no new warning caused by this migration. RLS and explicit grants remain unchanged because no table or public API surface was added.

- [ ] **Step 6: Prepare the production cutover without executing it**

The approved deployment runbook is:

1. Pause admin product writes.
2. Save the private ten-row JSON snapshot from the execution precondition.
3. Verify the six categories have internally consistent statuses.
4. Run `pnpm dlx supabase db push --linked --dry-run` and review that only approved pending migrations appear.
5. Apply the approved migration through the project's normal deployment process.
6. Deploy the admin application built from the matching commit.
7. Run the six-row, variant-count, detail-load, draft-save, and published-read smoke checks.
8. Resume admin product writes.

Do not run step 5 without explicit deployment authorization.

- [ ] **Step 7: Document rollback conditions**

Rollback is required if any of these occurs before new admin writes are accepted:

- product count is not six;
- variant keys do not match the fixed table in this plan;
- aggregate price/service selection counts differ from `98/17` for the current dataset;
- a detail page cannot load or round-trip all variants;
- RLS blocks an administrator or exposes a draft to anon.

Restore the pre-migration snapshot and the previous schema/application release as one coordinated rollback. Do not reconstruct deleted rows manually from memory, and do not resume writes until the ten original UUID/configuration pairs are verified.

## Out of Scope

- Connecting `apps/user` to `listPublishedProducts`.
- Changing the user's existing `포스터 · 전단지` category card.
- Adding per-variant publication, per-variant deletion, or per-variant sort order.
- Adding a second nested form engine or generic JSON schema framework.
- Redesigning the approved segmented selector.
- Running or deploying the migration to production.

## References

- `design.md`
- `docs/superpowers/plans/2026-08-07-admin-product-jsonb-crud.md`
- [Supabase CLI migration reference](https://supabase.com/docs/reference/cli/v0/supabase-migration)
- [Supabase breaking-change changelog](https://supabase.com/changelog?types=breaking-change)
