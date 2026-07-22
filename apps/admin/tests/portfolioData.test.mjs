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
  content_mode: 'html',
  created_at: '2026-07-21T00:00:00.000Z',
  id: 'portfolio-a',
  images: [
    { alt: '첫 이미지', path: 'portfolio/first.webp' },
    { alt: '두 번째 이미지', path: 'portfolio/second.webp' },
  ],
  is_landing_enabled: true,
  is_pinned: true,
  published_at: '2026-07-21T00:00:00.000Z',
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
      { alt: '', path: 'portfolio/a.webp' },
      { alt: 'B', path: 'portfolio/b.webp' },
    ],
  )
})

test('portfolio mutation keeps ordered image paths and draft publication state', () => {
  const form = {
    clientName: ' 씨브레인 ',
    content: '<p>내용</p>',
    contentMode: 'html',
    isLandingEnabled: true,
    isPinned: false,
    slug: ' cbrain-work ',
    title: ' 포트폴리오 ',
    type: ' 브로슈어 ',
  }
  const images = [
    { alt: ' 첫 이미지 ', path: 'portfolio/first.webp' },
    { alt: '두 번째 이미지', path: 'portfolio/second.webp' },
  ]

  assert.deepEqual(toPortfolioMutationInput(form, images, 'draft', '2026-07-21T00:00:00Z'), {
    client_name: '씨브레인',
    content: '<p>내용</p>',
    content_mode: 'html',
    images: [
      { alt: '첫 이미지', path: 'portfolio/first.webp' },
      { alt: '두 번째 이미지', path: 'portfolio/second.webp' },
    ],
    is_landing_enabled: true,
    is_pinned: false,
    published_at: null,
    slug: 'cbrain-work',
    status: 'draft',
    title: '포트폴리오',
    type: '브로슈어',
  })
})

test('published portfolios require at least one image while drafts may be partial', () => {
  const form = {
    clientName: '씨브레인',
    content: '내용',
    contentMode: 'text',
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
