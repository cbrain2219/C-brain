# 어드민 콘텐츠 테이블 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Figma의 블로그, 고객 인터뷰 · 후기, 공지사항 테이블을 기존 포트폴리오 어드민 레이아웃과 같은 구조로 /blog, /reviews, /notices에 구현한다.

**Architecture:** 기존 AdminDataTableSection을 세 페이지가 그대로 사용하고, 페이지 파일은 Figma별 fixture, 컬럼, 필터, 검색 문구, CTA만 선언한다. 세 페이지에서 반복되는 상태·게시 여부 표현은 작은 공유 cell helper로 모은다. 행 배경은 상태와 무관하게 기본 흰색이며 기존 hover CSS만 사용한다.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite 8, 기존 admin CSS

## Global Constraints

- 인터뷰 · 후기 기준은 Figma 노드 332:2741이다.
- 공지사항 기준은 Figma 노드 455:2643이다.
- 블로그 기준은 Figma 노드 232:4988이다.
- 세 노드의 원본 크기는 모두 1360 × 590이며, 기존 포트폴리오의 26px topbar, 20px gap, 52px header/row, 8px row gap 구조를 그대로 쓴다.
- design.md의 Pretendard, currentColor, gap 기반 간격 규칙을 유지한다.
- 현재 작업 트리의 ProductPage.tsx, App.tsx, PortfolioPage.tsx, AdminDataTableSection.tsx, AdminDataTableSection.css 변경을 보존한다.
- Figma에 표시된 공통 제목 “블로그 등록 현황”과 검색 placeholder “블로그 제목으로 검색해주세요.”는 인터뷰 · 후기와 공지사항 화면에서도 임의 교정하지 않는다.
- 필터 dropdown, 검색 실행, 정렬, 페이지네이션, API/Supabase 연동은 범위 밖이다.
- 신규 이미지나 아이콘 asset은 없다. 기존 ChevronDownIcon, SearchIcon, PackageIcon과 CSS separator를 재사용한다.
- Figma MCP asset URL은 source에 남기지 않는다.
- 최종 rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages는 출력 없이 종료해야 한다.

---

## File Structure

- Reuse: apps/admin/src/components/admin-table/AdminDataTableSection.tsx — 모든 행에 동일한 기본 class를 제공한다.
- Modify: apps/admin/src/components/admin-table/AdminDataTableSection.css — hover 중인 행에만 gray-50 배경을 적용한다.
- Create: apps/admin/src/components/admin-table/AdminContentTableCells.tsx — 게시 상태, 노출 상태, 고정 상태의 공통 cell renderer를 제공한다.
- Create: apps/admin/src/pages/BlogPage.tsx — 블로그 fixture와 9개 컬럼을 소유한다.
- Create: apps/admin/src/pages/ReviewPage.tsx — 인터뷰 · 후기 fixture와 7개 컬럼을 소유한다.
- Create: apps/admin/src/pages/NoticePage.tsx — 공지사항 fixture와 6개 컬럼을 소유한다.
- Modify: apps/admin/src/App.tsx — /blog, /reviews, /notices를 실제 페이지에 연결한다.
- Reuse unchanged: apps/admin/src/pages/PortfolioPage.css — 포트폴리오와 동일한 page wrapper를 제공한다.

### Task 1: 공통 테이블의 hover 전용 행 배경 유지

**Files:**

- Modify: apps/admin/src/components/admin-table/AdminDataTableSection.tsx
- Modify: apps/admin/src/components/admin-table/AdminDataTableSection.css

**Interfaces:**

- Preserves: 모든 행 wrapper는 admin-data-table__row class만 사용한다.
- Produces: hover 중인 행만 gray-50 배경을 사용한다.
- Removes: 상태 기반 row variant와 filled modifier.

- [x] **Step 1: 상태 기반 row variant 타입과 prop을 제거한다**

  AdminDataTableSection은 getRowVariant를 받지 않고 각 행에 admin-data-table__row만 렌더링한다.

- [x] **Step 2: 페이지별 row variant 설정을 제거한다**

  BlogPage, ReviewPage, NoticePage는 getRowVariant prop을 전달하지 않는다.

- [x] **Step 3: hover 중에만 배경색을 적용한다**

    .admin-data-table__row:hover {
      background: var(--admin-gray-50);
    }

- [x] **Step 4: lint와 build로 공통 컴포넌트 회귀를 확인한다**

  Run:

  pnpm --filter admin lint
  pnpm --filter admin build

  Expected: 두 명령 모두 exit code 0.

### Task 2: 공통 콘텐츠 cell renderer와 세 페이지 구현

**Files:**

- Create: apps/admin/src/components/admin-table/AdminContentTableCells.tsx
- Create: apps/admin/src/pages/BlogPage.tsx
- Create: apps/admin/src/pages/ReviewPage.tsx
- Create: apps/admin/src/pages/NoticePage.tsx

**Interfaces:**

- Produces: AdminContentStatus = 'draft' | 'published'
- Produces: AdminPublicationState = 'none' | 'published'
- Produces: AdminPinnedState = 'none' | 'pinned'
- Produces: renderAdminContentStatus, renderAdminPublicationState, renderAdminPinnedState
- Produces: BlogPage, ReviewPage, NoticePage

- [x] **Step 1: 공통 cell renderer를 작성한다**

  AdminContentTableCells.tsx는 다음 규칙을 구현한다.

  export type AdminContentStatus = 'draft' | 'published'
  export type AdminPublicationState = 'none' | 'published'
  export type AdminPinnedState = 'none' | 'pinned'

  export function renderAdminContentStatus(status: AdminContentStatus) {
  const className =
  status === 'draft'
  ? 'admin-data-table**status admin-data-table**status--draft'
  : 'admin-data-table\_\_status'
  const label = status === 'draft' ? '임시저장' : '게시됨'

      return (
        <span className={className}>
          <span className="admin-data-table__status-dot" />
          <span>{label}</span>
        </span>
      )

  }

  export function renderAdminPublicationState(state: AdminPublicationState) {
  return state === 'published' ? (
  <span className="admin-data-table__brand-text">게시됨</span>
  ) : (
  <span>-</span>
  )
  }

  export function renderAdminPinnedState(state: AdminPinnedState) {
  return state === 'pinned' ? (
  <span className="admin-data-table__brand-text">고정됨</span>
  ) : (
  <span>-</span>
  )
  }

- [x] **Step 2: BlogPage fixture와 9개 컬럼을 작성한다**

  공통 filter는 유형 필터 전체, 상태 필터 전체다. title은 블로그 등록 현황, search placeholder는 블로그 제목으로 검색해주세요.다. 컬럼과 track은 다음 순서다.

  | id        | header      | track |
  | --------- | ----------- | ----- |
  | status    | 상태        | 120fr |
  | type      | 유형        | 160fr |
  | title     | 블로그 제목 | 360fr |
  | views     | 조회수      | 120fr |
  | landing   | 랜딩        | 120fr |
  | banner    | 배너        | 120fr |
  | popular   | 인기        | 120fr |
  | createdAt | 등록일자    | 120fr |
  | detail    | 상세        | 120fr |

  fixture는 아래 8행을 이 순서로 사용한다.

  | status    | type        | title                                                | views | landing   | banner    | popular   |
  | --------- | ----------- | ---------------------------------------------------- | ----- | --------- | --------- | --------- |
  | draft     | 브로슈어    | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | 24    | published | none      | published |
  | published | 인쇄 가이드 | 카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준        | 124   | none      | published | published |
  | published | 브로슈어    | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | 34    | none      | none      | none      |
  | published | 인쇄 가이드 | 카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준        | 65    | none      | none      | published |
  | published | 브로슈어    | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | 256   | none      | published | published |
  | published | 브로슈어    | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | 2     | published | none      | none      |
  | published | 인쇄 가이드 | 카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준        | 0     | none      | zero      | none      |
  | published | 브로슈어    | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | 556   | published | published | published |

  zero는 Figma 원문대로 배너 cell에 숫자 0을 렌더링한다. 일자는 모두 26. 03. 16이고 상세 link는 /blog/{id}다. CTA는 /blog/new, 신규 블로그 등록이다.

- [x] **Step 3: ReviewPage fixture와 7개 컬럼을 작성한다**

  title, filter, search는 Figma 원문 공통값을 쓴다. 컬럼과 track은 상태 120fr, 유형 160fr, 인터뷰 · 후기 제목 600fr, 조회수 120fr, 랜딩 120fr, 등록일자 120fr, 상세 120fr이다.

  fixture는 아래 8행을 이 순서로 사용한다.

  | status    | type   | title                                                | views | landing   |
  | --------- | ------ | ---------------------------------------------------- | ----- | --------- |
  | draft     | 인터뷰 | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | 24    | published |
  | published | 인터뷰 | 카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준        | 124   | none      |
  | published | 인터뷰 | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | 34    | none      |
  | published | 인터뷰 | 카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준        | 65    | none      |
  | published | 인터뷰 | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | 256   | none      |
  | published | 후기   | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | 2     | published |
  | published | 후기   | 카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준        | 0     | none      |
  | published | 후기   | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | 556   | published |

  일자는 모두 26. 03. 16이고 상세 link는 /reviews/{id}다. CTA는 /reviews/new, 신규 인터뷰 · 후기 등록이다.

- [x] **Step 4: NoticePage fixture와 6개 컬럼을 작성한다**

  title, filter, search는 Figma 원문 공통값을 쓴다. 컬럼과 track은 상태 120fr, 유형 160fr, 인터뷰 · 후기 제목 720fr, 상단고정 120fr, 등록일자 120fr, 상세 120fr이다.

  fixture는 아래 8행을 이 순서로 사용한다.

  | status    | type      | title                                                | pinned |
  | --------- | --------- | ---------------------------------------------------- | ------ |
  | draft     | 공지      | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | pinned |
  | published | 이벤트    | 카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준        | none   |
  | published | 이벤트    | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | none   |
  | published | 휴무 안내 | 카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준        | none   |
  | published | 공지      | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | none   |
  | published | 공지      | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | pinned |
  | published | 공지      | 카탈로그 인쇄, 코팅 종류별 차이점과 선택 기준        | none   |
  | published | 공지      | 브로슈어 제작 전 반드시 확인해야 할 5가지 체크리스트 | pinned |

  일자는 모두 26. 03. 16이고 상세 link는 /notices/{id}다. CTA는 /notices/new, 신규 공지사항 등록이다.

- [x] **Step 5: 각 page wrapper를 포트폴리오와 동일하게 연결한다**

  각 페이지는 PortfolioPage.css를 import하고 다음 구조를 사용한다.

    <main className="portfolio-page" aria-label="페이지별 관리 이름">
      <AdminDataTableSection
        bottomAction={페이지별 CTA}
        columns={페이지별 columns}
        filters={공통 filters}
        getRowKey={(row) => row.id}
        rows={페이지별 rows}
        search={{ label: '검색', placeholder: '블로그 제목으로 검색해주세요.' }}
        title="블로그 등록 현황"
      />
    </main>

- [x] **Step 6: lint와 build를 통과시킨다**

  Run:

  pnpm --filter admin lint
  pnpm --filter admin build

  Expected: 두 명령 모두 exit code 0.

### Task 3: 라우트 연결과 Figma 검증

**Files:**

- Modify: apps/admin/src/App.tsx
- Verify: apps/admin/src/pages/BlogPage.tsx
- Verify: apps/admin/src/pages/ReviewPage.tsx
- Verify: apps/admin/src/pages/NoticePage.tsx

**Interfaces:**

- Produces: /blog → BlogPage
- Produces: /reviews → ReviewPage
- Produces: /notices → NoticePage
- Preserves: /products → ProductPage, /portfolio → PortfolioPage, 나머지 placeholder

- [x] **Step 1: 세 page import와 route를 추가한다**

  import { BlogPage } from './pages/BlogPage'
  import { NoticePage } from './pages/NoticePage'
  import { ReviewPage } from './pages/ReviewPage'

  placeholder filter에서 /blog, /reviews, /notices를 제외하고 Routes에 각각 실제 page element를 추가한다.

- [x] **Step 2: 1440px viewport에서 DOM과 치수를 확인한다**

  각 route에서 title, 두 filter, search placeholder, 8개 row, active menu를 확인한다. header와 row는 52px, row gap은 8px이어야 한다. hover 전에는 모든 행이 흰색이고 hover 중인 행만 gray-50이어야 한다.

  Expected headers:
  - /blog: 상태, 유형, 블로그 제목, 조회수, 랜딩, 배너, 인기, 등록일자, 상세
  - /reviews: 상태, 유형, 인터뷰 · 후기 제목, 조회수, 랜딩, 등록일자, 상세
  - /notices: 상태, 유형, 인터뷰 · 후기 제목, 상단고정, 등록일자, 상세

- [x] **Step 3: Figma screenshot과 실화면을 비교한다**

  1360px table content 영역에서 세 Figma 노드와 행 간격, 컬럼 비율, typography, 색을 비교한다. 첫 행의 회색은 hover 예시로 해석하며 정적 상태로 구현하지 않는다. 페이지 shell과 CTA는 사용자 요구대로 기존 포트폴리오 구현을 기준으로 한다.

- [x] **Step 4: 최종 정적 검사를 실행한다**

  Run:

  pnpm --filter admin lint
  pnpm --filter admin build
  rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
  git diff --check

  Expected: lint/build/diff check는 exit code 0, Figma URL scan은 출력 없이 exit code 1.

- [ ] **Step 5: 사용자가 요청한 경우에만 커밋한다**

  git add apps/admin/src/App.tsx apps/admin/src/components/admin-table apps/admin/src/pages/BlogPage.tsx apps/admin/src/pages/ReviewPage.tsx apps/admin/src/pages/NoticePage.tsx docs/superpowers/plans/2026-07-20-admin-content-tables.md
  git commit -m "feat(admin): add content table pages"

## Self-Review

- Spec coverage: 세 Figma 노드의 title, filters, search, column headers, column ratios, 8개 fixture row를 구현하고 행 배경은 hover 중에만 표시한다.
- Reuse: admin header, page wrapper, shared table, icon, typography, color token을 새로 만들지 않고 재사용한다.
- Existing changes: ProductPage와 포트폴리오 빈 상태 변경을 보존하며 상태 기반 row variant를 추가하지 않는다.
- Type consistency: 모든 fixture의 status, publication, pinned 값은 공유 union type과 renderer를 사용한다.
- Scope: filter/search 기능, API, pagination, editor/detail page는 추가하지 않는다.
- Placeholder scan: 구현에 필요한 문구, 수치, route, fixture가 모두 명시되어 있다.
