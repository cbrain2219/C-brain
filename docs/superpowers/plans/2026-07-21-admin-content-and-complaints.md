# Admin Content and Complaints Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 매출·LinkPay를 제외한 관리자 메뉴를 실제 Supabase 데이터에 연결하고, 공개 콘텐츠와 불편접수가 관리자 화면까지 이어지는 동작 가능한 흐름을 완성한다.

**Architecture:** `packages/supabase`가 DB 타입과 CRUD 계약을 소유하고, `apps/admin`은 그 계약을 사용하는 목록/폼 UI를 담당한다. 공개 사이트가 이미 가진 포트폴리오·리뷰·공지 화면은 published 데이터만 읽고 DB `sort_order`를 그대로 반영한다. 블로그는 현재 공개 목록/상세 화면이 없으므로 이번 범위에서는 관리자 CRUD와 공개 조회 API까지만 만든다. 불편접수는 사용자 폼에서 inquiry와 private attachment를 만들고 관리자에서 조회·상태 변경한다.

**Tech Stack:** React 19, React Router, Vite, Next.js 16, Supabase Postgres/Auth/Storage, TypeScript, Base UI AlertDialog, Node test runner.

---

## Global constraints

- 기존 상품 CRUD·삭제·드래그 정렬 동작과 사용자의 미커밋 변경을 보존한다.
- `design.md`의 기존 관리자 폼/테이블 패턴을 재사용하고 새로운 시각 체계를 만들지 않는다.
- 저장·삭제·정렬 실패는 toast와 `window.alert`를 함께 보여준다.
- 삭제는 복구 없는 hard delete이며 Base UI `AlertDialog`로 확인한 뒤 실행한다.
- 키보드 전용 정렬은 추가하지 않는다. 드래그는 검색/필터가 없는 전체 목록에서만 허용한다.
- 공개 HTML은 임의로 `dangerouslySetInnerHTML` 하지 않는다. `text` 모드는 줄바꿈 텍스트로 렌더하고, `html` 데이터는 현재 텍스트 표현으로 안전하게 표시한다.
- 관리자 이외의 CRUD와 draft 조회를 RLS로 차단하고, 공개 사이트에는 `published` 행만 노출한다.
- 공개 콘텐츠 파일은 `public-assets`, 불편접수 첨부는 `private-attachments` 버킷을 사용한다.

## Data contracts

- `posts`: `kind = blog | notice`로 두 콘텐츠를 함께 저장한다. 공통 필드와 블로그 thumbnail/landing/banner/featured, 공지 excerpt/pinned 필드, `view_count`, kind별 `sort_order`를 포함한다.
- `portfolio_items`: `type`, ordered `images` JSON, `content_mode`, landing/pinned flags, `view_count`, `sort_order`를 포함한다.
- `reviews`: `interview | testimonial`, company/manager, optional slug/video, content/SEO, landing flag, `view_count`, `sort_order`를 포함한다.
- 공지는 별도 테이블을 만들지 않고 `posts.kind = notice`를 사용한다.
- `inquiries`: service/complaint type/phone verification/privacy timestamp를 포함한다. 상태는 관리자 UI와 같은 `received | processing | resolved`로 통일한다.
- `inquiry_attachments`: bucket/path/file name/file size/content type을 보관한다.

## Task 1: Create the database foundation

**Files:**
- Create: `supabase/migrations/20260721000003_create_admin_content.sql`
- Modify: `packages/supabase/src/types.ts`
- Test: `packages/supabase/tests/content-contracts.test.mjs`

- [x] Add idempotent enum/table/index/updated-at trigger definitions for posts, portfolio, reviews, inquiries, and inquiry attachments.
- [x] Add public published-read and admin CRUD RLS policies.
- [x] Add storage buckets and policies for admin public assets and complaint attachments.
- [x] Backfill and enforce stable `sort_order` values.
- [x] Add atomic reorder RPCs for post kind, portfolio, and reviews, validating that every row in the target domain appears exactly once.
- [x] Mirror every migration column/function in `Database` TypeScript types.
- [x] Add contract tests that assert required tables, fields, policies, and RPC declarations exist.

## Task 2: Complete the shared Supabase data layer

**Files:**
- Modify: `packages/supabase/src/content.ts`
- Modify: `packages/supabase/src/portfolio.ts`
- Modify: `packages/supabase/src/inquiries.ts`
- Modify: `packages/supabase/src/files.ts`
- Create: `packages/supabase/src/reviews.ts`
- Modify: `packages/supabase/src/index.ts`
- Test: `packages/supabase/tests/content-helpers.test.mjs`

- [x] Add admin get-by-id, public get-by-slug, list, create, update, hard-delete, and reorder helpers for every content domain; blog/notice helpers share `posts` and require a kind.
- [x] Order admin and public lists by `sort_order` with deterministic id fallback.
- [x] Add inquiry create-with-attachments metadata, admin get-by-id, status update, and attachment-row helpers.
- [x] Add safe storage path generation and public/signed URL helpers.
- [x] Test query ordering, mutation payloads, and reorder RPC argument contracts with a small fake client.

## Task 3: Add reusable admin content behavior

**Files:**
- Create: `apps/admin/src/components/admin-form/AdminDeleteDialog.tsx`
- Create: `apps/admin/src/lib/adminAssets.ts`
- Create: `apps/admin/src/lib/adminContent.ts`
- Create: `apps/admin/src/pages/contentListState.ts`
- Test: `apps/admin/tests/contentListState.test.mjs`

- [x] Extract the existing product delete confirmation styling/behavior into a reusable AlertDialog without changing the product UX.
- [x] Add helpers for date formatting, status labels, public asset upload/replacement, and deterministic row filtering.
- [x] Test search/type/status filtering and status/date mappings.

## Task 4: Implement portfolio end to end

**Files:**
- Modify: `apps/admin/src/pages/portfolioData.ts`
- Modify: `apps/admin/src/pages/PortfolioPage.tsx`
- Modify: `apps/admin/src/pages/PortfolioFormPage.tsx`
- Test: `apps/admin/tests/portfolioData.test.mjs`
- Modify: `apps/user/app/_content/portfolio.ts`
- Modify: `apps/user/app/(site)/portfolio/page.tsx`
- Modify: `apps/user/app/(site)/portfolio/[slug]/page.tsx`
- Modify: `apps/user/app/_components/PortfolioSection.tsx`

- [x] Map DB rows to list/form/public view models, preserving ordered image alt text.
- [x] Load list data, implement controlled type/status filters and search, and persist drag ordering.
- [x] Load edit data; implement draft/publish create/update, ordered multi-image upload, hard delete confirmation, and save/delete failure alerts.
- [x] Replace fixture consumption on the public list/detail/landing surfaces with published Supabase rows ordered by `sort_order`.
- [x] Keep a clear empty state when no published portfolio exists.

## Task 5: Implement blog administration

**Files:**
- Create: `apps/admin/src/pages/blogData.ts`
- Modify: `apps/admin/src/pages/BlogPage.tsx`
- Modify: `apps/admin/src/pages/BlogFormPage.tsx`
- Test: `apps/admin/tests/blogData.test.mjs`

- [x] Map post rows to list and form state including setting flags and thumbnail metadata.
- [x] Implement real list loading, filters, search, and drag reorder.
- [x] Implement create/edit hydration, draft/publish, thumbnail upload/replacement, hard delete, and failure alerts.
- [x] Compute landing/banner/featured counts from loaded rows instead of constants.
- [x] Export public published-post helpers, but do not invent a new public blog design or route in this task.

## Task 6: Implement reviews end to end

**Files:**
- Create: `apps/admin/src/pages/reviewData.ts`
- Modify: `apps/admin/src/pages/ReviewPage.tsx`
- Modify: `apps/admin/src/pages/ReviewFormPage.tsx`
- Test: `apps/admin/tests/reviewData.test.mjs`
- Modify: `apps/user/app/_content/customerReviews.ts`
- Modify: `apps/user/app/(site)/reviews/page.tsx`
- Modify: `apps/user/app/(site)/reviews/[slug]/page.tsx`
- Modify: `apps/user/app/_components/CustomerReviewSection.tsx`

- [x] Map interview/testimonial rows to the existing conditional form and derive a useful list title for testimonials.
- [x] Implement list loading, filters, search, and drag reorder.
- [x] Implement create/edit hydration, draft/publish, interview video upload/replacement, hard delete, and failure alerts.
- [x] Replace review fixtures on list/detail/landing surfaces with published rows; render video safely and support an empty state.

## Task 7: Implement notices end to end

**Files:**
- Create: `apps/admin/src/pages/noticeData.ts`
- Modify: `apps/admin/src/pages/NoticePage.tsx`
- Modify: `apps/admin/src/pages/NoticeFormPage.tsx`
- Test: `apps/admin/tests/noticeData.test.mjs`
- Modify: `apps/user/app/(site)/notice/_data/notices.ts`
- Modify: `apps/user/app/(site)/notice/page.tsx`
- Modify: `apps/user/app/(site)/notice/[id]/page.tsx`

- [x] Implement list/form row mapping and normalized notice categories.
- [x] Implement list loading, filters, search, and drag reorder.
- [x] Implement create/edit hydration, draft/publish, hard delete, and failure alerts.
- [x] Read published notices in the public list/detail, keep pinned rows first, and preserve `sort_order` within pinned/unpinned groups.

## Task 8: Implement complaint submission and administration

**Files:**
- Create: `apps/user/app/api/complaints/route.ts`
- Modify: `apps/user/app/(site)/complaint/ComplaintForm.tsx`
- Create: `apps/user/app/(site)/complaint/complaintSubmission.ts`
- Test: `apps/user/__tests__/complaintSubmission.test.mjs`
- Modify: `apps/admin/src/pages/complaintData.ts`
- Modify: `apps/admin/src/pages/ComplaintPage.tsx`
- Modify: `apps/admin/src/pages/ComplaintDetailPage.tsx`
- Test: `apps/admin/tests/complaintData.test.mjs`

- [x] Issue signed upload URLs, upload private attachments directly from the browser, and submit validated JSON metadata before opening the success dialog.
- [x] Do not mark phone verification complete when the verification provider is unconfigured.
- [x] Keep user input and show an inline/alert error if DB or attachment persistence fails.
- [x] Replace the admin fixture with real list/detail queries, working status/type filters and search.
- [x] Generate short-lived signed URLs for private attachments.
- [x] Add status changing in the detail page with toast and alert failure feedback; complaints are not draggable.

## Task 9: Route and resilience cleanup

**Files:**
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/src/components/AdminHeader.tsx`
- Modify: `apps/admin/.env.example`
- Modify: `apps/user/.env.example`

- [x] Add a protected wildcard redirect to `/products` so invalid admin URLs do not render blank.
- [x] Make internal admin links use React Router navigation where practical.
- [x] Document Vite admin and Next public Supabase environment variable names without committing secrets.
- [x] Make the public-site link configurable instead of routing back into the admin SPA.

## Task 10: Verify the whole story

**Files:**
- Modify tests listed above only as required by the final implementation.

- [x] Run `pnpm --filter @repo/supabase check-types` and package tests.
- [x] Run `pnpm --filter admin test`, `pnpm --filter admin lint`, and `pnpm --filter admin build`.
- [x] Run `pnpm --filter user test`, `pnpm --filter user lint`, `pnpm --filter user check-types`, and `pnpm --filter user build`.
- [x] Run `git diff --check` and inspect the final diff for accidental changes or secrets.
- [ ] Apply the new SQL migration to the configured Supabase project before live-data browser QA.
- [ ] Smoke-test each admin list → create draft → edit/publish → reorder → refresh → hard delete flow, then user portfolio/review/notice visibility and complaint submit → admin status update.

Automated verification and no-data/error-state browser smoke tests are complete. The two remaining checks require applying the migration to the remote Supabase project and configuring its server secret.

## Self-review

- The plan excludes only Sales and LinkPay, while retaining the already-complete Product/Auth work as regression coverage.
- Every currently rendered admin page has a persistence outcome: four content CRUD domains and one complaint operations domain.
- Public integration is limited to screens that already exist; no speculative Blog UI, FAQ admin, or service admin is added.
- DB/RLS/storage requirements are explicit because the live project currently exposes only profiles and products.
- Each task has an observable test or browser flow and failure feedback requirements.
