# 어드민 불편접수 상세 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민 목록에서 fixture 불편접수 한 건의 연락처, 접수 정보, 상세 내용, 첨부 메타데이터를 `/complaints/:complaintId`에서 확인한다.

**Architecture:** `complaintData.ts`가 목록과 상세가 함께 쓰는 fixture 및 조회 함수를 소유하고, `ComplaintPage`는 개인정보를 제외한 열만 투영한다. `ComplaintDetailPage`는 route id로 fixture를 조회해 읽기 전용 섹션을 렌더링하고, 알 수 없는 id에는 목록 복귀가 가능한 not-found 상태를 보여준다.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Vite 8, 기존 admin CSS, Node 내장 test runner

## Global Constraints

- 상세 화면은 사용자 사이트가 아니라 `apps/admin`의 `/complaints/:complaintId` route다.
- 관리자 상세에 이름, 이메일, 휴대폰, 휴대폰 인증 여부, 개인정보 동의 시각, 서비스, 불편 유형, 접수일자, 상세 내용, 첨부 파일명/크기를 표시한다.
- 인증번호나 인증 토큰은 fixture와 UI 어디에도 넣지 않는다.
- 실제 API, DB, 파일 다운로드 URL, 답변 작성, 처리상태 변경은 범위 밖이다.
- 백엔드가 없으므로 `complaint-20260720-001` 한 건만 명시적인 fixture로 제공한다.
- 목록에는 fixture 연락처를 표시하지 않고 `ComplaintRow`로 필요한 값만 투영한다.
- 신규 dependency, icon, image asset은 추가하지 않는다.
- `design.md`의 Pretendard, parent `gap`, form focus, currentColor 규칙과 현재 dirty worktree 변경을 보존한다.
- 최종 Figma URL scan은 출력 없이 종료해야 한다.

---

## File Structure

- Create: `apps/admin/src/pages/complaintData.ts` — fixture, 상태 label, id 조회 함수를 제공한다.
- Modify: `apps/admin/src/pages/ComplaintPage.tsx` — fixture를 목록 row로 투영하고 `상세` 링크 열을 추가한다.
- Create: `apps/admin/src/pages/ComplaintDetailPage.tsx` — admin 상세 및 not-found 상태를 렌더링한다.
- Create: `apps/admin/src/pages/ComplaintDetailPage.css` — 960px 상세 레이아웃과 responsive grid를 정의한다.
- Modify: `apps/admin/src/App.tsx` — `/complaints/:complaintId`를 상세 페이지에 연결한다.
- Modify: `apps/admin/tests/complaintPage.test.mjs` — fixture 조회, 상세 route, 필수 section, 목록 링크를 검증한다.

### Task 1: 상세 페이지 계약 테스트 추가

**Files:**

- Modify: `apps/admin/tests/complaintPage.test.mjs`

**Interfaces:**

- Consumes: `complaintRecords`, `getComplaintRecord`
- Verifies: `/complaints/:complaintId` route와 상세 필수 문구
- Verifies: 목록의 마지막 열 `상세`

- [x] **Step 1: fixture와 상세 source contract test를 추가한다**

  테스트 상단에 다음 import와 path를 추가한다.

  ```js
  import {
    complaintRecords,
    getComplaintRecord,
  } from '../src/pages/complaintData.ts'

  const detailPagePath = new URL('../src/pages/ComplaintDetailPage.tsx', import.meta.url)
  const detailStylesPath = new URL('../src/pages/ComplaintDetailPage.css', import.meta.url)
  ```

  기존 header 기대값 끝에 `상세`를 추가하고 아래 두 test를 추가한다.

  ```js
  test('complaint fixture supports list and detail lookup', () => {
    const complaint = complaintRecords[0]

    assert.equal(complaint.id, 'complaint-20260720-001')
    assert.equal(complaint.attachments.length, 2)
    assert.equal(getComplaintRecord(complaint.id), complaint)
    assert.equal(getComplaintRecord('missing'), undefined)
  })

  test('complaint detail exposes admin-only intake information', async () => {
    const [appSource, detailSource, detailStyles] = await Promise.all([
      readFile(appPath, 'utf8'),
      readFile(detailPagePath, 'utf8'),
      readFile(detailStylesPath, 'utf8'),
    ])

    assert.match(appSource, /path="\/complaints\/:complaintId"/)
    for (const text of [
      '불편접수 상세',
      '접수 정보',
      '접수자 정보',
      '상세 내용',
      '첨부 파일',
      '휴대폰 인증',
      '개인정보 동의',
      '목록으로',
    ]) {
      assert.match(detailSource, new RegExp(text))
    }
    assert.match(detailStyles, /\.complaint-detail__definition-grid/)
    assert.match(detailStyles, /@media \(max-width: 720px\)/)
  })
  ```

- [x] **Step 2: 새 계약이 구현 부재로 실패하는지 확인한다**

  ```bash
  pnpm --filter admin exec node --experimental-strip-types --test tests/complaintPage.test.mjs
  ```

  Expected: `complaintData.ts` 또는 `ComplaintDetailPage.tsx` 부재로 FAIL한다.

### Task 2: 공유 fixture와 목록 상세 링크 구현

**Files:**

- Create: `apps/admin/src/pages/complaintData.ts`
- Modify: `apps/admin/src/pages/ComplaintPage.tsx`

**Interfaces:**

- Produces: `ComplaintStatus`, `ComplaintAttachment`, `ComplaintRecord`
- Produces: `complaintRecords`, `complaintStatusLabels`, `getComplaintRecord(id)`
- Produces: 목록 `/complaints/complaint-20260720-001` 상세 링크

- [x] **Step 1: 공유 fixture와 id 조회 함수를 작성한다**

  `complaintData.ts`는 다음 shape를 사용한다.

  ```ts
  export type ComplaintStatus = 'received' | 'processing' | 'resolved'

  export type ComplaintAttachment = {
    readonly id: string
    readonly name: string
    readonly sizeLabel: string
  }

  export type ComplaintRecord = {
    readonly attachments: readonly ComplaintAttachment[]
    readonly complaintType: string
    readonly createdAt: string
    readonly detail: string
    readonly email: string
    readonly id: string
    readonly name: string
    readonly phone: string
    readonly phoneVerified: boolean
    readonly privacyAgreedAt: string
    readonly service: string
    readonly status: ComplaintStatus
  }

  export const complaintStatusLabels = {
    processing: '처리 중',
    received: '접수',
    resolved: '처리 완료',
  } as const satisfies Record<ComplaintStatus, string>

  export const complaintRecords: readonly ComplaintRecord[] = [
    {
      attachments: [
        { id: 'attachment-01', name: '불만 접수 내역 01.png', sizeLabel: '12MB' },
        { id: 'attachment-02', name: '불만 접수 내역 02.png', sizeLabel: '12MB' },
      ],
      complaintType: '결과물의 결함',
      createdAt: '26. 07. 20 14:30',
      detail: '수령한 브로슈어 일부에서 인쇄 번짐과 재단 오차가 확인됩니다. 첨부한 사진을 확인한 뒤 재제작 가능 여부를 안내해주세요.',
      email: 'customer@example.com',
      id: 'complaint-20260720-001',
      name: '김고객',
      phone: '010-1234-5678',
      phoneVerified: true,
      privacyAgreedAt: '26. 07. 20 14:28',
      service: '브로슈어 · 카탈로그',
      status: 'received',
    },
  ]

  export function getComplaintRecord(id: string | undefined) {
    return complaintRecords.find((complaint) => complaint.id === id)
  }
  ```

- [x] **Step 2: 목록이 fixture를 개인정보 없는 row로 투영하도록 수정한다**

  `ComplaintPage.tsx`에서 local status 타입/label을 제거하고 fixture를 import한다. `ComplaintRow`에 `detailHref`를 더하고 `complaintRows`는 다음 map으로 만든다.

  ```tsx
  const complaintRows: readonly ComplaintRow[] = complaintRecords.map((complaint) => ({
    attachmentCount: complaint.attachments.length,
    complaintType: complaint.complaintType,
    createdAt: complaint.createdAt,
    detail: complaint.detail,
    detailHref: `/complaints/${complaint.id}`,
    id: complaint.id,
    name: complaint.name,
    service: complaint.service,
    status: complaint.status,
  }))
  ```

- [x] **Step 3: 접수 내용 폭을 456fr로 줄이고 80fr 상세 열을 추가한다**

  ```tsx
  {
    header: '상세',
    id: 'detailLink',
    renderCell: (row) => (
      <a className="admin-data-table__link" href={row.detailHref}>
        상세
      </a>
    ),
    track: '80fr',
  }
  ```

  전체 track 합은 계속 1376이다.

### Task 3: 어드민 상세 화면과 route 구현

**Files:**

- Create: `apps/admin/src/pages/ComplaintDetailPage.tsx`
- Create: `apps/admin/src/pages/ComplaintDetailPage.css`
- Modify: `apps/admin/src/App.tsx`

**Interfaces:**

- Consumes: `getComplaintRecord`, `complaintStatusLabels`
- Produces: `export function ComplaintDetailPage()`
- Produces: `/complaints/:complaintId` route

- [x] **Step 1: route id 조회, not-found, 읽기 전용 상세 section을 구현한다**

  `ComplaintDetailPage.tsx`를 다음 내용으로 생성한다.

  ```tsx
  import { Link, useParams } from 'react-router-dom'
  import '../components/admin-form/AdminFormLayout.css'
  import {
    complaintStatusLabels,
    getComplaintRecord,
  } from './complaintData'
  import './ComplaintDetailPage.css'

  type DetailFieldProps = {
    readonly label: string
    readonly value: string
  }

  function DetailField({ label, value }: DetailFieldProps) {
    return (
      <div className="complaint-detail__field">
        <dt className="complaint-detail__term pretendard-medium-14">{label}</dt>
        <dd className="complaint-detail__value pretendard-medium-16">{value}</dd>
      </div>
    )
  }

  export function ComplaintDetailPage() {
    const { complaintId } = useParams<{ complaintId: string }>()
    const complaint = getComplaintRecord(complaintId)

    if (!complaint) {
      return (
        <main className="complaint-detail-page" aria-labelledby="complaint-detail-title">
          <section className="complaint-detail complaint-detail--empty">
            <h1 className="complaint-detail__title pretendard-bold-18" id="complaint-detail-title">
              불편접수 상세
            </h1>
            <p className="complaint-detail__empty-copy pretendard-medium-16">
              접수 내역을 찾을 수 없습니다.
            </p>
            <Link className="admin-form__button admin-form__button--outline" to="/complaints">
              목록으로
            </Link>
          </section>
        </main>
      )
    }

    return (
      <main className="complaint-detail-page" aria-labelledby="complaint-detail-title">
        <article className="complaint-detail">
          <header className="complaint-detail__header">
            <div className="complaint-detail__heading">
              <h1 className="complaint-detail__title pretendard-bold-18" id="complaint-detail-title">
                불편접수 상세
              </h1>
              <span className="admin-data-table__status pretendard-medium-14">
                <span className="admin-data-table__status-dot" />
                <span>{complaintStatusLabels[complaint.status]}</span>
              </span>
            </div>
            <Link className="admin-form__button admin-form__button--outline" to="/complaints">
              목록으로
            </Link>
          </header>

          <section className="complaint-detail__section" aria-labelledby="complaint-intake-title">
            <h2 className="complaint-detail__section-title pretendard-bold-16" id="complaint-intake-title">
              접수 정보
            </h2>
            <dl className="complaint-detail__definition-grid">
              <DetailField label="접수번호" value={complaint.id} />
              <DetailField label="접수일자" value={complaint.createdAt} />
              <DetailField label="이용 서비스" value={complaint.service} />
              <DetailField label="불편 유형" value={complaint.complaintType} />
            </dl>
          </section>

          <section className="complaint-detail__section" aria-labelledby="complaint-customer-title">
            <h2 className="complaint-detail__section-title pretendard-bold-16" id="complaint-customer-title">
              접수자 정보
            </h2>
            <dl className="complaint-detail__definition-grid">
              <DetailField label="이름" value={complaint.name} />
              <DetailField label="이메일" value={complaint.email} />
              <DetailField label="휴대폰 번호" value={complaint.phone} />
              <DetailField label="휴대폰 인증" value={complaint.phoneVerified ? '인증 완료' : '미인증'} />
              <DetailField label="개인정보 동의" value={complaint.privacyAgreedAt} />
            </dl>
          </section>

          <section className="complaint-detail__section" aria-labelledby="complaint-content-title">
            <h2 className="complaint-detail__section-title pretendard-bold-16" id="complaint-content-title">
              상세 내용
            </h2>
            <p className="complaint-detail__content pretendard-medium-16">{complaint.detail}</p>
          </section>

          <section className="complaint-detail__section" aria-labelledby="complaint-attachments-title">
            <h2 className="complaint-detail__section-title pretendard-bold-16" id="complaint-attachments-title">
              첨부 파일
            </h2>
            <ul className="complaint-detail__attachment-list">
              {complaint.attachments.map((attachment) => (
                <li className="complaint-detail__attachment" key={attachment.id}>
                  <span className="complaint-detail__attachment-name pretendard-medium-14">
                    {attachment.name}
                  </span>
                  <span className="complaint-detail__attachment-size pretendard-medium-12">
                    {attachment.sizeLabel}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </main>
    )
  }
  ```

- [x] **Step 2: 기존 어드민 규칙에 맞는 responsive CSS를 작성한다**

  `ComplaintDetailPage.css`를 다음 내용으로 생성한다.

  ```css
  .complaint-detail-page {
    width: 100%;
    min-height: calc(100svh - 80px);
    padding: 52px 40px 104px;
    border-top: 1px solid #f1f5f9;
    background: var(--admin-surface);
    color: var(--admin-gray-800);
    display: flex;
    justify-content: center;
  }

  .complaint-detail {
    width: min(960px, 100%);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .complaint-detail__header,
  .complaint-detail__heading {
    display: flex;
    align-items: center;
  }

  .complaint-detail__header {
    min-height: 52px;
    justify-content: space-between;
    gap: 20px;
  }

  .complaint-detail__heading {
    gap: 16px;
  }

  .complaint-detail__title,
  .complaint-detail__section-title,
  .complaint-detail__empty-copy,
  .complaint-detail__content {
    margin: 0;
  }

  .complaint-detail__section {
    padding: 24px;
    border: 1px solid var(--admin-gray-100);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .complaint-detail__definition-grid {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 32px;
  }

  .complaint-detail__field {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .complaint-detail__term {
    color: var(--admin-gray-500);
  }

  .complaint-detail__value {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .complaint-detail__content {
    min-height: 160px;
    padding: 20px;
    border-radius: 16px;
    background: var(--admin-gray-50);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .complaint-detail__attachment-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .complaint-detail__attachment {
    min-height: 64px;
    padding: 12px 16px;
    border: 1px solid var(--admin-gray-100);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .complaint-detail__attachment-name {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .complaint-detail__attachment-size,
  .complaint-detail__empty-copy {
    color: var(--admin-gray-500);
  }

  .complaint-detail--empty {
    align-items: flex-start;
  }

  @media (max-width: 720px) {
    .complaint-detail-page {
      padding: 40px 20px 72px;
    }

    .complaint-detail__header {
      align-items: flex-start;
      flex-direction: column;
    }

    .complaint-detail__definition-grid {
      grid-template-columns: 1fr;
    }

    .complaint-detail__section {
      padding: 20px;
    }
  }
  ```

- [x] **Step 3: App route를 연결한다**

  ```tsx
  import { ComplaintDetailPage } from './pages/ComplaintDetailPage'

  <Route element={<ComplaintDetailPage />} path="/complaints/:complaintId" />
  ```

### Task 4: 자동·브라우저 검증

**Files:**

- Verify: all changed files

- [x] **Step 1: test, lint, build를 통과시킨다**

  ```bash
  pnpm --filter admin test
  pnpm --filter admin lint
  pnpm --filter admin build
  ```

- [x] **Step 2: 1440px와 720px에서 목록→상세와 not-found를 확인한다**

  `/complaints`의 한 행과 `상세` 링크, `/complaints/complaint-20260720-001`의 네 section, `/complaints/missing`의 not-found 상태, 활성 `불편접수` 메뉴, 가로 overflow 부재를 확인한다.

- [x] **Step 3: 최종 정적 검사를 실행한다**

  ```bash
  rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
  git diff --check
  ```

- [ ] **Step 4: 사용자가 요청한 경우에만 커밋한다**

  ```bash
  git add apps/admin/src/App.tsx apps/admin/src/pages/ComplaintPage.tsx apps/admin/src/pages/ComplaintDetailPage.tsx apps/admin/src/pages/ComplaintDetailPage.css apps/admin/src/pages/complaintData.ts apps/admin/tests/complaintPage.test.mjs docs/superpowers/plans/2026-07-20-admin-complaint-detail.md
  git commit -m "feat(admin): add complaint detail page"
  ```

## Self-Review

- Spec coverage: admin route, list link, contact details, intake fields, attachments, status, missing id를 모두 다룬다.
- Privacy: 목록에는 email/phone을 투영하지 않고 상세에서만 표시하며 인증 secret은 존재하지 않는다.
- Reuse: 기존 table link/status/button class와 admin shell을 재사용한다.
- Type consistency: 목록과 상세가 같은 `ComplaintStatus` 및 `ComplaintRecord`를 사용한다.
- Scope: API, 다운로드, 상태 변경, 답변은 추가하지 않는다.
