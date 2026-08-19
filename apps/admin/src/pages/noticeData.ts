import type { Json, PublishStatus, TableInsert, TableRow } from '@repo/supabase/types'
import type {
  AdminContentStatus,
  AdminPinnedState,
} from '../components/admin-table/AdminContentTableCells'
import { formatAdminDate, toDateInputValue, toPublishedAt } from './contentListState.ts'
import {
  createInitialManagedContentValue,
  managedContentFormFromRow,
  managedContentInputFromForm,
  managedContentIsEmpty,
  type ManagedContentFormValue,
} from '../lib/managedContent.ts'

export type NoticeFormState = ManagedContentFormValue & {
  excerpt: string
  isPinned: boolean
  publishedAt: string
  slug: string
  title: string
  type: string
}

export type NoticeListRow = {
  createdAt: string
  detailHref: string
  id: string
  pinnedStatus: AdminPinnedState
  status: AdminContentStatus
  title: string
  type: string
}

export type NoticeMutationInput = Pick<
  TableInsert<'posts'>,
  | 'content'
  | 'content_asset_scope'
  | 'content_authoring_mode'
  | 'content_json'
  | 'content_mode'
  | 'content_schema_version'
  | 'content_source_backup'
  | 'excerpt'
  | 'kind'
  | 'pinned'
  | 'published_at'
  | 'slug'
  | 'status'
  | 'title'
  | 'type'
>

export const defaultNoticeTypes = [
  '공지',
  '이벤트',
  '휴무 안내',
  '서비스 변경',
  '수상 · 소식',
] as const

export function createInitialNoticeForm(): NoticeFormState {
  return {
    ...createInitialManagedContentValue('raw_html'),
    excerpt: '',
    isPinned: false,
    publishedAt: '',
    slug: '',
    title: '',
    type: '',
  }
}

export function normalizeNoticeType(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function mergeNoticeTypes(types: readonly string[], nextType: string) {
  const normalizedType = normalizeNoticeType(nextType)

  if (!normalizedType) return [...types]

  const existingType = types.find(
    (type) => normalizeNoticeType(type).toLocaleLowerCase('ko-KR') === normalizedType.toLocaleLowerCase('ko-KR'),
  )

  return existingType ? [...types] : [...types, normalizedType]
}

export function toNoticeListRow(post: TableRow<'posts'>): NoticeListRow {
  return {
    createdAt: formatAdminDate(post.created_at),
    detailHref: `/notices/${post.id}`,
    id: post.id,
    pinnedStatus: post.pinned ? 'pinned' : 'none',
    status: post.status === 'published' ? 'published' : 'draft',
    title: post.title,
    type: normalizeNoticeType(post.type),
  }
}

export function toNoticeFormState(post: TableRow<'posts'>): NoticeFormState {
  return {
    ...managedContentFormFromRow(post),
    excerpt: post.excerpt ?? '',
    isPinned: post.pinned,
    publishedAt: toDateInputValue(post.published_at),
    slug: post.slug,
    title: post.title,
    type: normalizeNoticeType(post.type),
  }
}

export function toNoticeMutationInput(
  form: NoticeFormState,
  status: PublishStatus,
): NoticeMutationInput {
  const managedContent = managedContentInputFromForm(form)
  const type = normalizeNoticeType(form.type)
  const excerpt = form.excerpt.trim()

  if (
    !managedContent ||
    managedContentIsEmpty(form) ||
    !type ||
    !form.title.trim() ||
    !form.slug.trim() ||
    !excerpt
  ) {
    throw new Error('공지사항 정보를 확인해주세요.')
  }

  return {
    content: managedContent.content,
    content_asset_scope: managedContent.content_asset_scope,
    content_authoring_mode: managedContent.content_authoring_mode,
    content_json: managedContent.content_json as unknown as Json,
    content_mode: managedContent.content_mode,
    content_schema_version: managedContent.content_schema_version,
    content_source_backup: managedContent.content_source_backup,
    excerpt,
    kind: 'notice',
    pinned: form.isPinned,
    published_at: toPublishedAt(form.publishedAt) ?? new Date().toISOString(),
    slug: form.slug.trim(),
    status,
    title: form.title.trim(),
    type,
  }
}
