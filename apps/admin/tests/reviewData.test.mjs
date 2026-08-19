import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createInitialReviewForm,
  toReviewFormState,
  toReviewListRow,
  toReviewMutationInput,
} from '../src/pages/reviewData.ts'

function review(overrides = {}) {
  return {
    company_name: '오르카',
    content: '좋은 결과물을 받았습니다.',
    content_asset_scope: '00000000-0000-4000-8000-0000000000ab',
    content_authoring_mode: 'raw_html',
    content_json: null,
    content_mode: 'markdown',
    content_schema_version: 1,
    content_source_backup: null,
    created_at: '2026-07-21T00:00:00.000Z',
    id: 'review-1',
    kind: 'testimonial',
    manager_name: '김담당',
    project_deliverable: null,
    project_usage: null,
    published_at: '2026-07-21T00:00:00.000Z',
    seo_description: null,
    show_on_landing: true,
    slug: null,
    sort_order: 0,
    status: 'published',
    title: null,
    video_alt: null,
    video_path: null,
    view_count: 12,
    youtube_video_id: null,
    ...overrides,
  }
}

test('testimonial list rows derive a useful title from attribution', () => {
  const row = toReviewListRow(review())

  assert.equal(row.title, '오르카 김담당 후기')
  assert.equal(row.type, '후기')
  assert.equal(row.views, '-')
})

test('interview list rows format their view count', () => {
  const row = toReviewListRow(
    review({
      kind: 'interview',
      manager_name: null,
      title: '오르카 인터뷰',
      view_count: 1234,
    }),
  )

  assert.equal(row.type, '인터뷰')
  assert.equal(row.views, '1,234')
})

test('interview rows hydrate the conditional form and existing video', () => {
  const form = toReviewFormState(
    review({
      kind: 'interview',
      manager_name: null,
      project_deliverable: '브로슈어',
      project_usage: '영업 자료 활용',
      seo_description: '인터뷰 설명',
      slug: 'orca-story',
      title: '오르카 인터뷰',
      video_alt: '오르카 인터뷰 영상',
      video_path: 'reviews/orca.mp4',
    }),
    'https://example.com/orca.mp4',
  )

  assert.equal(form.type, '인터뷰')
  assert.equal(form.slug, 'orca-story')
  assert.equal(form.projectDeliverable, '브로슈어')
  assert.equal(form.projectUsage, '영업 자료 활용')
  assert.equal(form.videoPath, 'reviews/orca.mp4')
  assert.equal(form.videoPreviewUrl, 'https://example.com/orca.mp4')
  assert.equal(form.videoSource, 'file')
  assert.equal(form.youtubeUrl, '')
  assert.equal(form.contentAuthoringMode, 'raw_html')
})

test('YouTube interview rows hydrate a canonical editable URL without a Storage preview', () => {
  const form = toReviewFormState(
    review({
      kind: 'interview',
      manager_name: null,
      slug: 'youtube-story',
      title: 'YouTube 인터뷰',
      youtube_video_id: 'dQw4w9WgXcQ',
    }),
    null,
  )

  assert.equal(form.videoSource, 'youtube')
  assert.equal(form.youtubeUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  assert.equal(form.videoPath, null)
  assert.equal(form.videoPreviewUrl, null)
})

test('testimonial mutations clear interview-only fields', () => {
  const form = {
    ...createInitialReviewForm(),
    company: ' 오르카 ',
    content: ' 만족합니다. ',
    contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '만족합니다.' }] }] },
    manager: ' 김담당 ',
    publishedAt: '2026-07-21',
    seoDescription: '삭제될 설명',
    slug: 'old-interview',
    title: '삭제될 제목',
    type: '후기',
    videoAlt: '삭제될 영상 설명',
    videoPath: 'reviews/old.mp4',
  }
  const input = toReviewMutationInput(form, 'published', 'reviews/new.mp4')

  assert.deepEqual(input, {
    company_name: '오르카',
    content: ' 만족합니다. ',
    content_asset_scope: form.contentAssetScope,
    content_authoring_mode: 'wysiwyg',
    content_json: form.contentJson,
    content_mode: 'html',
    content_schema_version: 1,
    content_source_backup: null,
    kind: 'testimonial',
    manager_name: '김담당',
    project_deliverable: null,
    project_usage: null,
    published_at: '2026-07-20T15:00:00.000Z',
    seo_description: null,
    show_on_landing: true,
    slug: null,
    status: 'published',
    title: null,
    video_alt: null,
    video_path: null,
    youtube_video_id: null,
  })
})

test('published YouTube interview mutations store only the normalized video id', () => {
  const input = toReviewMutationInput(
    {
      ...createInitialReviewForm(),
      company: '새 고객사',
      content: '인터뷰 내용입니다.',
      contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '인터뷰 내용입니다.' }] }] },
      projectDeliverable: '제품 소개 브로슈어',
      projectUsage: '전시회 배포',
      publishedAt: '2026-08-14',
      slug: 'youtube-interview',
      title: 'YouTube 인터뷰',
      type: '인터뷰',
      videoSource: 'youtube',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ?t=42',
    },
    'published',
    null,
  )

  assert.equal(input.video_path, null)
  assert.equal(input.youtube_video_id, 'dQw4w9WgXcQ')
  assert.equal(input.project_deliverable, '제품 소개 브로슈어')
  assert.equal(input.project_usage, '전시회 배포')
})

test('published uploaded-file interview mutations clear an inactive YouTube link', () => {
  const input = toReviewMutationInput(
    {
      ...createInitialReviewForm(),
      company: '새 고객사',
      content: '인터뷰 내용입니다.',
      contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '인터뷰 내용입니다.' }] }] },
      projectDeliverable: '완료보고서',
      projectUsage: '프로젝트 결과 공유',
      publishedAt: '2026-08-14',
      slug: 'file-interview',
      title: '파일 인터뷰',
      type: '인터뷰',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    },
    'published',
    'reviews/interview.mp4',
  )

  assert.equal(input.video_path, 'reviews/interview.mp4')
  assert.equal(input.youtube_video_id, null)
})

test('drafts retain partial content while published reviews require complete fields', () => {
  const partial = { ...createInitialReviewForm(), type: '인터뷰' }

  assert.equal(toReviewMutationInput(partial, 'draft', null).status, 'draft')
  assert.throws(() => toReviewMutationInput(partial, 'published', null), {
    message: '필수 정보를 모두 입력해주세요.',
  })
})

test('an otherwise-complete empty WYSIWYG review may draft but cannot publish', () => {
  const form = {
    ...createInitialReviewForm(),
    company: '씨브레인',
    content: '<p></p>',
    manager: '김담당',
    publishedAt: '2026-08-14',
    type: '후기',
  }

  assert.equal(toReviewMutationInput(form, 'draft', null).status, 'draft')
  assert.throws(() => toReviewMutationInput(form, 'published', null), {
    message: '필수 정보를 모두 입력해주세요.',
  })
})
