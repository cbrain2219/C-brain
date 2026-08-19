import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createInitialBlogForm,
  filterBlogRows,
  getBlogThumbnailDisplayName,
  getBlogSettingCounts,
  toBlogFormState,
  toBlogListRow,
  toBlogMutationInput,
} from '../src/pages/blogData.ts'

function makePost(overrides = {}) {
  return {
    content: '<p>본문</p>',
    content_asset_scope: '00000000-0000-4000-8000-0000000000ab',
    content_authoring_mode: 'raw_html',
    content_json: null,
    content_mode: 'html',
    content_schema_version: 1,
    content_source_backup: null,
    created_at: '2026-07-21T00:00:00.000Z',
    excerpt: null,
    featured: false,
    id: 'post-1',
    kind: 'blog',
    pinned: false,
    published_at: '2026-07-21T00:00:00.000Z',
    seo_description: '검색 설명',
    show_as_banner: true,
    show_on_landing: true,
    slug: 'first-blog',
    sort_order: 0,
    status: 'published',
    thumbnail_alt: '썸네일',
    thumbnail_file_name: '씨브레인 오지.png',
    thumbnail_path: 'blog-thumbnails/post.webp',
    title: '첫 블로그',
    type: '디자인',
    view_count: 1234,
    ...overrides,
  }
}

test('new blog forms start in raw HTML authoring mode', () => {
  assert.equal(createInitialBlogForm().contentAuthoringMode, 'raw_html')
})

test('post row maps to list and edit form state', () => {
  const post = makePost({ type: ' 브로슈어·카탈로그 ' })
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
  assert.equal(row.type, '브로슈어 · 카탈로그')
  assert.equal(form.publishedAt, '2026-07-21')
  assert.equal(form.seoDescription, '검색 설명')
  assert.equal(form.thumbnailFileName, '씨브레인 오지.png')
  assert.equal(form.thumbnailPath, 'blog-thumbnails/post.webp')
  assert.equal(form.thumbnailPreviewUrl, 'https://example.com/post.webp')
  assert.equal(form.type, '브로슈어 · 카탈로그')
  assert.equal(form.contentAuthoringMode, 'raw_html')
  assert.equal(form.contentAssetScope, '00000000-0000-4000-8000-0000000000ab')
})

test('form preserves raw HTML bytes while trimming surrounding field values', () => {
  const form = {
    ...createInitialBlogForm(),
    content: '  <p>본문</p>  ',
    contentAuthoringMode: 'raw_html',
    contentJson: null,
    isBannerEnabled: false,
    isFeaturedEnabled: true,
    publishedAt: '2026-07-21',
    seoDescription: '  검색 설명  ',
    slug: '  first-blog  ',
    thumbnailAlt: '  썸네일  ',
    thumbnailFileName: '  씨브레인 오지.png  ',
    thumbnailPath: 'blog-thumbnails/post.webp',
    title: '  첫 블로그  ',
    type: '  인쇄   실무팁  ',
  }

  assert.deepEqual(toBlogMutationInput(form, 'draft'), {
    content: '  <p>본문</p>  ',
    content_asset_scope: form.contentAssetScope,
    content_authoring_mode: 'raw_html',
    content_json: null,
    content_mode: 'html',
    content_schema_version: 1,
    content_source_backup: null,
    excerpt: null,
    featured: true,
    kind: 'blog',
    pinned: false,
    published_at: '2026-07-20T15:00:00.000Z',
    seo_description: '검색 설명',
    show_as_banner: false,
    show_on_landing: true,
    slug: 'first-blog',
    status: 'draft',
    thumbnail_alt: '썸네일',
    thumbnail_file_name: '씨브레인 오지.png',
    thumbnail_path: 'blog-thumbnails/post.webp',
    title: '첫 블로그',
    type: '인쇄 실무팁',
  })
})

test('mutation clears thumbnail alt text when no thumbnail path is saved', () => {
  const form = {
    ...createInitialBlogForm(),
    content: '<p>본문</p>',
    contentAuthoringMode: 'raw_html',
    contentJson: null,
    publishedAt: '2026-07-21',
    slug: 'first-blog',
    thumbnailAlt: '남아 있는 대체 텍스트',
    title: '첫 블로그',
    type: '디자인',
  }

  const mutation = toBlogMutationInput(form, 'draft')

  assert.equal(mutation.thumbnail_alt, null)
  assert.equal(mutation.thumbnail_file_name, null)
  assert.equal(mutation.thumbnail_path, null)
})

test('thumbnail chip keeps a persisted original name and hides legacy UUID paths', () => {
  assert.equal(
    getBlogThumbnailDisplayName({
      thumbnail: null,
      thumbnailFileName: '씨브레인 오지.png',
    }),
    '씨브레인 오지.png',
  )
  assert.equal(
    getBlogThumbnailDisplayName({
      thumbnail: null,
      thumbnailFileName: null,
    }),
    '등록된 썸네일',
  )
})

test('list filtering and setting counts use loaded post rows', () => {
  const posts = [
    makePost(),
    makePost({
      featured: true,
      id: 'post-2',
      show_as_banner: false,
      show_on_landing: false,
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

test('mutation rejects the all-items filter label as a blog category', () => {
  const form = {
    ...createInitialBlogForm(),
    content: '<p>본문</p>',
    contentAuthoringMode: 'raw_html',
    contentJson: null,
    publishedAt: '2026-07-21',
    slug: 'first-blog',
    title: '첫 블로그',
    type: ' 전체 ',
  }

  assert.throws(() => toBlogMutationInput(form, 'published'), {
    message: '블로그 정보를 확인해주세요.',
  })
})
