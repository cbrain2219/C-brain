import type { PublishStatus, TableInsert, TableRow } from '@repo/supabase/types'
import {
  filterContentRows,
  formatAdminDate,
  toDateInputValue,
  toPublishedAt,
} from './contentListState.ts'

export type BlogContentMode = 'html' | 'text'
export type BlogStatus = Extract<PublishStatus, 'draft' | 'published'>
export type BlogStatusLabel = '임시저장' | '게시됨'

export type BlogFormState = {
  content: string
  contentMode: BlogContentMode
  isBannerEnabled: boolean
  isFeaturedEnabled: boolean
  isLandingEnabled: boolean
  publishedAt: string
  seoDescription: string
  slug: string
  thumbnail: File | null
  thumbnailAlt: string
  thumbnailPath: string | null
  thumbnailPreviewUrl: string | null
  title: string
  type: string
}

export type BlogListRow = {
  bannerStatus: 'none' | 'published'
  createdAt: string
  detailHref: string
  id: string
  landingStatus: 'none' | 'published'
  popularStatus: 'none' | 'published'
  publicationStatus: BlogStatus
  status: BlogStatusLabel
  title: string
  type: string
  views: string
}

export type BlogSettingCounts = {
  banner: number
  featured: number
  landing: number
}

export type BlogMutationInput = Pick<
  TableInsert<'posts'>,
  | 'content'
  | 'content_mode'
  | 'excerpt'
  | 'is_banner_enabled'
  | 'is_featured_enabled'
  | 'is_landing_enabled'
  | 'is_pinned'
  | 'kind'
  | 'published_at'
  | 'seo_description'
  | 'slug'
  | 'status'
  | 'thumbnail_alt'
  | 'thumbnail_path'
  | 'title'
  | 'type'
>

export function createInitialBlogForm(): BlogFormState {
  return {
    content: '',
    contentMode: 'html',
    isBannerEnabled: true,
    isFeaturedEnabled: false,
    isLandingEnabled: true,
    publishedAt: '',
    seoDescription: '',
    slug: '',
    thumbnail: null,
    thumbnailAlt: '',
    thumbnailPath: null,
    thumbnailPreviewUrl: null,
    title: '',
    type: '',
  }
}

export function toBlogFormState(
  post: TableRow<'posts'>,
  thumbnailPreviewUrl: string | null,
): BlogFormState {
  return {
    content: post.content,
    contentMode: post.content_mode,
    isBannerEnabled: post.is_banner_enabled,
    isFeaturedEnabled: post.is_featured_enabled,
    isLandingEnabled: post.is_landing_enabled,
    publishedAt: toDateInputValue(post.published_at),
    seoDescription: post.seo_description ?? '',
    slug: post.slug,
    thumbnail: null,
    thumbnailAlt: post.thumbnail_alt ?? '',
    thumbnailPath: post.thumbnail_path,
    thumbnailPreviewUrl,
    title: post.title,
    type: post.type,
  }
}

export function toBlogMutationInput(
  form: BlogFormState,
  status: BlogStatus,
  thumbnailPath = form.thumbnailPath,
): BlogMutationInput {
  const content = form.content.trim()
  const publishedAt = toPublishedAt(form.publishedAt)
  const slug = form.slug.trim()
  const title = form.title.trim()
  const type = form.type.trim()

  if (!content || !publishedAt || !slug || !title || !type) {
    throw new Error('블로그 정보를 확인해주세요.')
  }

  const seoDescription = form.seoDescription.trim()

  return {
    content,
    content_mode: form.contentMode,
    excerpt: null,
    is_banner_enabled: form.isBannerEnabled,
    is_featured_enabled: form.isFeaturedEnabled,
    is_landing_enabled: form.isLandingEnabled,
    is_pinned: false,
    kind: 'blog',
    published_at: publishedAt,
    seo_description: seoDescription || null,
    slug,
    status,
    thumbnail_alt: form.thumbnailAlt.trim() || null,
    thumbnail_path: thumbnailPath,
    title,
    type,
  }
}

export function toBlogListRow(post: TableRow<'posts'>): BlogListRow {
  const publicationStatus: BlogStatus = post.status === 'published' ? 'published' : 'draft'

  return {
    bannerStatus: post.is_banner_enabled ? 'published' : 'none',
    createdAt: formatAdminDate(post.created_at),
    detailHref: '/blog/' + post.id,
    id: post.id,
    landingStatus: post.is_landing_enabled ? 'published' : 'none',
    popularStatus: post.is_featured_enabled ? 'published' : 'none',
    publicationStatus,
    status: publicationStatus === 'draft' ? '임시저장' : '게시됨',
    title: post.title,
    type: post.type,
    views: new Intl.NumberFormat('ko-KR').format(post.view_count),
  }
}

export function filterBlogRows(
  rows: readonly BlogListRow[],
  filters: { readonly query: string; readonly status: string; readonly type: string },
) {
  return filterContentRows(rows, filters)
}

export function getBlogSettingCounts(posts: readonly TableRow<'posts'>[]): BlogSettingCounts {
  return posts.reduce<BlogSettingCounts>(
    (counts, post) => ({
      banner: counts.banner + Number(post.is_banner_enabled),
      featured: counts.featured + Number(post.is_featured_enabled),
      landing: counts.landing + Number(post.is_landing_enabled),
    }),
    { banner: 0, featured: 0, landing: 0 },
  )
}
