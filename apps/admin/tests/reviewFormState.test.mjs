import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MAX_REVIEW_VIDEO_BYTES,
  getReviewVideoError,
  isReviewType,
  isValidInterviewSlug,
  reviewTypes,
} from '../src/pages/reviewFormState.ts'

test('review types contain only the two fixed Figma choices', () => {
  assert.deepEqual(reviewTypes, ['인터뷰', '후기'])
  assert.equal(isReviewType('인터뷰'), true)
  assert.equal(isReviewType('후기'), true)
  assert.equal(isReviewType('블로그'), false)
  assert.equal(isReviewType(''), false)
})

test('interview slug follows the existing English letters and hyphens rule', () => {
  assert.equal(isValidInterviewSlug('customer-interview'), true)
  assert.equal(isValidInterviewSlug('CustomerInterview'), true)
  assert.equal(isValidInterviewSlug('customer-01'), false)
  assert.equal(isValidInterviewSlug('고객-인터뷰'), false)
})

test('review video accepts MP4 and MOV files through MIME or empty-MIME extension fallback', () => {
  assert.equal(
    getReviewVideoError({ name: 'interview.mp4', size: 1, type: 'video/mp4' }),
    null,
  )
  assert.equal(
    getReviewVideoError({ name: 'interview.mov', size: 1, type: '' }),
    null,
  )
  assert.equal(
    getReviewVideoError({
      name: 'interview.mov',
      size: MAX_REVIEW_VIDEO_BYTES,
      type: 'video/quicktime',
    }),
    null,
  )
})

test('review video rejects unsupported formats and files over 500MB', () => {
  assert.match(
    getReviewVideoError({ name: 'interview.webm', size: 1, type: 'video/webm' }) ?? '',
    /MP4, MOV/,
  )
  assert.match(
    getReviewVideoError({ name: 'renamed.mp4', size: 1, type: 'application/pdf' }) ?? '',
    /MP4, MOV/,
  )
  assert.match(
    getReviewVideoError({
      name: 'interview.mp4',
      size: MAX_REVIEW_VIDEO_BYTES + 1,
      type: 'video/mp4',
    }) ?? '',
    /500MB/,
  )
})
