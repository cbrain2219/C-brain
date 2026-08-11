import type { PublishStatus, TableInsert, TableRow } from '@repo/supabase/types'
import {
  filterContentRows,
  formatAdminDate,
  toDateInputValue,
  toPublishedAt,
} from './contentListState.ts'

export type BlogContentMode = 'html' | 'markdown'
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
  | 'featured'
  | 'kind'
  | 'pinned'
  | 'published_at'
  | 'seo_description'
  | 'show_as_banner'
  | 'show_on_landing'
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
    isBannerEnabled: post.show_as_banner,
    isFeaturedEnabled: post.featured,
    isLandingEnabled: post.show_on_landing,
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
    featured: form.isFeaturedEnabled,
    kind: 'blog',
    pinned: false,
    published_at: publishedAt,
    seo_description: seoDescription || null,
    show_as_banner: form.isBannerEnabled,
    show_on_landing: form.isLandingEnabled,
    slug,
    status,
    thumbnail_alt: thumbnailPath ? form.thumbnailAlt.trim() || null : null,
    thumbnail_path: thumbnailPath,
    title,
    type,
  }
}

export function toBlogListRow(post: TableRow<'posts'>): BlogListRow {
  const publicationStatus: BlogStatus = post.status === 'published' ? 'published' : 'draft'

  return {
    bannerStatus: post.show_as_banner ? 'published' : 'none',
    createdAt: formatAdminDate(post.created_at),
    detailHref: '/blog/' + post.id,
    id: post.id,
    landingStatus: post.show_on_landing ? 'published' : 'none',
    popularStatus: post.featured ? 'published' : 'none',
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
      banner: counts.banner + Number(post.show_as_banner),
      featured: counts.featured + Number(post.featured),
      landing: counts.landing + Number(post.show_on_landing),
    }),
    { banner: 0, featured: 0, landing: 0 },
  )
}
