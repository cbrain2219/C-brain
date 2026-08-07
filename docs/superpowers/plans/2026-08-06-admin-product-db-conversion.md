# 1. 관리자 상품 및 DB 구조 전환 Implementation Plan

> **Status: DEFERRED — DO NOT EXECUTE.** 최신 유형별 섹션 요구사항이 이 문서의 기존 프로필 표를 대체했다. 먼저 [관리자 상품 상세 UI 전환 계획](./2026-08-06-admin-product-detail-ui.md)으로 화면을 확정한 뒤, 그 UI 계약을 기준으로 DB 저장 계획을 다시 작성한다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 상품 등록·수정 화면을 Figma의 단일 페이지 폼으로 바꾸고, 상품 유형을 지정된 여섯 값으로 제한하면서 유형별 옵션 구성을 안전하게 저장한다.

**Architecture:** `productData.ts`에 여섯 상품 유형과 세 가지 폼 프로필을 단일 설정 객체로 정의하고, `ProductFormPage`는 선택된 프로필을 렌더링한다. Supabase에는 유형마다 모양이 다른 옵션을 담는 `configuration jsonb` 한 칼럼만 추가하고, 기존 정형 칼럼은 호환을 위해 유지하되 신규 폼의 원본 데이터는 `configuration`으로 삼는다.

**Tech Stack:** React 19, TypeScript 6, Vite 8, React Router 7, Supabase/Postgres, Node test runner, CSS

**Plan Boundary:** 이 문서는 1단계인 관리자 화면과 저장 구조 전환만 다룬다. 사용자 화면의 Supabase 조회, 주문 옵션 연결, 결제 금액 재검증은 [2. 사용자 상품 데이터 연동 계획](./2026-08-06-user-product-data-integration.md)에서 이어서 수행한다.

## Global Constraints

- 상품 유형은 정확히 `브로슈어 · 카탈로그`, `리플렛 · 팜플렛`, `포스터 · 전단지`, `배너 · 족자 · 현수막`, `명함 · 봉투`, `로고` 여섯 값만 신규 저장할 수 있다.
- Figma 기준 화면은 `1234:9529`(책자형), `1234:10015`(규격형), `1234:10434`(로고형)이다.
- 세 Figma 프레임에 명시되지 않은 유형은 가장 가까운 프로필로 매핑한다: 리플렛은 책자형, 포스터와 명함은 규격형을 사용한다. 프로필 설정 한 곳만 수정하면 이 매핑을 바꿀 수 있어야 한다.
- `신규 상품 등록`과 `상품 수정` 모두 한 페이지에서 저장하며 기존 2단계 `다음으로/뒤로가기` 흐름을 제거한다.
- 기존 상품의 ID, 상태, 정렬 순서와 가격 데이터는 삭제하거나 합치지 않는다. 같은 새 유형으로 매핑되는 여러 행도 그대로 보존한다.
- 현재 사용자 주문 화면은 `apps/user/app/_content/order.ts`의 정적 상품 설정을 사용한다. 이 1단계에서는 그 파일과 사용자 화면을 수정하지 않으며, 연동은 반드시 2단계 계획에서 별도 배포한다.
- 새 라이브러리나 범용 폼 엔진을 추가하지 않는다. 기존 `AdminTypeCombobox`, `AdminFormLayout`, `AdminIcon`을 재사용한다.
- `design.md`의 Pretendard GOV, `gap` 기반 간격, form focus, `currentColor` 아이콘 규칙을 지킨다.
- 단순 `+` 아이콘은 `AdminIcon`에 등록하고 Figma 원격 asset URL을 소스에 넣지 않는다.
- 구현 완료 전 `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`가 매치 없이 종료되어야 한다.
- 프로덕션 Supabase에는 이 작업에서 직접 push하지 않는다. 마이그레이션은 로컬 또는 별도 개발 DB에서 검증한 뒤 배포한다.

---

## Confirmed Current State

- 관리자 라우트 `/products/new`, `/products/:productId`는 모두 `apps/admin/src/pages/ProductFormPage.tsx`를 사용한다.
- 현재 폼은 상품명을 직접 입력하고 유형을 새로 추가할 수 있으며, 용지·페이지·수량을 먼저 입력한 뒤 별도 단계에서 조합별 가격을 입력한다.
- 현재 `products` 스키마는 모든 상품에 `paper_types`, `page_counts`, `order_quantities`의 비어 있지 않은 배열을 강제하므로 수량 섹션이 없는 로고형을 저장할 수 없다.
- 연결된 실제 프로젝트에는 상품 12개가 있고, 다음 9개는 손실 없이 새 유형으로 매핑할 수 있다.

| 기존 유형 | 행 수 | 새 유형 |
| --- | ---: | --- |
| 브로슈어 | 2 | 브로슈어 · 카탈로그 |
| 카탈로그 | 1 | 브로슈어 · 카탈로그 |
| 리플렛 | 2 | 리플렛 · 팜플렛 |
| 포스터 | 2 | 포스터 · 전단지 |
| 현수막 | 1 | 배너 · 족자 · 현수막 |
| 명함 | 1 | 명함 · 봉투 |

- `스티커`, `일반상품`, `추가상품` 각 1개는 자동 매핑하지 않는다. 마이그레이션 후에도 목록과 상세 조회는 가능하지만, 수정 저장 시 여섯 유형 중 하나를 선택하도록 한다.
- 현재 가격 매트릭스를 확인한 결과 각 상품의 동일 수량 인덱스는 용지/페이지 조합에 관계없이 가격이 하나뿐이다. 따라서 새 수량·단가 행으로 축약해도 현재 데이터의 가격 차이를 잃지 않는다.

## Form Profiles

| 고정 유형 | 프로필 | 하위 탭 | 옵션 섹션 | 기획 견적 | 수량 단위 |
| --- | --- | --- | --- | --- | --- |
| 브로슈어 · 카탈로그 | `booklet` | 없음 | 페이지 수, 용지, 두께, 표지 코팅 | 표시 | 부 |
| 리플렛 · 팜플렛 | `booklet` | 없음 | 페이지 수, 용지, 두께, 표지 코팅 | 표시 | 부 |
| 포스터 · 전단지 | `standard` | 포스터, 전단지 | 카테고리, 사이즈, 재질 | 표시 | 부 |
| 배너 · 족자 · 현수막 | `standard` | 배너, 족자, 현수막 | 카테고리, 사이즈, 재질 | 표시 | 개 |
| 명함 · 봉투 | `standard` | 명함, 봉투 | 카테고리, 사이즈, 재질 | 표시 | 부 |
| 로고 | `logo` | 없음 | 카테고리, 사이즈, 재질 | 숨김 | 없음 |

`로고`의 디자인 + 인쇄 견적 라벨은 `시안 당 단가`, 나머지는 Figma대로 `페이지 당 단가`를 사용한다. 로고의 숨겨진 `planning_estimate`는 기존 NOT NULL 칼럼 호환을 위해 `0`으로 저장한다.

## Canonical Data Contract

```ts
export const productTypes = [
  '브로슈어 · 카탈로그',
  '리플렛 · 팜플렛',
  '포스터 · 전단지',
  '배너 · 족자 · 현수막',
  '명함 · 봉투',
  '로고',
] as const

export type ProductType = (typeof productTypes)[number]
export type ProductOptionKey =
  | 'page'
  | 'paper'
  | 'thickness'
  | 'coating'
  | 'category'
  | 'size'
  | 'material'

export type ProductConfiguration = {
  version: 1
  legacyType?: string
  subtype: string | null
  options: Partial<Record<ProductOptionKey, string[]>>
  quantityPrices: Array<{
    quantity: number
    unitPrice: number
  }>
}
```

`products.name`은 삭제하지 않고 호환 필드로 유지한다. 하위 탭이 있으면 선택된 하위 유형(`배너`, `족자` 등), 없으면 고정 유형명을 자동 저장해 Figma에서 사라진 별도 상품명 입력을 대체한다.

---

### Task 1: Add the compatible product configuration schema

**Files:**
- Create via Supabase CLI: `supabase/migrations/*_add_product_configuration.sql`
- Modify: `packages/supabase/src/types.ts:368`
- Create: `packages/supabase/tests/product-schema-contract.test.mjs`

**Interfaces:**
- Consumes: 기존 `public.products` 행과 RLS/권한 정책
- Produces: `products.configuration: Json`, 신규/수정 행에 적용되는 고정 유형 check constraint

- [ ] **Step 1: Write the failing schema contract test**

```js
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const migrationsUrl = new URL("../../../supabase/migrations/", import.meta.url);
const migrationName = (await readdir(migrationsUrl)).find((name) =>
  name.endsWith("_add_product_configuration.sql"),
);

assert.ok(migrationName, "product configuration migration is missing");

const [migration, types] = await Promise.all([
  readFile(new URL(migrationName, migrationsUrl), "utf8"),
  readFile(new URL("../src/types.ts", import.meta.url), "utf8"),
]);

test("product schema stores variable configuration and fixes future types", () => {
  assert.match(migration, /add column configuration jsonb/);
  assert.match(migration, /products_type_fixed_check/);
  assert.match(migration, /not valid/);
  assert.match(types, /configuration: Json/);
});

test("migration preserves unmatched legacy types", () => {
  assert.doesNotMatch(migration, /delete from public\.products/);
  assert.match(migration, /'스티커'/);
  assert.match(migration, /'일반상품'/);
  assert.match(migration, /'추가상품'/);
});
```

- [ ] **Step 2: Run the contract test and confirm it fails**

Run: `pnpm --filter @repo/supabase test`

Expected: FAIL because the new migration and `configuration` database type do not exist.

- [ ] **Step 3: Generate the migration with the Supabase CLI**

Run: `pnpm dlx supabase migration new add_product_configuration`

Expected: one new `supabase/migrations/*_add_product_configuration.sql` file. Use the generated filename unchanged.

- [ ] **Step 4: Implement the additive migration**

Use this SQL in the generated migration:

```sql
alter table public.products
  add column configuration jsonb not null
  default '{"version":1,"subtype":null,"options":{},"quantityPrices":[]}'::jsonb;

alter table public.products
  drop constraint if exists products_paper_types_check,
  drop constraint if exists products_page_counts_check,
  drop constraint if exists products_order_quantities_check;

alter table public.products
  add constraint products_configuration_object_check
    check (jsonb_typeof(configuration) = 'object');

update public.products
set configuration = jsonb_set(
  configuration,
  '{legacyType}',
  to_jsonb(type),
  true
)
where type in (
  '브로슈어', '카탈로그', '리플렛', '포스터', '현수막', '명함',
  '스티커', '일반상품', '추가상품'
);

update public.products
set type = case type
  when '브로슈어' then '브로슈어 · 카탈로그'
  when '카탈로그' then '브로슈어 · 카탈로그'
  when '리플렛' then '리플렛 · 팜플렛'
  when '포스터' then '포스터 · 전단지'
  when '현수막' then '배너 · 족자 · 현수막'
  when '명함' then '명함 · 봉투'
  else type
end;

alter table public.products
  drop constraint if exists products_type_fixed_check;

alter table public.products
  add constraint products_type_fixed_check check (
    type in (
      '브로슈어 · 카탈로그',
      '리플렛 · 팜플렛',
      '포스터 · 전단지',
      '배너 · 족자 · 현수막',
      '명함 · 봉투',
      '로고'
    )
  ) not valid;
```

`NOT VALID`는 기존의 매핑 불가능한 세 행을 보존하면서 신규 INSERT와 UPDATE에는 여섯 값만 허용한다. 기존 `unit_prices`, 배열 칼럼과 공개 컬럼 grant는 그대로 유지하므로 사용자 주문 데이터 계약과 RLS를 넓히지 않는다.

- [ ] **Step 5: Mirror the column in generated-style TypeScript types**

Add `configuration: Json` to `Row` and make it optional in `Insert`/`Update` under `Database.public.Tables.products`; the database default makes the generated Insert field optional.

```ts
Row: {
  configuration: Json;
  // existing product fields
};
Insert: {
  configuration?: Json;
  // existing product fields
};
Update: {
  configuration?: Json;
  // existing product fields
};
```

- [ ] **Step 6: Run the Supabase package tests**

Run: `pnpm --filter @repo/supabase test && pnpm --filter @repo/supabase check-types`

Expected: PASS.

- [ ] **Step 7: Commit the schema contract**

```bash
git add supabase/migrations packages/supabase/src/types.ts packages/supabase/tests/product-schema-contract.test.mjs
git commit -m "feat: add flexible product configuration"
```

---

### Task 2: Replace the product form model with fixed profiles

**Files:**
- Modify: `apps/admin/src/pages/productData.ts`
- Modify: `apps/admin/tests/productData.test.mjs`

**Interfaces:**
- Consumes: `TableRow<'products'>`, `TableInsert<'products'>`, fixed type list
- Produces: `productTypes`, `productProfiles`, `isProductType`, `changeProductType`, `toProductFormState`, `toProductMutationInput`

- [ ] **Step 1: Add failing tests for the fixed catalog and profiles**

```js
test('product types are fixed in the requested display order', () => {
  assert.deepEqual(productTypes, [
    '브로슈어 · 카탈로그',
    '리플렛 · 팜플렛',
    '포스터 · 전단지',
    '배너 · 족자 · 현수막',
    '명함 · 봉투',
    '로고',
  ])
})

test('profiles expose only the sections shown for each form shape', () => {
  assert.deepEqual(
    productProfiles['브로슈어 · 카탈로그'].optionGroups.map(({ key }) => key),
    ['page', 'paper', 'thickness', 'coating'],
  )
  assert.deepEqual(productProfiles['배너 · 족자 · 현수막'].subtypes, [
    '배너',
    '족자',
    '현수막',
  ])
  assert.equal(productProfiles['로고'].showPlanning, false)
  assert.equal(productProfiles['로고'].quantityUnit, null)
})
```

- [ ] **Step 2: Add failing serializer tests for booklet, standard, logo, and draft states**

Cover these exact behaviors:

```js
test('logo publishes without planning or quantity rows', () => {
  const form = completeLogoForm()
  const input = toProductMutationInput(form, 'published')

  assert.equal(input.name, '로고')
  assert.equal(input.type, '로고')
  assert.equal(input.planning_estimate, 0)
  assert.deepEqual(input.order_quantities, [])
  assert.deepEqual(input.configuration.quantityPrices, [])
})

test('standard products derive the compatibility name from the subtype', () => {
  const form = completeBannerForm()
  const input = toProductMutationInput(form, 'published')

  assert.equal(input.name, '배너')
  assert.equal(input.type, '배너 · 족자 · 현수막')
  assert.deepEqual(input.configuration.quantityPrices, [
    { quantity: 1, unitPrice: 50000 },
    { quantity: 2, unitPrice: 50000 },
  ])
})

test('drafts discard empty editor rows while published products reject them', () => {
  const form = { ...completeBannerForm(), quantityPrices: [{ quantity: '', unitPrice: '' }] }

  assert.doesNotThrow(() => toProductMutationInput(form, 'draft'))
  assert.throws(() => toProductMutationInput(form, 'published'), {
    message: '상품 정보를 확인해주세요.',
  })
})
```

- [ ] **Step 3: Run the focused tests and confirm they fail**

Run: `pnpm --dir apps/admin exec node --experimental-strip-types --test tests/productData.test.mjs`

Expected: FAIL because the fixed catalog, profiles, configuration state, and conditional validation are not implemented.

- [ ] **Step 4: Define the fixed profiles in `productData.ts`**

Keep the profile definition data-only and exhaustive:

```ts
export const productProfiles = {
  '브로슈어 · 카탈로그': bookletProfile,
  '리플렛 · 팜플렛': bookletProfile,
  '포스터 · 전단지': standardProfile(['포스터', '전단지'], '부'),
  '배너 · 족자 · 현수막': standardProfile(['배너', '족자', '현수막'], '개'),
  '명함 · 봉투': standardProfile(['명함', '봉투'], '부'),
  로고: logoProfile,
} as const satisfies Record<ProductType, ProductProfile>
```

Do not introduce a class, registry service, context provider, or schema library. Plain constants and pure functions cover all six cases.

- [ ] **Step 5: Replace `ProductFormState` and type-change behavior**

Use formatted strings only in UI state and numeric values in the mutation:

```ts
export type ProductFormState = {
  designPrintEstimate: string
  optionValues: Record<ProductOptionKey, string[]>
  planningEstimate: string
  productType: ProductType | ''
  quantityPrices: Array<{ quantity: string; unitPrice: string }>
  subtype: string
}
```

`changeProductType(form, nextType)` preserves the two service estimates, resets incompatible options and quantity rows, and selects the first configured subtype. This prevents fields hidden by the new profile from leaking into saved JSON.

- [ ] **Step 6: Implement strict publish and tolerant draft serialization**

- Require a fixed product type for both statuses.
- For `published`, require both visible estimates, every visible option group, a valid subtype when the profile has tabs, and complete positive quantity rows when `quantityUnit` is not null.
- For `draft`, omit blank chips and blank quantity rows; serialize missing numeric estimates as `0` so existing NOT NULL columns remain valid.
- Write the canonical `configuration` object.
- Populate compatibility columns from the canonical state: `paper_types` from paper/material values, `page_counts` from numeric page values, `order_quantities` from quantity rows, and `unit_prices` as a simple index-to-price object.
- Derive `name` from subtype or fixed type; do not restore the removed product-name input.

- [ ] **Step 7: Add guarded JSON loading and legacy fallback**

`toProductFormState` must validate `configuration` with local type guards before using it. If the object is absent, malformed, or only contains `legacyType`, adapt the existing columns:

- map known legacy types to a fixed group;
- use `configuration.legacyType` as a standard-profile subtype when it is one of that profile's tabs;
- map existing page and paper arrays into the closest visible groups;
- collapse the old matrix to one price per quantity by selecting its only unique value;
- preserve unmapped legacy `product.type` as an empty selector so the administrator must pick a valid type before saving.

- [ ] **Step 8: Update list-price mapping**

`toProductListRow` should prefer valid `configuration.quantityPrices` and fall back to legacy `unit_prices`. This keeps the 상품가 column correct before and after an individual row is edited into the new format.

- [ ] **Step 9: Run model tests and type checking**

Run:

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test tests/productData.test.mjs
pnpm --filter admin exec tsc -b
```

Expected: PASS.

- [ ] **Step 10: Commit the product model**

```bash
git add apps/admin/src/pages/productData.ts apps/admin/tests/productData.test.mjs
git commit -m "feat: define fixed product form profiles"
```

---

### Task 3: Rebuild the administrator form as one conditional page

**Files:**
- Modify: `apps/admin/src/pages/ProductFormPage.tsx`
- Modify: `apps/admin/src/pages/ProductFormPage.css`
- Modify: `apps/admin/src/components/AdminIcon.tsx`
- Create: `apps/admin/tests/productFormPage.test.mjs`

**Interfaces:**
- Consumes: `productTypes`, `productProfiles`, `changeProductType`, form serialization helpers
- Produces: one create/edit form matching the three Figma profiles

- [ ] **Step 1: Add a failing source-contract test for the new form**

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const formPath = new URL('../src/pages/ProductFormPage.tsx', import.meta.url)

test('product form uses the fixed selector and one-page conditional sections', async () => {
  const source = await readFile(formPath, 'utf8')

  assert.match(source, /options=\{productTypes\}/)
  assert.match(source, /\breadOnly\b/)
  assert.doesNotMatch(source, /allowCustomValue/)
  assert.doesNotMatch(source, /type Step = 1 \| 2/)
  assert.doesNotMatch(source, /상품명을 입력해주세요/)
  assert.match(source, /I\. 유형 선택/)
  assert.match(source, /II\. 서비스 선택/)
  assert.match(source, /quantityUnit/)
  assert.match(source, /임시저장/)
  assert.match(source, /등록하기/)
  assert.doesNotMatch(source, /figma\.com\/api/)
})
```

- [ ] **Step 2: Run the form contract test and confirm it fails**

Run: `pnpm --dir apps/admin exec node --experimental-strip-types --test tests/productFormPage.test.mjs`

Expected: FAIL because the existing screen still has custom type creation, a product-name field, and two steps.

- [ ] **Step 3: Add the reusable admin plus icon**

Extend `AdminIconName` and `iconDefinitions` with a 16px `plus` glyph using `stroke="currentColor"`. Do not download the Figma `plus-03` asset and do not create a page-local icon wrapper.

```tsx
plus: {
  glyph: <path d="M8 3.333v9.334M3.333 8h9.334" />,
  height: 16,
  strokeWidth: 1.5,
  viewBox: '0 0 16 16',
  width: 16,
},
```

- [ ] **Step 4: Collapse `ProductFormPage` to one form**

Remove `Step`, selected paper/page indices, price-matrix navigation, dynamic type state, `commitProductType`, `handleStepOneSubmit`, and `handleFinalSubmit`. Keep loading, create/update, draft/publish, delete confirmation, errors, and navigation behavior.

Render this structure inside the existing `AdminFormLayout`:

```tsx
<ProductTypeField />
{profile.subtypes.length > 0 ? <ProductSubtypeTabs /> : null}
<ServiceEstimateFields />
{profile.optionGroups.map((group, index) => (
  <EditableOptionGroup number={index + 3} {...group} />
))}
{profile.quantityUnit ? <QuantityPriceRows /> : null}
```

Keep these behaviors explicit:

- The fixed combobox is `readOnly` and receives `productTypes`; typing and custom values are impossible.
- Changing type calls `changeProductType` so incompatible hidden values are removed.
- Standard-profile tabs use real `<button type="button" aria-pressed>` controls and update `form.subtype`.
- Clicking an existing option chip turns that chip into an inline editor. Enter or blur commits; committing an empty edit removes the value.
- `추가 +` appends and focuses one empty inline editor. Escape cancels the new chip.
- Quantity and unit-price rows are editable pairs. `추가 +` appends one pair; clearing both fields removes that pair on blur.
- The draft button uses `formNoValidate` and persists normalized partial data; publish runs the strict model validation.
- Logo omits planning and quantity sections rather than rendering disabled controls.
- The edit screen keeps the current delete action. The create screen does not render it.

- [ ] **Step 5: Match the Figma layout in `ProductFormPage.css`**

Implement the target rules without changing shared layout tokens:

- 640px maximum content width inherited from `AdminFormLayout`;
- 32px between numbered sections and 20px inside a section;
- 52px controls, 16px radius, `#f1f5f9` borders;
- segmented subtype rail: gray-50 background, 4px padding/gap, 44px active item, brand-500 fill;
- option chips: minimum 64px, 16px horizontal padding, selected brand-50/brand-500 treatment;
- option rows use flex-wrap with parent `gap`, never child margins;
- quantity header and rows use two equal columns with 8px gap;
- action layout remains responsive through `AdminFormLayout`;
- typography uses the existing `--font-sans` and 14/20 or 14/21 tokens; no new focus border/outline rules.

- [ ] **Step 6: Run the form tests, type checker, and lint**

Run:

```bash
pnpm --filter admin test
pnpm --filter admin exec tsc -b
pnpm --filter admin lint
```

Expected: PASS with zero lint warnings.

- [ ] **Step 7: Commit the one-page form**

```bash
git add apps/admin/src/pages/ProductFormPage.tsx apps/admin/src/pages/ProductFormPage.css apps/admin/src/components/AdminIcon.tsx apps/admin/tests/productFormPage.test.mjs
git commit -m "feat: implement conditional product form"
```

---

### Task 4: Verify migration safety and all product-form states

**Files:**
- Modify only if verification exposes a defect in a file owned by Tasks 1–3.

**Interfaces:**
- Consumes: migration, fixed profiles, administrator routes
- Produces: test and visual evidence that existing data remains editable and new values are constrained

- [ ] **Step 1: Verify pre-migration assumptions on the development database**

Run read-only queries before applying the migration:

```sql
select type, status, count(*)
from public.products
group by type, status
order by type, status;

select id, type
from public.products
where type not in (
  '브로슈어', '카탈로그', '리플렛', '포스터', '현수막', '명함',
  '스티커', '일반상품', '추가상품'
);
```

Expected: the first query accounts for all rows; the second returns no unexpected legacy types. If it returns rows, stop the migration and add only explicit mappings approved for those values—never delete or guess.

- [ ] **Step 2: Apply the migration to a local or isolated development database**

Use the repository's linked development workflow. Do not run `db push` against production. After applying, verify:

```sql
select type, count(*)
from public.products
group by type
order by type;

select type
from public.products
where type in ('스티커', '일반상품', '추가상품')
order by type;
```

Expected: the six known old labels are grouped under their new fixed labels; the three unmatched labels still exist exactly once each.

- [ ] **Step 3: Verify the database constraint behavior inside a rolled-back transaction**

```sql
begin;

insert into public.products (
  name,
  type,
  design_print_estimate,
  planning_estimate,
  paper_types,
  page_counts,
  order_quantities,
  unit_prices,
  configuration
) values (
  '잘못된 유형',
  '직접 입력 유형',
  0,
  0,
  '{}',
  '{}',
  '{}',
  '{}',
  '{"version":1,"subtype":null,"options":{},"quantityPrices":[]}'
);

rollback;
```

Expected: INSERT fails with `products_type_fixed_check`; execute `rollback` if the SQL client keeps the transaction open.

- [ ] **Step 4: Run the full automated regression suite**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter admin test
pnpm --filter admin exec tsc -b
pnpm --filter admin lint
pnpm --filter admin build
```

Expected: every command passes.

- [ ] **Step 5: Manually verify create-state variants at `/products/new`**

Check at desktop width and at 390px viewport:

1. The type menu lists exactly six values and accepts no typed/custom value.
2. `브로슈어 · 카탈로그` shows service, page, paper, thickness, coating, and quantity sections matching Figma `1234:9529`.
3. `배너 · 족자 · 현수막` shows the three subtype tabs plus category, size, material, and quantity sections matching Figma `1234:10015`.
4. `로고` shows only one service estimate, category, size, and material; it has no planning or quantity section, matching Figma `1234:10434`.
5. Chip add/edit/remove and quantity-row add/remove work by mouse and keyboard.
6. Draft save accepts partial visible values; publish focuses the first invalid visible field and displays one actionable error.

- [ ] **Step 6: Manually verify edit and legacy states**

1. Open one mapped legacy row and confirm its old pages, paper values, quantities, and prices appear.
2. Save it and confirm list status, ordering, and lowest price are unchanged.
3. Open `스티커`, `일반상품`, or `추가상품`; confirm the fixed selector is empty and save is blocked until one of the six values is selected.
4. Delete-dialog behavior and list navigation remain unchanged.

- [ ] **Step 7: Run the required Figma URL scan**

Run: `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`

Expected: no output and exit code 1 from `rg` because there are no matches.

- [ ] **Step 8: Review the final diff and commit verification fixes, if any**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only files listed in this plan are changed.

If Task 4 required a correction, stage only the owned implementation files that changed and commit them:

```bash
git add supabase/migrations packages/supabase/src/types.ts packages/supabase/tests/product-schema-contract.test.mjs apps/admin/src/pages/productData.ts apps/admin/tests/productData.test.mjs apps/admin/src/pages/ProductFormPage.tsx apps/admin/src/pages/ProductFormPage.css apps/admin/src/components/AdminIcon.tsx apps/admin/tests/productFormPage.test.mjs
git commit -m "fix: complete product form verification"
```

---

## Rollout Notes

- Deploy application code and the additive migration together to prevent the new serializer from writing a missing `configuration` column.
- 이 계획을 먼저 배포하고 관리자에서 실제 공개 상품의 `configuration`을 검수·저장한 뒤 2단계 사용자 연동을 배포한다. 두 단계를 한 번에 켜지 않는다.
- Do not validate `products_type_fixed_check` while `스티커`, `일반상품`, or `추가상품` remains. After administrators reclassify those three rows, a later one-line migration can run `alter table public.products validate constraint products_type_fixed_check;`.
- Do not drop the legacy product columns in this release. Remove them only after the user order flow reads `configuration` and production data has been verified.

## Explicitly Skipped

- A relational option-group schema: six fixed form profiles do not justify extra tables, joins, RLS policies, and CRUD APIs.
- A generic form-builder abstraction: the three profiles fit a plain configuration object and small local render helpers.
- User order-page integration: [2단계 계획](./2026-08-06-user-product-data-integration.md)으로 분리한다.
- Destructive consolidation of duplicate or unmatched products: no product rows are merged or deleted without a product-owner decision.
