import assert from 'node:assert/strict'
import test from 'node:test'

import {
  mergeNoticeTypes,
  normalizeNoticeType,
  toNoticeFormState,
  toNoticeListRow,
  toNoticeMutationInput,
} from '../src/pages/noticeData.ts'

const notice = {
  content: '공지 본문',
  content_mode: 'text',
  created_at: '2026-07-21T12:00:00.000Z',
  excerpt: '공지 요약',
  id: 'notice-1',
  is_banner_enabled: false,
  is_featured: false,
  is_landing_enabled: false,
  is_pinned: true,
  kind: 'notice',
  published_at: '2026-07-22T00:00:00.000Z',
  seo: null,
  slug: 'summer-event',
  sort_order: 3,
  status: 'published',
  thumbnail_alt: null,
  thumbnail_path: null,
  title: '여름 이벤트',
  type: '  이벤트   소식 ',
  updated_at: '2026-07-21T12:00:00.000Z',
  view_count: 10,
}

test('notice categories are trimmed, collapsed, and deduplicated case-insensitively', () => {
  assert.equal(normalizeNoticeType('  서비스   변경 '), '서비스 변경')
  assert.deepEqual(mergeNoticeTypes(['News'], ' news '), ['News'])
  assert.deepEqual(mergeNoticeTypes(['공지'], '  이벤트  '), ['공지', '이벤트'])
})

test('post rows map to the notice list and edit form', () => {
  assert.deepEqual(toNoticeListRow(notice), {
    createdAt: '26. 07. 21',
    detailHref: '/notices/notice-1',
    id: 'notice-1',
    pinnedStatus: 'pinned',
    status: 'published',
    title: '여름 이벤트',
    type: '이벤트 소식',
  })

  assert.deepEqual(toNoticeFormState(notice), {
    content: '공지 본문',
    contentMode: 'text',
    excerpt: '공지 요약',
    isPinned: true,
    publishedAt: '2026-07-22',
    slug: 'summer-event',
    title: '여름 이벤트',
    type: '이벤트 소식',
  })
  assert.equal(toNoticeListRow({ ...notice, status: 'archived' }).status, 'draft')
})

test('notice form maps to a notice post mutation', () => {
  assert.deepEqual(
    toNoticeMutationInput(
      {
        content: '본문',
        contentMode: 'html',
        excerpt: ' 요약 ',
        isPinned: true,
        publishedAt: '2026-07-22',
        slug: 'notice-slug',
        title: ' 공지 제목 ',
        type: ' 서비스   변경 ',
      },
      'draft',
    ),
    {
      content: '본문',
      content_mode: 'html',
      excerpt: '요약',
      is_pinned: true,
      kind: 'notice',
      published_at: '2026-07-21T15:00:00.000Z',
      slug: 'notice-slug',
      status: 'draft',
      title: '공지 제목',
      type: '서비스 변경',
    },
  )
})
