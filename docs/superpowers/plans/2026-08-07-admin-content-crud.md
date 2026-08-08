# 관리자 콘텐츠 CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 데이터를 보존하면서 포트폴리오, 블로그, 고객 인터뷰·후기, 공지사항의 관리자 CRUD와 불편접수의 관리자 조회·상태 수정을 실제 Supabase 스키마에 연결한다.

**Architecture:** 이미 구현된 목록·폼·삭제 다이얼로그와 Supabase helper를 그대로 사용한다. 새 `initial_admin_content.sql`을 현재 DB 계약의 기준으로 삼아 TypeScript 필드명과 순수 변환 함수를 맞추고, 불편접수 관리자 경로만 `complaints`/`complaint_attachments`로 전환한다. 새 추상화나 라이브러리는 추가하지 않는다.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Supabase JS 2, Postgres RLS/Storage, Node test runner

## Global Constraints

- 기존 `products` 10개와 모든 콘텐츠 행을 삭제·재시드·초기화하지 않는다.
- 관리자 UI만 연결한다. 사용자 불편접수 API의 예전 `inquiries` 연결은 이번 범위에서 변경하지 않는다.
- 포트폴리오·블로그·고객 인터뷰·후기·공지사항은 생성, 상세 조회, 임시저장, 게시/수정, 삭제를 지원한다.
- 불편접수는 관리자 생성·삭제 버튼 없이 목록, 상세, 첨부 다운로드, 처리상태 수정만 지원한다.
- `initial_admin_content.sql`의 `show_*`, `pinned`, `featured`, `company_name`, `manager_name`, `complaints` 필드명을 단일 DB 계약으로 사용한다.
- DB `content_mode`는 `html | markdown`을 사용하고 기존 화면의 “TEXT Editor 작성” 라벨은 유지한다.
- Slug는 DB 제약과 같은 `^[a-z0-9]+(?:-[a-z0-9]+)*$`만 허용한다.
- 관리자 권한은 `app_metadata.role = admin` RLS를 유지하고 service role을 브라우저에 노출하지 않는다.
- 새 패키지, 범용 폼 엔진, 전역 store, schema migration은 추가하지 않는다.
- `design.md`의 Pretendard GOV, SVG 아이콘, `gap`, focus 규칙을 유지한다.
- Figma API URL을 소스에 추가하지 않는다.
- 현재 worktree의 기존 인증·상품 변경과 섞여 있으므로 사용자 요청 전에는 커밋하지 않는다.

---

### Task 1: 현재 콘텐츠 DB 계약을 TypeScript와 계약 테스트에 반영

**Files:**
- Modify: `packages/supabase/src/types.ts`
- Modify: `packages/supabase/tests/content-contracts.test.mjs`
- Modify: `supabase/initial_admin_content.sql`

**Interfaces:**
- Produces: 현재 `posts`, `portfolio_items`, `reviews`, `complaints`, `complaint_attachments`의 `TableRow`, `TableInsert`, `TableUpdate`
- Consumes: 실제 프로젝트에서 확인한 `initial_admin_content.sql` 필드와 RLS/GRANT 계약

- [x] **Step 1: 현재 baseline SQL을 읽고 새 필드명을 요구하는 실패 테스트 작성**

```js
assertContains(baseline, [
  'show_on_landing',
  'show_as_banner',
  'featured',
  'pinned',
  'company_name',
  'manager_name',
  'complaints',
  'complaint_attachments',
])
assert.match(types, /complaints:\s*\{[\s\S]*?complaint_type: string;/)
```

- [x] **Step 2: focused Supabase test가 구 `inquiries`/`is_*` 계약 때문에 실패하는지 확인**

Run: `pnpm --filter @repo/supabase test`

Expected: 새 current-schema assertion이 FAIL.

- [x] **Step 3: `Database`의 현재 콘텐츠 테이블 타입을 baseline SQL과 동일하게 변경**

`content_mode`는 `html | markdown`으로 바꾸고, 현재 다섯 테이블의 Row/Insert/Update와 complaint attachment 관계를 정확히 선언한다. 사용자 API 호환을 위해 예전 `inquiries` 타입은 이번 범위에서 제거하지 않는다.

- [x] **Step 4: Storage MIME 목록의 중복 문자열을 한 항목으로 수정**

```sql
array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime'
]
```

- [x] **Step 5: Supabase test, type check, lint 통과 확인**

Run: `pnpm --filter @repo/supabase test && pnpm --filter @repo/supabase check-types && pnpm --filter @repo/supabase lint`

Expected: PASS.

---

### Task 2: 네 가지 생성형 메뉴의 폼과 목록을 현재 필드명에 연결

**Files:**
- Modify: `apps/admin/src/pages/blogData.ts`
- Modify: `apps/admin/src/pages/noticeData.ts`
- Modify: `apps/admin/src/pages/portfolioData.ts`
- Modify: `apps/admin/src/pages/reviewData.ts`
- Modify: `apps/admin/src/pages/BlogFormPage.tsx`
- Modify: `apps/admin/src/pages/NoticeFormPage.tsx`
- Modify: `apps/admin/src/pages/PortfolioFormPage.tsx`
- Modify: `apps/admin/src/pages/ReviewFormPage.tsx`
- Modify: `apps/admin/src/pages/portfolioFormState.ts`
- Modify: matching files in `apps/admin/tests/`

**Interfaces:**
- Produces: current-schema mutation payloads and lossless row-to-form mappings
- Consumes: Task 1 table types and existing CRUD helpers/form components

- [x] **Step 1: 각 데이터 변환 테스트 fixture와 기대 payload를 current-schema 이름으로 변경해 실패 확인**

```js
assert.equal(toBlogListRow(post).landingStatus, 'published')
assert.equal(toPortfolioFormValues(item).isPinned, true)
assert.equal(toReviewFormState(review, null).company, review.company_name)
assert.equal(toNoticeFormState(notice).isPinned, notice.pinned)
```

Run: `pnpm --filter admin test`

Expected: `show_*`, `pinned`, `company_name` mapping 부재로 FAIL.

- [x] **Step 2: 게시물 필드를 현재 스키마로 직결**

블로그는 `show_as_banner`, `featured`, `show_on_landing`, `pinned`; 공지사항은 `pinned`을 사용한다. 공지사항 `excerpt`는 DB check 전에 빈 값을 거부하고, 빈 작성일은 현재 시각으로 저장한다.

- [x] **Step 3: 포트폴리오와 리뷰 필드를 현재 스키마로 직결**

포트폴리오는 `show_on_landing`, `pinned`; 리뷰는 `company_name`, `manager_name`, `show_on_landing`을 사용한다. 기존 이미지/영상 upload 및 stale-file 정리 흐름은 유지한다.

- [x] **Step 4: 모든 콘텐츠 mode를 `html | markdown`으로 통일**

기존 “TEXT Editor 작성” 버튼이 `markdown` 값을 선택하게 하고, hydrate/serialize 시 별도 변환 없이 DB 값을 그대로 사용한다.

- [x] **Step 5: Slug 입력과 validation을 DB 제약 하나로 통일**

```ts
export function isValidPortfolioSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}
```

블로그, 포트폴리오, 인터뷰, 공지사항 input의 `pattern`, sanitizer, 안내 문구도 동일하게 맞춘다.

- [x] **Step 6: admin 데이터/폼 테스트와 build/lint 통과 확인**

Run: `pnpm --filter admin test && pnpm --filter admin build && pnpm --filter admin lint`

Expected: PASS.

---

### Task 3: 불편접수 관리자 경로를 현재 complaints 테이블로 전환

**Files:**
- Modify: `packages/supabase/src/inquiries.ts`
- Modify: `packages/supabase/tests/content-helpers.test.mjs`
- Modify: `apps/admin/src/pages/ComplaintPage.tsx`
- Modify: `apps/admin/src/pages/ComplaintDetailPage.tsx`
- Modify: `apps/admin/src/pages/complaintData.ts`
- Modify: `apps/admin/tests/complaintData.test.mjs`
- Modify: `apps/admin/tests/complaintPage.test.mjs`

**Interfaces:**
- Produces: `listAdminComplaints`, `getAdminComplaint`, `updateComplaintStatus`
- Consumes: `complaints`, nested `complaint_attachments`, `requireAdmin`, private attachment signed URLs

- [x] **Step 1: admin helper가 현재 테이블을 호출해야 하는 실패 테스트 작성**

```js
await listAdminComplaints(client)
await getAdminComplaint(client, 'complaint-id')
await updateComplaintStatus(client, 'complaint-id', 'resolved')
assert.ok(calls.some((call) => call.table === 'complaints'))
assert.ok(calls.some((call) => call.columns === '*, complaint_attachments(*)'))
```

- [x] **Step 2: 현재 complaint 전용 admin helper를 기존 파일에 최소 추가**

사용자 API가 사용하는 예전 inquiry helper는 유지하고, 새 helper는 관리자 인증 후 current table만 읽거나 status만 수정한다. 관리자 create/delete helper는 만들지 않는다.

- [x] **Step 3: 목록·상세·첨부 매핑을 current column으로 변경**

`complaint_attachments`, `bucket_id`, `object_path`, `original_file_name`을 사용하며 nullable email은 `-`로 표시한다.

- [x] **Step 4: admin page source contract를 새 helper 이름으로 변경**

목록에는 `bottomAction`이 없어야 하고, 상세에서는 처리상태 selector만 mutation을 수행해야 한다.

- [x] **Step 5: focused helper/admin tests 통과 확인**

Run: `pnpm --filter @repo/supabase test && pnpm --filter admin test`

Expected: PASS.

---

### Task 4: 실제 관리자 CRUD와 데이터 보존 검증

**Files:**
- Modify only if verification finds a defect in Tasks 1–3 files

**Interfaces:**
- Verifies: create/read/update/delete, RLS, Storage, no-create complaint UX, existing data preservation

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

- [x] **Step 2: 기존 데이터 기준선을 재확인**

검증 전후 `products`의 기존 10개 UUID/configuration과 다섯 콘텐츠 테이블의 기존 ID 집합이 동일해야 한다.

- [x] **Step 3: 생성형 네 메뉴를 브라우저에서 임시 CRUD 검증**

각 메뉴에서 고유한 QA draft를 생성하고 상세 조회, 한 필드 수정, 삭제까지 실행한다. 포트폴리오/리뷰 draft는 파일 없이 검증하고 Storage는 별도 임시 파일 upload/remove로 확인한다.

- [x] **Step 4: 불편접수 no-create와 현재 table read 계약 확인**

목록에 신규 등록 버튼이 없고 빈 목록이 정상 표시되는지 확인한다. 실제 current table SELECT가 성공하고 legacy `inquiries`가 호출되지 않아야 한다.

- [x] **Step 5: 임시 데이터와 파일을 모두 정리하고 최종 보존 확인**

QA 행/파일이 0개이며 기존 상품 10개와 시작 시점 콘텐츠 ID 집합이 그대로인지 확인한다.

## Self-Review

- **Spec coverage:** 포트폴리오, 블로그, 고객 인터뷰·후기, 공지사항의 전체 관리자 CRUD와 불편접수의 조회·상태 수정/no-create를 각각 Task 2–4가 검증한다.
- **Placeholder scan:** 실행 파일, helper 이름, 필드명, 테스트 명령과 기대 결과가 모두 구체적이다.
- **Type consistency:** DB content mode는 `html | markdown`, 상태와 필드명은 baseline SQL과 일치하고 complaint attachment 관계도 current table 이름을 사용한다.
- **Scope:** 사용자 접수 API, 새 migration, 신규 dependency, 디자인 재작업은 포함하지 않는다.
