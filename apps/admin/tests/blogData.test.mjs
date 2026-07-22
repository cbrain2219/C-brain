import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createInitialBlogForm,
  filterBlogRows,
  getBlogSettingCounts,
  toBlogFormState,
  toBlogListRow,
  toBlogMutationInput,
} from '../src/pages/blogData.ts'

function makePost(overrides = {}) {
  return {
    content: '<p>본문</p>',
    content_mode: 'html',
    created_at: '2026-07-21T00:00:00.000Z',
    excerpt: null,
    id: 'post-1',
    is_banner_enabled: true,
    is_featured_enabled: false,
    is_landing_enabled: true,
    is_pinned: false,
    kind: 'blog',
    published_at: '2026-07-21T00:00:00.000Z',
    seo: null,
    seo_description: '검색 설명',
    slug: 'first-blog',
    sort_order: 0,
    status: 'published',
    thumbnail_alt: '썸네일',
    thumbnail_path: 'blog-thumbnails/post.webp',
    title: '첫 블로그',
    type: '디자인',
    updated_at: '2026-07-21T00:00:00.000Z',
    view_count: 1234,
    ...overrides,
  }
}

test('post row maps to list and edit form state', () => {
  const post = makePost()
  const row = toBlogListRow(post)
  const form = toBlogFormState(post, 'https://example.com/post.webp')

  assert.deepEqual(
    {
      bannerStatus: row.bannerStatus,
      landingStatus: row.landingStatus,
      popularStatus: row.popularStatus,
      publicationStatus: row.publicationStatus,
      status: row.status,
      views: row.views,
    },
    {
      bannerStatus: 'published',
      landingStatus: 'published',
      popularStatus: 'none',
      publicationStatus: 'published',
      status: '게시됨',
      views: '1,234',
    },
  )
  assert.equal(row.detailHref, '/blog/post-1')
  assert.equal(form.publishedAt, '2026-07-21')
  assert.equal(form.seoDescription, '검색 설명')
  assert.equal(form.thumbnailPath, 'blog-thumbnails/post.webp')
  assert.equal(form.thumbnailPreviewUrl, 'https://example.com/post.webp')
})

test('form maps to a blog mutation with trimmed values and publication settings', () => {
  const form = {
    ...createInitialBlogForm(),
    content: '  <p>본문</p>  ',
    isBannerEnabled: false,
    isFeaturedEnabled: true,
    publishedAt: '2026-07-21',
    seoDescription: '  검색 설명  ',
    slug: '  first-blog  ',
    thumbnailAlt: '  썸네일  ',
    thumbnailPath: 'blog-thumbnails/post.webp',
    title: '  첫 블로그  ',
    type: '  디자인  ',
  }

  assert.deepEqual(toBlogMutationInput(form, 'draft'), {
    content: '<p>본문</p>',
    content_mode: 'html',
    excerpt: null,
    is_banner_enabled: false,
    is_featured_enabled: true,
    is_landing_enabled: true,
    is_pinned: false,
    kind: 'blog',
    published_at: '2026-07-20T15:00:00.000Z',
    seo_description: '검색 설명',
    slug: 'first-blog',
    status: 'draft',
    thumbnail_alt: '썸네일',
    thumbnail_path: 'blog-thumbnails/post.webp',
    title: '첫 블로그',
    type: '디자인',
  })
})

test('list filtering and setting counts use loaded post rows', () => {
  const posts = [
    makePost(),
    makePost({
      id: 'post-2',
      is_banner_enabled: false,
      is_featured_enabled: true,
      is_landing_enabled: false,
      status: 'draft',
      title: '둘째 글',
      type: '인쇄',
    }),
  ]
  const rows = posts.map(toBlogListRow)

  assert.deepEqual(
    filterBlogRows(rows, { query: '둘째', status: '임시저장', type: '인쇄' }),
    [rows[1]],
  )
  assert.deepEqual(getBlogSettingCounts(posts), { banner: 1, featured: 1, landing: 1 })
})

test('mutation rejects missing required blog data', () => {
  assert.throws(() => toBlogMutationInput(createInitialBlogForm(), 'published'), {
    message: '블로그 정보를 확인해주세요.',
  })
})
