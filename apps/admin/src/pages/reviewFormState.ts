import { isValidPortfolioSlug } from './portfolioFormState.ts'

export const reviewTypes = ['인터뷰', '후기'] as const

export type ReviewType = (typeof reviewTypes)[number]

export const MAX_REVIEW_VIDEO_BYTES = 500 * 1024 * 1024

const acceptedVideoTypes = new Set(['video/mp4', 'video/quicktime'])
const acceptedVideoExtension = /\.(mp4|mov)$/i

export type ReviewVideoFile = Pick<File, 'name' | 'size' | 'type'>

export function isReviewType(value: string): value is ReviewType {
  return reviewTypes.some((reviewType) => reviewType === value)
}

export function isValidInterviewSlug(value: string) {
  return isValidPortfolioSlug(value)
}

export function getReviewVideoError(file: ReviewVideoFile) {
  const hasAcceptedType = acceptedVideoTypes.has(file.type)
  const hasAcceptedExtension =
    file.type === '' && acceptedVideoExtension.test(file.name)

  if (!hasAcceptedType && !hasAcceptedExtension) {
    return 'MP4, MOV 파일만 업로드할 수 있습니다.'
  }

  if (file.size > MAX_REVIEW_VIDEO_BYTES) {
    return '영상 파일은 최대 500MB까지 업로드할 수 있습니다.'
  }

  return null
}
