import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { URL } from 'node:url'

const baselineUrl = new URL('../../../supabase/initial_admin_content.sql', import.meta.url)
const reviewYouTubeSqlUrl = new URL(
  '../../../supabase/manual/add_review_youtube_video.sql',
  import.meta.url,
)
const typesUrl = new URL('../src/types.ts', import.meta.url)

const [baseline, reviewYouTubeSql, types] = await Promise.all([
  readFile(baselineUrl, 'utf8'),
  readFile(reviewYouTubeSqlUrl, 'utf8'),
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
    'youtube_video_id',
    'complaint_type',
    'phone_verified',
    'privacy_agreed_at',
    'object_path',
    'original_file_name',
  ])
  assert.match(baseline, /content_mode in \('html', 'markdown'\)/)
  assert.match(
    baseline,
    /constraint posts_thumbnail_alt_requires_path\s+check \(thumbnail_path is not null or thumbnail_alt is null\)/,
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
    /reviews:\s*\{[\s\S]*?Row:\s*\{[\s\S]*?company_name: string;[\s\S]*?manager_name: string \| null;[\s\S]*?show_on_landing: boolean;[\s\S]*?youtube_video_id: string \| null;/,
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
