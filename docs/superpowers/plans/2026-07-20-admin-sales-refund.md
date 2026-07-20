# 어드민 매출·환불 화면 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/sales`에 Figma의 데이터 있음/없음 매출 대시보드를 구현하고, 환불 버튼에서 환불 확인 팝업과 환불 완료 팝업으로 이어지는 접근 가능한 로컬 UI 흐름을 제공한다.

**Architecture:** 매출 fixture와 금액·차트·환불 순수 함수는 `salesData.ts`에 모으고, 요약 카드·차트·거래 테이블·환불 dialog는 각자 전용 컴포넌트로 분리한다. `SalesPage`는 URL 미리보기 상태와 선택된 거래, 로컬 환불 상태만 조정하며 실제 PG 요청은 수행하지 않는다. 기존 `AdminHeader`, Pretendard 토큰, `AdminIcon` 패턴은 재사용하고 기존 범용 콘텐츠 테이블은 매출 전용 툴바/차트 구조와 맞지 않으므로 변경하지 않는다.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Vite 8, CSS, Node test runner

## Global Constraints

- 환불 확인 기준은 [Figma 노드 227:4179](https://www.figma.com/design/qZcNE6of4hWidBcayhacSI/%EC%94%A8%EB%B8%8C%EB%A0%88%EC%9D%B8_Design?node-id=227-4179&m=dev), 원본 크기 `600 × 344`다.
- 환불 완료 기준은 [Figma 노드 227:4171](https://www.figma.com/design/qZcNE6of4hWidBcayhacSI/%EC%94%A8%EB%B8%8C%EB%A0%88%EC%9D%B8_Design?node-id=227-4171&m=dev), 원본 크기 `608.5 × 207`이다.
- 데이터 있음 기준은 [Figma 노드 227:3667](https://www.figma.com/design/qZcNE6of4hWidBcayhacSI/%EC%94%A8%EB%B8%8C%EB%A0%88%EC%9D%B8_Design?node-id=227-3667&m=dev), 원본 크기 `1440 × 2210`이다.
- 데이터 없음 기준은 [Figma 노드 227:4223](https://www.figma.com/design/qZcNE6of4hWidBcayhacSI/%EC%94%A8%EB%B8%8C%EB%A0%88%EC%9D%B8_Design?node-id=227-4223&m=dev), 원본 크기 `1440 × 1946`이다.
- Figma의 Chrome Desktop 96px 영역과 footer 456px 영역은 기존 어드민 구현 방침에 따라 표현용 외곽 프레임으로 보고 구현하지 않는다. 앱의 기존 `AdminHeader`와 흰색 admin shell을 사용한다.
- 실제 NICE Payments/PG 환불 API, 영수증 API, 매출 조회 API, 서버 캐시, 인증/권한 변경은 범위 밖이다. `환불하기`는 현재 fixture 배열만 갱신한다.
- 네 화면은 다음 URL로 재현한다: `/sales`, `/sales?preview=empty`, `/sales?preview=refund`, `/sales?preview=refund-complete`.
- 기본 `/sales`는 데이터 있음 fixture를 사용한다. `preview`는 디자인 검증용 fixture 선택 장치이며 API가 연결될 때 데이터 loader로 교체할 수 있도록 `getSalesPreview` 한 곳에서만 해석한다.
- 날짜 범위는 Figma 원문 `26. 02. 10 ~ 26. 03. 09`를 표시한다. 날짜 선택 동작은 별도 디자인과 API 계약이 없으므로 추가하지 않는다.
- 상품 selector는 `브로슈어·카탈로그` 한 옵션과 선택 chip 제거 동작만 제공한다. 검색, 다중 상품 API 조회, 기간별 재조회는 범위 밖이다.
- 차트의 원 수치는 Figma 벡터에 데이터로 노출되지 않으므로, 선 모양과 표시된 tooltip 값 `1,245,500원`을 재현하는 명시적 12포인트 fixture를 사용한다. 이를 실제 매출 수치로 해석하지 않는다.
- `design.md`의 Pretendard, `currentColor`, SVG 아이콘 registry, 부모 `gap`, form focus 규칙을 따른다. 컴포넌트 내부 일반 간격에 child margin을 추가하지 않는다.
- 현재 작업 트리의 `apps/admin` 미커밋 변경은 사용자 소유다. 특히 `AdminHeader`, `AdminIcon`, `App.tsx`, 공용 테이블 컴포넌트 변경을 보존하면서 이 계획에 명시된 줄만 수정한다.
- UI 아이콘은 기존 `AdminIcon`을 확장해 렌더링한다. Figma MCP asset URL이나 만료되는 원격 asset을 source에 남기지 않는다.
- 신규 패키지와 차트 라이브러리를 설치하지 않는다. 차트는 데이터 기반 inline SVG로 구현한다.
- 최종 `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`는 출력 없이 종료해야 한다.

---

## File Structure

- Create: `apps/admin/src/pages/salesData.ts` — 매출 타입, 네 미리보기 상태, fixture, 금액/차트/환불 순수 함수를 소유한다.
- Test: `apps/admin/tests/salesData.test.mjs` — fixture 분기, 금액 형식, 차트 좌표, 환불 검증과 불변 갱신을 검증한다.
- Create: `apps/admin/src/components/admin-sales/SalesSummaryCards.tsx` — 기간 표시와 4개 요약 카드를 렌더링한다.
- Create: `apps/admin/src/components/admin-sales/SalesTrendChart.tsx` — 상품 chip/select, grid, 12포인트 SVG, tooltip, 빈 상태를 렌더링한다.
- Create: `apps/admin/src/components/admin-sales/SalesTransactionsTable.tsx` — 8개 컬럼, 3개 상태, 영수증/환불 action, 빈 상태를 렌더링한다.
- Create: `apps/admin/src/components/admin-sales/RefundDialog.tsx` — native modal dialog의 확인/완료 두 단계를 렌더링하고 금액 유효성을 검사한다.
- Create: `apps/admin/src/pages/SalesPage.tsx` — fixture 선택, 환불 flow, 로컬 row 갱신, 섹션 조립을 담당한다.
- Create: `apps/admin/src/pages/SalesPage.css` — 위 매출 전용 컴포넌트의 1360px desktop 레이아웃과 반응형/모달 스타일을 소유한다.
- Modify: `apps/admin/src/components/AdminIcon.tsx` — `calendar`, `card-check`, `pen-tool`, `user-profile` glyph를 현재 registry에 추가한다.
- Modify: `apps/admin/src/components/AdminHeader.tsx` — 현재 nav의 중복 `LinkPay` 항목을 제거하고 Figma의 두 번째 action 버튼 `링크페이 생성하기`로 이동한다.
- Modify: `apps/admin/src/index.css` — 매출 화면에 필요한 semantic color token과 visually-hidden utility를 추가한다.
- Modify: `apps/admin/src/App.tsx` — `/sales` placeholder를 `SalesPage`로 교체한다.
- Reuse unchanged: `apps/admin/src/components/admin-table/AdminDataTableSection.tsx`와 CSS — 다른 관리자 목록 화면의 진행 중 변경을 건드리지 않는다.
- Reuse unchanged: `apps/admin/public/figma-assets/cbrain-logo-*.svg` — 기존 header logo를 그대로 사용한다.

### Task 1: 매출 fixture와 순수 함수 계약을 테스트로 고정

**Files:**

- Create: `apps/admin/tests/salesData.test.mjs`
- Create: `apps/admin/src/pages/salesData.ts`

**Interfaces:**

- Produces: `SalesPreview = 'data' | 'empty' | 'refund' | 'refund-complete'`
- Produces: `SalesSummary`, `SalesTrendSeries`, `SalesTransaction`, `SalesDashboardData`
- Produces: `salesDashboardFixture`, `emptySalesDashboardFixture`, `refundPreviewTransaction`
- Produces: `getSalesPreview`, `formatSalesNumber`, `getChartPoints`, `getRefundAmountError`, `applyLocalRefund`
- Preserves: 원본 fixture 객체와 transaction 배열은 mutation하지 않는다.

- [ ] **Step 1: preview, 숫자, 차트, 환불 동작의 실패 테스트를 작성한다**

  `apps/admin/tests/salesData.test.mjs`를 아래 계약으로 생성한다.

  ```js
  import assert from 'node:assert/strict'
  import test from 'node:test'
  import {
    applyLocalRefund,
    emptySalesDashboardFixture,
    formatSalesNumber,
    getChartPoints,
    getRefundAmountError,
    getSalesPreview,
    salesDashboardFixture,
  } from '../src/pages/salesData.ts'

  test('sales preview accepts only the four supported fixture states', () => {
    assert.equal(getSalesPreview(null), 'data')
    assert.equal(getSalesPreview('empty'), 'empty')
    assert.equal(getSalesPreview('refund'), 'refund')
    assert.equal(getSalesPreview('refund-complete'), 'refund-complete')
    assert.equal(getSalesPreview('unexpected'), 'data')
  })

  test('populated and empty fixtures expose the two Figma data states', () => {
    assert.equal(salesDashboardFixture.transactions.length, 6)
    assert.equal(salesDashboardFixture.summary.scheduledSettlementAmount, 2_452_423)
    assert.equal(emptySalesDashboardFixture.transactions.length, 0)
    assert.equal(emptySalesDashboardFixture.summary.scheduledSettlementAmount, 0)
    assert.equal(emptySalesDashboardFixture.series.every((series) => series.points.length === 0), true)
  })

  test('sales values use Korean thousands separators', () => {
    assert.equal(formatSalesNumber(2_452_423), '2,452,423')
    assert.equal(formatSalesNumber(-3_000), '-3,000')
  })

  test('chart points span the full width and keep larger values higher', () => {
    const points = getChartPoints([0, 50, 100], 200, 100)

    assert.deepEqual(points, [
      { x: 0, y: 100 },
      { x: 100, y: 50 },
      { x: 200, y: 0 },
    ])
  })

  test('refund amount must be a whole won amount within the transaction limit', () => {
    assert.equal(getRefundAmountError('', 38_000), '환불 금액을 입력해주세요.')
    assert.equal(getRefundAmountError('3,000', 38_000), null)
    assert.equal(getRefundAmountError('0', 38_000), '환불 금액은 1원 이상이어야 합니다.')
    assert.equal(
      getRefundAmountError('38,001', 38_000),
      '거래금액 38,000원을 초과할 수 없습니다.',
    )
    assert.equal(getRefundAmountError('3.5', 38_000), '환불 금액은 원 단위 숫자로 입력해주세요.')
  })

  test('local refund returns a refund-complete row without mutating the source row', () => {
    const source = salesDashboardFixture.transactions[1]
    const refunded = applyLocalRefund(source, 3_000)

    assert.notEqual(refunded, source)
    assert.equal(source.status, 'settled')
    assert.deepEqual(refunded, {
      ...source,
      cardFee: 0,
      receiptHref: null,
      refundable: false,
      settlementAmount: -3_000,
      status: 'refund-complete',
      transactionAmount: -3_000,
    })
  })
  ```

- [ ] **Step 2: 새 테스트가 구현 부재로 실패하는지 확인한다**

  Run:

  ```bash
  pnpm --filter admin test
  ```

  Expected: `ERR_MODULE_NOT_FOUND` 또는 `salesData.ts` export 부재로 실패한다.

- [ ] **Step 3: 타입, helper, 명시적 fixture를 구현한다**

  `apps/admin/src/pages/salesData.ts`에 다음 public 계약을 작성한다.

  ```ts
  export type SalesPreview = 'data' | 'empty' | 'refund' | 'refund-complete'
  export type SalesTransactionStatus = 'refund-complete' | 'settled' | 'scheduled'

  export type SalesSummary = {
    readonly monthlyPaymentAmount: number
    readonly monthlyPaymentCount: number
    readonly monthlyVisitorCount: number
    readonly scheduledSettlementAmount: number
    readonly settlementLabel: string
  }

  export type SalesTrendPoint = {
    readonly axisLabel: string
    readonly tooltipLabel: string
    readonly value: number
  }

  export type SalesTrendSeries = {
    readonly color: 'brand' | 'info'
    readonly id: 'all' | 'brochure-catalog'
    readonly label: string
    readonly points: readonly SalesTrendPoint[]
  }

  export type SalesTransaction = {
    readonly cardFee: number
    readonly customerName: string
    readonly id: string
    readonly productName: string
    readonly receiptHref: string | null
    readonly refundable: boolean
    readonly settlementAmount: number
    readonly status: SalesTransactionStatus
    readonly transactionAmount: number
    readonly transactionDate: string
  }

  export type SalesDashboardData = {
    readonly series: readonly SalesTrendSeries[]
    readonly summary: SalesSummary
    readonly transactions: readonly SalesTransaction[]
  }

  export type ChartPoint = {
    readonly x: number
    readonly y: number
  }

  const numberFormatter = new Intl.NumberFormat('ko-KR')

  export function getSalesPreview(value: string | null): SalesPreview {
    if (value === 'empty' || value === 'refund' || value === 'refund-complete') return value
    return 'data'
  }

  export function formatSalesNumber(value: number) {
    return numberFormatter.format(value)
  }

  export function getChartPoints(
    values: readonly number[],
    width: number,
    height: number,
    maximum = Math.max(...values, 1),
  ): readonly ChartPoint[] {
    if (values.length === 0) return []

    const denominator = Math.max(values.length - 1, 1)

    return values.map((value, index) => ({
      x: (width * index) / denominator,
      y: height - (height * value) / maximum,
    }))
  }

  function parseRefundAmount(value: string) {
    const normalized = value.replaceAll(',', '').trim()
    if (!/^\d+$/.test(normalized)) return null
    return Number(normalized)
  }

  export function getRefundAmountError(value: string, maximum: number): string | null {
    if (value.trim() === '') return '환불 금액을 입력해주세요.'

    const amount = parseRefundAmount(value)
    if (amount === null || !Number.isSafeInteger(amount)) {
      return '환불 금액은 원 단위 숫자로 입력해주세요.'
    }
    if (amount < 1) return '환불 금액은 1원 이상이어야 합니다.'
    if (amount > maximum) {
      return `거래금액 ${formatSalesNumber(maximum)}원을 초과할 수 없습니다.`
    }

    return null
  }

  export function applyLocalRefund(
    transaction: SalesTransaction,
    amount: number,
  ): SalesTransaction {
    return {
      ...transaction,
      cardFee: 0,
      receiptHref: null,
      refundable: false,
      settlementAmount: -amount,
      status: 'refund-complete',
      transactionAmount: -amount,
    }
  }
  ```

  같은 파일의 fixture는 다음 값을 그대로 사용한다.

  Summary:

  | field | data | empty |
  | --- | ---: | ---: |
  | settlementLabel | `26. 03. 18. (수) 정산` | 동일 |
  | scheduledSettlementAmount | `2_452_423` | `0` |
  | monthlyPaymentAmount | `2_525_000` | `0` |
  | monthlyPaymentCount | `1_453` | `0` |
  | monthlyVisitorCount | `3_520` | `0` |

  Chart series:

  ```ts
  const allValues = [
    720_000, 980_000, 610_000, 1_280_000, 1_520_000, 910_000,
    1_810_000, 1_980_000, 2_140_000, 1_660_000, 1_940_000, 2_330_000,
  ] as const

  const brochureValues = [
    410_000, 590_000, 400_000, 610_000, 890_000, 470_000,
    1_010_000, 880_000, 1_245_500, 720_000, 1_000_000, 1_540_000,
  ] as const

  function makePoints(values: readonly number[]): readonly SalesTrendPoint[] {
    return values.map((value, index) => ({
      axisLabel: String(index + 1),
      tooltipLabel: `2월 ${index + 1}일 판매 금액`,
      value,
    }))
  }
  ```

  Transactions:

  | id | status | customerName | productName | date | amount | fee | settlement | receipt | refundable |
  | --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |
  | `refund-001` | `refund-complete` | `이동규` | `[현대로템] 명함` | `26. 03. 16` | `-3_000` | `0` | `-3_000` | `null` | `false` |
  | `settled-002` | `settled` | `이동규` | `[현대로템] 명함` | `26. 03. 16` | `16_000` | `598` | `15_303` | `#receipt-settled-002` | `true` |
  | `settled-003` | `settled` | `김민지` | `[노코더스] 브로슈어·카탈로그` | `26. 03. 16` | `16_000` | `598` | `15_303` | `#receipt-settled-003` | `true` |
  | `settled-004` | `settled` | `박서준` | `[CJ ENM] 브로슈어·카탈로그` | `26. 03. 16` | `16_000` | `598` | `15_303` | `#receipt-settled-004` | `true` |
  | `scheduled-005` | `scheduled` | `최유진` | `[연세대학교] 리플렛·팜플렛` | `26. 03. 16` | `16_000` | `598` | `15_303` | `#receipt-scheduled-005` | `true` |
  | `scheduled-006` | `scheduled` | `정하늘` | `[롯데] 명함` | `26. 03. 16` | `16_000` | `598` | `15_303` | `#receipt-scheduled-006` | `true` |

  `refundPreviewTransaction`은 팝업 Figma 검증용으로 `id: 'refund-preview'`, `customerName: '이동규'`, `productName: '[현대로템] 명함'`, `transactionAmount: 38_000`, `status: 'settled'`, `refundable: true`를 사용한다. `emptySalesDashboardFixture`는 summary를 0으로 바꾸고 두 series의 `points`와 `transactions`를 빈 배열로 둔다.

- [ ] **Step 4: 순수 함수 테스트를 통과시킨다**

  Run:

  ```bash
  pnpm --filter admin test
  ```

  Expected: 기존 3개 test file과 새 `salesData.test.mjs`가 모두 PASS한다.

- [ ] **Step 5: 데이터 계약을 독립 커밋한다**

  ```bash
  git add apps/admin/src/pages/salesData.ts apps/admin/tests/salesData.test.mjs
  git commit -m "feat(admin): add sales dashboard data model"
  ```

### Task 2: 공용 icon과 header action을 Figma 매출 shell에 맞춘다

**Files:**

- Modify: `apps/admin/src/components/AdminIcon.tsx`
- Modify: `apps/admin/src/components/AdminHeader.tsx`
- Modify: `apps/admin/src/index.css`

**Interfaces:**

- Extends: `AdminIconName` with `calendar | card-check | pen-tool | user-profile`
- Produces: header actions `씨브레인 홈페이지`, `링크페이 생성하기`
- Preserves: 기존 `/linkpay` route와 기존 action CSS의 148 × 52 버튼 규격

- [ ] **Step 1: Figma glyph 네 개를 `AdminIcon` registry에 등록한다**

  `AdminIcon.tsx`의 union과 `iconDefinitions`만 확장한다. Figma node `calendar-02`, `card-check`, `pen-tool-03`, `user-profile-03`에서 받은 원본 vector path를 사용하되 `stroke`/`fill`은 `currentColor`로 바꾼다. 크기 계약은 다음과 같다.

  | name | viewBox | glyph box | rendering |
  | --- | --- | --- | --- |
  | `calendar` | `0 0 14.8333 16.5` | `14.8333 × 16.5` | stroke 1.5, round |
  | `card-check` | `0 0 22.3995 15.7998` | `22.3995 × 15.7998` | stroke 2, round |
  | `pen-tool` | `0 0 21.2 21.2` | `21.2 × 21.2` | fill currentColor |
  | `user-profile` | `0 0 19.5249 17.0002` | `19.5249 × 17.0002` | stroke 2, round |

  각 요약 카드에서는 `<AdminIcon name="..." size={24} />`, 기간에서는 `<AdminIcon name="calendar" size={20} />`로 렌더링한다. 아이콘별 wrapper 컴포넌트는 만들지 않는다.

- [ ] **Step 2: LinkPay를 nav 중복 항목에서 header action으로 이동한다**

  `AdminHeader.tsx`에서 `menuItems`의 `{ label: 'LinkPay', to: '/linkpay' }`를 제거한다. `react-router-dom` import에 `Link`를 추가하고 action 영역은 아래 구조로 바꾼다.

  ```tsx
  <div className="admin-header__actions">
    <a className="admin-header__action pretendard-bold-14" href="/">
      씨브레인 홈페이지
    </a>
    <Link className="admin-header__action pretendard-bold-14" to="/linkpay">
      링크페이 생성하기
    </Link>
  </div>
  ```

  기존 logo, 7개 Figma nav menu, active 상태, `AdminHeader.css`는 변경하지 않는다.

- [ ] **Step 3: 매출 semantic color와 sr-only utility를 추가한다**

  `apps/admin/src/index.css`의 `:root`에 다음 token을 추가한다.

  ```css
  --admin-brand-800: #1c656c;
  --admin-info-500: #43a0f5;
  --admin-error-500: #f53333;
  --admin-overlay: rgb(15 23 42 / 40%);
  ```

  파일 하단에는 접근성용 utility를 추가한다.

  ```css
  .admin-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  ```

- [ ] **Step 4: 공용 shell 회귀 검사를 실행한다**

  Run:

  ```bash
  pnpm --filter admin lint
  pnpm --filter admin build
  ```

  Expected: 두 명령 모두 exit code 0. `/products`, `/portfolio`, `/blog`, `/reviews`, `/notices`에서 기존 header menu와 콘텐츠가 유지되고 LinkPay만 두 번째 action 버튼으로 보인다.

- [ ] **Step 5: shell 변경을 독립 커밋한다**

  ```bash
  git add apps/admin/src/components/AdminIcon.tsx apps/admin/src/components/AdminHeader.tsx apps/admin/src/index.css
  git commit -m "feat(admin): align sales header actions"
  ```

### Task 3: 매출 요약 카드와 데이터/빈 차트를 구현한다

**Files:**

- Create: `apps/admin/src/components/admin-sales/SalesSummaryCards.tsx`
- Create: `apps/admin/src/components/admin-sales/SalesTrendChart.tsx`
- Create: `apps/admin/src/pages/SalesPage.css`

**Interfaces:**

- Consumes: `SalesSummary`, `SalesTrendSeries`, `formatSalesNumber`, `getChartPoints`
- Produces: `SalesSummaryCards({ summary })`
- Produces: `SalesTrendChart({ series })`
- Preserves: 선택 상품 초기값 `brochure-catalog`, 기본 tooltip point index `8`

- [ ] **Step 1: 기간과 4개 요약 카드를 구현한다**

  `SalesSummaryCards.tsx`는 다음 public props와 구조를 사용한다.

  ```tsx
  import { AdminIcon } from '../AdminIcon'
  import { formatSalesNumber } from '../../pages/salesData'
  import type { SalesSummary } from '../../pages/salesData'

  type SalesSummaryCardsProps = {
    readonly summary: SalesSummary
  }

  const secondaryCards = [
    { field: 'monthlyPaymentAmount', icon: 'card-check', label: '이번 달 결제 금액', unit: '원' },
    { field: 'monthlyPaymentCount', icon: 'pen-tool', label: '이번 달 결제 건 수', unit: '건' },
    { field: 'monthlyVisitorCount', icon: 'user-profile', label: '이번 달 방문자 수', unit: '명' },
  ] as const

  export function SalesSummaryCards({ summary }: SalesSummaryCardsProps) {
    return (
      <section className="admin-sales-summary" aria-labelledby="sales-summary-title">
        <div className="admin-sales-section-heading">
          <h1 className="pretendard-bold-18" id="sales-summary-title">매출 추이</h1>
          <div className="admin-sales-period pretendard-medium-14" aria-label="조회 기간">
            <strong className="pretendard-bold-14">기간 설정</strong>
            <span><AdminIcon name="calendar" size={20} /><time dateTime="2026-02-10">26. 02. 10</time></span>
            <span aria-hidden="true">~</span>
            <span><AdminIcon name="calendar" size={20} /><time dateTime="2026-03-09">26. 03. 09</time></span>
          </div>
        </div>

        <div className="admin-sales-summary__cards">
          <article className="admin-sales-summary-card admin-sales-summary-card--primary">
            <span className="admin-sales-summary-card__settlement pretendard-bold-12">{summary.settlementLabel}</span>
            <div className="admin-sales-summary-card__value-group">
              <span className="pretendard-medium-16">예정 정산 금액</span>
              <strong className="admin-sales-summary-card__value pretendard-bold-32">
                {formatSalesNumber(summary.scheduledSettlementAmount)}
                <small className="pretendard-medium-16">원</small>
              </strong>
            </div>
          </article>

          {secondaryCards.map((card) => (
            <article className="admin-sales-summary-card" key={card.field}>
              <div className="admin-sales-summary-card__label-group">
                <span className="admin-sales-summary-card__icon"><AdminIcon name={card.icon} size={24} /></span>
                <span className="pretendard-medium-16">{card.label}</span>
              </div>
              <strong className="admin-sales-summary-card__value pretendard-bold-32">
                {formatSalesNumber(summary[card.field])}
                <small className="pretendard-medium-16">{card.unit}</small>
              </strong>
            </article>
          ))}
        </div>
      </section>
    )
  }
  ```

- [ ] **Step 2: 데이터 기반 SVG 차트를 구현한다**

  `SalesTrendChart.tsx`는 `selectedProductIds`를 `['brochure-catalog']`로 초기화한다. selector에서 같은 id를 중복 추가하지 않고, chip의 `x-close` 버튼은 해당 series를 제거한다. `all` series는 항상 표시한다.

  SVG 계약:

  ```ts
  const CHART_WIDTH = 1296
  const CHART_HEIGHT = 436
  const PLOT_TOP = 40
  const PLOT_HEIGHT = 360
  const DEFAULT_ACTIVE_POINT = { seriesId: 'brochure-catalog', pointIndex: 8 } as const
  ```

  현재 보이는 모든 series의 공통 maximum을 먼저 구하고 `getChartPoints(values, 1296, 360, commonMaximum)`으로 전달한 뒤 반환한 점의 y에 `PLOT_TOP`을 더한다. `polyline` 두 개, `all` series 아래 `linearGradient` area path, 각 point의 focusable `<circle>`을 그린다. point hover/focus 시 `{tooltipLabel}`과 `{formatSalesNumber(value)}원`을 표시하고 blur/mouse leave 시 기본 point로 돌아간다.

  빈 branch는 같은 19개 horizontal grid, y축, x축 label `1`~`12`를 남기고 중앙에 아래 문구를 렌더링한다.

  ```tsx
  <span className="admin-sales-empty-message pretendard-medium-14">
    조회할 데이터가 없습니다.
  </span>
  ```

  차트 wrapper는 `role="img"`와 데이터/빈 상태를 구분하는 `aria-label`을 갖고, SVG 뒤에 `.admin-sr-only` 목록으로 현재 series label과 12개 값을 제공한다.

- [ ] **Step 3: Figma 치수로 summary와 chart CSS를 작성한다**

  `SalesPage.css`에 다음 수치를 고정한다.

  ```css
  .admin-sales-page {
    width: 100%;
    min-height: calc(100svh - 80px);
    padding: 52px 40px 104px;
    background: var(--admin-surface);
    color: var(--admin-gray-800);
  }

  .admin-sales-page__content {
    width: min(1360px, 100%);
    display: flex;
    flex-direction: column;
    gap: 52px;
    margin: 0 auto;
  }

  .admin-sales-section-heading {
    min-height: 26px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
  }

  .admin-sales-summary,
  .admin-sales-chart-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .admin-sales-summary__cards {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
  }

  .admin-sales-summary-card {
    height: 196px;
    padding: 32px;
    border-radius: 16px;
    background: var(--admin-gray-50);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 20px;
  }

  .admin-sales-summary-card--primary {
    background: linear-gradient(100deg, var(--admin-brand-800), var(--admin-gray-800));
    color: var(--admin-text-inverse);
  }

  .admin-sales-chart-card {
    min-height: 560px;
    padding: 32px;
    border-radius: 16px;
    background: var(--admin-gray-50);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .admin-sales-chart-card--empty {
    min-height: 584px;
    gap: 32px;
  }
  ```

  상품 toolbar는 52px, legend chip은 32px/16px radius, selector는 `320 × 52`/16px radius, chart canvas는 436px다. 1360px 이하에서는 summary가 2열, 720px 이하에서는 1열이 되며 chart/table wrapper만 가로 스크롤을 허용한다.

- [ ] **Step 4: component lint와 build를 통과시킨다**

  Run:

  ```bash
  pnpm --filter admin lint
  pnpm --filter admin build
  ```

  Expected: exit code 0. Tailwind class와 신규 dependency가 없어야 한다.

- [ ] **Step 5: summary/chart를 독립 커밋한다**

  ```bash
  git add apps/admin/src/components/admin-sales/SalesSummaryCards.tsx apps/admin/src/components/admin-sales/SalesTrendChart.tsx apps/admin/src/pages/SalesPage.css
  git commit -m "feat(admin): add sales summary and trend chart"
  ```

### Task 4: 거래 테이블과 두 단계 환불 dialog를 구현한다

**Files:**

- Create: `apps/admin/src/components/admin-sales/SalesTransactionsTable.tsx`
- Create: `apps/admin/src/components/admin-sales/RefundDialog.tsx`
- Modify: `apps/admin/src/pages/SalesPage.css`

**Interfaces:**

- Produces: `SalesTransactionsTable({ rows, onRefund })`
- Produces: `RefundDialog({ step, transaction, onClose, onRefund, onConfirm })`
- Consumes: `SalesTransaction`, `formatSalesNumber`, `getRefundAmountError`
- Emits: 환불 요청 시 선택 transaction과 검증된 정수 won amount

- [ ] **Step 1: 8개 컬럼과 data/empty branch를 갖는 거래 테이블을 작성한다**

  `SalesTransactionsTable.tsx`는 다음 status map을 사용한다.

  ```ts
  const statusContent = {
    'refund-complete': { className: 'admin-sales-status--error', label: '환불완료' },
    settled: { className: 'admin-sales-status--brand', label: '정산완료' },
    scheduled: { className: 'admin-sales-status--muted', label: '정산예정' },
  } as const

  const headers = [
    '상태', '상품명', '거래일자', '거래금액',
    '카드수수료', '정산금', '거래영수증', '환불',
  ] as const
  ```

  `role="table"`, `role="rowgroup"`, `role="row"`, `role="columnheader"`, `role="cell"`을 사용한다. 상품명은 bold, 상태는 4px dot과 bold label, 숫자는 `formatSalesNumber`, receipt가 없거나 환불 불가이면 `-`를 렌더링한다. 환불 가능한 row는 아래 버튼을 렌더링한다.

  ```tsx
  <button
    className="admin-sales-table__refund pretendard-medium-14"
    onClick={() => onRefund(row)}
    type="button"
  >
    환불
  </button>
  ```

  빈 table은 header를 유지하고 그 아래 52px gap 뒤 32px pill에 `조회할 데이터가 없습니다.`를 표시한다.

- [ ] **Step 2: native dialog lifecycle과 환불 확인 단계를 구현한다**

  `RefundDialog.tsx`는 `<dialog>` ref를 mount 때 `showModal()`하고 unmount cleanup에서 `close()`한다. `cancel` event는 `preventDefault()` 후 `onClose()`를 호출한다. title은 `aria-labelledby`, 설명은 `aria-describedby`, x 버튼은 `aria-label="환불 팝업 닫기"`를 사용한다.

  확인 단계의 copy와 input은 다음과 같다.

  ```tsx
  <h2 className="pretendard-bold-20" id={titleId}>환불을 진행하시겠습니까?</h2>
  <p className="pretendard-medium-14" id={descriptionId}>
    {transaction.customerName}님이 {transaction.productName} 환불을 진행하시겠습니까?
  </p>
  <p className="pretendard-medium-14">
    거래금액 : {formatSalesNumber(transaction.transactionAmount)}원
  </p>
  <label className="admin-refund-dialog__field">
    <span className="pretendard-medium-14">환불 금액</span>
    <input
      className="admin-refund-dialog__input pretendard-medium-14"
      autoFocus
      inputMode="numeric"
      placeholder="환불하실 금액을 입력해주세요."
      required
      value={amount}
    />
  </label>
  ```

  submit 시 `getRefundAmountError(amount, transaction.transactionAmount)`를 호출한다. 오류면 input의 `setCustomValidity(error)`와 `reportValidity()`를 실행하고, 성공이면 comma를 제거한 정수로 `onRefund(value)`를 호출한다. 입력 변경 시 custom validity를 빈 문자열로 초기화한다.

- [ ] **Step 3: 환불 완료 단계를 같은 dialog surface에 구현한다**

  완료 단계는 input 없이 아래 copy와 `확인` 버튼만 렌더링한다.

  ```tsx
  <h2 className="pretendard-bold-20" id={titleId}>환불이 완료되었습니다</h2>
  <p className="pretendard-medium-14" id={descriptionId}>
    환불 금액은 이후 나이스페이먼츠(PG사)에서 정산 될 금액에서 차감됩니다.
  </p>
  <button className="admin-refund-dialog__primary pretendard-bold-14" onClick={onConfirm} type="button">
    확인
  </button>
  ```

  두 단계 모두 x 버튼과 Escape로 닫을 수 있다. 완료 팝업의 확인은 dialog state를 `null`로 만든다.

- [ ] **Step 4: Figma table/dialog 치수를 CSS에 추가한다**

  거래 grid는 desktop에서 정확히 아래 track을 사용한다.

  ```css
  .admin-sales-table__header,
  .admin-sales-table__row {
    display: grid;
    grid-template-columns: 120px minmax(520px, 1fr) repeat(6, 120px);
    align-items: center;
  }
  ```

  header/row는 52px, header radius 16px, body gap 8px, header separator는 기존 공용 테이블과 같은 32px vertical fade를 사용한다. status/refund color는 각각 `--admin-error-500`, `--admin-brand-500`, `--admin-gray-600`이다.

  Dialog CSS:

  ```css
  .admin-refund-dialog {
    width: min(600px, calc(100vw - 32px));
    padding: 32px;
    border: 1px solid var(--admin-gray-100);
    border-radius: 24px;
    background: var(--admin-gray-50);
    color: var(--admin-gray-800);
  }

  .admin-refund-dialog--complete {
    width: min(608.5px, calc(100vw - 32px));
  }

  .admin-refund-dialog::backdrop {
    background: var(--admin-overlay);
  }

  .admin-refund-dialog__layout {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 32px;
  }

  .admin-refund-dialog__input {
    width: 100%;
    height: 52px;
    padding: 0 16px;
    border: 1px solid var(--admin-gray-100);
    border-radius: 16px;
    background: var(--admin-surface);
    color: var(--admin-gray-800);
  }

  .admin-refund-dialog__primary {
    min-width: 57px;
    height: 52px;
    padding: 8px 16px;
    border: 0;
    border-radius: 16px;
    background: var(--admin-brand-500);
    color: var(--admin-text-inverse);
  }
  ```

  확인 단계 button은 copy 길이에 따라 81px, 완료 단계는 57px가 된다. close button은 24 × 24 투명 button이며 `<AdminIcon name="x-close" />`를 사용한다.

- [ ] **Step 5: table/dialog 정적 검사를 통과시킨다**

  Run:

  ```bash
  pnpm --filter admin lint
  pnpm --filter admin build
  ```

  Expected: exit code 0. dialog input에는 별도 `:focus` border/outline/box-shadow CSS가 없어야 한다.

- [ ] **Step 6: transaction/refund UI를 독립 커밋한다**

  ```bash
  git add apps/admin/src/components/admin-sales/SalesTransactionsTable.tsx apps/admin/src/components/admin-sales/RefundDialog.tsx apps/admin/src/pages/SalesPage.css
  git commit -m "feat(admin): add sales refund flow"
  ```

### Task 5: SalesPage 상태 흐름과 `/sales` route를 연결한다

**Files:**

- Create: `apps/admin/src/pages/SalesPage.tsx`
- Modify: `apps/admin/src/App.tsx`

**Interfaces:**

- Produces: `export function SalesPage()`
- Produces: `/sales` → `<SalesPage />`
- Preview mapping: data/empty/refund/refund-complete
- State machine: `null → confirm → complete → null`

- [ ] **Step 1: preview 변경 시 remount되는 page shell을 구현한다**

  `SalesPage.tsx`의 export는 query 해석만 담당하고 내부 dashboard에 `key={preview}`를 준다. 이 구조로 effect에서 state를 강제로 동기화하지 않는다.

  ```tsx
  import { useState } from 'react'
  import { useSearchParams } from 'react-router-dom'
  import { RefundDialog } from '../components/admin-sales/RefundDialog'
  import { SalesSummaryCards } from '../components/admin-sales/SalesSummaryCards'
  import { SalesTransactionsTable } from '../components/admin-sales/SalesTransactionsTable'
  import { SalesTrendChart } from '../components/admin-sales/SalesTrendChart'
  import {
    applyLocalRefund,
    emptySalesDashboardFixture,
    getSalesPreview,
    refundPreviewTransaction,
    salesDashboardFixture,
  } from './salesData'
  import type { SalesPreview, SalesTransaction } from './salesData'
  import './SalesPage.css'

  type RefundFlow = {
    readonly step: 'complete' | 'confirm'
    readonly transaction: SalesTransaction
  } | null

  function SalesDashboard({ preview }: { readonly preview: SalesPreview }) {
    const fixture = preview === 'empty' ? emptySalesDashboardFixture : salesDashboardFixture
    const [transactions, setTransactions] = useState(() => [...fixture.transactions])
    const [refundFlow, setRefundFlow] = useState<RefundFlow>(() => {
      if (preview === 'refund') return { step: 'confirm', transaction: refundPreviewTransaction }
      if (preview === 'refund-complete') return { step: 'complete', transaction: refundPreviewTransaction }
      return null
    })

    function completeRefund(amount: number) {
      if (!refundFlow) return

      const refunded = applyLocalRefund(refundFlow.transaction, amount)
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === refunded.id ? refunded : transaction,
        ),
      )
      setRefundFlow({ step: 'complete', transaction: refunded })
    }

    return (
      <main className="admin-sales-page" aria-label="매출 관리">
        <div className="admin-sales-page__content">
          <SalesSummaryCards summary={fixture.summary} />
          <SalesTrendChart series={fixture.series} />
          <SalesTransactionsTable
            onRefund={(transaction) => setRefundFlow({ step: 'confirm', transaction })}
            rows={transactions}
          />
        </div>

        {refundFlow ? (
          <RefundDialog
            key={`${refundFlow.transaction.id}-${refundFlow.step}`}
            onClose={() => setRefundFlow(null)}
            onConfirm={() => setRefundFlow(null)}
            onRefund={completeRefund}
            step={refundFlow.step}
            transaction={refundFlow.transaction}
          />
        ) : null}
      </main>
    )
  }

  export function SalesPage() {
    const [searchParams] = useSearchParams()
    const preview = getSalesPreview(searchParams.get('preview'))

    return <SalesDashboard key={preview} preview={preview} />
  }
  ```

- [ ] **Step 2: `/sales` placeholder를 실제 page로 교체한다**

  `App.tsx`에 import를 추가한다.

  ```tsx
  import { SalesPage } from './pages/SalesPage'
  ```

  `placeholderPages` filter에서 `/sales`를 제외하고 route를 추가한다.

  ```tsx
  <Route element={<SalesPage />} path="/sales" />
  ```

  root redirect `/products`, 다른 실제/placeholder route, `scrollToFirstInvalidControl`은 변경하지 않는다.

- [ ] **Step 3: 전체 자동 검사를 통과시킨다**

  Run:

  ```bash
  pnpm --filter admin test
  pnpm --filter admin lint
  pnpm --filter admin build
  ```

  Expected: 모두 exit code 0.

- [ ] **Step 4: route 연결을 독립 커밋한다**

  ```bash
  git add apps/admin/src/App.tsx apps/admin/src/pages/SalesPage.tsx
  git commit -m "feat(admin): add sales dashboard page"
  ```

### Task 6: 네 Figma 상태와 회귀를 실제 브라우저에서 검증한다

**Files:**

- Verify: `apps/admin/src/pages/SalesPage.tsx`
- Verify: `apps/admin/src/pages/SalesPage.css`
- Verify: `apps/admin/src/components/admin-sales/*.tsx`
- Verify: `apps/admin/src/components/AdminHeader.tsx`
- Verify: `apps/admin/src/App.tsx`

**Interfaces:**

- Confirms: 네 preview URL이 각 Figma node와 대응한다.
- Confirms: keyboard dialog와 local refund state transition이 동작한다.
- Confirms: 다른 admin route와 Figma URL 규칙에 회귀가 없다.

- [ ] **Step 1: 개발 서버를 시작한다**

  ```bash
  pnpm --filter admin dev --host 127.0.0.1
  ```

  Expected: Vite가 사용 가능한 localhost port를 출력한다.

- [ ] **Step 2: 데이터 있음 화면의 copy, 값, 치수를 확인한다**

  1440px viewport에서 `/sales`를 열고 확인한다.

  - Header 높이 80px, 매출 menu active, 우측 action 2개.
  - 본문 좌우 padding 40px, 최대 폭 1360px, section gap 52px.
  - Summary title/period와 `2,452,423원`, `2,525,000원`, `1,453건`, `3,520명`.
  - 4개 summary card가 각 325 × 196, gap 20px.
  - Chart card 1360 × 560, selector 320 × 52, tooltip `2월 9일 판매 금액 / 1,245,500원`.
  - Table header 순서가 `상태, 상품명, 거래일자, 거래금액, 카드수수료, 정산금, 거래영수증, 환불`.
  - 데이터 row 6개와 상태 순서 `환불완료, 정산완료, 정산완료, 정산완료, 정산예정, 정산예정`.

- [ ] **Step 3: 데이터 없음 화면을 확인한다**

  `/sales?preview=empty`에서 확인한다.

  - 네 summary 값이 모두 0이지만 period와 settlement label은 유지된다.
  - Chart의 legend, selector, grid, x축 1~12는 유지되고 line/point/tooltip은 없다.
  - Chart와 table 모두 `조회할 데이터가 없습니다.`를 한 번씩 표시한다.
  - Table header는 유지되고 row는 0개다.

- [ ] **Step 4: 환불 확인과 완료 popup을 확인한다**

  `/sales?preview=refund`에서 확인한다.

  - dialog surface 600 × 344, padding 32, radius 24.
  - copy가 `이동규님이 [현대로템] 명함 환불을 진행하시겠습니까?`, `거래금액 : 38,000원`과 일치한다.
  - input 536 × 52, button 81 × 52.
  - 빈 값/0/38,001/소수는 완료 단계로 이동하지 않고 browser validity를 표시한다.
  - `3,000` 제출 시 `환불이 완료되었습니다` 단계로 바뀐다.

  `/sales?preview=refund-complete`에서 확인한다.

  - dialog surface 608.5 × 207, copy와 확인 button 57 × 52가 Figma와 일치한다.
  - `확인`, x, Escape가 dialog를 닫는다.

- [ ] **Step 5: 실제 table 환불 상호작용을 확인한다**

  `/sales`의 두 번째 row에서 `환불`을 누르고 `3,000`을 입력한다. 완료 popup을 닫은 뒤 해당 row가 아래 값으로 바뀌는지 확인한다.

  ```text
  환불완료 | [현대로템] 명함 | 26. 03. 16 | -3,000 | 0 | -3,000 | - | -
  ```

  페이지 reload 시 fixture 원본으로 돌아와야 한다. 이는 서버 반영이 아닌 로컬 UI flow임을 확인한다.

- [ ] **Step 6: keyboard와 좁은 viewport 회귀를 확인한다**

  - 환불 button에서 Enter/Space로 dialog가 열린다.
  - dialog가 열릴 때 input으로 focus가 이동하고 Tab focus가 native dialog 안에 머문다.
  - Escape가 닫고 trigger가 보존된다.
  - 1024px에서 summary는 2열, chart/table은 내부 가로 스크롤로 잘리지 않으며 page 자체의 불필요한 horizontal overflow는 없다.
  - 720px 이하에서 summary는 1열이고 dialog 폭은 viewport minus 32px다.

- [ ] **Step 7: 다른 관리자 화면과 금지 URL을 검사한다**

  `/products`, `/portfolio`, `/blog`, `/reviews`, `/notices`, `/linkpay`를 열어 header와 본문 회귀가 없는지 확인한 뒤 실행한다.

  ```bash
  pnpm --filter admin test
  pnpm --filter admin lint
  pnpm --filter admin build
  rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
  git diff --check
  ```

  Expected: test/lint/build/diff check는 exit code 0, Figma URL scan은 출력 없이 exit code 1.

- [ ] **Step 8: 검증 중 수정이 있었다면 한 목적의 커밋으로 정리한다**

  ```bash
  git add apps/admin/src apps/admin/tests/salesData.test.mjs
  git commit -m "fix(admin): refine sales dashboard fidelity"
  ```

## Self-Review

- Spec coverage: 네 Figma node의 크기, copy, data/empty branch, summary 값, chart controls, 8개 table column, 6개 row, 확인/완료 dialog를 각각 task에 연결했다.
- State coverage: URL preview 4종과 실제 `null → confirm → complete → null` 환불 flow를 모두 정의했다.
- Data integrity: 실제 PG 호출이 없는 범위를 명시했고 환불은 immutable local row update만 수행한다.
- Reuse: 기존 header, logo, type tokens, `AdminIcon`, route shell을 재사용하고 진행 중인 공용 콘텐츠 테이블은 수정하지 않는다.
- Accessibility: semantic headings/table, native modal dialog, label/input, keyboard close, chart text alternative를 포함한다.
- Visual fidelity: 1360px content, 52/20/32px spacing, card/chart/table/dialog dimensions와 Figma copy를 고정했다.
- Asset policy: 신규 원격 asset 없이 `currentColor` icon registry와 inline data SVG chart를 사용하며 최종 Figma URL scan을 포함한다.
- Scope: Chrome frame, footer, API/PG, server persistence, date picker, multi-product backend filter, receipt endpoint를 추가하지 않는다.
- Type consistency: `SalesTransaction`, `SalesDashboardData`, preview union, refund flow names이 모든 task에서 동일하다.
- Placeholder scan: 구현에 필요한 값, 상태, URL, command, expected result가 모두 명시되어 있다.
