import type { PublishStatus, TableInsert, TableRow } from '@repo/supabase/types'
import type {
  AdminContentStatus,
  AdminPinnedState,
} from '../components/admin-table/AdminContentTableCells'
import { formatAdminDate, toDateInputValue, toPublishedAt } from './contentListState.ts'

export type NoticeContentMode = 'html' | 'text'

export type NoticeFormState = {
  content: string
  contentMode: NoticeContentMode
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
  | 'content_mode'
  | 'excerpt'
  | 'is_pinned'
  | 'kind'
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
    content: '',
    contentMode: 'html',
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
    pinnedStatus: post.is_pinned ? 'pinned' : 'none',
    status: post.status === 'published' ? 'published' : 'draft',
    title: post.title,
    type: normalizeNoticeType(post.type),
  }
}

export function toNoticeFormState(post: TableRow<'posts'>): NoticeFormState {
  return {
    content: post.content,
    contentMode: post.content_mode,
    excerpt: post.excerpt ?? '',
    isPinned: post.is_pinned,
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
  const type = normalizeNoticeType(form.type)

  if (!type || !form.title.trim() || !form.slug.trim() || !form.content.trim()) {
    throw new Error('공지사항 정보를 확인해주세요.')
  }

  return {
    content: form.content,
    content_mode: form.contentMode,
    excerpt: form.excerpt.trim() || null,
    is_pinned: form.isPinned,
    kind: 'notice',
    published_at: toPublishedAt(form.publishedAt),
    slug: form.slug.trim(),
    status,
    title: form.title.trim(),
    type,
  }
}
