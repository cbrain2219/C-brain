import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { URL } from 'node:url'

const baselineUrl = new URL('../../../supabase/initial_admin_content.sql', import.meta.url)
const legacyAdminContentMigrationUrl = new URL(
  '../../../supabase/migrations/20260721000003_create_admin_content.sql',
  import.meta.url,
)
const managedContentMigrationUrl = new URL(
  '../../../supabase/migrations/20260814000000_add_managed_content_editor.sql',
  import.meta.url,
)
const blogThumbnailFileNameMigrationUrl = new URL(
  '../../../supabase/migrations/20260818063308_add_blog_thumbnail_file_name.sql',
  import.meta.url,
)
const reviewYouTubeSqlUrl = new URL(
  '../../../supabase/manual/add_review_youtube_video.sql',
  import.meta.url,
)
const reviewProjectInfoSqlUrl = new URL(
  '../../../supabase/manual/add_review_project_info.sql',
  import.meta.url,
)
const blogDataUrl = new URL('../../../apps/admin/src/pages/blogData.ts', import.meta.url)
const portfolioDataUrl = new URL('../../../apps/admin/src/pages/portfolioData.ts', import.meta.url)
const reviewDataUrl = new URL('../../../apps/admin/src/pages/reviewData.ts', import.meta.url)
const typesUrl = new URL('../src/types.ts', import.meta.url)

const [
  baseline,
  legacyAdminContentMigration,
  managedContentMigration,
  blogThumbnailFileNameMigration,
  reviewProjectInfoSql,
  reviewYouTubeSql,
  blogData,
  portfolioData,
  reviewData,
  types,
] = await Promise.all([
  readFile(baselineUrl, 'utf8'),
  readFile(legacyAdminContentMigrationUrl, 'utf8'),
  readFile(managedContentMigrationUrl, 'utf8'),
  readFile(blogThumbnailFileNameMigrationUrl, 'utf8'),
  readFile(reviewProjectInfoSqlUrl, 'utf8'),
  readFile(reviewYouTubeSqlUrl, 'utf8'),
  readFile(blogDataUrl, 'utf8'),
  readFile(portfolioDataUrl, 'utf8'),
  readFile(reviewDataUrl, 'utf8'),
  readFile(typesUrl, 'utf8'),
])
const legacySubtypeColumn = ['product', 'subtype'].join('_')

function assertContains(source, values) {
  values.forEach((value) => {
    assert.match(source, new RegExp(`\\b${value}\\b`), `missing ${value}`)
  })
}

test('fresh baseline declares the current admin content contracts', () => {
  assertContains(baseline, [
    'products',
    'posts',
    'portfolio_items',
    'reviews',
    'complaints',
    'complaint_attachments',
    'show_on_landing',
    'show_as_banner',
    'featured',
    'pinned',
    'company_name',
    'manager_name',
    'project_deliverable',
    'project_usage',
    'youtube_video_id',
    'complaint_type',
    'phone_verified',
    'privacy_agreed_at',
    'object_path',
    'original_file_name',
    'thumbnail_file_name',
  ])
  assert.match(baseline, /content_mode in \('html', 'markdown'\)/)
  assert.match(
    baseline,
    /constraint posts_thumbnail_alt_requires_path\s+check \(thumbnail_path is not null or thumbnail_alt is null\)/,
  )
  assert.match(
    baseline,
    /constraint posts_thumbnail_file_name_requires_path[\s\S]*?thumbnail_file_name is null[\s\S]*?thumbnail_path is not null/,
  )
  assert.doesNotMatch(baseline, /create table public\.inquiries/)
})

test('baseline restricts public reads and admin mutations with RLS', () => {
  for (const table of ['products', 'posts', 'portfolio_items', 'reviews']) {
    assert.match(baseline, new RegExp(`alter table public\\.${table} enable row level security`))
    assert.match(
      baseline,
      new RegExp(`create policy ${table}[^\\n]*public_read_published[\\s\\S]*?using \\(status = 'published'\\)`),
    )
  }

  assert.match(baseline, /auth\.jwt\(\) -> 'app_metadata' ->> 'role'/)
  assert.match(baseline, /create policy complaints_admin_read/)
  assert.match(baseline, /create policy complaints_admin_update_status/)
  assert.match(baseline, /grant update \(status\) on public\.complaints/)
  assert.doesNotMatch(baseline, /grant insert[^;]*public\.complaints/)
  assert.doesNotMatch(baseline, /grant delete[^;]*public\.complaints/)
})

test('managed content keeps inactive authoring fields outside anonymous reads', () => {
  const publicFields = [
    'content',
    'content_mode',
    'content_authoring_mode',
    'content_asset_scope',
  ]
  const privateFields = [
    'content_json',
    'content_source_backup',
    'content_schema_version',
    'thumbnail_file_name',
  ]

  for (const table of ['posts', 'portfolio_items', 'reviews']) {
    const baselineGrant = new RegExp(
      `grant select \\(([\\s\\S]*?)\\) on public\\.${table} to anon;`,
    ).exec(baseline)
    assert.ok(baselineGrant, `missing anonymous ${table} column grant`)
    for (const field of publicFields) assert.match(baselineGrant[1], new RegExp(`\\b${field}\\b`))
    for (const field of privateFields) assert.doesNotMatch(baselineGrant[1], new RegExp(`\\b${field}\\b`))

    for (const source of [baseline, managedContentMigration]) {
      const policy = new RegExp(
        `create policy ${table}_public_read_published([\\s\\S]*?);`,
      ).exec(source)
      assert.ok(policy, `missing ${table} public-read policy`)
      assert.match(policy[1], /for select\s+to anon\s+using \(status = 'published'\)/)
      assert.doesNotMatch(policy[1], /to anon, authenticated/)
    }
  }

  assert.match(
    managedContentMigration,
    /revoke all privileges on table public\.posts, public\.portfolio_items, public\.reviews\s+from public, anon;/,
  )
  assert.match(managedContentMigration, /from information_schema\.columns/)
  assert.match(
    managedContentMigration,
    /column_name not in \(\s*'content_json',\s*'content_source_backup',\s*'content_schema_version'\s*\)/,
  )
  assert.match(
    managedContentMigration,
    /format\(\s*'grant select \(%s\) on table public\.%I to anon'/,
  )
  assert.match(legacyAdminContentMigration, /is_landing_enabled boolean/)
  assert.match(legacyAdminContentMigration, /company text not null/)
  assert.match(
    managedContentMigration,
    /\('posts', 'is_landing_enabled', 'show_on_landing'\)/,
  )
  assert.match(
    managedContentMigration,
    /\('reviews', 'company', 'company_name'\)/,
  )
  assert.match(
    managedContentMigration,
    /grant select, insert, update, delete\s+on public\.posts, public\.portfolio_items, public\.reviews\s+to authenticated;/,
  )
  assert.match(
    managedContentMigration,
    /grant all privileges on table public\.posts, public\.portfolio_items, public\.reviews\s+to service_role;/,
  )
})

test('baseline provisions public and private storage policies', () => {
  assert.match(baseline, /'public-assets'[\s\S]*?true/)
  assert.match(baseline, /'private-attachments'[\s\S]*?false/)
  assert.match(baseline, /create policy public_assets_admin_insert/)
  assert.match(baseline, /create policy public_assets_admin_update/)
  assert.match(baseline, /create policy public_assets_admin_delete/)
  assert.match(baseline, /create policy private_attachments_admin_read/)
  assert.equal((baseline.match(/'video\/quicktime'/g) ?? []).length, 1)
})

test('reorder RPCs validate complete duplicate-free ID lists', () => {
  assertContains(baseline, [
    'reorder_products',
    'reorder_posts',
    'reorder_portfolio_items',
    'reorder_reviews',
    'cardinality',
  ])
  assert.equal((baseline.match(/count\(distinct /g) ?? []).length, 4)
})

test('TypeScript mirrors the current content tables', () => {
  assert.match(
    types,
    /posts:\s*\{[\s\S]*?Row:\s*\{[\s\S]*?featured: boolean;[\s\S]*?pinned: boolean;[\s\S]*?show_as_banner: boolean;[\s\S]*?show_on_landing: boolean;/,
  )
  assert.match(
    types,
    /portfolio_items:\s*\{[\s\S]*?Row:\s*\{[\s\S]*?pinned: boolean;[\s\S]*?show_on_landing: boolean;/,
  )
  assert.match(
    types,
    /reviews:\s*\{[\s\S]*?Row:\s*\{[\s\S]*?company_name: string;[\s\S]*?manager_name: string \| null;[\s\S]*?project_deliverable: string \| null;[\s\S]*?project_usage: string \| null;[\s\S]*?show_on_landing: boolean;[\s\S]*?youtube_video_id: string \| null;/,
  )
  assert.match(
    types,
    /complaints:\s*\{[\s\S]*?Row:\s*\{[\s\S]*?complaint_type: string;[\s\S]*?privacy_agreed_at: string;/,
  )
  assert.match(
    types,
    /complaint_attachments:\s*\{[\s\S]*?Row:\s*\{[\s\S]*?object_path: string;[\s\S]*?original_file_name: string;/,
  )
  assert.match(types, /content_mode: "html" \| "markdown"/)
  const postsType = /posts:\s*\{([\s\S]*?)Relationships: \[\];/.exec(types)
  assert.ok(postsType)
  for (const section of ['Row', 'Insert', 'Update']) {
    const sectionType = new RegExp(`${section}:\\s*\\{([\\s\\S]*?)\\n\\s*\\};`).exec(postsType[1])
    assert.ok(sectionType)
    assert.match(sectionType[1], /thumbnail_file_name\??: string \| null;/)
  }
})

test('blog thumbnail filename migration adds private nullable metadata safely', () => {
  assert.match(
    blogThumbnailFileNameMigration,
    /alter table public\.posts\s+add column if not exists thumbnail_file_name text/,
  )
  assert.match(
    blogThumbnailFileNameMigration,
    /add constraint posts_thumbnail_file_name_requires_path[\s\S]*?thumbnail_file_name is null[\s\S]*?thumbnail_path is not null[\s\S]*?nullif\(btrim\(thumbnail_file_name\), ''\) is not null[\s\S]*?not valid/,
  )
  assert.match(
    blogThumbnailFileNameMigration,
    /validate constraint posts_thumbnail_file_name_requires_path/,
  )
  assert.match(
    blogThumbnailFileNameMigration,
    /revoke select \(thumbnail_file_name\) on table public\.posts from public, anon/,
  )
  assert.match(blogThumbnailFileNameMigration, /notify pgrst, 'reload schema'/)
  assert.doesNotMatch(
    blogThumbnailFileNameMigration,
    /grant select[^;]*thumbnail_file_name[^;]*to anon/,
  )
})

test('managed content columns and WYSIWYG constraints match the database contract', () => {
  const columns = [
    'content_authoring_mode',
    'content_json',
    'content_schema_version',
    'content_source_backup',
    'content_asset_scope',
  ]

  for (const table of ['posts', 'portfolio_items', 'reviews']) {
    const tableMatch = new RegExp(
      `${table}:\\s*\\{([\\s\\S]*?)Relationships: \\[\\];`,
    ).exec(types)
    assert.ok(tableMatch, `missing ${table} TypeScript table contract`)

    for (const section of ['Row', 'Insert', 'Update']) {
      const sectionMatch = new RegExp(
        `${section}:\\s*\\{([\\s\\S]*?)\\n\\s*\\};`,
      ).exec(tableMatch[1])
      assert.ok(sectionMatch, `missing ${table} ${section} contract`)

      for (const column of columns) {
        assert.match(sectionMatch[1], new RegExp(`\\b${column}\\??:`))
      }
    }

    assert.match(
      baseline,
      new RegExp(`create table public\\.${table} \\([\\s\\S]*?content_asset_scope uuid not null`),
    )
  }

  assert.match(
    managedContentMigration,
    /content_authoring_mode <> 'wysiwyg'[\s\S]*?content_mode = 'html'[\s\S]*?jsonb_typeof\(content_json\) = 'object'[\s\S]*?content_json ->> 'type' = 'doc'/,
  )
})

test('managed migration converges the legacy admin schema before current admin mappings run', () => {
  const legacyPairs = [
    ['posts', 'is_landing_enabled', 'show_on_landing'],
    ['posts', 'is_banner_enabled', 'show_as_banner'],
    ['posts', 'is_featured_enabled', 'featured'],
    ['posts', 'is_pinned', 'pinned'],
    ['portfolio_items', 'is_landing_enabled', 'show_on_landing'],
    ['portfolio_items', 'is_pinned', 'pinned'],
    ['reviews', 'company', 'company_name'],
    ['reviews', 'manager', 'manager_name'],
    ['reviews', 'is_landing_enabled', 'show_on_landing'],
  ]

  assert.match(legacyAdminContentMigration, /is_featured_enabled boolean/)
  assert.match(legacyAdminContentMigration, /is_pinned boolean/)
  assert.match(legacyAdminContentMigration, /manager text/)
  assert.match(baseline, /show_on_landing boolean/)
  assert.match(baseline, /company_name text not null/)

  assert.match(managedContentMigration, /from information_schema\.columns/)
  assert.match(
    managedContentMigration,
    /cannot converge public\.%: both legacy column % and canonical column % exist/,
  )

  for (const [table, legacyColumn, canonicalColumn] of legacyPairs) {
    assert.match(
      managedContentMigration,
      new RegExp(
        `\\('${table}', '${legacyColumn}', '${canonicalColumn}'\\)[\\s\\S]*?alter table public\\.%I rename column %I to %I`,
      ),
      `migration must conditionally rename ${table}.${legacyColumn}`,
    )
  }

  for (const column of ['project_deliverable', 'project_usage', 'youtube_video_id']) {
    assert.match(
      managedContentMigration,
      new RegExp(`add column if not exists ${column} text`),
    )
  }
  for (const constraint of [
    'reviews_youtube_video_id_format_check',
    'reviews_video_source_check',
    'reviews_project_deliverable_nonblank_check',
    'reviews_project_usage_nonblank_check',
  ]) {
    assert.match(
      managedContentMigration,
      new RegExp(`conname = '${constraint}'[\\s\\S]*?add constraint ${constraint}`),
      `migration must add ${constraint} only when the current history has not already done so`,
    )
  }
  assert.match(
    managedContentMigration,
    /even NOT VALID:[\s\S]*?still rejects every later UPDATE[\s\S]*?legacy published interview/,
  )
  assert.doesNotMatch(
    managedContentMigration,
    /add constraint reviews_published_interview_(?:project_info|video)_check/,
  )

  const dynamicGrant = managedContentMigration.indexOf('from information_schema.columns')
  const firstLegacyPair = managedContentMigration.indexOf("('posts', 'is_landing_enabled', 'show_on_landing')")
  assert.ok(firstLegacyPair >= 0 && firstLegacyPair < dynamicGrant)

  for (const [source, columns] of [
    [blogData, ['show_on_landing', 'show_as_banner', 'featured', 'pinned']],
    [portfolioData, ['show_on_landing', 'pinned']],
    [
      reviewData,
      [
        'company_name',
        'manager_name',
        'show_on_landing',
        'project_deliverable',
        'project_usage',
        'youtube_video_id',
      ],
    ],
  ]) {
    for (const column of columns) {
      assert.match(source, new RegExp(`\\b${column}\\b`))
    }
  }
})

test('content asset scopes are immutable after insert across both database histories', () => {
  const sources = [
    ['fresh baseline', baseline],
    ['managed-content migration', managedContentMigration],
  ]

  for (const [name, source] of sources) {
    assert.match(
      source,
      /create or replace function public\.prevent_content_asset_scope_change\(\)\s+returns trigger\s+language plpgsql\s+set search_path = ''/,
      `${name} must define the scope guard with a safe search path`,
    )
    assert.match(
      source,
      /if new\.content_asset_scope is distinct from old\.content_asset_scope then\s+raise exception 'content_asset_scope is immutable';/,
      `${name} must allow same-value scope updates while rejecting scope rotation`,
    )
    assert.match(
      source,
      /revoke execute on function public\.prevent_content_asset_scope_change\(\)\s+from public, anon, authenticated;/,
      `${name} must not expose the trigger function for direct execution`,
    )

    for (const table of ['posts', 'portfolio_items', 'reviews']) {
      assert.match(
        source,
        new RegExp(
          `create trigger ${table}_prevent_content_asset_scope_change\\s+before update of content_asset_scope on public\\.${table}\\s+for each row\\s+execute function public\\.prevent_content_asset_scope_change\\(\\);`,
        ),
        `${name} must guard ${table} scope changes`,
      )
    }
  }

  for (const table of ['posts', 'portfolio_items', 'reviews']) {
    const backfill = managedContentMigration.indexOf(`update public.${table}`)
    const trigger = managedContentMigration.indexOf(
      `create trigger ${table}_prevent_content_asset_scope_change`,
    )
    assert.ok(backfill >= 0 && trigger > backfill, `${table} scope guard must follow its backfill`)
  }

  assert.match(legacyAdminContentMigration, /enum \('html', 'text'\)/)
  assert.match(baseline, /content_asset_scope uuid not null default gen_random_uuid\(\)/)
})

test('the managed-content migration safely reconciles both content-mode histories', () => {
  assert.match(legacyAdminContentMigration, /enum \('html', 'text'\)/)
  assert.match(
    managedContentMigration,
    /^begin;\s+set local lock_timeout = '5s';\s+set local statement_timeout = '30s';/,
  )

  for (const table of ['posts', 'portfolio_items', 'reviews']) {
    assert.match(
      managedContentMigration,
      new RegExp(
        `alter table public\\.${table} alter column content_mode type text\\s+using case[\\s\\S]*?when content_mode::text = 'text' then 'markdown'`,
      ),
    )
    assert.match(
      managedContentMigration,
      new RegExp(
        `constraint ${table}_content_mode_check\\s+check \\(content_mode in \\('html', 'markdown'\\)\\)`,
      ),
    )
    assert.match(managedContentMigration, /from pg_trigger/)
    assert.match(managedContentMigration, /and not tgisinternal/)
    assert.doesNotMatch(managedContentMigration, /disable trigger user|enable trigger user/)
    assert.match(
      managedContentMigration,
      new RegExp(
        `tgname = '${table}_set_updated_at'[\\s\\S]*?update public\\.${table}[\\s\\S]*?enable(?: always| replica)? trigger ${table}_set_updated_at`,
      ),
      `${table} must preserve the documented updated-at trigger state around its backfill`,
    )
  }

  assert.doesNotMatch(
    managedContentMigration,
    /\b(?:update|insert into)\s+public\.(?:posts|portfolio_items|reviews)[\s\S]*?\bcontent\s*=/i,
  )
})

test('manual review YouTube SQL replaces the known legacy published-video check', () => {
  assert.match(reviewYouTubeSql, /add column if not exists youtube_video_id text/)
  assert.match(reviewYouTubeSql, /drop constraint if exists reviews_check/)
  assert.doesNotMatch(reviewYouTubeSql, /do \$migration\$/)
  assert.match(reviewYouTubeSql, /constraint reviews_youtube_video_id_format_check/)
  assert.match(reviewYouTubeSql, /constraint reviews_video_source_check/)
  assert.match(reviewYouTubeSql, /constraint reviews_published_interview_video_check/)
  assert.match(
    reviewYouTubeSql,
    /nullif\(btrim\(video_path\), ''\) is not null[\s\S]*or[\s\S]*youtube_video_id is not null/,
  )
})

test('manual review project-info SQL adds, backfills, and validates both fields', () => {
  assert.match(
    reviewProjectInfoSql,
    /add column if not exists project_deliverable text/,
  )
  assert.match(reviewProjectInfoSql, /add column if not exists project_usage text/)
  assert.match(reviewProjectInfoSql, /where kind = 'interview'/)
  assert.match(
    reviewProjectInfoSql,
    /constraint reviews_published_interview_project_info_check/,
  )
  assert.match(reviewProjectInfoSql, /select count\(\*\) as invalid_count/)
})

test('TypeScript mirrors the current JSONB product table', () => {
  assert.match(
    types,
    /products:\s*\{[\s\S]*?Row:\s*\{[\s\S]*?configuration: Json;[\s\S]*?product_type: string;[\s\S]*?sort_order: number;/,
  )
  assert.match(
    types,
    /products:\s*\{[\s\S]*?Insert:\s*\{[\s\S]*?configuration\?: Json;[\s\S]*?product_type: string;[\s\S]*?sort_order\?: number;/,
  )
  assert.doesNotMatch(types, new RegExp(legacySubtypeColumn))
})
