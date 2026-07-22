import type { Json, PublishStatus, TableInsert, TableRow } from '@repo/supabase/types'
import { filterContentRows, formatAdminDate } from './contentListState.ts'

export type PortfolioLandingStatus = 'none' | 'published'

export type PortfolioImage = {
  readonly alt: string
  readonly path: string
}

export type PortfolioFormValues = {
  readonly clientName: string
  readonly content: string
  readonly contentMode: 'html' | 'text'
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
  | 'content_mode'
  | 'images'
  | 'is_landing_enabled'
  | 'is_pinned'
  | 'published_at'
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

    return [{ alt: typeof image.alt === 'string' ? image.alt : '', path: image.path }]
  })
}

export function toPortfolioListRow(item: TableRow<'portfolio_items'>): PortfolioRow {
  return {
    client: item.client_name || '-',
    createdAt: formatAdminDate(item.created_at),
    detailHref: '/portfolio/' + item.id,
    id: item.id,
    isPinned: item.is_pinned,
    landingStatus: item.is_landing_enabled ? 'published' : 'none',
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
    content: item.content,
    contentMode: item.content_mode,
    images: getPortfolioImages(item.images),
    isLandingEnabled: item.is_landing_enabled,
    isPinned: item.is_pinned,
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
  const clientName = form.clientName.trim()
  const slug = form.slug.trim()
  const title = form.title.trim()
  const type = form.type.trim()

  if (!clientName || !form.content.trim() || !slug || !title || !type) {
    throw new Error('포트폴리오 정보를 확인해주세요.')
  }

  if (status === 'published' && images.length === 0) {
    throw new Error('게시할 포트폴리오 이미지를 한 장 이상 등록해주세요.')
  }

  return {
    client_name: clientName,
    content: form.content,
    content_mode: form.contentMode,
    images: images.map((image) => ({ alt: image.alt.trim(), path: image.path })) as Json,
    is_landing_enabled: form.isLandingEnabled,
    is_pinned: form.isPinned,
    published_at: status === 'published' ? publishedAt : null,
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
