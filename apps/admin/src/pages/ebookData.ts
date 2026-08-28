import type { EbookStatus, TableInsert, TableRow } from '@repo/supabase/types'
import type { AdminContentStatus } from '../components/admin-table/AdminContentTableCells'
import { formatAdminDate } from './contentListState.ts'

export type EbookFormState = {
  embedUrl: string
  ogImage: File | null
  ogImageAlt: string
  ogImageFileName: string | null
  ogImagePath: string | null
  ogImagePreviewUrl: string | null
  seoDescription: string
  slug: string
  title: string
}

export type EbookListRow = {
  createdAt: string
  detailHref: string
  id: string
  publicUrl: string
  status: AdminContentStatus
  title: string
}

export type EbookMutationInput = Pick<
  TableInsert<'ebooks'>,
  | 'embed_url'
  | 'og_image_alt'
  | 'og_image_file_name'
  | 'og_image_path'
  | 'seo_description'
  | 'slug'
  | 'status'
  | 'title'
>

const ebookSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const printableAsciiPattern = /^[\x20-\x7e]+$/

export function createInitialEbookForm(): EbookFormState {
  return {
    embedUrl: '',
    ogImage: null,
    ogImageAlt: '',
    ogImageFileName: null,
    ogImagePath: null,
    ogImagePreviewUrl: null,
    seoDescription: '',
    slug: '',
    title: '',
  }
}

export function isValidEbookSlug(value: string) {
  return ebookSlugPattern.test(value.trim())
}

export function sanitizeEbookSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

export function isValidEbookUrl(value: string) {
  const trimmedValue = value.trim()

  if (!printableAsciiPattern.test(trimmedValue)) return false

  try {
    const url = new URL(trimmedValue)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function sanitizeEbookEmbedUrl(value: string) {
  return value.replace(/[^\x20-\x7e]/g, '')
}

export function normalizeEbookEmbedUrl(value: string) {
  const trimmedValue = value.trim()

  if (!printableAsciiPattern.test(trimmedValue)) {
    throw new Error('지원하지 않는 E-book URL입니다.')
  }

  const url = new URL(trimmedValue)

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('지원하지 않는 E-book URL입니다.')
  }

  url.protocol = 'https:'
  return url.toString()
}

export function createEbookPublicUrl(slug: string, publicOrigin: string) {
  const originWithSlash = publicOrigin.endsWith('/')
    ? publicOrigin
    : `${publicOrigin}/`
  return new URL(slug, originWithSlash).toString()
}

export function toEbookListRow(
  ebook: TableRow<'ebooks'>,
  publicOrigin: string,
): EbookListRow {
  return {
    createdAt: formatAdminDate(ebook.created_at),
    detailHref: `/ebook/${ebook.id}`,
    id: ebook.id,
    publicUrl: createEbookPublicUrl(ebook.slug, publicOrigin),
    status: ebook.status === 'published' ? 'published' : 'draft',
    title: ebook.title,
  }
}

export function toEbookFormState(
  ebook: TableRow<'ebooks'>,
  ogImagePreviewUrl: string | null = null,
): EbookFormState {
  return {
    embedUrl: ebook.embed_url,
    ogImage: null,
    ogImageAlt: ebook.og_image_alt || '',
    ogImageFileName: ebook.og_image_file_name,
    ogImagePath: ebook.og_image_path,
    ogImagePreviewUrl,
    seoDescription: ebook.seo_description,
    slug: ebook.slug,
    title: ebook.title,
  }
}

export function toEbookMutationInput(
  form: EbookFormState,
  status: EbookStatus = 'published',
  ogImagePath: string | null = form.ogImagePath,
): EbookMutationInput {
  const seoDescription = form.seoDescription.trim()
  const slug = form.slug.trim()
  const title = form.title.trim()

  if (
    !isValidEbookUrl(form.embedUrl) ||
    !isValidEbookSlug(slug) ||
    !title ||
    !seoDescription
  ) {
    throw new Error('E-book 정보를 확인해주세요.')
  }

  return {
    embed_url: normalizeEbookEmbedUrl(form.embedUrl),
    og_image_alt: ogImagePath ? form.ogImageAlt.trim() || title : null,
    og_image_file_name: ogImagePath
      ? form.ogImageFileName?.trim() || 'ebook-og-image'
      : null,
    og_image_path: ogImagePath,
    seo_description: seoDescription,
    slug,
    status,
    title,
  }
}

export function getEbookOgImageDisplayName(
  form: Pick<EbookFormState, 'ogImage' | 'ogImageFileName'>,
) {
  return form.ogImage?.name || form.ogImageFileName || '등록된 OG 이미지'
}
