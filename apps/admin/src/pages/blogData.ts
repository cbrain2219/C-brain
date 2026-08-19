import type { Json, PublishStatus, TableInsert, TableRow } from '@repo/supabase/types'
import { blogAllCategory, normalizeBlogCategory } from '@repo/supabase/categories'
import {
  filterContentRows,
  formatAdminDate,
  toDateInputValue,
  toPublishedAt,
} from './contentListState.ts'
import {
  createInitialManagedContentValue,
  managedContentFormFromRow,
  managedContentInputFromForm,
  managedContentIsEmpty,
  type ManagedContentFormValue,
} from '../lib/managedContent.ts'

export type BlogStatus = Extract<PublishStatus, 'draft' | 'published'>
export type BlogStatusLabel = '임시저장' | '게시됨'

export type BlogFormState = ManagedContentFormValue & {
  isBannerEnabled: boolean
  isFeaturedEnabled: boolean
  isLandingEnabled: boolean
  publishedAt: string
  seoDescription: string
  slug: string
  thumbnail: File | null
  thumbnailAlt: string
  thumbnailFileName: string | null
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
  | 'content_asset_scope'
  | 'content_authoring_mode'
  | 'content_json'
  | 'content_mode'
  | 'content_schema_version'
  | 'content_source_backup'
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
  | 'thumbnail_file_name'
  | 'thumbnail_path'
  | 'title'
  | 'type'
>

export function createInitialBlogForm(): BlogFormState {
  return {
    ...createInitialManagedContentValue('raw_html'),
    isBannerEnabled: true,
    isFeaturedEnabled: false,
    isLandingEnabled: true,
    publishedAt: '',
    seoDescription: '',
    slug: '',
    thumbnail: null,
    thumbnailAlt: '',
    thumbnailFileName: null,
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
    ...managedContentFormFromRow(post),
    isBannerEnabled: post.show_as_banner,
    isFeaturedEnabled: post.featured,
    isLandingEnabled: post.show_on_landing,
    publishedAt: toDateInputValue(post.published_at),
    seoDescription: post.seo_description ?? '',
    slug: post.slug,
    thumbnail: null,
    thumbnailAlt: post.thumbnail_alt ?? '',
    thumbnailFileName: post.thumbnail_file_name,
    thumbnailPath: post.thumbnail_path,
    thumbnailPreviewUrl,
    title: post.title,
    type: normalizeBlogCategory(post.type),
  }
}

export function toBlogMutationInput(
  form: BlogFormState,
  status: BlogStatus,
  thumbnailPath = form.thumbnailPath,
): BlogMutationInput {
  const managedContent = managedContentInputFromForm(form)
  const publishedAt = toPublishedAt(form.publishedAt)
  const slug = form.slug.trim()
  const title = form.title.trim()
  const type = normalizeBlogCategory(form.type)

  if (
    !managedContent ||
    managedContentIsEmpty(form) ||
    !publishedAt ||
    !slug ||
    !title ||
    !type ||
    type === blogAllCategory
  ) {
    throw new Error('블로그 정보를 확인해주세요.')
  }

  const seoDescription = form.seoDescription.trim()

  return {
    content: managedContent.content,
    content_asset_scope: managedContent.content_asset_scope,
    content_authoring_mode: managedContent.content_authoring_mode,
    content_json: managedContent.content_json as unknown as Json,
    content_mode: managedContent.content_mode,
    content_schema_version: managedContent.content_schema_version,
    content_source_backup: managedContent.content_source_backup,
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
    thumbnail_file_name: thumbnailPath ? form.thumbnailFileName?.trim() || null : null,
    thumbnail_path: thumbnailPath,
    title,
    type,
  }
}

export function getBlogThumbnailDisplayName(
  form: Pick<BlogFormState, 'thumbnail' | 'thumbnailFileName'>,
) {
  return form.thumbnail?.name || form.thumbnailFileName?.trim() || '등록된 썸네일'
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
    type: normalizeBlogCategory(post.type),
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
