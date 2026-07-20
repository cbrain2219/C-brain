# 어드민 상품 리스트 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Figma 노드 `227:6375`의 상품 리스트를 `/products`에 구현하되, 기존 포트폴리오 리스트 레이아웃을 그대로 재사용한다.

**Architecture:** 기존 `AdminDataTableSection`과 `PortfolioPage.css`가 Figma의 제목, 툴바, 52px 테이블 헤더, 빈 상태, 하단 CTA를 이미 표현한다. 새 `ProductPage`는 Figma에서 확인한 상품 전용 문구와 6개 컬럼만 선언하고, `App.tsx`는 `/products` placeholder를 이 페이지로 교체한다.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite 8, 기존 admin CSS

## Global Constraints

- 디자인 기준은 [Figma 상품_P 노드](https://www.figma.com/design/qZcNE6of4hWidBcayhacSI/%EC%94%A8%EB%B8%8C%EB%A0%88%EC%9D%B8_Design?node-id=227-6375&m=dev)다.
- `design.md`의 Pretendard, SVG 아이콘, `currentColor`, `gap` 기반 간격 규칙을 유지한다.
- 현재 작업 트리의 `AdminDataTableSection.tsx`, `AdminDataTableSection.css`, `PortfolioPage.tsx` 미커밋 변경을 보존하고 수정하지 않는다.
- 새 테이블 컴포넌트, CSS 파일, 아이콘, 이미지, 패키지, API/Supabase 연동을 추가하지 않는다.
- 필터 dropdown, 검색 동작, 정렬, 페이지네이션, 상품 행 fixture는 범위 밖이다.
- Figma 브라우저 chrome과 footer는 표현용 외곽 프레임이다. 사용자 요구대로 기존 포트폴리오 리스트와 동일한 admin shell만 재사용한다.
- Figma에 적힌 `상태 필터 → 일반상품`과 검색 placeholder `포트폴리오 제목으로 검색해주세요.`는 의미를 임의 교정하지 않고 그대로 구현한다.
- Figma MCP asset URL은 소스에 남기지 않는다. 이 화면은 glyph가 일치하는 기존 `ChevronDownIcon`, `SearchIcon`, `PackageIcon`을 재사용하므로 신규 asset 다운로드가 없다.
- 최종 `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`는 출력 없이 종료해야 한다.

---

## File Structure

- Create: `apps/admin/src/pages/ProductPage.tsx` — Figma 상품 리스트의 문구, 컬럼, 빈 행 설정을 소유한다.
- Modify: `apps/admin/src/App.tsx` — `/products`를 `ProductPage`에 연결하고 placeholder 렌더링에서 제외한다.
- Reuse unchanged: `apps/admin/src/components/admin-table/AdminDataTableSection.tsx` — 공용 리스트 구조, 아이콘, 빈 상태, CTA를 제공한다.
- Reuse unchanged: `apps/admin/src/components/admin-table/AdminDataTableSection.css` — Figma와 일치하는 52px 헤더, 16px radius, 20px/32px gap, 반응형 축소를 제공한다.
- Reuse unchanged: `apps/admin/src/pages/PortfolioPage.css` — 포트폴리오와 동일한 페이지 외곽 레이아웃을 제공한다.

### Task 1: Figma 상품 리스트 페이지와 라우트 구현

**Files:**
- Create: `apps/admin/src/pages/ProductPage.tsx`
- Modify: `apps/admin/src/App.tsx:1-4,77-99`
- Verify: `apps/admin/src/pages/PortfolioPage.tsx`
- Verify: `apps/admin/src/components/admin-table/AdminDataTableSection.tsx`

**Interfaces:**
- Consumes: `AdminDataTableSection<Row>`, `AdminTableColumn<Row>`, `AdminTableFilter`
- Produces: `export function ProductPage()` and route `/products` → `<ProductPage />`
- Preserves: route `/portfolio` → `<PortfolioPage />` and every other placeholder route

- [x] **Step 1: 현재 `/products`가 Figma 리스트가 아님을 확인한다**

  ```bash
  pnpm --filter admin dev --host 127.0.0.1
  ```

  브라우저에서 `http://127.0.0.1:5173/products`를 열어 다음을 확인한다.

  ```js
  if (document.querySelector('[role="table"]')) {
    throw new Error('Expected the pre-implementation /products route to have no table')
  }

  if (document.querySelector('#page-title')?.textContent?.trim() !== '상품') {
    throw new Error('Expected the current products placeholder')
  }
  ```

  Expected: 두 조건 모두 통과하며 현재 화면이 placeholder임을 증명한다.

- [x] **Step 2: Figma 값으로 `ProductPage.tsx`를 작성한다**

  `apps/admin/src/pages/ProductPage.tsx`를 아래 내용으로 생성한다. Figma metadata의 컬럼 폭은 `120 / 120 / flex / 120 / 120 / 120`이며, 1360px 기준 flex 상품명 컬럼은 760px가 된다.

  ```tsx
  import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
  import type {
    AdminTableColumn,
    AdminTableFilter,
  } from '../components/admin-table/AdminDataTableSection'
  import './PortfolioPage.css'

  type ProductRow = {
    readonly id: string
  }

  const productFilters = [
    { id: 'type', label: '유형 필터', value: '일반상품' },
    { id: 'status', label: '상태 필터', value: '일반상품' },
  ] satisfies readonly AdminTableFilter[]

  const productRows: readonly ProductRow[] = []

  const productColumns: readonly AdminTableColumn<ProductRow>[] = [
    {
      header: '상태',
      id: 'status',
      renderCell: () => null,
      track: '120px',
    },
    {
      header: '유형',
      id: 'type',
      renderCell: () => null,
      track: '120px',
    },
    {
      header: '상품명',
      id: 'name',
      renderCell: () => null,
      track: 'minmax(0, 1fr)',
    },
    {
      header: '등록일자',
      id: 'createdAt',
      renderCell: () => null,
      track: '120px',
    },
    {
      header: '상품가',
      id: 'price',
      renderCell: () => null,
      track: '120px',
    },
    {
      header: '상세',
      id: 'detail',
      renderCell: () => null,
      track: '120px',
    },
  ]

  export function ProductPage() {
    return (
      <main className="portfolio-page" aria-label="상품 관리">
        <AdminDataTableSection
          bottomAction={{ href: '/products/new', label: '신규 상품 등록' }}
          columns={productColumns}
          emptyMessage="조회할 데이터가 없습니다."
          filters={productFilters}
          getRowKey={(row) => row.id}
          rows={productRows}
          search={{
            label: '검색',
            placeholder: '포트폴리오 제목으로 검색해주세요.',
          }}
          title="상품 등록 현황"
        />
      </main>
    )
  }
  ```

  `ProductRow`는 현재 Figma가 빈 상태만 정의하므로 `id`만 갖는다. 실제 상품 데이터 계약이 생길 때 필드와 cell renderer를 함께 추가한다.

- [x] **Step 3: `/products`를 `ProductPage`에 연결한다**

  `apps/admin/src/App.tsx` 상단에 import를 추가한다.

  ```tsx
  import { ProductPage } from './pages/ProductPage'
  ```

  placeholder 계산과 실제 라우트를 아래처럼 바꾼다.

  ```tsx
  const placeholderPages = adminPages.filter(
    (page) => page.path !== '/products' && page.path !== '/portfolio',
  )

  // Routes 내부
  <Route element={<Navigate replace to="/products" />} path="/" />
  <Route element={<ProductPage />} path="/products" />
  <Route element={<PortfolioPage />} path="/portfolio" />
  ```

  `adminPages`, `AdminPage`, 다른 route 정의는 변경하지 않는다.

- [x] **Step 4: 타입·lint·production build를 통과시킨다**

  ```bash
  pnpm --filter admin lint
  pnpm --filter admin build
  ```

  Expected: 두 명령 모두 exit code 0으로 종료한다. 새 의존성이나 설정 변경은 없어야 한다.

- [x] **Step 5: Figma 문구와 DOM 구조를 검증한다**

  `http://127.0.0.1:5173/products`에서 다음 스크립트를 실행한다.

  ```js
  const expectedHeaders = ['상태', '유형', '상품명', '등록일자', '상품가', '상세']
  const headers = Array.from(document.querySelectorAll('[role="columnheader"]')).map(
    (node) => node.textContent?.trim(),
  )
  const bodyText = document.body.innerText
  const activeMenu = document.querySelector('.admin-header__menu-link--active')
  const search = document.querySelector('.admin-data-table-search__input')

  if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
    throw new Error(`Unexpected headers: ${JSON.stringify(headers)}`)
  }

  for (const text of ['상품 등록 현황', '유형 필터', '상태 필터', '조회할 데이터가 없습니다.', '신규 상품 등록']) {
    if (!bodyText.includes(text)) throw new Error(`Missing Figma copy: ${text}`)
  }

  if ((bodyText.match(/일반상품/g) ?? []).length !== 2) {
    throw new Error('Expected both Figma filter values to be 일반상품')
  }

  if (search?.getAttribute('placeholder') !== '포트폴리오 제목으로 검색해주세요.') {
    throw new Error('Unexpected Figma search placeholder')
  }

  if (activeMenu?.textContent?.trim() !== '상품') {
    throw new Error('Products navigation is not active')
  }
  ```

  Expected: 오류 없이 끝나며 table header 순서와 모든 Figma 문구가 정확히 일치한다.

- [x] **Step 6: Figma 치수와 기존 포트폴리오 회귀를 검증한다**

  1440×1030 viewport에서 `/products`를 열고 아래를 실행한다.

  ```js
  const header = document.querySelector('.admin-data-table__header')
  const empty = document.querySelector('.admin-data-table__empty')
  const action = document.querySelector('.admin-data-table-section__action')
  const columns = getComputedStyle(header).gridTemplateColumns.split(' ').map(Number.parseFloat)

  if (header.getBoundingClientRect().height !== 52) throw new Error('Header must be 52px')
  if (empty.getBoundingClientRect().height !== 32) throw new Error('Empty state must be 32px')
  if (action.getBoundingClientRect().height !== 40) throw new Error('CTA must be 40px')
  if (columns.length !== 6 || columns[0] !== 120 || columns[1] !== 120 || columns.slice(3).some((width) => width !== 120)) {
    throw new Error(`Unexpected column tracks: ${columns.join(', ')}`)
  }
  ```

  이어서 1024px viewport에서 `/products`가 기존 `AdminDataTableSection` 방식으로 비례 축소되고 가로 overflow가 생기지 않는지 확인한다. `/portfolio`도 열어 기존 제목, 8개 헤더, 빈 상태, CTA, 활성 메뉴가 그대로인지 확인한다.

- [x] **Step 7: Figma URL과 변경 범위를 검사한다**

  ```bash
  rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
  git diff --check
  git diff -- apps/admin/src/App.tsx apps/admin/src/pages/ProductPage.tsx
  ```

  Expected: `rg`는 출력 없이 exit code 1, `git diff --check`는 exit code 0이다. source diff는 `ProductPage.tsx` 추가와 `App.tsx` route 변경뿐이다.

- [x] **Step 8: 사용자가 요청한 경우에만 커밋한다**

  ```bash
  git add apps/admin/src/App.tsx apps/admin/src/pages/ProductPage.tsx
  git commit -m "feat(admin): add product list page"
  ```

  Result: 사용자가 커밋을 요청하지 않아 실행하지 않았다.

## Self-Review

- Spec coverage: Figma 노드의 제목, 두 필터, 검색 placeholder, 6개 헤더, 빈 상태, CTA, 컬럼 폭을 모두 Task 1에 고정했다.
- Reuse: 기존 admin header, page wrapper, table component, CSS, SVG glyph를 그대로 사용한다.
- Scope: 브라우저 chrome, footer, 데이터/API, 동작 없는 controls의 기능 구현은 제외했다.
- Type consistency: `ProductRow`, `productRows`, `AdminTableColumn<ProductRow>`, `getRowKey`가 모두 `id: string` 계약을 공유한다.
- Placeholder scan: 구현에 필요한 모든 문구와 수치가 Figma 값으로 고정되었다.
