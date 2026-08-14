# Review YouTube Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins choose an uploaded MP4/MOV file or a YouTube link for an interview, then render YouTube interviews as responsive privacy-enhanced embeds on the public detail page.

**Architecture:** Keep `reviews.video_path` exclusively for Supabase Storage objects and add `reviews.youtube_video_id` for the normalized 11-character YouTube identifier. A shared pure helper parses accepted YouTube URL forms and creates canonical watch/embed URLs; the admin writes exactly one source and the public mapper prefers the validated YouTube ID, otherwise preserving the existing uploaded-file flow.

**Tech Stack:** React 19, Vite admin app, Next.js 16 App Router, TypeScript, Supabase/Postgres, Node test runner, CSS Modules.

**Status:** Completed and verified on 2026-08-14. The production `reviews_check` constraint was identified and replaced successfully; package, admin, and user tests/builds passed.

## Global Constraints

- Do not execute DDL against the connected Supabase project; provide an idempotent SQL file for the user to run manually.
- Preserve existing MP4/MOV upload, preview, cleanup, and public-link behavior.
- Accept only real YouTube video URLs from `youtube.com`, `youtu.be`, or `youtube-nocookie.com`; canonicalize to an 11-character video ID.
- Use `https://www.youtube-nocookie.com/embed/{id}` for public and admin embeds.
- Follow `design.md`: existing Pretendard GOV typography, parent `gap` spacing, no new focus styling, and no new raster UI icons.
- Preserve user-owned blog changes in the dirty worktree and do not create commits.
- The final Figma asset URL scan must return no matches.

---

### Task 1: Shared YouTube Contract and Manual SQL

**Files:**

- Create: `packages/supabase/src/reviewVideo.ts`
- Modify: `packages/supabase/src/index.ts`
- Modify: `packages/supabase/src/types.ts`
- Modify: `supabase/initial_admin_content.sql`
- Create: `supabase/manual/add_review_youtube_video.sql`
- Test: `packages/supabase/tests/review-video.test.mjs`
- Test: `packages/supabase/tests/content-contracts.test.mjs`

**Interfaces:**

- Produces: `getYouTubeVideoId(value: string): string | null`
- Produces: `getYouTubeWatchUrl(videoId: string): string | null`
- Produces: `getYouTubeEmbedUrl(videoId: string): string | null`
- Produces: nullable `youtube_video_id` on `TableRow`, `TableInsert`, and `TableUpdate` for `reviews`.

- [ ] **Step 1: Write failing URL and schema contract tests**

```ts
assert.equal(
  getYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=2"),
  "dQw4w9WgXcQ",
);
assert.equal(
  getYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
  "dQw4w9WgXcQ",
);
assert.equal(
  getYouTubeVideoId("https://youtube.example/watch?v=dQw4w9WgXcQ"),
  null,
);
assert.equal(
  getYouTubeEmbedUrl("dQw4w9WgXcQ"),
  "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
);
assert.match(baseline, /youtube_video_id text/);
assert.match(types, /youtube_video_id: string \| null/);
```

- [ ] **Step 2: Run the focused package tests and confirm they fail**

Run: `pnpm --filter @repo/supabase test`

Expected: failure because `reviewVideo.ts` and `youtube_video_id` do not exist.

- [ ] **Step 3: Implement strict URL parsing and schema contracts**

The parser must accept `watch?v=`, `youtu.be/{id}`, `/embed/{id}`, `/shorts/{id}`, and `/live/{id}` URLs over HTTP(S), reject deceptive hosts and non-11-character IDs, and return canonical HTTPS URLs. The baseline schema must require a valid ID when present, prevent simultaneous `video_path` and `youtube_video_id`, and allow either source for published interviews.

- [ ] **Step 4: Create the idempotent manual SQL**

The SQL must add `youtube_video_id`, discover and replace the existing unnamed published-interview check that requires `video_path`, add named format/source checks, validate them against existing rows, and finish with inspection queries. It must not alter RLS or grants.

- [ ] **Step 5: Run the focused package tests and confirm they pass**

Run: `pnpm --filter @repo/supabase test`

Expected: all package tests pass.

---

### Task 2: Admin Source Selection, Validation, and Persistence

**Files:**

- Modify: `apps/admin/src/pages/reviewFormState.ts`
- Modify: `apps/admin/src/pages/reviewData.ts`
- Modify: `apps/admin/src/pages/ReviewFormPage.tsx`
- Modify: `apps/admin/src/pages/ReviewFormPage.css`
- Test: `apps/admin/tests/reviewFormState.test.mjs`
- Test: `apps/admin/tests/reviewData.test.mjs`
- Test: `apps/admin/tests/reviewFormPage.test.mjs`

**Interfaces:**

- Produces: `ReviewVideoSource = "file" | "youtube"`.
- Produces: `getReviewYouTubeUrlError(value: string): string | null`.
- Extends `ReviewFormState` with `videoSource` and `youtubeUrl`.
- Extends `ReviewMutationInput` with `youtube_video_id` while ensuring the inactive video source is `null`.

- [ ] **Step 1: Write failing admin state and source tests**

```ts
assert.equal(getReviewYouTubeUrlError("https://youtu.be/dQw4w9WgXcQ"), null);
assert.match(
  getReviewYouTubeUrlError("https://example.com/video") ?? "",
  /YouTube/,
);
assert.equal(toReviewFormState(youtubeReview, null).videoSource, "youtube");
assert.equal(
  toReviewMutationInput(youtubeForm, "published", null).youtube_video_id,
  "dQw4w9WgXcQ",
);
assert.equal(
  toReviewMutationInput(youtubeForm, "published", null).video_path,
  null,
);
```

- [ ] **Step 2: Run the focused admin tests and confirm they fail**

Run: `pnpm --filter admin test`

Expected: failures for missing source state, URL validation, and UI controls.

- [ ] **Step 3: Implement the source selector and YouTube preview**

Reuse the existing `.blog-form__mode-tabs` controls for `영상 파일` and `YouTube 링크`. The YouTube branch must provide an accessible URL input, custom error text, and an iframe preview using the privacy-enhanced embed URL. The file branch must retain the current drag/drop, local preview, and clear control.

- [ ] **Step 4: Persist exactly one video source and preserve cleanup safety**

Validate before upload, skip Storage upload in YouTube mode, normalize the URL to `youtube_video_id`, set the inactive source to `null`, and delete an old Storage file only after a successful switch to YouTube or replacement upload.

- [ ] **Step 5: Run admin tests, type checks, and lint**

Run: `pnpm --filter admin test && pnpm --filter admin build && pnpm --filter admin lint`

Expected: all commands pass.

---

### Task 3: Public Responsive YouTube Embed and Structured Data

**Files:**

- Modify: `apps/user/app/_content/customerReviews.ts`
- Modify: `apps/user/app/(site)/reviews/[slug]/page.tsx`
- Modify: `apps/user/app/(site)/reviews/[slug]/page.module.css`
- Modify: `apps/user/app/_content/structured-data.ts`
- Test: `apps/user/__tests__/customer-reviews-page.test.mjs`
- Test: `apps/user/__tests__/customer-review-detail-page.test.mjs`
- Test: `apps/user/__tests__/structured-data.test.mjs`

**Interfaces:**

- Extends `CustomerInterviewDetail` with optional `youtubeUrl` and `youtubeEmbedUrl`.
- Extends article video structured data with optional `embedUrl`; uploaded files continue to use `contentUrl`.

- [ ] **Step 1: Write failing public mapper, embed, and JSON-LD tests**

```ts
assert.equal(detail.youtubeUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
assert.equal(
  detail.youtubeEmbedUrl,
  "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
);
assert.match(pageSource, /<iframe/);
assert.match(pageSource, /allowFullScreen/);
assert.match(pageSource, /loading="lazy"/);
assert.match(structuredDataSource, /embedUrl: input\.video\.embedUrl/);
```

- [ ] **Step 2: Run focused user tests and confirm they fail**

Run: `pnpm --filter user test`

Expected: failures because the public model and detail page do not yet support YouTube.

- [ ] **Step 3: Map validated IDs without routing them through Storage**

When `youtube_video_id` is valid, return canonical watch/embed URLs and ignore `video_path`; otherwise retain the existing resolved Storage URL. Never pass a YouTube URL into `getPublicAssetUrl`.

- [ ] **Step 4: Render the responsive privacy-enhanced player**

Render an iframe inside the existing rounded video figure with `title`, `allowFullScreen`, `loading="lazy"`, a strict referrer policy, and the standard YouTube feature allow-list. Keep the current thumbnail/play-link branch unchanged for uploaded files.

- [ ] **Step 5: Emit correct VideoObject fields**

Use `embedUrl` for YouTube and `contentUrl` for uploaded files, retaining name, description, thumbnail, and upload date.

- [ ] **Step 6: Run user tests, type checks, lint, and build**

Run: `pnpm --filter user test && pnpm --filter user check-types && pnpm --filter user lint && pnpm --filter user build`

Expected: all commands pass.

---

### Task 4: Repository Verification and Handoff

**Files:**

- Modify only failing files that are within this feature's scope.

**Interfaces:**

- Consumes all interfaces from Tasks 1–3.
- Produces a tested code change plus a copy-paste SQL handoff that the user applies before deployment.

- [ ] **Step 1: Run all affected workspace checks**

Run: `pnpm --filter @repo/supabase test && pnpm --filter @repo/supabase check-types && pnpm --filter @repo/supabase lint && pnpm --filter admin test && pnpm --filter admin build && pnpm --filter admin lint && pnpm --filter user test && pnpm --filter user check-types && pnpm --filter user lint && pnpm --filter user build`

Expected: all commands pass, except any pre-existing failure must be isolated and reported with evidence.

- [ ] **Step 2: Run the required asset and accidental-URL scans**

Run: `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`

Expected: no matches.

Run: `rg "youtube\.com|youtu\.be|youtube-nocookie\.com" apps packages`

Expected: only intentional validation, canonical URL, social-link, and test references; no user-supplied URL is routed through Storage.

- [ ] **Step 3: Review the scoped diff and SQL ordering**

Confirm unrelated blog files are absent from the feature diff, the SQL is idempotent for an already-migrated database, and the handoff states that SQL must be applied before deploying code that writes `youtube_video_id`.
