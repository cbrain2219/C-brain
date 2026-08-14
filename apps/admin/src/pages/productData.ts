import { getLowestProductPrice } from '@repo/supabase'
import type { ProductRecord } from '@repo/supabase'
import type { ProductStatus } from '@repo/supabase/types'
import { formatAdminDate } from './contentListState.ts'

export type ProductListRow = {
  createdAt: string
  detailHref: string
  id: string
  name: string
  price: string
  status: ProductStatus
  type: string
}

export function formatNumericValue(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function toProductListRow(product: ProductRecord): ProductListRow {
  const lowestPrice = getLowestProductPrice(
    product.configuration,
    product.product_type,
  )

  return {
    createdAt: formatAdminDate(product.created_at),
    detailHref: '/products/' + product.id,
    id: product.id,
    name: product.product_type,
    price:
      lowestPrice === null
        ? '-'
        : new Intl.NumberFormat('ko-KR').format(lowestPrice) + '원~',
    status: product.status,
    type: product.product_type,
  }
}

export function filterProductRows<Row extends Pick<ProductListRow, 'name' | 'status' | 'type'>>(
  rows: readonly Row[],
  filters: {
    query: string
    status: ProductStatus | '전체' | '임시저장' | '게시됨'
    type: string
  },
) {
  const query = filters.query.trim().toLocaleLowerCase('ko-KR')
  const status =
    filters.status === '임시저장' ? 'draft' : filters.status === '게시됨' ? 'published' : filters.status

  return rows.filter(
    (row) =>
      (status === '전체' || row.status === status) &&
      (filters.type === '전체' || row.type === filters.type) &&
      row.name.toLocaleLowerCase('ko-KR').includes(query),
  )
}
