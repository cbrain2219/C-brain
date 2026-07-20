# 어드민 불편접수 목록 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자 불편접수 폼의 핵심 정보를 `/complaints` 어드민 목록에서 안전하게 훑어볼 수 있는 UI와 향후 조회 데이터 계약을 구현한다.

**Architecture:** 기존 `AdminDataTableSection`과 `PortfolioPage.css`를 그대로 조합하는 페이지 전용 `ComplaintPage`를 추가하고, 현재 placeholder 라우트만 실제 페이지로 교체한다. 접수 저장 API가 아직 없으므로 목록 데이터는 비워 두되, 서버 연동 시 그대로 대체할 수 있도록 `ComplaintRow` 타입과 컬럼 renderer를 페이지 안에 둔다. 긴 접수 내용은 공통 테이블 셀에 CSS ellipsis 한 규칙만 추가해 레이아웃을 보호한다.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Vite 8, 기존 admin CSS, Node 내장 test runner

## Global Constraints

- 첨부 이미지는 사용자용 접수 폼의 필드 구성을 정하는 참고 자료다. 별도의 어드민 시안이 없으므로 외곽 레이아웃과 테이블 치수는 기존 `/portfolio` 어드민 목록을 기준으로 한다.
- 목록에 노출할 폼 필드는 `complaintType`, `service`, `name`, `detail`, `attachments`의 개수다. 서버가 생성할 `id`, `status`, `createdAt`을 목록 read model에 더한다.
- `status` 값은 `received | processing | resolved`, 화면 문구는 `접수 | 처리 중 | 처리 완료`로 고정한다.
- 이메일과 휴대폰 번호는 목록에서 노출하지 않는다. 연락처와 첨부파일 원본은 권한 제어가 가능한 상세 화면에서만 다룬다.
- 인증번호/인증 토큰은 목록 타입에 넣지 않으며 영구 저장하지 않는다. `privacy` 동의값도 목록 컬럼으로 노출하지 않는다.
- 불편접수는 사용자 사이트에서 생성되므로 신규 등록 CTA를 두지 않는다.
- 현재 `ComplaintForm.tsx`는 성공 팝업만 열고 데이터를 저장하지 않는다. 이번 작업은 API, DB, 첨부 저장소, 실제 행 데이터, 상태 변경, 상세 화면을 구현하지 않으며 빈 상태를 정직하게 표시한다.
- 필터와 검색은 현재 공유 테이블과 동일한 표시용 native control로 둔다. 실제 filtering, sorting, pagination은 조회 API가 생길 때 함께 구현한다.
- 샘플 개인정보나 가짜 접수 행을 만들지 않는다.
- 신규 dependency, 이미지, SVG, 아이콘, 페이지 전용 CSS 파일을 추가하지 않는다.
- `design.md`의 Pretendard, `-0.015em` 자간, parent `gap`, `currentColor` 아이콘, form focus 규칙을 유지한다.
- 현재 dirty worktree의 기존 변경을 보존하고 아래 명시된 파일만 수정한다.
- 최종 `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`는 출력 없이 종료해야 한다.

---

## File Structure

- Create: `apps/admin/src/pages/ComplaintPage.tsx` — 목록 read model, 상태 문구, 필터, 검색 문구, 컬럼, 빈 상태를 소유한다.
- Create: `apps/admin/tests/complaintPage.test.mjs` — 목록 컬럼 계약, route 연결, CTA 부재, 긴 내용 ellipsis를 한 번에 검증한다.
- Modify: `apps/admin/src/App.tsx:2-14,88-119` — `/complaints`를 placeholder에서 제외하고 `ComplaintPage`에 연결한다.
- Modify: `apps/admin/src/components/admin-table/AdminDataTableSection.css:221-223` — 사용자 입력이 긴 경우를 위한 한 줄 ellipsis cell utility를 추가한다.
- Reuse unchanged: `apps/admin/src/components/admin-table/AdminDataTableSection.tsx` — 공통 title, filter, search, table, empty state, responsive scaling을 제공한다.
- Reuse unchanged: `apps/admin/src/pages/PortfolioPage.css` — 기존 어드민 목록의 page wrapper를 제공한다.

### Task 1: 불편접수 목록 계약을 실행 가능한 테스트로 고정

**Files:**

- Create: `apps/admin/tests/complaintPage.test.mjs`

**Interfaces:**

- Verifies: `/complaints` → `ComplaintPage`
- Verifies: columns = `처리상태`, `불편 유형`, `이용 서비스`, `접수자`, `접수 내용`, `첨부`, `접수일자`
- Verifies: 신규 등록 CTA 없음
- Verifies: 긴 접수 내용은 공통 ellipsis class 사용

- [x] **Step 1: 실패하는 source contract test를 작성한다**

  `apps/admin/tests/complaintPage.test.mjs`를 다음 내용으로 생성한다.

  ```js
  import assert from 'node:assert/strict'
  import { readFile } from 'node:fs/promises'
  import test from 'node:test'

  const appPath = new URL('../src/App.tsx', import.meta.url)
  const pagePath = new URL('../src/pages/ComplaintPage.tsx', import.meta.url)
  const tableStylesPath = new URL(
    '../src/components/admin-table/AdminDataTableSection.css',
    import.meta.url,
  )

  test('complaint list exposes intake-backed columns without an admin create action', async () => {
    const [appSource, pageSource, tableStylesSource] = await Promise.all([
      readFile(appPath, 'utf8'),
      readFile(pagePath, 'utf8'),
      readFile(tableStylesPath, 'utf8'),
    ])
    const headers = Array.from(
      pageSource.matchAll(/header: '([^']+)'/g),
      (match) => match[1],
    )

    assert.deepEqual(headers, [
      '처리상태',
      '불편 유형',
      '이용 서비스',
      '접수자',
      '접수 내용',
      '첨부',
      '접수일자',
    ])
    assert.match(pageSource, /title="불편접수 현황"/)
    assert.match(pageSource, /emptyMessage="접수된 불편사항이 없습니다\."/)
    assert.match(
      pageSource,
      /placeholder: '접수자 또는 접수 내용으로 검색해주세요\.'/,
    )
    assert.doesNotMatch(pageSource, /bottomAction=/)
    assert.match(
      appSource,
      /import \{ ComplaintPage \} from '\.\/pages\/ComplaintPage'/,
    )
    assert.match(
      appSource,
      /<Route element=\{<ComplaintPage \/>\} path="\/complaints" \/>/,
    )
    assert.match(
      tableStylesSource,
      /\.admin-data-table__summary-cell\s*\{[\s\S]*?overflow:\s*hidden;[\s\S]*?text-overflow:\s*ellipsis;/,
    )
  })
  ```

- [x] **Step 2: 새 테스트가 구현 부재로 실패하는지 확인한다**

  ```bash
  pnpm --filter admin exec node --experimental-strip-types --test tests/complaintPage.test.mjs
  ```

  Expected: `ENOENT`로 `src/pages/ComplaintPage.tsx`를 찾지 못해 FAIL한다.

- [x] **Step 3: 테스트 파일만 커밋하지 않고 Task 2까지 이어서 작업한다**

  Red 상태 자체는 사용자에게 동작하는 단위가 아니므로 별도 커밋을 만들지 않는다.

### Task 2: 기존 공통 테이블로 불편접수 목록 페이지 구현

**Files:**

- Create: `apps/admin/src/pages/ComplaintPage.tsx`
- Modify: `apps/admin/src/components/admin-table/AdminDataTableSection.css:221-223`

**Interfaces:**

- Consumes: `AdminDataTableSection<Row>`, `AdminTableColumn<Row>`, `AdminTableFilter`, `getUserTagOptions`
- Produces: `export function ComplaintPage()`
- Produces: page-local `ComplaintRow` read model with `id`, `status`, `complaintType`, `service`, `name`, `detail`, `attachmentCount`, `createdAt`
- Preserves: 공통 테이블의 layout, filter/search control, empty state, responsive scale

- [x] **Step 1: `ComplaintPage.tsx`에 최소 read model과 빈 data source를 정의한다**

  파일을 아래 내용으로 생성한다. `ComplaintRow`에는 목록에 쓰지 않는 이메일, 휴대폰, 인증정보, 동의값을 넣지 않는다.

  ```tsx
  import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
  import type {
    AdminTableColumn,
    AdminTableFilter,
  } from '../components/admin-table/AdminDataTableSection'
  import { getUserTagOptions } from '../components/admin-table/adminTableFilters'
  import './PortfolioPage.css'

  type ComplaintStatus = 'received' | 'processing' | 'resolved'

  type ComplaintRow = {
    readonly attachmentCount: number
    readonly complaintType: string
    readonly createdAt: string
    readonly detail: string
    readonly id: string
    readonly name: string
    readonly service: string
    readonly status: ComplaintStatus
  }

  const complaintRows: readonly ComplaintRow[] = []

  const complaintStatusLabels = {
    processing: '처리 중',
    received: '접수',
    resolved: '처리 완료',
  } as const satisfies Record<ComplaintStatus, string>

  const complaintFilters = [
    {
      id: 'status',
      label: '처리상태',
      options: ['전체', '접수', '처리 중', '처리 완료'],
    },
    {
      id: 'type',
      label: '불편 유형',
      options: [
        '전체',
        ...getUserTagOptions(complaintRows.map((row) => row.complaintType)),
      ],
    },
  ] satisfies readonly AdminTableFilter[]
  ```

- [x] **Step 2: 상태와 7개 컬럼 renderer를 같은 파일에 추가한다**

  컬럼 track 합은 공통 테이블의 1376px 기준 폭과 같은 `120 + 180 + 200 + 120 + 536 + 100 + 120`이다. 상태 색상은 새 의미색을 발명하지 않고 기존 brand status 표현을 재사용한다.

  ```tsx
  function renderComplaintStatus(row: ComplaintRow) {
    return (
      <span className="admin-data-table__status">
        <span className="admin-data-table__status-dot" />
        <span>{complaintStatusLabels[row.status]}</span>
      </span>
    )
  }

  const complaintColumns = [
    {
      header: '처리상태',
      id: 'status',
      renderCell: renderComplaintStatus,
      track: '120fr',
    },
    {
      header: '불편 유형',
      id: 'complaintType',
      renderCell: (row) => row.complaintType,
      track: '180fr',
    },
    {
      header: '이용 서비스',
      id: 'service',
      renderCell: (row) => row.service,
      track: '200fr',
    },
    {
      header: '접수자',
      id: 'name',
      renderCell: (row) => row.name,
      track: '120fr',
    },
    {
      header: '접수 내용',
      id: 'detail',
      renderCell: (row) => (
        <span className="admin-data-table__summary-cell" title={row.detail}>
          {row.detail}
        </span>
      ),
      track: '536fr',
    },
    {
      header: '첨부',
      id: 'attachments',
      renderCell: (row) =>
        row.attachmentCount > 0 ? `${row.attachmentCount}개` : '-',
      track: '100fr',
    },
    {
      header: '접수일자',
      id: 'createdAt',
      renderCell: (row) => row.createdAt,
      track: '120fr',
    },
  ] satisfies readonly AdminTableColumn<ComplaintRow>[]
  ```

- [x] **Step 3: CTA 없는 목록 shell과 빈 상태를 렌더링한다**

  같은 파일 아래에 다음 export를 추가한다.

  ```tsx
  export function ComplaintPage() {
    return (
      <main className="portfolio-page" aria-label="불편접수 관리">
        <AdminDataTableSection
          columns={complaintColumns}
          emptyMessage="접수된 불편사항이 없습니다."
          filters={complaintFilters}
          getRowKey={(row) => row.id}
          rows={complaintRows}
          search={{
            label: '검색',
            placeholder: '접수자 또는 접수 내용으로 검색해주세요.',
          }}
          title="불편접수 현황"
        />
      </main>
    )
  }
  ```

- [x] **Step 4: 긴 사용자 입력이 다른 컬럼을 침범하지 않도록 native ellipsis를 추가한다**

  `apps/admin/src/components/admin-table/AdminDataTableSection.css`의 `.admin-data-table__title-cell` 인접 위치에 아래 규칙을 추가한다.

  ```css
  .admin-data-table__summary-cell {
    width: 100%;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  ```

  `white-space: nowrap`은 부모 `.admin-data-table__cell`에서 상속되므로 중복 선언하지 않는다. 전체 원문은 DOM과 `title`에 남는다.

- [x] **Step 5: build를 실행해 page-local 타입과 JSX를 검증한다**

  ```bash
  pnpm --filter admin build
  ```

  Expected: exit code 0. 새 dependency나 설정 변경은 없다.

### Task 3: `/complaints` route 연결과 회귀 검증

**Files:**

- Modify: `apps/admin/src/App.tsx:2-14,88-119`
- Verify: `apps/admin/src/components/AdminHeader.tsx`
- Verify: `apps/admin/src/pages/ComplaintPage.tsx`
- Test: `apps/admin/tests/complaintPage.test.mjs`

**Interfaces:**

- Produces: `/complaints` → `<ComplaintPage />`
- Preserves: 다른 실제 page route와 placeholder route
- Preserves: 기존 header의 `불편접수` active navigation

- [x] **Step 1: `ComplaintPage`를 import하고 placeholder 대상에서 제외한다**

  `apps/admin/src/App.tsx`의 page import에 다음 한 줄을 추가한다.

  ```tsx
  import { ComplaintPage } from './pages/ComplaintPage'
  ```

  `placeholderPages` 조건에 다음 비교를 추가한다.

  ```tsx
  page.path !== '/complaints'
  ```

  기존 `/products`, `/portfolio`, `/blog`, `/reviews`, `/notices` 제외 조건은 그대로 보존한다.

- [x] **Step 2: 실제 route를 placeholder map보다 앞에 추가한다**

  기존 content page route들과 함께 다음 한 줄을 추가한다.

  ```tsx
  <Route element={<ComplaintPage />} path="/complaints" />
  ```

- [x] **Step 3: contract test와 admin 전체 검사를 통과시킨다**

  ```bash
  pnpm --filter admin test
  pnpm --filter admin lint
  pnpm --filter admin build
  ```

  Expected: 모든 명령이 exit code 0이고 `complaintPage.test.mjs`가 PASS한다.

- [x] **Step 4: 1440px viewport에서 목록 DOM과 치수를 확인한다**

  ```bash
  pnpm --filter admin dev --host 127.0.0.1
  ```

  브라우저에서 `http://127.0.0.1:5173/complaints`를 열고 다음을 실행한다.

  ```js
  const expectedHeaders = [
    '처리상태',
    '불편 유형',
    '이용 서비스',
    '접수자',
    '접수 내용',
    '첨부',
    '접수일자',
  ]
  const headers = Array.from(
    document.querySelectorAll('[role="columnheader"]'),
    (node) => node.textContent?.trim(),
  )
  const bodyText = document.body.innerText
  const activeMenu = document.querySelector('.admin-header__menu-link--active')
  const action = document.querySelector('.admin-data-table-section__action')

  if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
    throw new Error(`Unexpected headers: ${JSON.stringify(headers)}`)
  }
  for (const text of [
    '불편접수 현황',
    '처리상태',
    '불편 유형',
    '접수된 불편사항이 없습니다.',
  ]) {
    if (!bodyText.includes(text)) throw new Error(`Missing list copy: ${text}`)
  }
  if (activeMenu?.textContent?.trim() !== '불편접수') {
    throw new Error('Complaint navigation is not active')
  }
  if (action) throw new Error('Complaint intake must not expose an admin create action')
  ```

  Expected: 오류 없이 끝난다. table header는 52px, empty badge는 32px이며 `/portfolio`와 동일한 바깥 padding과 반응형 scale을 사용한다.

- [x] **Step 5: 작은 viewport와 기존 목록 회귀를 확인한다**

  1024px viewport에서 `/complaints`가 공통 `AdminDataTableSection` 방식으로 비례 축소되고 문서 가로 overflow를 만들지 않는지 확인한다. 이어서 `/products`와 `/portfolio`를 열어 기존 title, filter, header, empty state/row, CTA가 그대로인지 확인한다.

- [x] **Step 6: Figma URL, whitespace, 변경 범위를 최종 검사한다**

  ```bash
  rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
  git diff --check
  git diff -- apps/admin/src/App.tsx apps/admin/src/components/admin-table/AdminDataTableSection.css apps/admin/src/pages/ComplaintPage.tsx apps/admin/tests/complaintPage.test.mjs
  ```

  Expected: `rg`는 출력 없이 exit code 1, `git diff --check`는 exit code 0이다. source diff는 계획의 네 파일만 포함한다.

- [ ] **Step 7: 사용자가 요청한 경우에만 커밋한다**

  ```bash
  git add apps/admin/src/App.tsx apps/admin/src/components/admin-table/AdminDataTableSection.css apps/admin/src/pages/ComplaintPage.tsx apps/admin/tests/complaintPage.test.mjs docs/superpowers/plans/2026-07-20-admin-complaint-list.md
  git commit -m "feat(admin): add complaint list page"
  ```

## Follow-up Boundary

실제 접수 데이터가 보이려면 별도 서버 연동 계획이 필요하다. 그 계획은 사용자 폼의 `multipart/form-data` 제출, 서버 검증, 첨부 저장소, `complaintId`/`createdAt` 생성, 어드민 인증·권한, 목록 조회 API, 상세 조회 API, 상태 변경 audit를 함께 다뤄야 한다. 이 UI 계획에 임시 `localStorage`나 가짜 API를 넣지 않는다.

## Self-Review

- Spec coverage: 이미지의 이름, 이용 서비스, 불편 유형, 상세 내용, 첨부를 목록 컬럼에 매핑했고 서버 메타데이터인 상태와 접수일자를 구분했다.
- Privacy: 이메일, 휴대폰, 인증번호/토큰, 개인정보 동의값, 첨부 원본을 목록 read model에서 제외했다.
- Reuse: 기존 admin header, page wrapper, table, typography, color token, filter/search control을 재사용하며 신규 dependency와 asset이 없다.
- Type consistency: `ComplaintStatus` 세 값과 `complaintStatusLabels`의 key가 `Record<ComplaintStatus, string>`으로 일치한다.
- Empty state honesty: 현재 저장 경로가 없으므로 fixture를 만들지 않고 빈 목록을 표시한다.
- Scope: 실제 filtering/search, API/DB, 상세 화면, 상태 변경, 첨부 다운로드는 별도 계획으로 남긴다.
- Placeholder scan: 구현에 필요한 경로, 타입, 문구, 컬럼 폭, 명령과 예상 결과가 모두 구체적으로 명시되어 있으며 `TBD`나 `TODO`가 없다.
