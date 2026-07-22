import type { PublishStatus, TableInsert, TableRow } from '@repo/supabase/types'
import { formatAdminDate, toDateInputValue, toPublishedAt } from './contentListState.ts'
import type { ReviewType } from './reviewFormState.ts'

export type ReviewContentMode = 'html' | 'text'

export type ReviewFormState = {
  readonly company: string
  readonly content: string
  readonly contentMode: ReviewContentMode
  readonly isLandingEnabled: boolean
  readonly manager: string
  readonly publishedAt: string
  readonly seoDescription: string
  readonly slug: string
  readonly title: string
  readonly type: ReviewType | ''
  readonly video: File | null
  readonly videoAlt: string
  readonly videoPath: string | null
  readonly videoPreviewUrl: string | null
}

export type ReviewListRow = {
  readonly createdAt: string
  readonly detailHref: string
  readonly id: string
  readonly landingStatus: 'none' | 'published'
  readonly status: PublishStatus
  readonly title: string
  readonly type: ReviewType
  readonly views: string
}

export type ReviewMutationInput = Pick<
  TableInsert<'reviews'>,
  | 'company'
  | 'content'
  | 'content_mode'
  | 'is_landing_enabled'
  | 'kind'
  | 'manager'
  | 'published_at'
  | 'seo_description'
  | 'slug'
  | 'status'
  | 'title'
  | 'video_alt'
  | 'video_path'
>

export function createInitialReviewForm(): ReviewFormState {
  return {
    company: '',
    content: '',
    contentMode: 'html',
    isLandingEnabled: true,
    manager: '',
    publishedAt: '',
    seoDescription: '',
    slug: '',
    title: '',
    type: '',
    video: null,
    videoAlt: '',
    videoPath: null,
    videoPreviewUrl: null,
  }
}

function getTestimonialTitle(review: TableRow<'reviews'>) {
  const attribution = [review.company, review.manager].filter(Boolean).join(' ')

  if (attribution) return `${attribution} 후기`

  const content = review.content.trim()

  return content.length > 30 ? `${content.slice(0, 30)}…` : content || '고객 후기'
}

export function toReviewListRow(review: TableRow<'reviews'>): ReviewListRow {
  return {
    createdAt: formatAdminDate(review.created_at),
    detailHref: `/reviews/${review.id}`,
    id: review.id,
    landingStatus: review.is_landing_enabled ? 'published' : 'none',
    status: review.status,
    title: review.kind === 'interview' ? review.title || '제목 없는 인터뷰' : getTestimonialTitle(review),
    type: review.kind === 'interview' ? '인터뷰' : '후기',
    views: new Intl.NumberFormat('ko-KR').format(review.view_count),
  }
}

export function toReviewFormState(
  review: TableRow<'reviews'>,
  videoPreviewUrl: string | null,
): ReviewFormState {
  return {
    company: review.company,
    content: review.content,
    contentMode: review.content_mode,
    isLandingEnabled: review.is_landing_enabled,
    manager: review.manager ?? '',
    publishedAt: toDateInputValue(review.published_at),
    seoDescription: review.seo_description ?? '',
    slug: review.slug ?? '',
    title: review.title ?? '',
    type: review.kind === 'interview' ? '인터뷰' : '후기',
    video: null,
    videoAlt: review.video_alt ?? '',
    videoPath: review.video_path,
    videoPreviewUrl,
  }
}

export function toReviewMutationInput(
  form: ReviewFormState,
  status: PublishStatus,
  videoPath: string | null,
): ReviewMutationInput {
  if (!form.type) throw new Error('인터뷰 · 후기 유형을 선택해주세요.')

  const isInterview = form.type === '인터뷰'
  const company = form.company.trim()
  const content = form.content.trim()
  const manager = form.manager.trim()
  const publishedAt = toPublishedAt(form.publishedAt)
  const slug = form.slug.trim()
  const title = form.title.trim()

  if (
    status === 'published' &&
    (!company || !content || !publishedAt || (isInterview ? !title || !slug : !manager))
  ) {
    throw new Error('필수 정보를 모두 입력해주세요.')
  }

  return {
    company,
    content,
    content_mode: form.contentMode,
    is_landing_enabled: isInterview ? false : form.isLandingEnabled,
    kind: isInterview ? 'interview' : 'testimonial',
    manager: isInterview ? null : manager || null,
    published_at: publishedAt,
    seo_description: isInterview ? form.seoDescription.trim() || null : null,
    slug: isInterview ? slug || null : null,
    status,
    title: isInterview ? title || null : null,
    video_alt: isInterview ? form.videoAlt.trim() || null : null,
    video_path: isInterview ? videoPath : null,
  }
}
