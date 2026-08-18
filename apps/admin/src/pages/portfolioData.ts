import type { Json, PublishStatus, TableInsert, TableRow } from '@repo/supabase/types'
import { filterContentRows, formatAdminDate } from './contentListState.ts'
import {
  managedContentFormFromRow,
  managedContentInputFromForm,
  managedContentIsEmpty,
  type ManagedContentFormValue,
} from '../lib/managedContent.ts'

export type PortfolioLandingStatus = 'none' | 'published'

export type PortfolioImage = {
  readonly alt: string
  readonly fileName: string
  readonly path: string
}

export type PortfolioFormValues = ManagedContentFormValue & {
  readonly clientName: string
  readonly images: readonly PortfolioImage[]
  readonly isLandingEnabled: boolean
  readonly isPinned: boolean
  readonly slug: string
  readonly title: string
  readonly type: string
}

export type PortfolioRow = {
  readonly client: string
  readonly createdAt: string
  readonly detailHref: string
  readonly id: string
  readonly isPinned: boolean
  readonly landingStatus: PortfolioLandingStatus
  readonly status: PublishStatus
  readonly title: string
  readonly type: string
  readonly views: string
}

export type PortfolioMutationInput = Pick<
  TableInsert<'portfolio_items'>,
  | 'client_name'
  | 'content'
  | 'content_asset_scope'
  | 'content_authoring_mode'
  | 'content_json'
  | 'content_mode'
  | 'content_schema_version'
  | 'content_source_backup'
  | 'images'
  | 'pinned'
  | 'published_at'
  | 'show_on_landing'
  | 'slug'
  | 'status'
  | 'title'
  | 'type'
>

function isJsonObject(value: Json): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getPortfolioImages(value: Json): PortfolioImage[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((image) => {
    if (!isJsonObject(image) || typeof image.path !== 'string' || !image.path) return []

    const storedFileName = typeof image.fileName === 'string' ? image.fileName.trim() : ''
    const fallbackFileName = image.path.split('/').pop() || 'image'

    return [
      {
        alt: typeof image.alt === 'string' ? image.alt : '',
        fileName: storedFileName || fallbackFileName,
        path: image.path,
      },
    ]
  })
}

export function toPortfolioListRow(item: TableRow<'portfolio_items'>): PortfolioRow {
  return {
    client: item.client_name || '-',
    createdAt: formatAdminDate(item.created_at),
    detailHref: '/portfolio/' + item.id,
    id: item.id,
    isPinned: item.pinned,
    landingStatus: item.show_on_landing ? 'published' : 'none',
    status: item.status,
    title: item.title,
    type: item.type,
    views: new Intl.NumberFormat('ko-KR').format(item.view_count),
  }
}

export function toPortfolioFormValues(
  item: TableRow<'portfolio_items'>,
): PortfolioFormValues {
  return {
    clientName: item.client_name || '',
    ...managedContentFormFromRow(item),
    images: getPortfolioImages(item.images),
    isLandingEnabled: item.show_on_landing,
    isPinned: item.pinned,
    slug: item.slug,
    title: item.title,
    type: item.type,
  }
}

export function toPortfolioMutationInput(
  form: Omit<PortfolioFormValues, 'images'>,
  images: readonly PortfolioImage[],
  status: PublishStatus,
  publishedAt: string | null,
): PortfolioMutationInput {
  const managedContent = managedContentInputFromForm(form)
  const clientName = form.clientName.trim()
  const slug = form.slug.trim()
  const title = form.title.trim()
  const type = form.type.trim()

  if (!managedContent || !clientName || managedContentIsEmpty(form) || !slug || !title || !type) {
    throw new Error('포트폴리오 정보를 확인해주세요.')
  }

  if (status === 'published' && images.length === 0) {
    throw new Error('게시할 포트폴리오 이미지를 한 장 이상 등록해주세요.')
  }

  return {
    client_name: clientName,
    content: managedContent.content,
    content_asset_scope: managedContent.content_asset_scope,
    content_authoring_mode: managedContent.content_authoring_mode,
    content_json: managedContent.content_json as unknown as Json,
    content_mode: managedContent.content_mode,
    content_schema_version: managedContent.content_schema_version,
    content_source_backup: managedContent.content_source_backup,
    images: images.map((image) => ({
      alt: image.alt.trim(),
      fileName: image.fileName.trim() || image.path.split('/').pop() || 'image',
      path: image.path,
    })) as Json,
    pinned: form.isPinned,
    published_at: status === 'published' ? publishedAt : null,
    show_on_landing: form.isLandingEnabled,
    slug,
    status,
    title,
    type,
  }
}

export function filterPortfolioRows(
  rows: readonly PortfolioRow[],
  filters: { readonly query: string; readonly status: string; readonly type: string },
) {
  let status = filters.status

  if (status === '임시저장') status = 'draft'
  if (status === '게시됨') status = 'published'
  if (status === '보관됨') status = 'archived'

  return filterContentRows(rows, { ...filters, status })
}

export function getPortfolioSettingCounts(rows: readonly PortfolioRow[]) {
  return {
    landing: rows.filter((row) => row.landingStatus === 'published').length,
    pinned: rows.filter((row) => row.isPinned).length,
  }
}
