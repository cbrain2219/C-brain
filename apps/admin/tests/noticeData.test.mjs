import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createInitialNoticeForm,
  mergeNoticeTypes,
  normalizeNoticeType,
  toNoticeFormState,
  toNoticeListRow,
  toNoticeMutationInput,
} from '../src/pages/noticeData.ts'

const notice = {
  content: '공지 본문',
  content_asset_scope: '00000000-0000-4000-8000-0000000000ab',
  content_authoring_mode: 'raw_html',
  content_json: null,
  content_mode: 'markdown',
  content_schema_version: 1,
  content_source_backup: null,
  created_at: '2026-07-21T12:00:00.000Z',
  excerpt: '공지 요약',
  id: 'notice-1',
  featured: false,
  kind: 'notice',
  pinned: true,
  published_at: '2026-07-22T00:00:00.000Z',
  seo_description: null,
  show_as_banner: false,
  show_on_landing: false,
  slug: 'summer-event',
  sort_order: 3,
  status: 'published',
  thumbnail_alt: null,
  thumbnail_path: null,
  title: '여름 이벤트',
  type: '  이벤트   소식 ',
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
    contentAssetScope: '00000000-0000-4000-8000-0000000000ab',
    contentAuthoringMode: 'raw_html',
    contentJson: null,
    contentMode: 'markdown',
    contentSchemaVersion: 1,
    contentSourceBackup: null,
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
  const form = {
    ...createInitialNoticeForm(),
    content: '본문',
    contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '본문' }] }] },
    excerpt: ' 요약 ',
    isPinned: true,
    publishedAt: '2026-07-22',
    slug: 'notice-slug',
    title: ' 공지 제목 ',
    type: ' 서비스   변경 ',
  }

  assert.deepEqual(
    toNoticeMutationInput(form, 'draft'),
    {
      content: '본문',
      content_asset_scope: form.contentAssetScope,
      content_authoring_mode: 'wysiwyg',
      content_json: form.contentJson,
      content_mode: 'html',
      content_schema_version: 1,
      content_source_backup: null,
      excerpt: '요약',
      pinned: true,
      kind: 'notice',
      published_at: '2026-07-21T15:00:00.000Z',
      slug: 'notice-slug',
      status: 'draft',
      title: '공지 제목',
      type: '서비스 변경',
    },
  )
})
