# User Blog and Portfolio Supabase Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the user app's hard-coded blog and portfolio records with published Supabase content while preserving the current UI, responsive layout, copy, and interactions exactly.

**Architecture:** Keep the existing admin CRUD, `posts` and `portfolio_items` tables, shared Supabase query helpers, and user-facing components. Add one server-only loader that reads published rows with a cookie-free publishable-key server client and maps them into the view models already consumed by the UI. Pass those view models into the existing landing, list, detail, metadata, and sitemap paths. Remove fixture records and fixture fallbacks so Supabase is the only content source.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase JS/SSR, Postgres RLS, Node test runner, pnpm/Turborepo

## Global Constraints

- UI preservation is the primary acceptance criterion. Do not change CSS files, class names, JSX hierarchy, visible copy, spacing, breakpoints, animations, filtering behavior, navigation behavior, or empty-state wording.
- Read `design.md` before implementation. Existing typography, SVG icon, focus, spacing, and responsive rules remain authoritative.
- Do not modify the admin blog or portfolio UI in this scope. Their CRUD paths already write to Supabase.
- Do not add or alter tables, columns, RLS policies, seeds, or storage buckets unless the read-only preflight proves the deployed database differs from the repository contract. The expected implementation requires **no SQL migration**.
- Never use `SUPABASE_SECRET_KEY` or a service-role/secret client in user page rendering. Use the existing publishable-key SSR client so RLS remains effective.
- Public reads must include only `status = 'published'`. Draft and archived rows must remain invisible even when landing/banner/featured flags are enabled.
- Delete the blog and portfolio fixture rows. Missing environment variables or query failures must return an empty content set, never stale mock content.
- Do not add API routes, client-side fetching, SWR/React Query, a global store, a CMS abstraction, or new npm dependencies.
- Keep the existing public storage URL helper and the current local blog fallback image. Do not add remote asset domains or Figma API URLs.
- Preserve unrelated dirty-worktree changes. Stage and commit only the exact files listed in each task.
- React `cache` may be used only for request-scoped deduplication between page rendering and `generateMetadata`; do not add persistent caching or revalidation behavior in this scope.

## Data Mapping Contract

| User view field/behavior | Supabase source | Rule |
| --- | --- | --- |
| Blog identity | `posts.id`, `slug`, `title`, `type` | `kind = 'blog'`; keep DB order from `sort_order`, then `id` |
| Blog summary | `excerpt`, `seo_description`, `content` | First non-empty value; safely reduce content to plain text and cap the fallback summary |
| Blog thumbnail | `thumbnail_path`, `thumbnail_alt` | Resolve storage paths with `getPublicAssetUrl`; use the current local fallback image only when the path is null |
| Blog date | `published_at` | Keep ISO value for metadata; format the visible date as `YYYY. MM. DD` in Asia/Seoul |
| Blog landing/banner/popular | `show_on_landing`, `show_as_banner`, `featured` | Convert enabled flags into sequential ranks in the already sorted DB order |
| Blog detail | `content`, `content_mode`, `seo_description` | Convert to safe existing `BlogContentBlock` values; never inject unsanitized HTML |
| Portfolio identity | `portfolio_items.id`, `slug`, `title`, `type`, `client_name` | Reuse `mapPortfolioRows` and the existing category mapping |
| Portfolio images | `images[].path`, `images[].alt` | Preserve DB order; first valid image remains the representative card image |
| Portfolio content | `content`, `content_mode` | Reuse the current safe plain-text conversion and current detail paragraph UI |
| Portfolio landing/order | `show_on_landing`, `pinned`, `sort_order` | Landing uses only enabled rows; pinned rows stay first without changing category filtering |
| Public visibility | `status` plus RLS | Shared queries and RLS both enforce `published` |

## Execution Status

- Implemented and verified locally with automated tests, a production build, and a temporary read-only Supabase-compatible response server.
- No CSS, schema, seed, RLS policy, storage bucket, or admin UI changes were made.
- Live production rows and deployed RLS remain to be verified because this workspace has no application Supabase environment values and the connected Supabase tool points to a different project.

---

### Task 1: Establish the DB and visual baselines before changing code

**Files:**

- Read only: `design.md`
- Read only: `supabase/migrations/20260721000003_create_admin_content.sql`
- Read only: `supabase/initial_admin_content.sql`
- Read only: `apps/user/app/(site)/page.tsx`
- Read only: `apps/user/app/(site)/blog/page.tsx`
- Read only: `apps/user/app/(site)/blog/[slug]/page.tsx`
- Read only: `apps/user/app/(site)/portfolio/page.tsx`
- Read only: `apps/user/app/(site)/portfolio/[slug]/page.tsx`

- [ ] **Step 1: Confirm the current automated baseline**

Run:

```bash
pnpm --filter user test
pnpm --filter user check-types
pnpm --filter user build
```

Expected: all three commands pass before implementation. Record any existing unrelated failure instead of silently treating it as caused by this work.

- [ ] **Step 2: Verify live content and publication flags with read-only SQL**

Run in the Supabase SQL editor or through a read-only SQL tool:

```sql
select kind, status, count(*)
from public.posts
where kind = 'blog'
group by kind, status
order by status;

select status, count(*)
from public.portfolio_items
group by status
order by status;

select id, slug, title, type, status,
       show_on_landing, show_as_banner, featured,
       thumbnail_path, published_at, sort_order
from public.posts
where kind = 'blog'
order by sort_order, id;

select id, slug, title, type, status,
       show_on_landing, pinned, images, published_at, sort_order
from public.portfolio_items
order by sort_order, id;
```

Expected: DB rows exist for the content intended to replace the fixtures. Before cutover, prepare at least two published and one draft blog row, plus two published and one draft portfolio row, through the existing admin UI.

- [ ] **Step 3: Verify required published fields and known portfolio categories**

Run:

```sql
select id, slug, title
from public.posts
where kind = 'blog'
  and status = 'published'
  and (
    btrim(slug) = '' or
    btrim(title) = '' or
    btrim(type) = '' or
    btrim(content) = '' or
    published_at is null
  );

select id, slug, title, type
from public.portfolio_items
where status = 'published'
  and (
    btrim(slug) = '' or
    btrim(title) = '' or
    btrim(type) = '' or
    btrim(content) = '' or
    jsonb_typeof(images) <> 'array' or
    images = '[]'::jsonb
  );

select type, count(*)
from public.portfolio_items
where status = 'published'
group by type
order by type;
```

Expected: the first two queries return zero rows. Every published portfolio `type` matches an existing category ID or label from `portfolioCategories`; correct data in admin before connecting rather than changing the public category UI.

- [ ] **Step 4: Verify RLS without changing it**

Run:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('posts', 'portfolio_items');

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('posts', 'portfolio_items')
order by tablename, policyname;
```

Expected: RLS is enabled for both tables. Anonymous/authenticated public SELECT policies permit only `status = 'published'`, while admin write policies remain authenticated/admin-only. This matches Supabase's current RLS guidance: https://supabase.com/docs/guides/database/postgres/row-level-security

- [ ] **Step 5: Capture a fresh visual and interaction baseline**

Start the current user app and capture `/`, `/blog`, one blog detail, `/portfolio`, and one portfolio detail at 390px, 1080px, and 1440px widths. Record:

- Landing portfolio tab selection, card count, scroll restoration, and detail/back navigation.
- Blog category navigation, banner carousel, hover pause, swipe/keyboard controls, popular list, and detail/back navigation.
- Current card aspect ratios, grid columns, typography, section spacing, CTA position, and empty states.

Expected: these screenshots and interaction notes become the post-change comparison baseline. Content text/images may change to DB values; layout and behavior may not.

---

### Task 2: Replace fixture seeds with pure DB-row mappers

**Files:**

- Create: `apps/user/__tests__/blog-content.test.mjs`
- Modify: `apps/user/__tests__/portfolio-content.test.mjs`
- Modify: `apps/user/app/(site)/blog/_types/blog.ts`
- Modify: `apps/user/app/(site)/blog/_data/blogPosts.ts`
- Modify: `apps/user/app/_content/portfolio.ts`

- [ ] **Step 1: Write failing blog mapping tests**

Cover these cases in `blog-content.test.mjs`:

- A `posts` row maps `id`, `slug`, `title`, `type`, publish date, SEO text, storage thumbnail, and thumbnail alt text.
- Sorted rows map `show_on_landing`, `show_as_banner`, and `featured` into deterministic ranks.
- Null thumbnail paths use the existing local fallback image.
- HTML content removes `script`/`style` content and tags before creating paragraph blocks.
- Markdown/text content creates stable paragraph blocks without `dangerouslySetInnerHTML`.
- `getBlogPostBySlug` and `getRelatedBlogPosts` search only the explicitly supplied DB-derived array.
- The module no longer exports a hard-coded `blogPosts` array.

Run:

```bash
pnpm --filter user exec node --test __tests__/blog-content.test.mjs
```

Expected: FAIL because `mapBlogRows` and the explicit-list helper signatures do not exist yet.

- [ ] **Step 2: Strengthen the portfolio mapper tests**

Update `portfolio-content.test.mjs` to require:

- `show_on_landing` maps to a `showOnLanding` view-model field.
- Pinned ordering, image path validation, image order, generated alt fallback, category mapping, and safe content conversion remain unchanged.
- `getPortfolioItemBySlug`, `getRelatedPortfolioItems`, and `getPortfolioDetailBySlug` require an explicit item array.
- The module no longer exports hard-coded `portfolioItems` or `featuredPortfolioItems` arrays.

Run:

```bash
pnpm --filter user exec node --test __tests__/portfolio-content.test.mjs
```

Expected: FAIL because the fixture exports/default arguments still exist and `showOnLanding` is missing.

- [ ] **Step 3: Implement the smallest blog mapper that fits the existing UI**

In `blogPosts.ts`:

- Remove `BlogPostSeed`, `featuredPostDetail`, `createBlogPost`, and every hard-coded blog record.
- Export this pure boundary:

```ts
type BlogAssetUrlResolver = (path: string) => string;

export function mapBlogRows(
  rows: readonly TableRow<"posts">[],
  resolveAssetUrl: BlogAssetUrlResolver,
): BlogPost[];

export function getBlogPostBySlug(
  slug: string,
  posts: readonly BlogPost[],
): BlogPost | undefined;

export function getRelatedBlogPosts(
  currentSlug: string,
  posts: readonly BlogPost[],
  limit?: number,
): BlogPost[];
```

- Keep the current `BlogPostDetail`/`BlogContentBlock` rendering contract. Safely normalize DB content into paragraph blocks; do not render raw HTML and do not add a markdown dependency.
- Use `excerpt`, then `seo_description`, then a trimmed plain-text content prefix for the card summary.
- Set `landingRank`, `bannerRank`, and `popularRank` only when the corresponding DB flag is true, numbering enabled rows in the already sorted DB order.
- Keep author text as `씨브레인`, matching the current UI.
- Add `imageAlt` to `BlogPost`; no visual markup changes are required for this field.

- [ ] **Step 4: Remove portfolio fixture defaults while preserving its mapper**

In `portfolio.ts`:

- Delete `PortfolioItemSeed`, `portfolioDetailImages`, `createPortfolioItem`, `portfolioItems`, and `featuredPortfolioItems`.
- Add `showOnLanding: boolean` to `PortfolioItem` and map it from `row.show_on_landing`.
- Keep `portfolioCategories`, path validation, public URL resolution, pinned ordering, safe plain-text content conversion, SEO helpers, and navigation helpers.
- Remove all default fixture arguments from slug/related/detail helpers. Callers must pass an explicit DB-derived list.

- [ ] **Step 5: Run focused tests and commit only mapper work**

Run:

```bash
pnpm --filter user exec node --test \
  __tests__/blog-content.test.mjs \
  __tests__/portfolio-content.test.mjs
```

Expected: PASS.

Commit:

```bash
git add \
  'apps/user/__tests__/blog-content.test.mjs' \
  'apps/user/__tests__/portfolio-content.test.mjs' \
  'apps/user/app/(site)/blog/_types/blog.ts' \
  'apps/user/app/(site)/blog/_data/blogPosts.ts' \
  'apps/user/app/_content/portfolio.ts'
git commit -m "refactor(user): map public content from database rows"
```

---

### Task 3: Add one server-only public content loader

**Files:**

- Create: `apps/user/lib/publicContent.ts`
- Create: `apps/user/__tests__/public-content-loader.test.mjs`

- [ ] **Step 1: Write the loader contract test first**

Assert that the loader:

- Uses `createPublicUserSupabaseClient`, which supplies no auth cookies.
- Calls existing `listPublishedPosts(client, 'blog')` and `listPublishedPortfolioItems(client)` helpers.
- Resolves storage paths with existing `getPublicAssetUrl`.
- Calls the two pure mapper functions.
- Returns empty arrays when public Supabase environment variables are absent or the query fails.
- Does not import fixture arrays, a secret key, service role, browser-side hooks, or a new API route.

Run:

```bash
pnpm --filter user exec node --test __tests__/public-content-loader.test.mjs
```

Expected: FAIL because `apps/user/lib/publicContent.ts` does not exist.

- [ ] **Step 2: Implement the server boundary**

Create `publicContent.ts` with only these exports:

```ts
export const getPublishedBlogPosts: () => Promise<BlogPost[]>;
export const getPublishedPortfolioItems: () => Promise<PortfolioItem[]>;
```

Implementation rules:

- Mark the module server-only.
- Wrap each loader with React `cache` so detail rendering and `generateMetadata` share one request-scoped query. This follows Next.js guidance for non-`fetch` data clients: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Return `[]` if `createPublicUserSupabaseClient()` returns null.
- Catch query errors, log one route-neutral error message, and return `[]`; never return fixture content.
- Use `listPublishedPosts(client, 'blog')` and `listPublishedPortfolioItems(client)` as the only table queries.
- Resolve non-local storage paths through `getPublicAssetUrl(client, path)`.

- [ ] **Step 3: Run and commit the loader contract**

Run:

```bash
pnpm --filter user exec node --test __tests__/public-content-loader.test.mjs
pnpm --filter @repo/supabase test
```

Expected: PASS; existing shared Supabase helper tests remain green.

Commit:

```bash
git add \
  'apps/user/lib/publicContent.ts' \
  'apps/user/__tests__/public-content-loader.test.mjs'
git commit -m "feat(user): load published content from supabase"
```

---

### Task 4: Feed DB content into the unchanged landing, list, and detail UI

**Files:**

- Modify: `apps/user/__tests__/blog-page.test.mjs`
- Modify: `apps/user/__tests__/portfolio-page.test.mjs`
- Modify: `apps/user/app/(site)/page.tsx`
- Modify: `apps/user/app/_components/BlogSection.tsx`
- Modify: `apps/user/app/_components/PortfolioSection.tsx`
- Modify: `apps/user/app/(site)/blog/page.tsx`
- Modify: `apps/user/app/(site)/blog/[slug]/page.tsx`
- Modify: `apps/user/app/(site)/blog/_components/BlogCard.tsx`
- Modify: `apps/user/app/(site)/blog/_components/BlogFeaturedCard.tsx`
- Modify: `apps/user/app/(site)/portfolio/page.tsx`
- Modify: `apps/user/app/(site)/portfolio/[slug]/page.tsx`

- [ ] **Step 1: Replace fixture-only assertions with DB-wiring and UI-invariance assertions**

Update the existing source-contract tests to require:

- Home, blog list/detail, and portfolio list/detail use `getPublishedBlogPosts` or `getPublishedPortfolioItems`.
- `BlogSection` receives `posts`; `PortfolioSection` receives `items` while retaining `initialCategoryId`.
- No page or component imports `blogPosts`, `portfolioItems`, or `featuredPortfolioItems`.
- Existing class names, semantic tags, visible text, carousel logic, category controls, storage-based scroll restoration, links, image `sizes`, and empty-state wording remain present.
- Detail metadata, JSON-LD, canonical URLs, related-content order, and `notFound()` behavior remain present.
- Blog cards use DB-derived `imageAlt` while keeping identical image markup and dimensions.

Run:

```bash
pnpm --filter user exec node --test \
  __tests__/blog-page.test.mjs \
  __tests__/portfolio-page.test.mjs
```

Expected: FAIL because the pages still import fixtures.

- [ ] **Step 2: Load both collections once in the home server component**

In `apps/user/app/(site)/page.tsx`:

- Load blog and portfolio content in parallel with `Promise.all`.
- Pass DB-derived arrays into the existing sections.
- Keep the current section order and every other prop unchanged.

In the landing sections:

```ts
type BlogSectionProps = {
  posts: readonly BlogPost[];
};

type PortfolioSectionProps = {
  initialCategoryId?: PortfolioCategoryId;
  items: readonly PortfolioItem[];
};
```

- Keep `PortfolioSection` as a client component.
- Blog landing cards remain the first three rows with `landingRank`, in rank order.
- Portfolio landing cards are `showOnLanding === true`, filtered by the active existing category, in pinned/DB order, capped at 12.
- When arrays are empty, render the same section shell and existing empty behavior; do not add new copy or CSS.

- [ ] **Step 3: Wire the two list pages**

- Blog list: await `getPublishedBlogPosts()` and pass the result to the unchanged `BlogBoard`.
- Portfolio list: await `getPublishedPortfolioItems()` and pass the result to the unchanged `PortfolioGallery`.
- Keep category query-string handling and static list-page metadata unchanged.

- [ ] **Step 4: Wire dynamic detail, metadata, and related content**

For both detail routes:

- Use the cached loader in `generateMetadata` and the page component.
- Pass the loaded array into slug, related-content, and detail helper functions.
- Keep DB-backed detail pages request-rendered with `revalidate = 0`; do not snapshot admin content in `generateStaticParams`.
- Preserve the current fallback metadata and call `notFound()` when a published slug is absent.
- Preserve all JSON-LD, canonical, social image, return-link, and interaction behavior.

- [ ] **Step 5: Run regression tests and prove that UI source files did not change stylistically**

Run:

```bash
pnpm --filter user exec node --test \
  __tests__/blog-page.test.mjs \
  __tests__/portfolio-page.test.mjs \
  __tests__/structured-data.test.mjs

git diff --name-only -- apps/user | rg '\.css$'
```

Expected: tests PASS; the CSS command prints no files.

Commit:

```bash
git add \
  'apps/user/__tests__/blog-page.test.mjs' \
  'apps/user/__tests__/portfolio-page.test.mjs' \
  'apps/user/app/(site)/page.tsx' \
  'apps/user/app/_components/BlogSection.tsx' \
  'apps/user/app/_components/PortfolioSection.tsx' \
  'apps/user/app/(site)/blog/page.tsx' \
  'apps/user/app/(site)/blog/[slug]/page.tsx' \
  'apps/user/app/(site)/blog/_components/BlogCard.tsx' \
  'apps/user/app/(site)/blog/_components/BlogFeaturedCard.tsx' \
  'apps/user/app/(site)/portfolio/page.tsx' \
  'apps/user/app/(site)/portfolio/[slug]/page.tsx'
git commit -m "feat(user): connect blog and portfolio to admin content"
```

---

### Task 5: Make sitemap content follow the same published DB source

**Files:**

- Modify: `apps/user/__tests__/sitemap.test.mjs`
- Modify: `apps/user/app/sitemap.ts`

- [ ] **Step 1: Write the failing sitemap contract**

Require the sitemap route to:

- Be async.
- Load published blog and portfolio content from `publicContent.ts`.
- Include only returned published slugs.
- Preserve existing notice, review, static-route, priority, and change-frequency behavior.
- Contain no fixture imports.

Run:

```bash
pnpm --filter user exec node --test __tests__/sitemap.test.mjs
```

Expected: FAIL because the sitemap is synchronous and maps fixture arrays.

- [ ] **Step 2: Implement the dynamic groups without changing sitemap shape**

- Await both published collections in parallel.
- Map the same `/blog/{slug}` and `/portfolio/{slug}` routes and current priorities.
- Retain blog `lastModified` from `publishedAtIso`.
- If Supabase is unavailable, omit only the blog and portfolio dynamic groups; retain all existing static, notice, and review entries.
- Do not introduce a separate sitemap cache. Set `revalidate = 0` so admin publication changes are reflected without a new deployment.

- [ ] **Step 3: Run and commit**

Run:

```bash
pnpm --filter user exec node --test __tests__/sitemap.test.mjs
```

Expected: PASS.

Commit:

```bash
git add \
  'apps/user/__tests__/sitemap.test.mjs' \
  'apps/user/app/sitemap.ts'
git commit -m "fix(user): source public sitemap content from supabase"
```

---

### Task 6: Run automated, security, visual, and end-to-end QA

**Files:**

- Verify only; no expected production code changes
- Optional local evidence: `artifacts/blog-portfolio-db-qa/`

- [ ] **Step 1: Run the complete automated gate**

Run:

```bash
pnpm --filter @repo/supabase test
pnpm --filter user test
pnpm --filter user lint
pnpm --filter user check-types
pnpm --filter user build
git diff --check
```

Expected: every command passes with zero warnings promoted to errors.

- [ ] **Step 2: Prove fixtures, secret access, CSS changes, and remote Figma URLs are absent**

Run:

```bash
rg "export const (blogPosts|portfolioItems|featuredPortfolioItems)|createBlogPost\(|createPortfolioItem\(" apps/user/app
rg "SUPABASE_SECRET_KEY|service_role" \
  apps/user/lib/publicContent.ts \
  'apps/user/app/(site)/blog' \
  'apps/user/app/(site)/portfolio' \
  apps/user/app/_components/BlogSection.tsx \
  apps/user/app/_components/PortfolioSection.tsx
git diff --name-only -- apps/user | rg '\.css$'
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: all four searches print no matches. A no-match `rg` exit status of 1 is expected here.

- [ ] **Step 3: Exercise the publication matrix through the actual admin and user apps**

| Scenario | Admin action | Required user result |
| --- | --- | --- |
| Draft blog | Save draft with all display flags enabled | Absent from home, `/blog`, direct detail, and sitemap |
| Published ordinary blog | Publish with landing/banner/featured off | Present in `/blog` and detail; absent from landing/banner/TOP5 |
| Featured blog | Enable landing, banner, and featured one at a time | Appears only in the matching existing UI location and DB order |
| Draft portfolio | Save draft with landing enabled | Absent from home, list, direct detail, and sitemap |
| Published portfolio | Publish with landing off | Present in list/detail and correct category; absent from home |
| Landing/pinned portfolio | Enable landing and pinned | Present in the selected landing category and ordered before unpinned rows |
| Edit | Change title, content, category/type, image/alt, and flags | Refresh shows the DB update everywhere without layout or route regression |
| Unpublish/delete | Return to draft or delete the QA row | Removed from public surfaces; old detail URL returns 404 |

- [ ] **Step 4: Verify RLS from the public application path**

Using the publishable-key client while signed out:

- SELECT returns published blog/portfolio rows only.
- A known draft slug returns no row.
- INSERT, UPDATE, and DELETE attempts fail.
- No secret key is present in browser bundles or network requests.

Expected: the user app can read published content but cannot read drafts or mutate content.

- [ ] **Step 5: Repeat the visual baseline at all three widths**

Compare the same routes at 390px, 1080px, and 1440px. Content differences are expected; reject changes to:

- Header/hero/section/CTA positions.
- Card aspect ratios, gaps, grid columns, font sizes, line heights, button dimensions, or breakpoints.
- Portfolio category interaction, scroll restoration, and back-link destinations.
- Blog category links, carousel timing/controls, popular list, card links, or back-link restoration.
- Empty-state placement, focus visibility, keyboard navigation, or image behavior.

Expected: no UI or interaction regression. If a long DB title/content causes overflow, fix the data or reuse existing truncation behavior; do not redesign the component in this scope.

- [ ] **Step 6: Deploy in a data-safe order and smoke test**

1. Finish and verify production blog/portfolio rows in the existing admin UI.
2. Confirm production RLS and public storage access with the read-only checks from Task 1.
3. Deploy the user code.
4. Smoke test `/`, `/blog`, one blog detail, `/portfolio`, one portfolio detail, and `/sitemap.xml` while signed out.
5. Verify one admin edit appears after refresh and one draft remains invisible.

Rollback: revert the user-code commits if the public rendering fails. No database rollback is required because this plan applies no schema or data migration.

## Definition of Done

- Supabase is the only runtime source for user-facing blog and portfolio records.
- Existing admin create/edit/draft/publish/delete changes are reflected correctly on the user site.
- Draft/archived content cannot be read publicly.
- Landing/banner/featured/pinned/category/order flags behave as mapped above.
- List, detail, SEO, JSON-LD, and sitemap all use the same published DB source.
- No mock record fallback, new dependency, API route, schema change, secret-key read, CSS change, or UI redesign is present.
- Automated checks and the full manual publication/visual matrix pass.
