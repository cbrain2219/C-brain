import type { Json, PublishStatus, TableInsert, TableRow } from '@repo/supabase/types'
import {
  getYouTubeVideoId,
  getYouTubeWatchUrl,
} from '@repo/supabase/review-video'
import { formatAdminDate, toDateInputValue, toPublishedAt } from './contentListState.ts'
import type { ReviewType, ReviewVideoSource } from './reviewFormState.ts'
import {
  createInitialManagedContentValue,
  managedContentFormFromRow,
  managedContentInputFromForm,
  managedContentIsEmpty,
  type ManagedContentFormValue,
} from '../lib/managedContent.ts'

export type ReviewContentMode = ManagedContentFormValue['contentMode']

export type ReviewFormState = ManagedContentFormValue & {
  readonly company: string
  readonly isLandingEnabled: boolean
  readonly manager: string
  readonly projectDeliverable: string
  readonly projectUsage: string
  readonly publishedAt: string
  readonly seoDescription: string
  readonly slug: string
  readonly title: string
  readonly type: ReviewType | ''
  readonly video: File | null
  readonly videoAlt: string
  readonly videoPath: string | null
  readonly videoPreviewUrl: string | null
  readonly videoSource: ReviewVideoSource
  readonly youtubeUrl: string
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
  | 'company_name'
  | 'content'
  | 'content_asset_scope'
  | 'content_authoring_mode'
  | 'content_json'
  | 'content_mode'
  | 'content_schema_version'
  | 'content_source_backup'
  | 'kind'
  | 'manager_name'
  | 'project_deliverable'
  | 'project_usage'
  | 'published_at'
  | 'seo_description'
  | 'show_on_landing'
  | 'slug'
  | 'status'
  | 'title'
  | 'video_alt'
  | 'video_path'
  | 'youtube_video_id'
>

export function createInitialReviewForm(): ReviewFormState {
  return {
    company: '',
    ...createInitialManagedContentValue(),
    isLandingEnabled: true,
    manager: '',
    projectDeliverable: '',
    projectUsage: '',
    publishedAt: '',
    seoDescription: '',
    slug: '',
    title: '',
    type: '',
    video: null,
    videoAlt: '',
    videoPath: null,
    videoPreviewUrl: null,
    videoSource: 'file',
    youtubeUrl: '',
  }
}

function getTestimonialTitle(review: TableRow<'reviews'>) {
  const attribution = [review.company_name, review.manager_name].filter(Boolean).join(' ')

  if (attribution) return `${attribution} 후기`

  const content = review.content.trim()

  return content.length > 30 ? `${content.slice(0, 30)}…` : content || '고객 후기'
}

export function toReviewListRow(review: TableRow<'reviews'>): ReviewListRow {
  return {
    createdAt: formatAdminDate(review.created_at),
    detailHref: `/reviews/${review.id}`,
    id: review.id,
    landingStatus: review.show_on_landing ? 'published' : 'none',
    status: review.status,
    title: review.kind === 'interview' ? review.title || '제목 없는 인터뷰' : getTestimonialTitle(review),
    type: review.kind === 'interview' ? '인터뷰' : '후기',
    views:
      review.kind === 'interview'
        ? new Intl.NumberFormat('ko-KR').format(review.view_count)
        : '-',
  }
}

export function toReviewFormState(
  review: TableRow<'reviews'>,
  videoPreviewUrl: string | null,
): ReviewFormState {
  const youtubeUrl = getYouTubeWatchUrl(review.youtube_video_id ?? '')

  return {
    company: review.company_name,
    ...managedContentFormFromRow(review),
    isLandingEnabled: review.show_on_landing,
    manager: review.manager_name ?? '',
    projectDeliverable: review.project_deliverable ?? '',
    projectUsage: review.project_usage ?? '',
    publishedAt: toDateInputValue(review.published_at),
    seoDescription: review.seo_description ?? '',
    slug: review.slug ?? '',
    title: review.title ?? '',
    type: review.kind === 'interview' ? '인터뷰' : '후기',
    video: null,
    videoAlt: review.video_alt ?? '',
    videoPath: review.video_path,
    videoPreviewUrl: youtubeUrl ? null : videoPreviewUrl,
    videoSource: youtubeUrl ? 'youtube' : 'file',
    youtubeUrl: youtubeUrl ?? '',
  }
}

export function toReviewMutationInput(
  form: ReviewFormState,
  status: PublishStatus,
  videoPath: string | null,
): ReviewMutationInput {
  if (!form.type) throw new Error('인터뷰 · 후기 유형을 선택해주세요.')

  const managedContent = managedContentInputFromForm(form)
  if (!managedContent) throw new Error('필수 정보를 모두 입력해주세요.')

  const isInterview = form.type === '인터뷰'
  const company = form.company.trim()
  const manager = form.manager.trim()
  const projectDeliverable = form.projectDeliverable.trim()
  const projectUsage = form.projectUsage.trim()
  const publishedAt = toPublishedAt(form.publishedAt)
  const slug = form.slug.trim()
  const title = form.title.trim()
  const youtubeVideoId =
    isInterview && form.videoSource === 'youtube'
      ? getYouTubeVideoId(form.youtubeUrl)
      : null
  const nextVideoPath =
    isInterview && form.videoSource === 'file' ? videoPath : null
  const hasInterviewVideo =
    form.videoSource === 'youtube'
      ? Boolean(youtubeVideoId)
      : Boolean(nextVideoPath || form.video)

  if (
    status === 'published' &&
    (!company ||
      managedContentIsEmpty(form) ||
      !publishedAt ||
      (isInterview
        ? !title ||
          !projectDeliverable ||
          !projectUsage ||
          !slug ||
          !hasInterviewVideo
        : !manager))
  ) {
    throw new Error('필수 정보를 모두 입력해주세요.')
  }

  return {
    company_name: company,
    content: managedContent.content,
    content_asset_scope: managedContent.content_asset_scope,
    content_authoring_mode: managedContent.content_authoring_mode,
    content_json: managedContent.content_json as unknown as Json,
    content_mode: managedContent.content_mode,
    content_schema_version: managedContent.content_schema_version,
    content_source_backup: managedContent.content_source_backup,
    kind: isInterview ? 'interview' : 'testimonial',
    manager_name: isInterview ? null : manager || null,
    project_deliverable: isInterview ? projectDeliverable || null : null,
    project_usage: isInterview ? projectUsage || null : null,
    published_at: publishedAt,
    seo_description: isInterview ? form.seoDescription.trim() || null : null,
    show_on_landing: isInterview ? false : form.isLandingEnabled,
    slug: isInterview ? slug || null : null,
    status,
    title: isInterview ? title || null : null,
    video_alt: isInterview ? form.videoAlt.trim() || null : null,
    video_path: nextVideoPath,
    youtube_video_id: isInterview ? youtubeVideoId : null,
  }
}
