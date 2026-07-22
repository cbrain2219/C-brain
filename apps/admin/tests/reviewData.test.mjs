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
    company: '오르카',
    content: '좋은 결과물을 받았습니다.',
    content_mode: 'text',
    created_at: '2026-07-21T00:00:00.000Z',
    id: 'review-1',
    is_landing_enabled: true,
    kind: 'testimonial',
    manager: '김담당',
    published_at: '2026-07-21T00:00:00.000Z',
    seo_description: null,
    slug: null,
    sort_order: 0,
    status: 'published',
    title: null,
    updated_at: '2026-07-21T00:00:00.000Z',
    video_alt: null,
    video_path: null,
    view_count: 12,
    ...overrides,
  }
}

test('testimonial list rows derive a useful title from attribution', () => {
  const row = toReviewListRow(review())

  assert.equal(row.title, '오르카 김담당 후기')
  assert.equal(row.type, '후기')
  assert.equal(row.views, '12')
})

test('interview rows hydrate the conditional form and existing video', () => {
  const form = toReviewFormState(
    review({
      kind: 'interview',
      manager: null,
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
  assert.equal(form.videoPath, 'reviews/orca.mp4')
  assert.equal(form.videoPreviewUrl, 'https://example.com/orca.mp4')
})

test('testimonial mutations clear interview-only fields', () => {
  const input = toReviewMutationInput(
    {
      ...createInitialReviewForm(),
      company: ' 오르카 ',
      content: ' 만족합니다. ',
      manager: ' 김담당 ',
      publishedAt: '2026-07-21',
      seoDescription: '삭제될 설명',
      slug: 'old-interview',
      title: '삭제될 제목',
      type: '후기',
      videoAlt: '삭제될 영상 설명',
      videoPath: 'reviews/old.mp4',
    },
    'published',
    'reviews/new.mp4',
  )

  assert.deepEqual(input, {
    company: '오르카',
    content: '만족합니다.',
    content_mode: 'html',
    is_landing_enabled: true,
    kind: 'testimonial',
    manager: '김담당',
    published_at: '2026-07-20T15:00:00.000Z',
    seo_description: null,
    slug: null,
    status: 'published',
    title: null,
    video_alt: null,
    video_path: null,
  })
})

test('drafts retain partial content while published reviews require complete fields', () => {
  const partial = { ...createInitialReviewForm(), type: '인터뷰' }

  assert.equal(toReviewMutationInput(partial, 'draft', null).status, 'draft')
  assert.throws(() => toReviewMutationInput(partial, 'published', null), {
    message: '필수 정보를 모두 입력해주세요.',
  })
})
