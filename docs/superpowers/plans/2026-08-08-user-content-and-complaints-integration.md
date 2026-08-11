# User Content and Complaint Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 등록한 고객 인터뷰·후기·공지사항을 기존 유저 화면에 그대로 노출하고, 유저 불편접수를 현재 `complaints` 계열 테이블에 저장한 뒤 자동·수동 QA까지 통과한다.

**Architecture:** 기존 페이지와 표시 컴포넌트는 그대로 두고, 정적 fixture를 Supabase row → 기존 view model 어댑터로 교체한다. 불편접수는 기존 폼·서명 업로드 흐름을 유지하면서 서버 라우트의 저장 대상만 `inquiries`에서 `complaints`로 바꾼다. 공개 읽기는 anon + RLS, 불편접수 쓰기는 서버의 secret client만 사용한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, `@supabase/ssr` 0.8, `@supabase/supabase-js` 2.89, Node test runner, 기존 CSS Modules

## Global Constraints

- 최우선 계약은 **UI 무변경**이다. CSS, breakpoint, JSX 계층, 문구, 접근성 속성, 빈 상태, 폼 상태 전이는 바꾸지 않는다.
- 새 패키지, 범용 repository/service 계층, 새 상태 관리, 새 디자인 컴포넌트를 추가하지 않는다.
- `dangerouslySetInnerHTML`을 사용하지 않는다. HTML 입력은 스크립트·스타일·태그를 제거한 안전한 텍스트로, markdown 입력은 이 계획에 명시한 제한된 블록만 React 노드로 변환한다.
- 런타임 fixture fallback은 두지 않는다. DB가 비었거나 환경 변수가 없으면 목록은 기존 빈 상태, 상세는 404를 사용한다. 배포 전 데이터 준비를 별도 게이트로 둔다.
- `SUPABASE_SECRET_KEY` 또는 service-role 권한은 브라우저 번들로 보내지 않는다. 불편접수만 Next Route Handler에서 secret client를 사용한다.
- `complaints`와 `complaint_attachments`에 anon 정책을 추가하지 않는다. 첨부는 `private-attachments`에만 저장한다.
- 실제 SMS 인증은 이 범위에 포함하지 않는다. 현재 동작과 DB 값에 맞춰 `phone_verified`는 계속 `false`로 저장한다.
- 기존 로컬 변경은 사용자 소유다. 관련 파일만 수정하고, 명시적 요청 전에는 커밋·푸시·배포·원격 DB 쓰기를 하지 않는다.
- Figma UI 파일을 건드리지 않으며, 최종적으로 `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`가 무출력이어야 한다.

---

## 확인된 현재 상태

| 영역 | 현재 | 목표 |
|---|---|---|
| 고객 인터뷰·후기 | `customerReviews.ts`의 정적 3개 인터뷰·12개 후기 | `reviews`의 published row를 기존 card/detail view model로 변환 |
| 공지사항 | `notices.ts`의 정적 15개 fixture | `posts(kind = 'notice')`의 published row를 기존 notice view model로 변환 |
| 불편접수 | UI와 signed upload는 연결됨. 최종 저장만 `inquiries`/`inquiry_attachments` | `complaints`/`complaint_attachments`로 저장 |
| 관리자 | 현재 `posts`, `reviews`, `complaints` helper와 CRUD가 구현 중 | 같은 계약을 유저 앱이 소비 |
| Supabase | 연결된 커넥터 프로젝트에는 `study_snapshots`만 있고 콘텐츠 테이블이 없음. 로컬 `.env.local`도 비어 있음 | 전용 C-Brain 프로젝트를 확인하고 현재 스키마를 먼저 준비 |

현재 연결 흐름과 출시 차단 게이트는 [Archify workflow](./2026-08-08-user-content-connect.workflow.html)에서 확인한다.

## UI Freeze Contract

다음 파일은 구현 중 수정 금지다.

- `apps/user/app/page.module.css`
- `apps/user/app/(site)/reviews/page.tsx`
- `apps/user/app/(site)/reviews/CustomerTestimonialList.tsx`
- `apps/user/app/_components/CustomerReviewSection.tsx`
- `apps/user/app/_components/CustomerTestimonialCard.tsx`
- `apps/user/app/(site)/reviews/[slug]/page.module.css`
- `apps/user/app/(site)/notice/page.tsx`
- `apps/user/app/(site)/notice/[id]/page.tsx`
- `apps/user/app/(site)/notice/page.module.css`
- `apps/user/app/(site)/notice/[id]/page.module.css`
- `apps/user/app/(site)/notice/_components/NoticeBoard.tsx`
- `apps/user/app/(site)/notice/_components/NoticeItem.tsx`
- `apps/user/app/(site)/notice/[id]/_components/NoticeDetailArticle.tsx`
- `apps/user/app/(site)/complaint/page.tsx`
- `apps/user/app/(site)/complaint/ComplaintForm.tsx`

`apps/user/app/(site)/reviews/[slug]/page.tsx`는 데이터 함수가 비동기로 바뀌므로 import, 두 곳의 `await`, `generateStaticParams` 제거만 허용한다. `return (` 이후의 렌더 JSX는 바꾸지 않는다.

구현 시작 직전 현재 worktree 기준 해시를 보관한다.

```bash
shasum -a 256 \
  apps/user/app/page.module.css \
  'apps/user/app/(site)/reviews/page.tsx' \
  'apps/user/app/(site)/reviews/CustomerTestimonialList.tsx' \
  apps/user/app/_components/CustomerReviewSection.tsx \
  apps/user/app/_components/CustomerTestimonialCard.tsx \
  'apps/user/app/(site)/reviews/[slug]/page.module.css' \
  'apps/user/app/(site)/notice/page.tsx' \
  'apps/user/app/(site)/notice/[id]/page.tsx' \
  'apps/user/app/(site)/notice/page.module.css' \
  'apps/user/app/(site)/notice/[id]/page.module.css' \
  'apps/user/app/(site)/notice/_components/NoticeBoard.tsx' \
  'apps/user/app/(site)/notice/_components/NoticeItem.tsx' \
  'apps/user/app/(site)/notice/[id]/_components/NoticeDetailArticle.tsx' \
  'apps/user/app/(site)/complaint/page.tsx' \
  'apps/user/app/(site)/complaint/ComplaintForm.tsx' \
  > /tmp/cbrain-user-ui-before.sha256
```

최종 검사는 `shasum -a 256 -c /tmp/cbrain-user-ui-before.sha256`이며 한 파일이라도 다르면 출시를 중단한다.

## Data Mapping Contract

### Reviews

- `reviews.kind = 'interview'`만 인터뷰 카드·상세로 보낸다.
- `reviews.kind = 'testimonial'`만 후기 목록으로 보낸다.
- 랜딩 후기는 testimonial 중 `show_on_landing = true`인 앞 3개다.
- DB 순서는 기존 helper의 `sort_order ASC, id ASC`를 그대로 사용한다.
- 인터뷰의 `company_name`, `title`, `slug`, `content`, `published_at`, `video_alt`, `seo_description`은 DB가 단일 원천이다.
- `video_path`는 `getPublicAssetUrl`로 변환하며, 없으면 상세의 영상 링크만 렌더하지 않는다.
- 상세 조회 결과가 interview가 아니거나 slug가 없으면 `undefined`로 처리한다.
- `video_alt`가 비면 `${company_name} 고객 인터뷰 영상`, `seo_description`이 비면 첫 paragraph 또는 title을 사용한다.
- 현재 DB에 없는 썸네일·산업군·프로젝트 정보·featured 문구는 세 기존 slug(`seojin-instech`, `ninebell-healthcare`, `chungkang-college`)에 한해 로컬 **presentation metadata**로 유지한다.
- 신규 인터뷰는 기존 `reviewInterviewImage`, category `고객사`, 프로젝트 정보 `의뢰처 / 제작물 / 활용`의 안전한 기본값을 사용한다. 고유 포스터 관리가 실제 요구가 될 때만 별도 thumbnail column을 설계한다.
- featured는 published 인터뷰 중 로컬 metadata에 featured가 지정된 row를 우선하고, 없으면 `published_at`이 가장 최근인 row를 사용한다.

후기 변환은 다음 계약을 따른다.

```ts
{
  body: safePlainText(row.content, row.content_mode),
  company: row.company_name.trim(),
  id: row.id,
  name: row.manager_name?.trim() ?? "",
  publishedAt: row.published_at ?? row.created_at,
  title:
    row.title?.trim() ||
    `${row.company_name.trim()}${row.manager_name?.trim() ? ` ${row.manager_name.trim()}` : ""} 후기`,
}
```

인터뷰 markdown은 빈 줄 단위로 나눈 뒤 `## `는 heading, `> `는 quote, 나머지는 paragraph로만 변환한다. block id는 `${row.id}-block-${index}`로 만든다.

### Notices

DB `type`을 다음처럼 고정 변환한다. 알 수 없는 값은 콘텐츠를 숨기지 않고 `notice`로 보낸다.

```ts
const noticeCategoryByType = {
  공지: "notice",
  이벤트: "event",
  "휴무 안내": "holiday",
  "서비스 변경": "service",
  "수상 · 소식": "news",
} as const;
```

- `id = slug`, `author = '씨브레인'`, `isPinned = pinned`으로 매핑한다.
- `published_at`, `title`, `excerpt`, `sort_order`는 DB를 따른다.
- nullable `excerpt`가 비면 안전하게 추출한 본문의 첫 160자를 사용한다. `totalCount`는 category filter 전 published notice 전체 개수다.
- markdown paragraph와 `1. 제목` 아래의 `- 상세` 목록만 현재 `NoticeContentBlock`으로 변환한다.
- HTML mode는 script/style 제거 → block closing tag를 줄바꿈으로 변환 → 나머지 tag 제거 → React text 렌더 순서로 처리한다.
- `dangerouslySetInnerHTML`과 외부 HTML/markdown parser는 추가하지 않는다.

### Complaints

```ts
type ComplaintInsert = {
  complaint_type: string;
  content: string;
  email: string;
  name: string;
  phone: string;
  phone_verified: false;
  privacy_agreed_at: string;
  service: string;
  status: "received";
};
```

첨부는 `complaints/${submissionId}/${uuid}.ext`에 저장하고 다음 필드로 기록한다.

```ts
{
  bucket_id: "private-attachments",
  complaint_id: complaint.id,
  content_type: attachment.type,
  file_size: attachment.size,
  object_path: attachment.path,
  original_file_name: attachment.name,
}
```

---

### Task 1: 대상 Supabase와 UI 기준선을 먼저 고정한다

**Files:**

- Read: `.env.example`
- Read: `apps/user/.env.example`
- Read: `apps/admin/.env.example`
- Read: `supabase/initial_admin_content.sql`
- Create: `supabase/seed_user_content_qa.sql`
- Test: `packages/supabase/tests/content-contracts.test.mjs`

**Produces:** 전용 QA DB, 현재 스키마 검증 결과, UI 전후 비교용 동일 콘텐츠 데이터

**Consumes:** `initial_admin_content.sql`, 기존 정적 공지 15개·인터뷰 3개·후기 12개, 실제 인터뷰 영상 3개

- [ ] **Step 1: UI 보호 파일의 SHA-256을 기록하고 현재 테스트를 기준선으로 실행**

```bash
pnpm --filter user test
pnpm --filter @repo/supabase test
```

Expected: 구현 전 결과를 그대로 기록한다. 이미 실패하는 unrelated test가 있으면 파일명과 오류를 기록하고 이번 작업과 구분한다.

이어 현재 정적 fixture 상태에서 `/`, `/reviews`, `/reviews/seojin-instech`, `/notice`, `/notice/notice-1`, `/complaint`를 390×844, 768×1024, 1080×900, 1440×1000으로 캡처해 `/tmp/cbrain-ui-regression/before/`에 24개 기준 이미지를 저장한다. 폰트 로딩이 끝나고 animation이 정지한 뒤 캡처한다.

- [ ] **Step 2: 대상 프로젝트를 사용자에게 확인**

현재 Supabase 커넥터 프로젝트에는 `study_snapshots`만 있고, 관리자 `.env.example`의 별도 URL은 publishable key로 401을 반환했다. `initial_admin_content.sql`은 `public` 전체 privilege를 revoke하므로 기존 앱과 공유하는 프로젝트에 실행하면 안 된다. 전용 C-Brain 프로젝트가 확인되지 않으면 여기서 중단한다. 신규 프로젝트 생성은 비용 확인과 사용자 승인을 먼저 받는다.

- [ ] **Step 3: 확인된 빈 C-Brain 프로젝트에 current schema를 적용하고 계약을 검증**

`initial_admin_content.sql`은 fresh-schema baseline이므로 기존 데이터가 있는 프로젝트에 재실행하지 않는다. 적용 후 아래 쿼리가 정확한 테이블을 반환해야 한다.

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'posts',
    'reviews',
    'complaints',
    'complaint_attachments'
  )
order by table_name;
```

Expected: 네 테이블 모두 존재.

```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'posts',
    'reviews',
    'complaints',
    'complaint_attachments'
  )
order by tablename, policyname;
```

Expected:

- `posts`, `reviews`: published 공개 SELECT + admin manage
- `complaints`: admin SELECT + status UPDATE만 존재
- `complaint_attachments`: admin SELECT만 존재
- anon INSERT/SELECT policy가 complaints 계열에는 없음

```sql
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'posts',
    'reviews',
    'complaints',
    'complaint_attachments'
  )
order by grantee, table_name, privilege_type;
```

Expected: anon은 `posts`, `reviews` SELECT만 갖고 complaints 계열 권한은 없다. RLS와 별개로 Data API table privilege가 명시돼 있어야 한다.

이 검사는 Supabase의 [Data API 보안 가이드](https://supabase.com/docs/guides/api/securing-your-api)와 [2026 explicit table privilege 변경 안내](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)를 따른다. RLS가 있어도 `GRANT`가 없으면 Data API 접근은 성립하지 않는다.

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('public-assets', 'private-attachments')
order by id;
```

Expected: `public-assets.public = true`, `private-attachments.public = false`.

관리자 Auth 사용자는 별도로 만든다. `enable_admin_login.sql`은 현재 `asd@asd.com`을 하드코딩하므로 그 주소가 실제 관리자인지 사용자 확인 없이 실행하지 않는다. 다른 계정이면 Supabase Auth 설정에서 선택한 user의 `app_metadata.role`만 `admin`으로 설정하고 다시 로그인해 JWT를 갱신한다.

- [ ] **Step 4: 앱별 로컬 env를 같은 프로젝트로 맞춤**

커밋하지 않는 `apps/user/.env.local`에는 확인된 프로젝트의 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`와 로컬 값 `NEXT_PUBLIC_SITE_URL=http://localhost:3000`을 둔다. `apps/admin/.env.local`에는 같은 프로젝트의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`와 `VITE_USER_APP_URL=http://localhost:3000`을 둔다. 값은 Supabase 프로젝트 설정에서 직접 복사하고 출력·문서·로그·git에 남기지 않는다.

- [ ] **Step 5: QA 전용 idempotent seed 작성**

`supabase/seed_user_content_qa.sql`은 다음만 수행한다.

- 정적 공지 15개를 `posts(kind = 'notice')`에 넣고 `(kind, slug)` conflict 시 갱신한다.
- 정적 후기 12개는 `md5('cbrain:testimonial:' || fixture_id)::uuid`를 id로 사용해 재실행 시 중복되지 않게 한다.
- 인터뷰 3개는 내용과 slug를 `draft`로 넣고, conflict 시 기존 `video_path`와 `status`를 덮어쓰지 않는다.
- 공지의 `sort_order`는 기존 화면의 `publishedAt DESC` 결과와 같게, 후기·인터뷰는 현재 배열 순서와 같게 넣는다.
- 콘텐츠는 `content_mode = 'markdown'`과 이 계획의 제한 문법으로 저장한다.
- 파일 첫 줄에 `-- QA ONLY: never run against production`을 넣고, 실제 운영 데이터 마이그레이션으로 사용하지 않는다.

`content-contracts.test.mjs`에는 seed source를 읽어 QA-only 표식, 공지 slug 15개, 인터뷰 slug 3개, 후기 fixture id 12개, deterministic `md5` id, `ON CONFLICT`가 모두 존재하는지 검사하는 테스트를 추가한다. seed에는 `inquiries`, `inquiry_attachments`가 없어야 한다.

- [ ] **Step 6: 관리자에서 인터뷰 3개에 실제 영상을 업로드하고 published로 전환**

DB 제약상 published interview는 `title`, `slug`, `video_path`, `published_at`이 모두 필요하다. 실제 영상이 없으면 인터뷰 cutover와 UI 전후 비교는 **No-Go**다. 스키마를 느슨하게 만들거나 가짜 경로를 넣지 않는다.

- [ ] **Step 7: 스키마 계약 테스트 실행**

```bash
pnpm --filter @repo/supabase test
```

Expected: current schema, RLS, GRANT, storage contract가 PASS.

---

### Task 2: 현재 complaint write helper를 추가한다

**Files:**

- Modify: `packages/supabase/src/inquiries.ts`
- Modify: `packages/supabase/tests/content-helpers.test.mjs`

**Produces:** current complaint insert helper 두 개

**Consumes:** `TableInsert<'complaints'>`, `TableInsert<'complaint_attachments'>`, `unwrapSupabaseData`

- [ ] **Step 1: 현재 테이블을 기대하는 failing test 추가**

테스트는 fake client call을 검사한다.

```js
await createComplaint(client, complaintInput);
await createComplaintAttachments(client, [attachmentInput]);

assert.ok(calls.some((call) => call.table === "complaints"));
assert.ok(calls.some((call) => call.table === "complaint_attachments"));
assert.equal(calls.some((call) => call.table === "inquiries"), false);
```

빈 첨부 배열은 insert를 호출하지 않고 `[]`를 반환하는 assertion도 추가한다.

- [ ] **Step 2: focused test가 helper 부재로 실패하는지 확인**

```bash
pnpm --filter @repo/supabase test
```

Expected: `createComplaint`/`createComplaintAttachments` 부재로 FAIL.

- [ ] **Step 3: 기존 helper 패턴 그대로 최소 구현**

```ts
export async function createComplaint(
  client: CBrainSupabaseClient,
  input: TableInsert<"complaints">,
) {
  const { data, error } = await client
    .from("complaints")
    .insert(input)
    .select("*")
    .single();

  return unwrapSupabaseData(data, error);
}

export async function createComplaintAttachments(
  client: CBrainSupabaseClient,
  inputs: TableInsert<"complaint_attachments">[],
) {
  if (inputs.length === 0) return [];

  const { data, error } = await client
    .from("complaint_attachments")
    .insert(inputs)
    .select("*");

  return unwrapSupabaseData(data, error);
}
```

기존 legacy helper는 다른 호출자가 있을 수 있으므로 이 작업에서 삭제하지 않는다.

- [ ] **Step 4: helper 테스트 실행**

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
```

Expected: PASS.

---

### Task 3: 불편접수 서버 저장을 complaints 계열로 전환한다

**Files:**

- Modify: `apps/user/app/(site)/complaint/complaintSubmission.ts`
- Modify: `apps/user/app/api/complaints/route.ts`
- Modify: `apps/user/app/api/complaints/uploads/route.ts`
- Modify: `apps/user/__tests__/complaintSubmission.test.mjs`
- Modify: `apps/user/__tests__/complaint-route.test.mjs`
- Verify unchanged: `apps/user/app/(site)/complaint/ComplaintForm.tsx`

**Produces:** 현재 complaint row/attachment row, 실패 시 complaint→storage 순서의 정리

**Consumes:** 기존 JSON payload, signed upload token, `getFileInfo`, private bucket

- [ ] **Step 1: 테스트를 current table/column 계약으로 먼저 변경**

다음을 assertion으로 고정한다.

- prefix는 `complaints/${submissionId}`
- mapper 이름은 `toComplaintInput`
- mapper 결과에 `title`, `user_id`가 없음
- 0-byte 첨부가 DB insert 전에 거부됨
- 최종 route는 `createComplaint`, `createComplaintAttachments`를 사용
- cleanup은 `complaints.id`, `complaint_attachments.object_path`를 조회
- 실패 시 complaint row 삭제가 storage object 삭제보다 먼저 실행
- complaint insert 자체가 실패해도 업로드 object는 정리됨
- `ComplaintForm.tsx`는 signed upload → JSON finalize → 성공 dialog 순서를 그대로 유지

- [ ] **Step 2: focused test의 legacy assertion 실패 확인**

```bash
node --test \
  apps/user/__tests__/complaintSubmission.test.mjs \
  apps/user/__tests__/complaint-route.test.mjs \
  apps/user/__tests__/complaint-page.test.mjs
```

Expected: legacy path/table/field assertion으로 FAIL.

- [ ] **Step 3: payload mapping만 현재 컬럼으로 변경**

`getComplaintUploadPrefix`는 `complaints/${submissionId}`를 반환한다. `toComplaintInquiryInput`은 `toComplaintInput`으로 이름을 바꾸고 `title`, `user_id`를 제거한다. 입력 trim, honeypot, 파일 제한, UUID 검증, `phone_verified: false`는 유지한다. `complaint_attachments.file_size > 0` 제약과 맞게 0-byte 파일은 validation에서 거부한다.

- [ ] **Step 4: POST route의 저장 대상과 attachment column을 변경**

```ts
const complaint = await createComplaint(client, {
  ...toComplaintInput(submission.values, new Date().toISOString()),
  id: submission.submissionId,
});

await createComplaintAttachments(
  client,
  submission.attachments.map((attachment) => ({
    bucket_id: STORAGE_BUCKETS.privateAttachments,
    complaint_id: complaint.id,
    content_type: attachment.type,
    file_size: attachment.size,
    object_path: attachment.path,
    original_file_name: attachment.name,
  })),
);
```

처리 순서는 `getFileInfo`와 size/contentType 검증 → `createComplaint` → `createComplaintAttachments`다. 400/500 응답 문구는 그대로 둔다. cleanup은 실제 complaint가 생성됐을 때만 그 row를 먼저 삭제하고, 그 다음 `uploadedPaths`를 삭제한다. complaint insert 전에 실패했더라도 storage 정리는 실행돼야 한다.

- [ ] **Step 5: upload DELETE route의 reference check를 현재 테이블로 변경**

- `complaints.id = submissionId`가 있으면 object를 삭제하지 않는다.
- `complaint_attachments.object_path IN cleanup.paths`에 있는 path는 삭제하지 않는다.
- 참조되지 않은 path만 private bucket에서 삭제한다.

- [ ] **Step 6: complaint 회귀 테스트 실행**

```bash
node --test \
  apps/user/__tests__/complaintSubmission.test.mjs \
  apps/user/__tests__/complaint-route.test.mjs \
  apps/user/__tests__/complaint-page.test.mjs
pnpm --filter user check-types
```

Expected: PASS, UI 보호 파일 hash 유지.

---

### Task 4: 고객 인터뷰·후기를 Supabase read로 교체한다

**Files:**

- Modify: `apps/user/app/_content/customerReviews.ts`
- Modify: `apps/user/app/(site)/reviews/[slug]/page.tsx`
- Modify: `apps/user/__tests__/customer-reviews-page.test.mjs`
- Modify: `apps/user/__tests__/customer-review-detail-page.test.mjs`
- Verify unchanged: `apps/user/app/(site)/reviews/page.tsx`
- Verify unchanged: `apps/user/app/_components/CustomerReviewSection.tsx`
- Verify unchanged: `apps/user/app/(site)/reviews/CustomerTestimonialList.tsx`
- Verify unchanged: `apps/user/app/_components/CustomerTestimonialCard.tsx`

**Produces:** published review row → 기존 list/detail/landing view model

**Consumes:** `createUserSupabaseClient`, `listPublishedReviews`, `getPublishedReview`, `getPublicAssetUrl`

- [ ] **Step 1: fixture-only 테스트를 dynamic source + mapper 계약으로 변경**

기존 CSS·semantic markup·empty state·pagination·local asset assertion은 수정하지 않는다. fixture-only assertion만 다음으로 교체한다.

```js
assert.match(contentSource, /createUserSupabaseClient/);
assert.match(contentSource, /listPublishedReviews/);
assert.match(contentSource, /getPublishedReview/);
assert.match(contentSource, /getPublicAssetUrl/);
assert.match(contentSource, /status/); // helper가 published만 반환한다는 package test와 함께 검증
assert.doesNotMatch(contentSource, /dangerouslySetInnerHTML/);
```

추가 mapper assertion:

- interview/testimonial 분리
- landing은 `show_on_landing` testimonial만 최대 3개
- HTML의 `<script>` 내용과 tag가 결과 text에 없음
- markdown heading/quote/paragraph의 stable block id
- 기존 세 slug의 presentation metadata 유지
- 신규 slug가 기본 thumbnail/project metadata를 사용
- client가 null이면 빈 목록/null을 반환하고 fixture를 반환하지 않음

pure mapper 실행 테스트는 새 dependency 대신 `complaintSubmission.test.mjs`와 같은 `typescript.transpileModule` + data URL harness를 사용한다. 서버 import를 제거한 뒤 mapper에 plain row fixture와 asset URL resolver를 직접 전달한다.

- [ ] **Step 2: focused test가 fixture-only 구현 때문에 실패하는지 확인**

```bash
node --test \
  apps/user/__tests__/customer-reviews-page.test.mjs \
  apps/user/__tests__/customer-review-detail-page.test.mjs
```

Expected: Supabase loader/mapper 부재로 FAIL.

- [ ] **Step 3: 정적 업무 데이터를 presentation metadata와 pure mapper로 축소**

`customerInterviewRecords`, `customerInterviewDetails`, `customerTestimonials`의 런타임 데이터 원천 역할을 제거한다. 기존 세 인터뷰의 thumbnail, industry, keywords, projectInfo, featured 문구만 slug map으로 남긴다. DB row를 받아 `CustomerInterviewCard`, `CustomerInterviewDetail`, `CustomerTestimonial`을 만드는 export 가능한 pure mapper를 같은 파일에 둔다.

- [ ] **Step 4: 기존 함수 이름을 유지한 async loader 구현**

```ts
export async function getCustomerReviewPageData(): Promise<CustomerReviewPageData>
export async function getLandingCustomerTestimonials(): Promise<CustomerTestimonial[]>
export async function getPublishedCustomerInterviewDetailBySlug(
  slug: string,
): Promise<CustomerInterviewDetail | undefined>
```

`createUserSupabaseClient()`가 null이면 각각 empty data, `[]`, `undefined`를 반환한다. 에러를 fixture로 숨기지 않는다.

- [ ] **Step 5: 상세 페이지만 async loader로 연결**

`generateStaticParams`와 `customerInterviewDetails` import를 제거한다. `generateMetadata`와 page 본문의 두 호출에 `await`를 붙인다. `return (` 이후 JSX와 CSS module은 변경하지 않는다.

- [ ] **Step 6: review 회귀 테스트 실행**

```bash
node --test \
  apps/user/__tests__/customer-reviews-page.test.mjs \
  apps/user/__tests__/customer-review-detail-page.test.mjs
pnpm --filter user check-types
```

Expected: PASS, 보호 파일 hash 유지.

---

### Task 5: 공지사항을 Supabase read로 교체한다

**Files:**

- Modify: `apps/user/app/(site)/notice/_data/notices.ts`
- Modify: `apps/user/__tests__/notice-pages.test.mjs`
- Verify unchanged: `apps/user/app/(site)/notice/page.tsx`
- Verify unchanged: `apps/user/app/(site)/notice/[id]/page.tsx`
- Verify unchanged: 모든 notice UI component와 CSS module

**Produces:** published notice row → 기존 list/filter/detail view model

**Consumes:** `createUserSupabaseClient`, `listPublishedPosts`, `getPublishedPost`

- [ ] **Step 1: fixture-only assertion을 DB mapper 계약으로 변경**

기존 category rail, pinned split, detail link, metadata, 404, back history, responsive CSS assertion은 그대로 둔다. 다음만 새로 고정한다.

- `listPublishedPosts(client, 'notice')`
- `getPublishedPost(client, 'notice', id)`; route segment 이름은 `id`지만 값은 slug
- 다섯 admin type의 정확한 category 변환과 unknown fallback
- DB `sort_order` 보존, category filter 후에도 상대 순서 보존
- HTML script/style 제거와 markdown ordered-list 변환
- client null은 empty page/null, fixture fallback 없음
- raw HTML injection 없음

pure mapper 실행 테스트는 review와 같은 `typescript.transpileModule` harness를 사용하며, `noticeCategories`를 실제 constants source에서 함께 로드한다.

- [ ] **Step 2: focused test가 fixture-only 구현 때문에 실패하는지 확인**

```bash
node --test apps/user/__tests__/notice-pages.test.mjs
```

Expected: Supabase loader/mapper 부재로 FAIL.

- [ ] **Step 3: 같은 파일 안에서 최소 mapper와 async loader 구현**

```ts
export async function getNoticePageData(
  activeCategory: NoticeCategoryValue,
): Promise<NoticePageData>

export async function getNoticeById(
  id: string,
): Promise<NoticeDetail | undefined>
```

목록은 `listPublishedPosts(client, 'notice')`, 상세는 `getPublishedPost(client, 'notice', id)`를 사용한다. 기존 page 두 개가 이미 `await`하므로 page/component 수정은 없다.

- [ ] **Step 4: notice 회귀 테스트 실행**

```bash
node --test apps/user/__tests__/notice-pages.test.mjs
pnpm --filter user check-types
```

Expected: PASS, 보호 파일 hash 유지.

---

### Task 6: 자동 QA, 권한 QA, 관리자→유저 E2E, 시각 QA를 순서대로 통과한다

**Files:**

- Verify: `apps/user/__tests__/*.test.mjs`
- Verify: `packages/supabase/tests/*.test.mjs`
- Verify: `supabase/initial_admin_content.sql`
- Verify unchanged: UI Freeze Contract 전체

**Produces:** Go/No-Go 판정과 QA 증거

**Consumes:** 전용 QA DB, 동일 fixture seed, admin 계정, 네 viewport screenshot

- [ ] **Step 1: 전체 자동 검증**

```bash
pnpm --filter @repo/supabase test
pnpm --filter @repo/supabase check-types
pnpm --filter @repo/supabase lint
pnpm --filter user test
pnpm --filter user check-types
pnpm --filter user lint
pnpm --filter user build
```

Expected: 전부 exit 0. 이어서 다른 workspace 회귀를 확인한다.

```bash
pnpm test
pnpm check-types
pnpm lint
pnpm build
```

Expected: 전부 exit 0. unrelated baseline failure가 있으면 새 failure가 아님을 diff와 개별 명령으로 증명해야 하며, 그렇지 않으면 No-Go.

- [ ] **Step 2: RLS와 Data API 권한 smoke test**

anon/public client로 다음을 확인한다.

- published `posts(kind='notice')`, `reviews`는 조회됨
- draft/archived post와 review는 조회되지 않음
- `complaints`, `complaint_attachments` SELECT는 거부됨
- anon complaint INSERT도 거부됨
- Next `/api/complaints`만 secret client로 insert 성공
- private attachment object의 public URL 접근은 실패하고 admin signed URL만 성공

Supabase security advisor도 실행해 새 RLS/privilege 경고가 없는지 확인한다.

- [ ] **Step 3: 관리자→유저 콘텐츠 E2E**

각 테스트 record title/slug 앞에는 `qa-user-connect-20260808`을 사용하고 전용 QA 프로젝트에서만 실행한다.

| 시나리오 | 기대 결과 |
|---|---|
| 공지 draft 생성 | `/notice`에 없음 |
| 공지 publish | 올바른 category와 pinned 위치에 즉시 표시, slug 상세 열림 |
| 공지 수정 | 목록·상세 내용 반영 |
| 공지 삭제 | 목록에서 제거, 상세 404 |
| testimonial draft/publish | draft는 없음, publish는 `/reviews`에 표시 |
| testimonial landing on/off | on일 때 랜딩에 있고 off면 랜딩에서만 사라짐 |
| interview publish | 기존 카드/상세 UI로 표시, 영상 링크 정상 |
| review reorder | 유저 목록 순서가 admin 순서와 같음 |
| review archive/delete | 목록에서 제거, interview 상세 404 |

- [ ] **Step 4: 불편접수 E2E**

| 시나리오 | 기대 결과 |
|---|---|
| 첨부 없음 | 201, `complaints` 1 row, attachment 0 row |
| PNG/JPEG/WEBP 첨부 | 201, 실제 private object와 metadata가 일치 |
| 11개/50MB 초과/잘못된 MIME | 400, complaint row 없음, orphan object 없음 |
| object size/type 변조 | 400, complaint row 삭제 후 object 삭제 |
| attachment insert 실패 | 500, complaint row와 업로드 object 정리 |
| 중복 submit | 버튼 disabled로 1회만 저장 |
| 서버 실패 | 입력값 유지, 성공 dialog 미노출 |
| 성공 | 기존 성공 dialog 노출, admin 목록에서 접수 확인 |
| admin status 변경 | received → processing → resolved 저장 |

- [ ] **Step 5: 반응형 화면 전후 비교**

같은 브라우저, 같은 폰트 로딩 완료 상태, 같은 QA seed로 아래 6개 route를 각각 390×844, 768×1024, 1080×900, 1440×1000에서 캡처해 `/tmp/cbrain-ui-regression/after/`에 저장한다.

- `/`
- `/reviews`
- `/reviews/seojin-instech`
- `/notice`
- `/notice/notice-1`
- `/complaint`

총 24쌍에서 다음이 같아야 한다.

- container width, section height, padding, gap, typography, line-height
- 카드 개수·열 수·pagination 위치
- 공지 category rail·pinned 구획·상세 메타
- 인터뷰 hero/card/detail 영상 영역·프로젝트 정보
- 불편접수 field, focus/disabled/error/success 상태
- horizontal overflow 없음

QA seed는 기존 copy와 순서를 동일하게 맞춘다. 실제 `video_path` 연결로 기존 JSX의 조건부 영상 링크가 활성화되는 차이만 기능상 허용한다. 그 외 픽셀 차이, 줄바꿈 차이, CLS가 하나라도 있으면 No-Go다. 차이를 CSS로 보정하지 말고 view model 매핑·seed 순서를 먼저 수정한다.

- [ ] **Step 6: UI source freeze와 Figma asset gate 확인**

```bash
shasum -a 256 -c /tmp/cbrain-user-ui-before.sha256
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: hash 전부 `OK`, `rg` 무출력.

- [ ] **Step 7: 운영 데이터와 배포 순서 확인**

1. 앱 배포 전에 운영 admin에서 실제 공지·후기·인터뷰를 준비한다. QA fixture를 운영에 넣지 않는다.
2. published interview는 실제 영상이 모두 있어야 한다.
3. 코드 배포 후 public read smoke test, complaint 1건 smoke test, admin 확인 순서로 검증한다.
4. UI/read 문제면 review·notice loader만 이전 release로 되돌린다.
5. 새 `complaints`에 실제 접수가 한 건이라도 들어온 뒤에는 write route를 `inquiries`로 되돌리지 않는다. 그래야 접수 데이터가 두 테이블로 다시 갈라지지 않는다.

## Definition of Done

- 관리자에서 publish/unpublish/reorder한 후기·인터뷰·공지사항이 기존 유저 UI에 정확히 반영된다.
- 불편접수와 첨부가 `complaints`/`complaint_attachments` 및 private bucket에만 저장된다.
- draft/archived 콘텐츠와 complaint 개인정보가 public client에 노출되지 않는다.
- targeted test, workspace test, type check, lint, build, RLS smoke, 관리자→유저 E2E가 모두 통과한다.
- 보호 파일 hash와 24쌍 화면 비교에서 의도하지 않은 UI 변경이 없다.
- `figma.com/api` source reference가 없다.
- 실제 인터뷰 영상 또는 전용 Supabase 프로젝트가 확인되지 않으면 완료로 표시하지 않는다.
