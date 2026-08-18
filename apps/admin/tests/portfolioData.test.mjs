import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterPortfolioRows,
  getPortfolioImages,
  getPortfolioSettingCounts,
  toPortfolioFormValues,
  toPortfolioListRow,
  toPortfolioMutationInput,
} from '../src/pages/portfolioData.ts'

const portfolioItem = {
  client_name: '씨브레인',
  content: '<p>내용</p>',
  content_asset_scope: '00000000-0000-4000-8000-0000000000ab',
  content_authoring_mode: 'raw_html',
  content_json: null,
  content_mode: 'html',
  content_schema_version: 1,
  content_source_backup: null,
  created_at: '2026-07-21T00:00:00.000Z',
  id: 'portfolio-a',
  images: [
    { alt: '첫 이미지', fileName: '첫 이미지.webp', path: 'portfolio/first.webp' },
    { alt: '두 번째 이미지', fileName: '두 번째 이미지.webp', path: 'portfolio/second.webp' },
  ],
  pinned: true,
  published_at: '2026-07-21T00:00:00.000Z',
  show_on_landing: true,
  slug: 'cbrain-work',
  status: 'published',
  title: '씨브레인 포트폴리오',
  type: '브로슈어 · 카탈로그',
  view_count: 1234,
}

test('portfolio DB row maps to list and edit form values', () => {
  const row = toPortfolioListRow(portfolioItem)
  const form = toPortfolioFormValues(portfolioItem)

  assert.deepEqual(
    {
      client: row.client,
      detailHref: row.detailHref,
      landingStatus: row.landingStatus,
      status: row.status,
      views: row.views,
    },
    {
      client: '씨브레인',
      detailHref: '/portfolio/portfolio-a',
      landingStatus: 'published',
      status: 'published',
      views: '1,234',
    },
  )
  assert.deepEqual(form.images, portfolioItem.images)
  assert.equal(form.contentMode, 'html')
  assert.equal(form.contentAuthoringMode, 'raw_html')
  assert.equal(form.contentAssetScope, '00000000-0000-4000-8000-0000000000ab')
  assert.equal(form.isPinned, true)
})

test('portfolio images preserve valid path order and normalize missing alt text', () => {
  assert.deepEqual(
    getPortfolioImages([
      { path: 'portfolio/a.webp' },
      { alt: 'B', path: 'portfolio/b.webp' },
      { alt: '잘못된 행' },
      null,
    ]),
    [
      { alt: '', fileName: 'a.webp', path: 'portfolio/a.webp' },
      { alt: 'B', fileName: 'b.webp', path: 'portfolio/b.webp' },
    ],
  )
})

test('portfolio images preserve the original Korean file name separately from its storage path', () => {
  assert.deepEqual(
    getPortfolioImages([
      {
        alt: '표지',
        fileName: '씨브레인 회사소개서 최종본.jpg',
        path: 'portfolio/11111111-1111-4111-8111-111111111111.jpg',
      },
    ]),
    [
      {
        alt: '표지',
        fileName: '씨브레인 회사소개서 최종본.jpg',
        path: 'portfolio/11111111-1111-4111-8111-111111111111.jpg',
      },
    ],
  )
})

test('portfolio images fall back to the storage filename when fileName is whitespace', () => {
  assert.deepEqual(
    getPortfolioImages([{ alt: '표지', fileName: '   ', path: 'portfolio/storage-name.webp' }]),
    [{ alt: '표지', fileName: 'storage-name.webp', path: 'portfolio/storage-name.webp' }],
  )
})

test('portfolio mutation keeps ordered image paths and draft publication state', () => {
  const form = {
    clientName: ' 씨브레인 ',
    content: '<p>내용</p>',
    contentAssetScope: '00000000-0000-4000-8000-0000000000ab',
    contentAuthoringMode: 'raw_html',
    contentJson: null,
    contentMode: 'html',
    contentSchemaVersion: 1,
    contentSourceBackup: null,
    isLandingEnabled: true,
    isPinned: false,
    slug: ' cbrain-work ',
    title: ' 포트폴리오 ',
    type: ' 브로슈어 ',
  }
  const images = [
    { alt: ' 첫 이미지 ', fileName: ' 첫 이미지.webp ', path: 'portfolio/first.webp' },
    { alt: '두 번째 이미지', fileName: '두 번째 이미지.webp', path: 'portfolio/second.webp' },
  ]

  assert.deepEqual(toPortfolioMutationInput(form, images, 'draft', '2026-07-21T00:00:00Z'), {
    client_name: '씨브레인',
    content: '<p>내용</p>',
    content_asset_scope: '00000000-0000-4000-8000-0000000000ab',
    content_authoring_mode: 'raw_html',
    content_json: null,
    content_mode: 'html',
    content_schema_version: 1,
    content_source_backup: null,
    images: [
      { alt: '첫 이미지', fileName: '첫 이미지.webp', path: 'portfolio/first.webp' },
      { alt: '두 번째 이미지', fileName: '두 번째 이미지.webp', path: 'portfolio/second.webp' },
    ],
    pinned: false,
    published_at: null,
    show_on_landing: true,
    slug: 'cbrain-work',
    status: 'draft',
    title: '포트폴리오',
    type: '브로슈어',
  })
})

test('portfolio mutation falls back to the storage filename when an image fileName is whitespace', () => {
  const form = {
    clientName: '씨브레인',
    content: '<p>내용</p>',
    contentAssetScope: '00000000-0000-4000-8000-0000000000ab',
    contentAuthoringMode: 'raw_html',
    contentJson: null,
    contentMode: 'html',
    contentSchemaVersion: 1,
    contentSourceBackup: null,
    isLandingEnabled: false,
    isPinned: false,
    slug: 'cbrain-work',
    title: '포트폴리오',
    type: '브로슈어',
  }

  const mutation = toPortfolioMutationInput(
    form,
    [{ alt: '표지', fileName: '   ', path: 'portfolio/storage-name.webp' }],
    'draft',
    null,
  )

  assert.deepEqual(mutation.images, [
    { alt: '표지', fileName: 'storage-name.webp', path: 'portfolio/storage-name.webp' },
  ])
})

test('published portfolios require at least one image while drafts may be partial', () => {
  const form = {
    clientName: '씨브레인',
    content: '내용',
    contentAssetScope: '00000000-0000-4000-8000-0000000000ab',
    contentAuthoringMode: 'raw_html',
    contentJson: null,
    contentMode: 'markdown',
    contentSchemaVersion: 1,
    contentSourceBackup: null,
    isLandingEnabled: false,
    isPinned: false,
    slug: 'cbrain-work',
    title: '포트폴리오',
    type: '브로슈어',
  }

  assert.equal(toPortfolioMutationInput(form, [], 'draft', null).status, 'draft')
  assert.throws(() => toPortfolioMutationInput(form, [], 'published', null), {
    message: '게시할 포트폴리오 이미지를 한 장 이상 등록해주세요.',
  })
})

test('portfolio filtering matches Korean status label, type, and title query', () => {
  const rows = [
    {
      ...toPortfolioListRow(portfolioItem),
      id: 'a',
      status: 'published',
      title: '브로슈어 제작',
      type: '브로슈어',
    },
    {
      ...toPortfolioListRow(portfolioItem),
      id: 'b',
      status: 'draft',
      title: '명함 제작',
      type: '명함',
    },
  ]

  assert.deepEqual(
    filterPortfolioRows(rows, { query: '브로', status: '게시됨', type: '브로슈어' }),
    [rows[0]],
  )
  assert.deepEqual(
    filterPortfolioRows(rows, { query: '', status: '임시저장', type: '전체' }),
    [rows[1]],
  )
})

test('portfolio setting counts come from mapped rows', () => {
  const rows = [
    { isPinned: true, landingStatus: 'published' },
    { isPinned: false, landingStatus: 'none' },
    { isPinned: true, landingStatus: 'published' },
  ]

  assert.deepEqual(getPortfolioSettingCounts(rows), { landing: 2, pinned: 2 })
})
