# 관리자 상품 상세 UI 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 상품 등록·수정 화면에 사용할 새 단일 페이지 상품 폼 UI를 여섯 고정 유형별 섹션 구성으로 만들고, DB나 저장 로직을 건드리지 않은 상태에서 안전하게 검수할 수 있는 개발용 프리뷰를 제공한다.

**Architecture:** 유형·섹션 순서·입력 종류는 `productFormUi.ts`의 단일 설정 객체로 정의하고, 재사용 가능한 `ProductFormFields`가 공통 I·II 섹션과 유형별 III 이후 섹션을 렌더링한다. 현재 운영 CRUD 화면은 그대로 두고 동일 컴포넌트를 개발 전용 `/products/ui-preview`에서 먼저 검수한다. UI 승인 후 후속 DB 계획에서 이 컴포넌트를 실제 `ProductFormPage`의 저장 상태와 연결한다.

**Tech Stack:** React 19, TypeScript 6, Vite 8, React Router 7, Node test runner, CSS

## Global Constraints

- 이 계획은 관리자 UI만 다룬다. `supabase/migrations/**`, `packages/supabase/**`, `apps/user/**`, `apps/admin/src/pages/productData.ts`의 DB serializer는 수정하지 않는다.
- 현재 `/products/new`, `/products/:productId` CRUD 화면은 이 단계에서 교체하지 않는다. 새 UI는 `import.meta.env.DEV`일 때만 등록되는 `/products/ui-preview`에서 검수한다.
- 프리뷰의 `임시저장`, `등록하기`, `수정하기`는 Supabase를 호출하지 않는다. 클릭하면 `UI 프리뷰에서는 저장하지 않습니다.` 안내만 표시한다.
- 최신 사용자 요구사항의 섹션 구성은 기존 Figma 프레임의 필드 종류보다 우선한다. Figma `1234:9529`, `1234:10015`, `1234:10434`는 폭, 간격, 입력 모양, 서비스 영역, 수량 표 스타일만 참조한다.
- 모든 유형은 `I. 유형 선택`, `II. 서비스 선택`을 공통으로 가진다. 유형별 섹션은 반드시 `III.`부터 끊김 없이 번호를 매긴다.
- 메인 유형은 정확히 `브로슈어 · 카탈로그`, `리플렛 · 팜플렛`, `포스터 · 전단지`, `배너 · 족자 · 현수막`, `명함 · 봉투`, `로고` 여섯 값만 표시한다. `/` 표기는 요구사항 설명의 별칭이며 UI 값은 가운데점 표기로 통일한다.
- 비로고 유형의 서비스 영역은 `디자인 + 인쇄 견적 (페이지 당 단가)`와 `기획 견적 (페이지 당 단가)`를 표시한다. 로고도 II 섹션은 유지하되 `디자인 + 인쇄 견적 (시안 당 단가)`만 표시한다.
- 옵션 값은 추가·수정·삭제할 수 있고, 수량 섹션은 `수량`과 `인쇄 단가` 두 열을 가진 행을 추가·수정·삭제할 수 있어야 한다.
- 유형을 바꾸면 서비스 견적 값은 유지하고, 호환되지 않는 III 이후 옵션과 수량 행은 새 유형의 빈 초기값으로 교체한다.
- `design.md`의 Pretendard GOV, `-0.015em`, 부모 `gap` 간격, form focus 규칙을 따른다.
- 신규 UI 아이콘은 `AdminIcon`의 inline SVG로만 추가하고 `currentColor`를 사용한다. 이 화면에는 원격 Figma asset이 필요하지 않다.
- Figma MCP asset URL을 소스에 넣지 않는다. 완료 전 `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`가 매치 없이 종료되어야 한다.
- 새 폼 라이브러리, validation 라이브러리, 전역 store, context provider를 추가하지 않는다.

---

## Exact Section Matrix

공통 영역은 아래 두 섹션이다.

| 번호 | 표시명 | 구성 |
| --- | --- | --- |
| I | 유형 선택 | 여섯 고정 값만 제공하는 readonly combobox |
| II | 서비스 선택 | 견적 입력; 로고만 기획 견적 숨김 |

유형별 III 이후 영역은 아래 순서가 최종 기준이다.

| 메인 유형 | III 이후 섹션 |
| --- | --- |
| 브로슈어 · 카탈로그 | III. 페이지 수 선택 → IV. 용지 선택 → V. 두께 선택 → VI. 표지 코팅 선택 → VII. 수량 선택 |
| 리플렛 · 팜플렛 | III. 사이즈 선택 → IV. 용지 선택 → V. 두께 선택 → VI. 표지 코팅 선택 → VII. 수량 선택 (국3절) → VIII. 수량 선택 (A3) → IX. 수량 선택 (A4) |
| 포스터 · 전단지 | III. 사이즈 선택 → IV. 용지 → V. 두께 선택 → VI. 코팅 선택 → VII. 수량 선택 |
| 배너 · 족자 · 현수막 | III. 사이즈 → IV. 거치대 선택 → V. 재질 → VI. 면 → VII. 코팅 → VIII. 수량 선택 |
| 명함 · 봉투 | III. 사이즈 → IV. 기본 수량 → V. 재질 선택 → VI. 두께 선택 → VII. 인원 선택 |
| 로고 | III. 유형 → IV. 시안 개수 |

## Control Mapping

| 섹션 종류 | UI 컨트롤 | 단위 |
| --- | --- | --- |
| 페이지 수 선택 | 숫자 옵션 편집기 | `p` |
| 사이즈/용지/두께/코팅/거치대/재질/면/로고 유형 | 텍스트 옵션 편집기 | 없음 |
| 기본 수량 | 숫자 옵션 편집기 | `부` |
| 인원 선택 | 숫자 옵션 편집기 | `명` |
| 시안 개수 | 숫자 옵션 편집기 | `개` |
| 모든 `수량 선택` | 수량·인쇄 단가 2열 편집기 | 인쇄물 `부`, 배너형 `개` |

`국3절`, `A3`, `A4`는 리플렛 수량 표의 별도 제목이며 하나의 표 안에서 사이즈를 고르는 탭으로 합치지 않는다.

## Visual Contract

- 폼 폭은 `min(640px, 100%)`을 유지한다.
- 페이지 상하 구조는 기존 `AdminFormLayout`의 본문과 하단 action bar를 재사용한다.
- 큰 섹션 사이는 `32px`, 섹션 제목과 컨트롤 사이는 `20px`, 같은 행 내부는 `8px` 또는 `16px` `gap`을 사용한다.
- 텍스트/숫자 컨트롤은 높이 `52px`, 테두리 `#f1f5f9`, radius `16px`, 좌우 padding `16px`다.
- 옵션 항목은 입력 가능한 52px pill 형태로 표시하고 우측에 삭제 버튼을 둔다.
- `추가` action은 브랜드색 텍스트와 16px `plus` 아이콘을 사용하며 새 빈 항목을 끝에 추가한 뒤 포커스한다.
- 수량 표 header는 `#f8fafc`, radius `12px`, `수량`/`인쇄 단가` 1:1 열이다. 각 입력 행도 같은 1:1 열을 유지한다.
- 520px 이하에서는 옵션 pill과 수량 행이 가로 overflow를 만들지 않도록 한 열로 쌓고, action bar는 기존 모바일 규칙을 유지한다.

---

### Task 1: Define the exact UI profile contract and local draft state

**Files:**
- Create: `apps/admin/src/pages/productFormUi.ts`
- Create: `apps/admin/tests/productFormUi.test.mjs`

**Interfaces:**
- Consumes: 최신 여섯 유형 섹션 표
- Produces: `productTypes`, `ProductType`, `productUiProfiles`, `ProductUiDraft`, `createProductUiDraft`, `changeProductUiType`, `formatProductSectionHeading`

- [ ] **Step 1: Write the failing profile-matrix test**

Create `apps/admin/tests/productFormUi.test.mjs` and assert every visible heading exactly:

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatProductSectionHeading,
  productTypes,
  productUiProfiles,
} from '../src/pages/productFormUi.ts'

const headings = (type) =>
  productUiProfiles[type].sections.map((section, index) =>
    formatProductSectionHeading(index, section.label),
  )

test('product types are fixed in display order', () => {
  assert.deepEqual(productTypes, [
    '브로슈어 · 카탈로그',
    '리플렛 · 팜플렛',
    '포스터 · 전단지',
    '배너 · 족자 · 현수막',
    '명함 · 봉투',
    '로고',
  ])
})

test('every product starts its custom sections at III', () => {
  assert.deepEqual(headings('브로슈어 · 카탈로그'), [
    'III. 페이지 수 선택',
    'IV. 용지 선택',
    'V. 두께 선택',
    'VI. 표지 코팅 선택',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('리플렛 · 팜플렛'), [
    'III. 사이즈 선택',
    'IV. 용지 선택',
    'V. 두께 선택',
    'VI. 표지 코팅 선택',
    'VII. 수량 선택 (국3절)',
    'VIII. 수량 선택 (A3)',
    'IX. 수량 선택 (A4)',
  ])
  assert.deepEqual(headings('포스터 · 전단지'), [
    'III. 사이즈 선택',
    'IV. 용지',
    'V. 두께 선택',
    'VI. 코팅 선택',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('배너 · 족자 · 현수막'), [
    'III. 사이즈',
    'IV. 거치대 선택',
    'V. 재질',
    'VI. 면',
    'VII. 코팅',
    'VIII. 수량 선택',
  ])
  assert.deepEqual(headings('명함 · 봉투'), [
    'III. 사이즈',
    'IV. 기본 수량',
    'V. 재질 선택',
    'VI. 두께 선택',
    'VII. 인원 선택',
  ])
  assert.deepEqual(headings('로고'), ['III. 유형', 'IV. 시안 개수'])
})
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test tests/productFormUi.test.mjs
```

Expected: FAIL because `productFormUi.ts` does not exist.

- [ ] **Step 3: Define the section and draft types**

Use these exact public types in `productFormUi.ts`:

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

export type ProductOptionSectionKey =
  | 'pageCount'
  | 'paper'
  | 'thickness'
  | 'coverCoating'
  | 'size'
  | 'coating'
  | 'stand'
  | 'material'
  | 'side'
  | 'baseQuantity'
  | 'people'
  | 'logoType'
  | 'proposalCount'

export type ProductPriceSectionKey =
  | 'quantity'
  | 'quantityThird'
  | 'quantityA3'
  | 'quantityA4'

export type ProductUiSection =
  | {
      inputMode: 'numeric' | 'text'
      key: ProductOptionSectionKey
      kind: 'options'
      label: string
      valueUnit?: 'p' | '부' | '명' | '개'
    }
  | {
      key: ProductPriceSectionKey
      kind: 'quantity-prices'
      label: string
      quantityUnit: '부' | '개'
    }

export type ProductUiProfile = {
  estimateUnit: '페이지' | '시안'
  sections: readonly ProductUiSection[]
  showPlanningEstimate: boolean
}

export type QuantityPriceDraft = {
  quantity: string
  unitPrice: string
}

export type ProductUiDraft = {
  designPrintEstimate: string
  optionValues: Partial<Record<ProductOptionSectionKey, string[]>>
  planningEstimate: string
  priceRows: Partial<Record<ProductPriceSectionKey, QuantityPriceDraft[]>>
  productType: ProductType | ''
}
```

- [ ] **Step 4: Implement the complete profile map**

Define every section explicitly; do not infer fields from the type label:

```ts
export const productUiProfiles = {
  '브로슈어 · 카탈로그': {
    estimateUnit: '페이지',
    showPlanningEstimate: true,
    sections: [
      { key: 'pageCount', kind: 'options', label: '페이지 수 선택', inputMode: 'numeric', valueUnit: 'p' },
      { key: 'paper', kind: 'options', label: '용지 선택', inputMode: 'text' },
      { key: 'thickness', kind: 'options', label: '두께 선택', inputMode: 'text' },
      { key: 'coverCoating', kind: 'options', label: '표지 코팅 선택', inputMode: 'text' },
      { key: 'quantity', kind: 'quantity-prices', label: '수량 선택', quantityUnit: '부' },
    ],
  },
  '리플렛 · 팜플렛': {
    estimateUnit: '페이지',
    showPlanningEstimate: true,
    sections: [
      { key: 'size', kind: 'options', label: '사이즈 선택', inputMode: 'text' },
      { key: 'paper', kind: 'options', label: '용지 선택', inputMode: 'text' },
      { key: 'thickness', kind: 'options', label: '두께 선택', inputMode: 'text' },
      { key: 'coverCoating', kind: 'options', label: '표지 코팅 선택', inputMode: 'text' },
      { key: 'quantityThird', kind: 'quantity-prices', label: '수량 선택 (국3절)', quantityUnit: '부' },
      { key: 'quantityA3', kind: 'quantity-prices', label: '수량 선택 (A3)', quantityUnit: '부' },
      { key: 'quantityA4', kind: 'quantity-prices', label: '수량 선택 (A4)', quantityUnit: '부' },
    ],
  },
  '포스터 · 전단지': {
    estimateUnit: '페이지',
    showPlanningEstimate: true,
    sections: [
      { key: 'size', kind: 'options', label: '사이즈 선택', inputMode: 'text' },
      { key: 'paper', kind: 'options', label: '용지', inputMode: 'text' },
      { key: 'thickness', kind: 'options', label: '두께 선택', inputMode: 'text' },
      { key: 'coating', kind: 'options', label: '코팅 선택', inputMode: 'text' },
      { key: 'quantity', kind: 'quantity-prices', label: '수량 선택', quantityUnit: '부' },
    ],
  },
  '배너 · 족자 · 현수막': {
    estimateUnit: '페이지',
    showPlanningEstimate: true,
    sections: [
      { key: 'size', kind: 'options', label: '사이즈', inputMode: 'text' },
      { key: 'stand', kind: 'options', label: '거치대 선택', inputMode: 'text' },
      { key: 'material', kind: 'options', label: '재질', inputMode: 'text' },
      { key: 'side', kind: 'options', label: '면', inputMode: 'text' },
      { key: 'coating', kind: 'options', label: '코팅', inputMode: 'text' },
      { key: 'quantity', kind: 'quantity-prices', label: '수량 선택', quantityUnit: '개' },
    ],
  },
  '명함 · 봉투': {
    estimateUnit: '페이지',
    showPlanningEstimate: true,
    sections: [
      { key: 'size', kind: 'options', label: '사이즈', inputMode: 'text' },
      { key: 'baseQuantity', kind: 'options', label: '기본 수량', inputMode: 'numeric', valueUnit: '부' },
      { key: 'material', kind: 'options', label: '재질 선택', inputMode: 'text' },
      { key: 'thickness', kind: 'options', label: '두께 선택', inputMode: 'text' },
      { key: 'people', kind: 'options', label: '인원 선택', inputMode: 'numeric', valueUnit: '명' },
    ],
  },
  로고: {
    estimateUnit: '시안',
    showPlanningEstimate: false,
    sections: [
      { key: 'logoType', kind: 'options', label: '유형', inputMode: 'text' },
      { key: 'proposalCount', kind: 'options', label: '시안 개수', inputMode: 'numeric', valueUnit: '개' },
    ],
  },
} as const satisfies Record<ProductType, ProductUiProfile>
```

- [ ] **Step 5: Implement numbering and type-change helpers**

`formatProductSectionHeading(0, label)` returns `III. ${label}` and supports all seven custom sections through `IX`. Use these helpers so numbering and reset behavior have one implementation:

```ts
const sectionNumbers = ['III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const

export function formatProductSectionHeading(index: number, label: string) {
  const number = sectionNumbers[index]

  if (!number) throw new Error('상품 UI 섹션 번호를 확인해주세요.')

  return `${number}. ${label}`
}

function createTypeSpecificState(productType: ProductType | '') {
  const optionValues: ProductUiDraft['optionValues'] = {}
  const priceRows: ProductUiDraft['priceRows'] = {}

  if (!productType) return { optionValues, priceRows }

  for (const section of productUiProfiles[productType].sections) {
    if (section.kind === 'options') optionValues[section.key] = ['']
    else priceRows[section.key] = [{ quantity: '', unitPrice: '' }]
  }

  return { optionValues, priceRows }
}

export function createProductUiDraft(
  productType: ProductType | '' = '',
): ProductUiDraft {
  return {
    designPrintEstimate: '',
    planningEstimate: '',
    productType,
    ...createTypeSpecificState(productType),
  }
}

export function changeProductUiType(
  draft: ProductUiDraft,
  productType: ProductType,
): ProductUiDraft {
  return {
    ...draft,
    productType,
    ...createTypeSpecificState(productType),
  }
}
```

`createProductUiDraft(type)` creates one blank option or quantity row for each section. `changeProductUiType` keeps both service estimate strings and replaces all type-specific collections with the next profile's blank state.

Add tests that prove:

```js
const brochure = createProductUiDraft('브로슈어 · 카탈로그')
brochure.designPrintEstimate = '100,000'
brochure.optionValues.pageCount = ['8', '16']

const logo = changeProductUiType(brochure, '로고')

assert.equal(logo.designPrintEstimate, '100,000')
assert.deepEqual(logo.optionValues.logoType, [''])
assert.deepEqual(logo.optionValues.proposalCount, [''])
assert.equal(logo.optionValues.pageCount, undefined)
assert.deepEqual(logo.priceRows, {})
```

- [ ] **Step 6: Run the focused tests and type check**

Run:

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test tests/productFormUi.test.mjs
pnpm --filter admin exec tsc -b
```

Expected: PASS.

- [ ] **Step 7: Commit the UI contract**

```bash
git add apps/admin/src/pages/productFormUi.ts apps/admin/tests/productFormUi.test.mjs
git commit -m "feat: define product detail ui profiles"
```

---

### Task 2: Build reusable option and quantity editors

**Files:**
- Create: `apps/admin/src/pages/ProductFormSectionEditors.tsx`
- Create: `apps/admin/src/pages/ProductFormFields.css`
- Modify: `apps/admin/src/components/AdminIcon.tsx`
- Create: `apps/admin/tests/productFormSectionEditors.test.mjs`

**Interfaces:**
- Consumes: `QuantityPriceDraft`, numbered section headings
- Produces: `ServiceSelectionEditor`, `OptionValuesEditor`, `QuantityPriceEditor`

- [ ] **Step 1: Write the failing component contract test**

Read the three source files and assert:

```js
test('section editors use semantic controls and shared icons', async () => {
  assert.match(source, /export function ServiceSelectionEditor/)
  assert.match(source, /export function OptionValuesEditor/)
  assert.match(source, /export function QuantityPriceEditor/)
  assert.match(source, /<fieldset/)
  assert.match(source, /<legend/)
  assert.match(source, /<AdminIcon name="plus"/)
  assert.match(source, /<AdminIcon name="x-close"/)
  assert.match(source, /aria-label=\{`\$\{heading\} 항목 추가`\}/)
  assert.match(source, /수량 및 단위를 입력해주세요\./)
  assert.match(source, /인쇄 단가를 입력해주세요\./)
  assert.doesNotMatch(source, /figma\.com\/api/)
})
```

- [ ] **Step 2: Run the component test and confirm failure**

Run:

```bash
pnpm --dir apps/admin exec node --test tests/productFormSectionEditors.test.mjs
```

Expected: FAIL because the editor component and `plus` icon do not exist.

- [ ] **Step 3: Add the shared plus icon**

Add `'plus'` to `AdminIconName` and this definition to `iconDefinitions`:

```tsx
plus: {
  glyph: <path d="M8 3.2V12.8M3.2 8H12.8" />,
  height: 16,
  strokeWidth: 1.5,
  viewBox: '0 0 16 16',
  width: 16,
},
```

It must inherit `currentColor`; do not download the temporary Figma plus asset.

- [ ] **Step 4: Implement `ServiceSelectionEditor`**

Use this prop contract:

```ts
type ServiceSelectionEditorProps = {
  designPrintEstimate: string
  estimateUnit: '페이지' | '시안'
  onDesignPrintEstimateChange: (value: string) => void
  onPlanningEstimateChange: (value: string) => void
  planningEstimate: string
  showPlanningEstimate: boolean
}
```

Render one fieldset with legend `II. 서비스 선택`. The first numeric input label is `디자인 + 인쇄 견적 (${estimateUnit} 당 단가)`. Render `기획 견적 (페이지 당 단가)` only when `showPlanningEstimate` is true. Use the existing `formatNumericValue` formatter without changing the persistence serializer.

Define the private price helper in the same file:

```tsx
type PriceInputProps = {
  label: string
  onChange: (value: string) => void
  value: string
}

function PriceInput({ label, onChange, value }: PriceInputProps) {
  return (
    <label className="product-ui-field">
      <span className="product-ui-field__label">{label}</span>
      <span className="product-ui-control">
        <input
          aria-label={label}
          className="product-ui-control__input"
          inputMode="numeric"
          onChange={(event) => onChange(formatNumericValue(event.currentTarget.value))}
          value={value}
        />
        <span className="product-ui-control__suffix">원</span>
      </span>
    </label>
  )
}
```

```tsx
<fieldset className="product-ui-section">
  <legend className="product-ui-section__legend">II. 서비스 선택</legend>
  <PriceInput
    label={`디자인 + 인쇄 견적 (${estimateUnit} 당 단가)`}
    onChange={onDesignPrintEstimateChange}
    value={designPrintEstimate}
  />
  {showPlanningEstimate ? (
    <PriceInput
      label="기획 견적 (페이지 당 단가)"
      onChange={onPlanningEstimateChange}
      value={planningEstimate}
    />
  ) : null}
</fieldset>
```

`PriceInput` is a private helper in the same file. It renders a numeric text input plus `원`, and calls `formatNumericValue(event.currentTarget.value)` before invoking `onChange`.

- [ ] **Step 5: Implement `OptionValuesEditor`**

Use this prop contract:

```ts
type OptionValuesEditorProps = {
  heading: string
  inputMode: 'numeric' | 'text'
  onAdd: () => void
  onRemove: (index: number) => void
  onValueChange: (index: number, value: string) => void
  valueUnit?: 'p' | '부' | '명' | '개'
  values: readonly string[]
}
```

Each row contains an input, optional suffix, and a 44px remove button with `AdminIcon name="x-close"`. Numeric mode strips non-digits and applies comma formatting; text mode preserves typed text. The `추가` button appends a blank value. After React renders the new row, focus its input using a local ref and `requestAnimationFrame`.

```tsx
<fieldset className="product-ui-section">
  <legend className="product-ui-section__legend">{heading}</legend>
  <div className="product-ui-option-list">
    {values.map((value, index) => (
      <div className="product-ui-option-row" key={`${heading}-${index}`}>
        <span className="product-ui-control">
          <input
            aria-label={`${heading} ${index + 1}`}
            className="product-ui-control__input"
            inputMode={inputMode === 'numeric' ? 'numeric' : undefined}
            onChange={(event) =>
              onValueChange(
                index,
                inputMode === 'numeric'
                  ? formatNumericValue(event.currentTarget.value)
                  : event.currentTarget.value,
              )
            }
            value={value}
          />
          {valueUnit ? <span className="product-ui-control__suffix">{valueUnit}</span> : null}
        </span>
        <button aria-label={`${heading} ${index + 1} 삭제`} onClick={() => onRemove(index)} type="button">
          <AdminIcon name="x-close" size={16} />
        </button>
      </div>
    ))}
  </div>
  <button aria-label={`${heading} 항목 추가`} onClick={onAdd} type="button">
    <span>추가</span>
    <AdminIcon name="plus" size={16} />
  </button>
</fieldset>
```

- [ ] **Step 6: Implement `QuantityPriceEditor`**

Use this prop contract:

```ts
type QuantityPriceEditorProps = {
  heading: string
  onAdd: () => void
  onRemove: (index: number) => void
  onRowChange: (index: number, row: QuantityPriceDraft) => void
  quantityUnit: '부' | '개'
  rows: readonly QuantityPriceDraft[]
}
```

Render a two-column header and rows. The quantity cell formats digits and shows the supplied unit; the price cell formats digits and shows `원`. The remove button must be outside the two price columns at desktop width and remain keyboard reachable. The add action appends `{ quantity: '', unitPrice: '' }` and focuses the new quantity input.

```tsx
<fieldset className="product-ui-section">
  <legend className="product-ui-section__legend">{heading}</legend>
  <div className="product-ui-price-header" aria-hidden="true">
    <span>수량</span>
    <span>인쇄 단가</span>
  </div>
  {rows.map((row, index) => (
    <div className="product-ui-price-row" key={`${heading}-${index}`}>
      <div className="product-ui-price-columns">
        <NumericControl
          ariaLabel={`${heading} ${index + 1} 수량`}
          onChange={(quantity) => onRowChange(index, { ...row, quantity })}
          suffix={quantityUnit}
          value={row.quantity}
        />
        <NumericControl
          ariaLabel={`${heading} ${index + 1} 인쇄 단가`}
          onChange={(unitPrice) => onRowChange(index, { ...row, unitPrice })}
          suffix="원"
          value={row.unitPrice}
        />
      </div>
      <button aria-label={`${heading} ${index + 1} 삭제`} onClick={() => onRemove(index)} type="button">
        <AdminIcon name="x-close" size={16} />
      </button>
    </div>
  ))}
  <button aria-label={`${heading} 항목 추가`} onClick={onAdd} type="button">
    <span>추가</span>
    <AdminIcon name="plus" size={16} />
  </button>
</fieldset>
```

`NumericControl` is another private helper in the same file. Reuse one internal `useFocusLastAddedRow(length)` hook for both editor components so focus behavior is not duplicated.

```tsx
type NumericControlProps = {
  ariaLabel: string
  onChange: (value: string) => void
  suffix: '부' | '개' | '원'
  value: string
}

function NumericControl({ ariaLabel, onChange, suffix, value }: NumericControlProps) {
  return (
    <span className="product-ui-control">
      <input
        aria-label={ariaLabel}
        className="product-ui-control__input"
        inputMode="numeric"
        onChange={(event) => onChange(formatNumericValue(event.currentTarget.value))}
        value={value}
      />
      <span className="product-ui-control__suffix">{suffix}</span>
    </span>
  )
}

function useFocusLastAddedRow(length: number) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const previousLength = useRef(length)

  useEffect(() => {
    if (length > previousLength.current) {
      const frame = window.requestAnimationFrame(() => {
        inputs.current[length - 1]?.focus()
      })

      previousLength.current = length
      return () => window.cancelAnimationFrame(frame)
    }

    previousLength.current = length
  }, [length])

  return (index: number) => (input: HTMLInputElement | null) => {
    inputs.current[index] = input
  }
}
```

Attach the returned ref callback to each option input and to the quantity input of each price row.

- [ ] **Step 7: Implement the visual contract in `ProductFormFields.css`**

Create focused class groups for:

- `.product-ui-section`, `.product-ui-section__legend`;
- `.product-ui-option-list`, `.product-ui-option-row`;
- `.product-ui-control`, `.product-ui-control__input`, `.product-ui-control__suffix`;
- `.product-ui-add-button`, `.product-ui-remove-button`;
- `.product-ui-price-header`, `.product-ui-price-row`, `.product-ui-price-columns`.

Use flex/grid parent `gap`; do not add focus border, outline, or box-shadow rules. At `max-width: 520px`, make option and price rows stack without horizontal scrolling while keeping remove buttons visible.

- [ ] **Step 8: Run tests, type checking, and lint**

Run:

```bash
pnpm --dir apps/admin exec node --test tests/productFormSectionEditors.test.mjs
pnpm --filter admin exec tsc -b
pnpm --filter admin lint
```

Expected: PASS.

- [ ] **Step 9: Commit the section editors**

```bash
git add apps/admin/src/pages/ProductFormSectionEditors.tsx apps/admin/src/pages/ProductFormFields.css apps/admin/src/components/AdminIcon.tsx apps/admin/tests/productFormSectionEditors.test.mjs
git commit -m "feat: add product option editors"
```

---

### Task 3: Compose the common and conditional form fields

**Files:**
- Create: `apps/admin/src/pages/ProductFormFields.tsx`
- Modify: `apps/admin/src/pages/ProductFormFields.css`
- Create: `apps/admin/tests/productFormFields.test.mjs`

**Interfaces:**
- Consumes: `ProductUiDraft`, `productTypes`, `productUiProfiles`, `changeProductUiType`, three section editors
- Produces: `ProductFormFields({ draft, onChange })`

- [ ] **Step 1: Write the failing composition test**

Assert that `ProductFormFields.tsx`:

- renders the exact `I. 유형 선택` label before `ServiceSelectionEditor`;
- passes `readOnly` and `options={productTypes}` to `AdminTypeCombobox`;
- does not pass `allowCustomValue`;
- resolves `productUiProfiles[draft.productType]`;
- maps `profile.sections` and calls `formatProductSectionHeading(index, section.label)`;
- dispatches `options` sections to `OptionValuesEditor` and `quantity-prices` sections to `QuantityPriceEditor`;
- has no Supabase import, mutation helper, `fetch`, or form submit handler.

- [ ] **Step 2: Run the composition test and confirm failure**

Run:

```bash
pnpm --dir apps/admin exec node --test tests/productFormFields.test.mjs
```

Expected: FAIL because `ProductFormFields.tsx` does not exist.

- [ ] **Step 3: Implement the component contract**

Use exactly:

```ts
type RenderSectionArgs = {
  draft: ProductUiDraft
  index: number
  onChange: (nextDraft: ProductUiDraft) => void
  section: ProductUiSection
}

type ProductFormFieldsProps = {
  draft: ProductUiDraft
  onChange: (nextDraft: ProductUiDraft) => void
}

function isProductType(value: string): value is ProductType {
  return productTypes.some((productType) => productType === value)
}

function TypeSelection({ draft, onChange }: ProductFormFieldsProps) {
  const inputId = useId()

  return (
    <div className="product-ui-section">
      <label className="product-ui-section__legend" htmlFor={inputId}>
        I. 유형 선택
      </label>
      <AdminTypeCombobox
        inputId={inputId}
        name="productType"
        onCommit={(value) => {
          if (isProductType(value)) onChange(changeProductUiType(draft, value))
        }}
        options={productTypes}
        placeholder="상품 유형을 선택해주세요."
        readOnly
        value={draft.productType}
      />
    </div>
  )
}

export function ProductFormFields({ draft, onChange }: ProductFormFieldsProps) {
  const profile = draft.productType ? productUiProfiles[draft.productType] : null

  return (
    <div className="product-ui-sections">
      <TypeSelection draft={draft} onChange={onChange} />
      {profile ? (
        <ServiceSelectionEditor
          designPrintEstimate={draft.designPrintEstimate}
          estimateUnit={profile.estimateUnit}
          onDesignPrintEstimateChange={(designPrintEstimate) =>
            onChange({ ...draft, designPrintEstimate })
          }
          onPlanningEstimateChange={(planningEstimate) =>
            onChange({ ...draft, planningEstimate })
          }
          planningEstimate={draft.planningEstimate}
          showPlanningEstimate={profile.showPlanningEstimate}
        />
      ) : (
        <p className="product-ui-hint">
          유형을 선택하면 서비스와 상세 옵션이 표시됩니다.
        </p>
      )}
      {profile?.sections.map((section, index) =>
        renderProductUiSection({ draft, index, onChange, section }),
      )}
    </div>
  )
}
```

The type combobox commits only one of `productTypes`. On commit, call `changeProductUiType(draft, nextType)`. Its placeholder is `상품 유형을 선택해주세요.` and the input is readonly while the menu remains clickable and keyboard navigable.

- [ ] **Step 4: Render the common service section**

If no type is selected, render only I and a short neutral hint `유형을 선택하면 서비스와 상세 옵션이 표시됩니다.`. After selection, render II immediately and pass the profile's `estimateUnit` and `showPlanningEstimate` to `ServiceSelectionEditor`.

- [ ] **Step 5: Render all conditional sections from the profile**

For each section:

- calculate the visible heading from its array index;
- read its value array or rows from `draft`;
- update only that key with immutable array operations;
- never keep a second switch statement containing the six full layouts;
- use the discriminated `kind` field to choose the editor.

Removing the last row is allowed; the editor then shows only `추가`. UI validation and publish requirements belong to the later persistence plan.

Implement the dispatcher with immutable updates:

```tsx
function renderProductUiSection({ draft, index, onChange, section }: RenderSectionArgs) {
  const heading = formatProductSectionHeading(index, section.label)

  if (section.kind === 'options') {
    const values = draft.optionValues[section.key] ?? []

    return (
      <OptionValuesEditor
        heading={heading}
        inputMode={section.inputMode}
        key={section.key}
        onAdd={() =>
          onChange({
            ...draft,
            optionValues: {
              ...draft.optionValues,
              [section.key]: [...values, ''],
            },
          })
        }
        onRemove={(removeIndex) =>
          onChange({
            ...draft,
            optionValues: {
              ...draft.optionValues,
              [section.key]: values.filter((_, valueIndex) => valueIndex !== removeIndex),
            },
          })
        }
        onValueChange={(changeIndex, value) =>
          onChange({
            ...draft,
            optionValues: {
              ...draft.optionValues,
              [section.key]: values.map((current, valueIndex) =>
                valueIndex === changeIndex ? value : current,
              ),
            },
          })
        }
        valueUnit={section.valueUnit}
        values={values}
      />
    )
  }

  const rows = draft.priceRows[section.key] ?? []

  return (
    <QuantityPriceEditor
      heading={heading}
      key={section.key}
      onAdd={() =>
        onChange({
          ...draft,
          priceRows: {
            ...draft.priceRows,
            [section.key]: [...rows, { quantity: '', unitPrice: '' }],
          },
        })
      }
      onRemove={(removeIndex) =>
        onChange({
          ...draft,
          priceRows: {
            ...draft.priceRows,
            [section.key]: rows.filter((_, rowIndex) => rowIndex !== removeIndex),
          },
        })
      }
      onRowChange={(changeIndex, row) =>
        onChange({
          ...draft,
          priceRows: {
            ...draft.priceRows,
            [section.key]: rows.map((current, rowIndex) =>
              rowIndex === changeIndex ? row : current,
            ),
          },
        })
      }
      quantityUnit={section.quantityUnit}
      rows={rows}
    />
  )
}
```

- [ ] **Step 6: Add layout grouping**

Wrap I, II, and every numbered custom section in a `.product-ui-sections` vertical container with `32px` gap. Do not alter the global `AdminFormLayout.css`; keep this spacing local to the new fields component.

- [ ] **Step 7: Run component tests and checks**

Run:

```bash
pnpm --dir apps/admin exec node --test tests/productFormFields.test.mjs
pnpm --filter admin exec tsc -b
pnpm --filter admin lint
```

Expected: PASS.

- [ ] **Step 8: Commit the conditional form fields**

```bash
git add apps/admin/src/pages/ProductFormFields.tsx apps/admin/src/pages/ProductFormFields.css apps/admin/tests/productFormFields.test.mjs
git commit -m "feat: compose conditional product form ui"
```

---

### Task 4: Add a safe development-only preview route

**Files:**
- Create: `apps/admin/src/pages/ProductFormUiPreviewPage.tsx`
- Modify: `apps/admin/src/App.tsx`
- Create: `apps/admin/tests/productFormUiPreviewPage.test.mjs`

**Interfaces:**
- Consumes: `AdminFormLayout`, `ProductFormFields`, `createProductUiDraft`
- Produces: development-only `/products/ui-preview`

- [ ] **Step 1: Write the failing preview-boundary test**

Assert:

```js
test('ui preview cannot mutate product data', async () => {
  assert.doesNotMatch(previewSource, /@repo\/supabase/)
  assert.doesNotMatch(previewSource, /createProduct|updateProduct|deleteProduct/)
  assert.match(previewSource, /UI 프리뷰에서는 저장하지 않습니다\./)
  assert.match(appSource, /import\.meta\.env\.DEV/)
  assert.match(appSource, /path="\/products\/ui-preview"/)
})
```

Also assert the existing `/products/new` and `/products/:productId` routes still render `ProductFormPage`.

- [ ] **Step 2: Run the preview test and confirm failure**

Run:

```bash
pnpm --dir apps/admin exec node --test tests/productFormUiPreviewPage.test.mjs
```

Expected: FAIL because the preview page and route do not exist.

- [ ] **Step 3: Implement the preview page**

Initialize with `createProductUiDraft('브로슈어 · 카탈로그')`, render `ProductFormFields`, and use `AdminFormLayout` with title `신규 상품 등록`. Keep the Figma action layout:

- `목록으로` links to `/products`;
- `임시저장` and `등록하기` are ordinary preview buttons;
- submitting prevents default and calls `toast.info('UI 프리뷰에서는 저장하지 않습니다.')`;
- no delete button and no product query are present.

```tsx
export function ProductFormUiPreviewPage() {
  const [draft, setDraft] = useState(() =>
    createProductUiDraft('브로슈어 · 카탈로그'),
  )

  return (
    <AdminFormLayout
      actions={
        <>
          <Link className="admin-form__button admin-form__button--outline" to="/products">
            목록으로
          </Link>
          <div className="admin-form__actions-group">
            <button className="admin-form__button admin-form__button--outline" type="submit">
              임시저장
            </button>
            <button className="admin-form__button admin-form__button--solid" type="submit">
              등록하기
            </button>
          </div>
        </>
      }
      onSubmit={(event) => {
        event.preventDefault()
        toast.info('UI 프리뷰에서는 저장하지 않습니다.')
      }}
      title="신규 상품 등록"
    >
      <ProductFormFields draft={draft} onChange={setDraft} />
    </AdminFormLayout>
  )
}
```

- [ ] **Step 4: Register the route only in development**

Inside the authenticated admin route tree in `App.tsx`, add:

```tsx
{import.meta.env.DEV ? (
  <Route element={<ProductFormUiPreviewPage />} path="/products/ui-preview" />
) : null}
```

Do not add a production navigation link. Reviewers open the URL directly while running `pnpm --filter admin dev`.

- [ ] **Step 5: Prove the current CRUD code is unchanged**

Run:

```bash
git diff -- apps/admin/src/pages/ProductFormPage.tsx apps/admin/src/pages/productData.ts
```

Expected: no output. This is the safety boundary for the UI-only phase.

- [ ] **Step 6: Run preview tests and build**

Run:

```bash
pnpm --dir apps/admin exec node --test tests/productFormUiPreviewPage.test.mjs
pnpm --filter admin test
pnpm --filter admin exec tsc -b
pnpm --filter admin build
```

Expected: PASS.

- [ ] **Step 7: Commit the preview route**

```bash
git add apps/admin/src/pages/ProductFormUiPreviewPage.tsx apps/admin/src/App.tsx apps/admin/tests/productFormUiPreviewPage.test.mjs
git commit -m "feat: preview product detail ui"
```

---

### Task 5: Verify every type, responsive state, and scope boundary

**Files:**
- Modify only if verification finds a defect in the files created or modified by Tasks 1–4

- [ ] **Step 1: Run the complete admin checks**

```bash
pnpm --filter admin test
pnpm --filter admin exec tsc -b
pnpm --filter admin lint
pnpm --filter admin build
```

Expected: every command passes.

- [ ] **Step 2: Verify the common sections**

At `/products/ui-preview`, confirm:

1. I appears before II.
2. The type menu contains exactly six values and cannot create a custom value.
3. Non-logo types show both page-unit service estimates.
4. Logo shows one 시안-unit estimate and no planning field.
5. Switching type preserves service values and clears all III 이후 values.

- [ ] **Step 3: Verify the six exact section sequences**

Select each type and compare every heading, Roman numeral, and order with the Exact Section Matrix above. Specifically confirm:

- 리플렛 has three separate quantity tables: 국3절, A3, A4;
- 배너 has 거치대, 재질, 면, 코팅 and uses `개` in its quantity table;
- 명함 has no price table and uses `부`, `명` suffixes for 기본 수량 and 인원;
- 로고 stops at IV and has no quantity table.

- [ ] **Step 4: Verify editor interactions and accessibility**

For every editor kind:

1. Add appends one row and focuses it.
2. Remove deletes only its own row.
3. Numeric fields reject non-digits and format thousands separators.
4. Text fields preserve Korean and Latin size/material names.
5. Tab and Shift+Tab reach every input, add button, remove button, and combobox option.
6. Legends expose complete numbered headings to assistive technology.

- [ ] **Step 5: Verify visual fidelity**

At 1280px and 390px viewports, compare against Figma nodes `1234:9529`, `1234:10015`, and `1234:10434` for the shared visual language:

- 640px maximum form width;
- 52px controls and 16px radii;
- 32px section spacing and 20px title-to-control spacing;
- brand `추가` action;
- gray two-column quantity header;
- no clipping, horizontal page scroll, or overlapping action buttons.

The latest Exact Section Matrix overrides field names shown in the older Figma frames.

- [ ] **Step 6: Verify the UI-only scope**

Run:

```bash
git diff --name-only -- apps/admin supabase packages apps/user
```

Expected changed implementation paths are limited to:

```text
apps/admin/src/App.tsx
apps/admin/src/components/AdminIcon.tsx
apps/admin/src/pages/ProductFormFields.css
apps/admin/src/pages/ProductFormFields.tsx
apps/admin/src/pages/ProductFormSectionEditors.tsx
apps/admin/src/pages/ProductFormUiPreviewPage.tsx
apps/admin/src/pages/productFormUi.ts
apps/admin/tests/productFormFields.test.mjs
apps/admin/tests/productFormSectionEditors.test.mjs
apps/admin/tests/productFormUi.test.mjs
apps/admin/tests/productFormUiPreviewPage.test.mjs
```

There must be no diff under `supabase/`, `packages/supabase/`, `apps/user/`, `ProductFormPage.tsx`, or `productData.ts`.

- [ ] **Step 7: Run the required Figma URL scan**

```bash
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: no output and exit code 1 because no temporary Figma URL is stored.

- [ ] **Step 8: Review and commit verification fixes, if any**

```bash
git diff --check
git status --short
```

If verification required a correction, stage only the paths listed in Step 6 and commit:

```bash
git commit -m "fix: complete product detail ui verification"
```

---

## Completion Gate

This UI phase is complete when all six type layouts are approved in `/products/ui-preview`. It is not a production rollout gate. After approval:

1. rewrite the deferred DB plan using `ProductUiDraft` and `productUiProfiles` as the exact storage contract;
2. add migration, edit loading, validation, and serialization;
3. mount `ProductFormFields` inside the real `ProductFormPage`;
4. delete the development preview route;
5. only then enable real 임시저장/등록/수정 actions for the new fields.

## Explicitly Skipped

- Supabase schema, migration, RLS, and grants.
- Loading existing type-specific options from DB.
- Saving, draft validation, publish validation, or price calculation.
- Replacing the production `/products/new` and `/products/:productId` routes.
- User home, order page, and payment integration.
- Destructive conversion or cleanup of existing products.
