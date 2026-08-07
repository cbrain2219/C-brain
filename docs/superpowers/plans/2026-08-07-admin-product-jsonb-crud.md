# 관리자 상품 JSONB CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 Supabase의 상품 10개를 그대로 보존하면서 새 유형별 상품 폼의 상세 조회, 임시저장, 게시, 수정, 신규 등록, 삭제를 실제 `products` 테이블에 연결한다.

**Architecture:** `products`의 현재 계약인 `product_type`, `product_subtype`, `status`, `configuration jsonb`를 TypeScript 타입과 Supabase helper의 단일 기준으로 사용한다. UI 문자열과 JSON 숫자의 변환은 순수 모듈에 격리하고, 편집 시 원래 JSON 객체의 알 수 없는 키를 보존한 채 세 개의 폼 소유 키만 갱신한다. `ProductFormUiPage`는 기존 공용 폼 필드를 유지하면서 데이터 로드와 CRUD 상태만 담당한다.

**Tech Stack:** React 19, TypeScript 6, Vite 8, React Router 7, Supabase JS 2, Postgres JSONB, Node test runner

## Global Constraints

- 현재 원격 DB의 10개 상품 행, UUID, `sort_order`, 상태, 옵션과 가격을 구현 과정에서 삭제·재시드·초기화하지 않는다.
- 이번 작업은 스키마 변경이 아니다. 원격 SQL, migration, seed를 실행하지 않는다.
- DB 숫자는 JSON number 또는 `null`, 폼 숫자는 쉼표가 포함된 문자열로 유지한다.
- 편집 저장은 `configuration`의 알 수 없는 최상위 키를 보존하고 `optionValues`, `priceRowsBySelection`, `serviceEstimatesBySelection`만 교체한다.
- 상품 유형과 하위 유형은 `productFormUi.ts`의 여섯 고정 유형 및 허용 하위 유형만 저장한다.
- 신규 등록은 DB의 `(product_type, product_subtype)` unique 계약을 유지한다. 이미 존재하는 조합은 중복 등록하지 않고 오류를 표시한다.
- 추가 라이브러리, 전역 store, context provider, 범용 schema/form 엔진을 도입하지 않는다.
- `design.md`의 Pretendard GOV, `gap` 간격, focus, SVG 아이콘 규칙을 유지한다.
- Figma API URL을 소스에 추가하지 않는다.

---

### Task 1: 현재 상품 테이블 계약을 타입과 helper에 반영

**Files:**
- Modify: `packages/supabase/src/types.ts`
- Modify: `packages/supabase/src/products.ts`
- Modify: `packages/supabase/tests/content-helpers.test.mjs`

**Interfaces:**
- Produces: `ProductRecord`, `ProductInsert`, `ProductUpdate`, typed `getAdminProduct`, `createProduct`, `updateProduct`, `deleteProduct`
- Consumes: 현재 `public.products` 필드와 admin `app_metadata.role` RLS

- [x] **Step 1: 새 CRUD payload와 호출 순서를 고정하는 실패 테스트 작성**

```js
test('product helpers use the JSONB product contract', async () => {
  const product = {
    configuration: { optionValues: {} },
    created_at: '2026-08-07T00:00:00.000Z',
    id: 'product-id',
    product_subtype: '',
    product_type: '브로슈어 · 카탈로그',
    sort_order: 1,
    status: 'draft',
  }
  const { calls, client } = createFakeClient({ products: product })

  assert.deepEqual(await getAdminProduct(client, product.id), product)
  assert.deepEqual(await createProduct(client, {
    configuration: product.configuration,
    product_subtype: '',
    product_type: product.product_type,
    status: 'draft',
  }), product)
  assert.deepEqual(await updateProduct(client, product.id, {
    configuration: product.configuration,
    status: 'published',
  }), product)
  await deleteProduct(client, product.id)

  assert.ok(calls.some((call) => call.method === 'insert'))
  assert.ok(calls.some((call) => call.method === 'update'))
  assert.ok(calls.some((call) => call.method === 'delete'))
})
```

- [x] **Step 2: focused Supabase test를 실행해 구 타입 계약 때문에 실패하는지 확인**

Run: `pnpm --filter @repo/supabase test`

Expected: 새 JSONB insert/update 계약 또는 import가 없어 FAIL.

- [x] **Step 3: `Database.public.Tables.products`를 현재 스키마로 교체**

```ts
products: {
  Row: {
    configuration: Json
    created_at: string
    id: string
    product_subtype: string
    product_type: string
    sort_order: number
    status: ProductStatus
  }
  Insert: {
    configuration?: Json
    created_at?: string
    id?: string
    product_subtype?: string
    product_type: string
    sort_order?: number
    status?: ProductStatus
  }
  Update: {
    configuration?: Json
    created_at?: string
    id?: string
    product_subtype?: string
    product_type?: string
    sort_order?: number
    status?: ProductStatus
  }
  Relationships: []
}
```

- [x] **Step 4: product helper 타입과 반환값을 새 계약으로 단순화**

```ts
export type ProductRecord = TableRow<'products'>
export type ProductInsert = Pick<
  TableInsert<'products'>,
  'configuration' | 'product_subtype' | 'product_type' | 'status'
>
export type ProductUpdate = Pick<
  TableUpdate<'products'>,
  'configuration' | 'product_subtype' | 'product_type' | 'status'
>
```

`createProduct`는 `ProductInsert`, `updateProduct`는 `ProductUpdate`를 받고 각각 `.select('*').single()`로 저장된 한 행을 반환한다. 모든 mutation 앞에는 기존 `requireAdmin`을 유지한다.

- [x] **Step 5: Supabase test, type check, lint 통과 확인**

Run: `pnpm --filter @repo/supabase test && pnpm --filter @repo/supabase check-types && pnpm --filter @repo/supabase lint`

Expected: PASS.

---

### Task 2: JSONB와 상품 UI draft 사이의 무손실 변환 구현

**Files:**
- Create: `apps/admin/src/pages/productFormPersistence.ts`
- Create: `apps/admin/tests/productFormPersistence.test.mjs`
- Modify: `apps/admin/src/pages/productData.ts`
- Modify: `apps/admin/tests/productData.test.mjs`
- Modify: `apps/admin/src/pages/ProductFormPage.tsx`

**Interfaces:**
- Produces: `toProductUiDraft(record)`, `toProductWriteInput(draft, status, originalConfiguration?)`, `getProductValidationMessage(draft, status)`
- Consumes: `ProductUiDraft`, `productTypes`, `productSubtypeOptions`, `getProductUiProfile`, `ProductRecord`

- [x] **Step 1: 현재 seed 형태의 정확한 hydrate/serialize round trip 실패 테스트 작성**

```js
test('seeded JSONB hydrates and serializes without losing prices', () => {
  const record = seededBrochureRecord()
  const draft = toProductUiDraft(record)
  const input = toProductWriteInput(draft, 'draft', record.configuration)

  assert.equal(draft.productType, record.product_type)
  assert.deepEqual(draft.optionValues.pageCount, ['8', '12', '16'])
  assert.equal(draft.priceRowsBySelection['0:0:0:0'][0].unitPrice, '850,000')
  assert.deepEqual(input.configuration, record.configuration)
})
```

추가로 `null` 가격, 하위 유형, 알 수 없는 JSON 키 보존, 잘못된 유형 거부, 빈 draft 숫자의 `null` 저장, published 옵션의 빈 값 거부를 각각 검증한다.

- [x] **Step 2: focused admin test를 실행해 변환 모듈 부재로 실패하는지 확인**

Run: `pnpm --dir apps/admin exec node --experimental-strip-types --test tests/productFormPersistence.test.mjs`

Expected: module not found 또는 export 부재로 FAIL.

- [x] **Step 3: 엄격한 JSON reader와 숫자 변환 구현**

```ts
function toStoredNumber(value: string) {
  const normalized = value.replaceAll(',', '').trim()
  if (!normalized) return null
  const number = Number(normalized)
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error('숫자 입력값을 확인해주세요.')
  }
  return number
}

function toDraftNumber(value: Json | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? formatNumericValue(String(value))
    : ''
}
```

`toProductUiDraft`는 record의 유형/하위 유형을 profile과 대조하고, 세 JSON 키를 guarded parsing하여 쉼표 문자열 draft로 변환한다. 선택 인덱스는 모든 옵션에서 0으로 초기화하고, DB에 저장하지 않는다.

- [x] **Step 4: 원본 JSON을 보존하는 serializer 구현**

```ts
const configuration = {
  ...originalJsonObject,
  optionValues: serializedOptions,
  priceRowsBySelection: serializedPriceRows,
  serviceEstimatesBySelection: serializedServices,
}

return {
  configuration,
  product_subtype: draft.productSubtype,
  product_type: draft.productType,
  status,
}
```

편집 중 유형/하위 유형이 달라진 경우 caller는 `originalConfiguration`을 전달하지 않아 이전 유형의 확장 키가 새 상품으로 새지 않게 한다.

- [x] **Step 5: live 목록에 필요한 기능만 `productData.ts`에 남기고 dead legacy form을 alias 처리**

`productData.ts`에는 `formatNumericValue`, `ProductListRow`, `toProductListRow`, `filterProductRows`만 유지한다. 더는 route에 쓰이지 않는 `ProductFormPage.tsx`는 `ProductFormUiPage`를 re-export하여 이전 import가 생겨도 구 스키마 mutation을 실행할 수 없게 한다.

- [x] **Step 6: 변환 및 목록 테스트 통과 확인**

Run: `pnpm --filter admin test && pnpm --filter admin build`

Expected: PASS.

---

### Task 3: 실제 상품 폼에 조회·저장·게시·삭제 연결

**Files:**
- Modify: `apps/admin/src/pages/ProductFormUiPage.tsx`
- Modify: `apps/admin/tests/productFormUiPage.test.mjs`

**Interfaces:**
- Consumes: Task 1 CRUD helper, Task 2 pure converters, existing `ProductFormFields`, `AdminDeleteDialog`
- Produces: working `/products/new` and `/products/:productId`

- [x] **Step 1: 페이지 source contract를 실제 CRUD 기준으로 변경해 먼저 실패 확인**

```js
test('product form loads and mutates JSONB products', () => {
  assert.match(source, /getAdminProduct/)
  assert.match(source, /createProduct/)
  assert.match(source, /updateProduct/)
  assert.match(source, /deleteProduct/)
  assert.match(source, /toProductUiDraft/)
  assert.match(source, /toProductWriteInput/)
  assert.doesNotMatch(source, /현재 UI만 적용되어 저장되지 않습니다/)
})
```

- [x] **Step 2: edit route hydration과 오류 경계 구현**

`productId`가 있으면 `getAdminProduct`를 한 번 호출하고 결과를 `toProductUiDraft`로 변환한다. 완료 전에는 `상품 정보를 불러오는 중입니다.`, 실패 시에는 `상품 정보를 불러오지 못했습니다.`를 `role=status|alert`로 표시하고 빈 폼을 렌더링하지 않는다.

- [x] **Step 3: draft/publish persistence 구현**

submitter의 `value`를 `draft | publish`로 읽는다. 저장 중 중복 submit을 막고, edit이면 `updateProduct`, new이면 `createProduct`를 호출한다. 임시저장 성공 시 새 행은 반환 ID의 상세 URL로 이동하고, 편집 행은 같은 URL을 유지한다. 게시 성공 시 목록으로 이동한다.

- [x] **Step 4: 공용 삭제 dialog 연결**

edit route에서만 `AdminDeleteDialog`를 표시한다. 확인 시 `deleteProduct` 후 `/products`로 replace 이동하며, 실패 시 현재 폼 상태를 유지하고 error/toast를 표시한다.

- [x] **Step 5: action과 error UX 유지**

저장/삭제 중 모든 mutation button을 disabled 처리하고 등록 button 문구를 `저장 중`으로 바꾼다. 기존 Figma action 배치, `AdminFooter`, 유형별 필드 컴포넌트는 변경하지 않는다.

- [x] **Step 6: 페이지 test, 전체 admin test, build, lint 통과 확인**

Run: `pnpm --filter admin test && pnpm --filter admin build && pnpm --filter admin lint`

Expected: PASS.

---

### Task 4: 기존 데이터 보존 및 실제 동작 검증

**Files:**
- Modify only if verification finds a defect in Tasks 1–3 files

**Interfaces:**
- Verifies: DB read contract, form hydration, no-op update, list state, UI actions, unchanged seeded catalog

- [x] **Step 1: 전체 정적 검증**

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
pnpm --filter admin test
pnpm --filter admin build
pnpm --filter admin lint
git diff --check
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: 모든 pnpm/git 검사는 0, Figma URL 검색은 출력 없이 1.

- [x] **Step 2: 현재 10개 행을 read-only로 확인**

관리자 상품 목록에서 상품 10개, 유형/하위유형, 상태, 최저가가 모두 표시되는지 확인한다. 기존 상세 중 브로슈어, 리플렛, 명함, 로고를 열어 현재 JSONB가 옵션/가격/서비스 입력으로 복원되는지 확인한다.

- [x] **Step 3: 데이터 보존형 edit 검증**

기존 행을 삭제하거나 가격을 바꾸지 않는다. 한 상세 페이지에서 값을 변경하지 않은 채 `임시저장`을 실행하고, 재조회 후 UUID, `sort_order`, status, configuration이 저장 전과 동일한지 확인한다. 네트워크/콘솔에 application error가 없어야 한다.

- [x] **Step 4: create/update/delete helper의 실제 RLS 검증**

기존 10개가 아닌 고유한 QA 임시 행을 authenticated admin으로 생성하고, 같은 행만 업데이트한 뒤 삭제한다. 각 응답 ID가 동일한지 확인하고 마지막 목록 count가 다시 10인지 확인한다. 실패하면 즉시 QA 행만 정리하며 기존 ID는 mutation 대상으로 사용하지 않는다.

- [x] **Step 5: 최종 보존 확인**

검증 종료 시 기존 상품 목록의 10개 UUID와 정렬 순서가 시작 상태와 같고, QA 임시 행이 남지 않았는지 확인한다.

## Self-Review

- **Spec coverage:** Task 1은 현재 DB 계약과 CRUD helper, Task 2는 JSONB 무손실 변환, Task 3은 모든 visible action, Task 4는 기존 데이터 보존과 실제 RLS를 검증한다.
- **Placeholder scan:** 모든 새 symbol, 파일, 명령과 기대 결과가 명시되어 있다.
- **Type consistency:** DB는 number/null, UI는 comma string, status는 `draft | published`, identity는 기존 UUID를 유지한다.
- **Scope:** schema migration과 seed 실행은 없으며 상품 CRUD 외 다른 도메인은 수정하지 않는다.
