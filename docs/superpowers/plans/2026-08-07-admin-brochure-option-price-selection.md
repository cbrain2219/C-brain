# 관리자 브로슈어 옵션별 가격 선택 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 상품 폼에서 브로슈어 옵션 pill을 선택과 편집으로 구분하고, 선택한 페이지·용지·두께·코팅 조합마다 엑셀 기준 가격 행을 독립적으로 표시·수정한다.

**Architecture:** 기존 `ProductUiDraft`에 선택된 옵션 인덱스와 조합 키별 가격 행만 추가한다. 옵션 pill은 선택 전에는 실제 `button`, 선택 후에는 기존 `input`으로 렌더링하며, 가격 키는 `페이지:용지:두께:코팅` 인덱스 순서로 만든다. 다른 다섯 상품 유형의 기존 평면 가격 행은 그대로 둔다.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Node test runner, CSS

## Global Constraints

- 이번 변경은 `브로슈어 · 카탈로그`만 조합형 가격으로 구현한다.
- 참조 워크북의 `브로슈어_카달로그` 시트 값인 페이지 `8/12/16`, 용지 `일반지(스노우지)/고급지(랑데뷰)`, 두께 `얇은/보통/두꺼운`, 코팅 `무광/유광`, 수량 `100/200/300`을 사용한다.
- 워크북은 코팅별 가격 차이를 제공하지 않으므로 최초 가격은 두 코팅에 동일하게 복제하되, UI 상태는 코팅별로 분리해 이후 서로 다르게 편집할 수 있게 한다.
- 워크북의 디자인 단가는 `80,000원`, 기획 단가는 `50,000원`이다.
- 새 dependency, 전역 store, context provider, 범용 폼 엔진을 추가하지 않는다.
- 기존 사용자의 미커밋 변경을 되돌리거나 자동 커밋하지 않는다.
- `design.md`의 Pretendard GOV, `gap`, form focus, SVG 아이콘 규칙을 유지한다.
- 완료 전 `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`가 매치 없이 종료되어야 한다.

---

### Task 1: 브로슈어 옵션과 가격 매트릭스를 폼 상태에 추가

**Files:**

- Modify: `apps/admin/src/pages/productFormUi.ts`
- Modify: `apps/admin/tests/productFormUi.test.mjs`

**Interfaces:**

- Produces: `ProductUiDraft.selectedOptionIndexes`, `ProductUiDraft.priceRowsBySelection`, `getBrochurePriceKey()`, `removeBrochurePriceOption()`
- Consumes: `ProductFormFields`가 선택 조합에 맞는 가격 행을 찾고 갱신할 때 위 상태와 함수를 사용한다.

- [x] **Step 1: 엑셀 기본값과 조합 키를 고정하는 실패 테스트 작성**

```js
test("brochure defaults reproduce every spreadsheet price combination", () => {
  const draft = createProductUiDraft("브로슈어 · 카탈로그");

  assert.deepEqual(draft.optionValues.pageCount, ["8", "12", "16"]);
  assert.deepEqual(draft.optionValues.paper, [
    "일반지(스노우지)",
    "고급지(랑데뷰)",
  ]);
  assert.deepEqual(draft.optionValues.thickness, ["얇은", "보통", "두꺼운"]);
  assert.deepEqual(draft.optionValues.coverCoating, ["무광", "유광"]);
  assert.equal(Object.keys(draft.priceRowsBySelection).length, 36);
  assert.deepEqual(draft.priceRowsBySelection["0:0:0:0"], [
    { quantity: "100", unitPrice: "850,000" },
    { quantity: "200", unitPrice: "1,010,000" },
    { quantity: "300", unitPrice: "1,130,000" },
  ]);
  assert.deepEqual(draft.priceRowsBySelection["2:1:2:1"], [
    { quantity: "100", unitPrice: "1,680,000" },
    { quantity: "200", unitPrice: "2,010,000" },
    { quantity: "300", unitPrice: "2,240,000" },
  ]);
});
```

- [x] **Step 2: 테스트가 새 상태와 함수 부재로 실패하는지 확인**

Run:

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test tests/productFormUi.test.mjs
```

Expected: `priceRowsBySelection` 또는 `getBrochurePriceKey` 관련 assertion이 FAIL한다.

- [x] **Step 3: 워크북의 가격표를 `[용지][두께][페이지][수량]` 순서로 입력**

```ts
const brochurePriceMatrix = [
  [
    [
      [850000, 1010000, 1130000],
      [1240000, 1440000, 1620000],
      [1610000, 1870000, 1910000],
    ],
    [
      [860000, 1020000, 1140000],
      [1250000, 1450000, 1630000],
      [1620000, 1900000, 1940000],
    ],
    [
      [860000, 1030000, 1160000],
      [1250000, 1470000, 1660000],
      [1620000, 1900000, 2000000],
    ],
  ],
  [
    [
      [880000, 1060000, 1210000],
      [1280000, 1510000, 1720000],
      [1650000, 1960000, 2090000],
    ],
    [
      [890000, 1080000, 1230000],
      [1290000, 1540000, 1760000],
      [1670000, 1990000, 2150000],
    ],
    [
      [900000, 1100000, 1260000],
      [1300000, 1560000, 1790000],
      [1680000, 2010000, 2240000],
    ],
  ],
] as const;
```

`createProductUiDraft('브로슈어 · 카탈로그')`가 3×2×3×2 = 36개의 조합 키를 만들고, 각 키에 `100/200/300` 수량 행을 별도 배열로 저장한다. `getBrochurePriceKey()`는 `pageCount`, `paper`, `thickness`, `coverCoating`의 선택 인덱스를 순서대로 `:`로 연결한다.

- [x] **Step 4: 옵션 삭제 시 조합 키를 안전하게 재인덱싱**

`removeBrochurePriceOption(priceRowsBySelection, optionKey, removeIndex)`는 삭제된 인덱스가 포함된 조합을 제거하고, 그보다 큰 해당 차원 인덱스를 1 감소시킨다. 테스트에서 페이지 0 삭제 후 기존 `1:0:0:0` 값이 `0:0:0:0`으로 이동하는지 확인한다.

- [x] **Step 5: 모델 테스트 통과 확인**

Run the focused test again and expect PASS.

---

### Task 2: 선택 전 button, 선택 후 input 상호작용과 가격 전환 연결

**Files:**

- Modify: `apps/admin/src/pages/ProductFormSectionEditors.tsx`
- Modify: `apps/admin/src/pages/ProductFormFields.tsx`
- Modify: `apps/admin/src/pages/ProductFormFields.css`
- Modify: `apps/admin/src/pages/ProductFormUiPage.tsx`
- Modify: `apps/admin/tests/productFormSectionEditors.test.mjs`
- Modify: `apps/admin/tests/productFormFields.test.mjs`
- Modify: `apps/admin/tests/productFormUiPage.test.mjs`

**Interfaces:**

- `OptionValuesEditor` adds `selectedIndex: number` and `onSelect(index: number): void`.
- `ProductFormFields` reads and updates `draft.selectedOptionIndexes`.
- Brochure `QuantityPriceEditor` reads and writes `draft.priceRowsBySelection[getBrochurePriceKey(...)]`; other types continue using `draft.priceRows[section.key]`.

- [x] **Step 1: 선택/편집 분리 계약을 검사하는 실패 테스트 작성**

The source contract must show an inactive `<button type="button">` calling `onSelect(index)`, a selected branch containing the option `<input>`, and no hard-coded `index === 0` selected class.

- [x] **Step 2: `OptionValuesEditor`를 두 렌더링 상태로 분리**

```tsx
{
  isSelected ? (
    <span className="product-ui-control product-ui-control--option product-ui-control--selected">
      <input className="product-ui-control__input product-ui-control__input--option" />
      {valueUnit ? (
        <span className="product-ui-control__suffix">{valueUnit}</span>
      ) : null}
    </span>
  ) : (
    <button
      aria-label={`${heading} ${index + 1} 선택`}
      className="product-ui-control product-ui-control--option product-ui-control--selectable"
      onClick={() => onSelect(index)}
      type="button"
    >
      <span
        className={
          value
            ? "product-ui-control__value"
            : "product-ui-control__value product-ui-control__value--placeholder"
        }
      >
        {value || "입력해주세요."}
      </span>
      {valueUnit ? (
        <span className="product-ui-control__suffix">{valueUnit}</span>
      ) : null}
    </button>
  );
}
```

새 항목 추가 시 해당 인덱스를 선택하므로 기존 `useFocusLastAddedRow`가 새 input에만 포커스한다. 선택되지 않은 항목은 button 클릭 한 번으로 선택만 바뀌고 input cursor를 열지 않는다.

- [x] **Step 3: 옵션 선택·추가·삭제 상태 연결**

`ProductFormFields`는 각 옵션 섹션의 선택 인덱스를 전달한다. 추가 시 새 마지막 항목을 선택하고, 삭제 시 현재 선택을 남은 범위로 보정하며 브로슈어 가격 키는 `removeBrochurePriceOption()`으로 재인덱싱한다.

- [x] **Step 4: 브로슈어 가격 행을 현재 조합 키에 연결**

현재 조합이 엑셀 초기 조합이면 미리 채운 가격을 표시한다. 새로 추가한 옵션 조합처럼 키가 아직 없으면 `100/200/300` 빈 가격 행을 사용하고, 첫 수정부터 그 조합 전용 배열을 `priceRowsBySelection`에 저장한다. 수량 행 추가·삭제·수정도 현재 조합만 변경한다.

- [x] **Step 5: 서비스 단가와 초기 옵션을 엑셀 값으로 교체**

`ProductFormUiPage`는 `createProductUiDraft('브로슈어 · 카탈로그')`를 그대로 사용하고 `designPrintEstimate: '80,000'`, `planningEstimate: '50,000'`만 덮어쓴다.

- [x] **Step 6: 스타일과 focused tests 확인**

`.product-ui-control--selectable`에 pointer cursor를, 표시 텍스트에 overflow/placeholder 색상을 추가한다. 다음 테스트를 실행해 PASS를 확인한다.

```bash
pnpm --dir apps/admin exec node --experimental-strip-types --test \
  tests/productFormUi.test.mjs \
  tests/productFormSectionEditors.test.mjs \
  tests/productFormFields.test.mjs \
  tests/productFormUiPage.test.mjs
```

---

### Task 3: 정적·브라우저 검증

**Files:**

- Verify only: `apps/admin/**`, `apps/**`, `packages/**`

- [x] **Step 1: 전체 관리자 테스트·lint·build 실행**

```bash
pnpm --dir apps/admin test
pnpm --dir apps/admin lint
pnpm --dir apps/admin build
```

- [x] **Step 2: 1000×1232 브라우저에서 상호작용 확인**

`/products/fd796975-2d4d-4be9-9f62-74e2019fb1b3`에서 다음을 확인한다.

1. 첫 pill만 선택 스타일과 input을 가진다.
2. `12p`를 한 번 클릭하면 선택 스타일만 이동하고 input cursor는 열리지 않는다.
3. 선택된 `12p`를 다시 클릭하면 input을 편집할 수 있다.
4. 페이지/용지/두께/코팅을 바꿀 때 해당 조합의 `100/200/300부` 가격이 엑셀 값으로 전환된다.
5. 한 조합의 가격을 수정한 뒤 다른 조합으로 갔다 돌아오면 수정값이 유지된다.

- [x] **Step 3: 금지된 Figma URL과 최종 diff 확인**

```bash
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
git diff --check
git status --short
```

Expected: Figma URL 검색은 매치 없이 종료되고, `git diff --check`는 출력 없이 성공한다.
