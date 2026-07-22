import type { Json, ProductStatus, TableInsert, TableRow } from '@repo/supabase/types'
import { formatAdminDate } from './contentListState.ts'

export type ProductFormState = {
  designPrintEstimate: string
  name: string
  orderQuantities: string[]
  pageCounts: string[]
  paperTypes: string[]
  planningEstimate: string
  productType: string
  unitPrices: Record<string, string>
}

export type ProductListRow = {
  createdAt: string
  detailHref: string
  id: string
  name: string
  price: string
  status: ProductStatus
  type: string
}

export type ProductMutationInput = Pick<
  TableInsert<'products'>,
  | 'design_print_estimate'
  | 'name'
  | 'order_quantities'
  | 'page_counts'
  | 'paper_types'
  | 'planning_estimate'
  | 'status'
  | 'type'
  | 'unit_prices'
>

export function createInitialProductForm(): ProductFormState {
  return {
    designPrintEstimate: '',
    name: '',
    orderQuantities: [''],
    pageCounts: [''],
    paperTypes: [''],
    planningEstimate: '',
    productType: '',
    unitPrices: {},
  }
}

export function formatNumericValue(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function getUnitPriceKey(paperIndex: number, pageIndex: number, quantityIndex: number) {
  return [paperIndex, pageIndex, quantityIndex].join(':')
}

export function getMissingUnitPriceKey(form: ProductFormState) {
  for (let paperIndex = 0; paperIndex < form.paperTypes.length; paperIndex += 1) {
    for (let pageIndex = 0; pageIndex < form.pageCounts.length; pageIndex += 1) {
      for (let quantityIndex = 0; quantityIndex < form.orderQuantities.length; quantityIndex += 1) {
        const key = getUnitPriceKey(paperIndex, pageIndex, quantityIndex)

        if (!form.unitPrices[key]?.trim()) return key
      }
    }
  }

  return null
}

function toSafeNonNegativeInteger(value: string) {
  const digits = value.replace(/\D/g, '')

  if (!digits) return null

  const number = Number(digits)

  return Number.isSafeInteger(number) && number >= 0 ? number : null
}

function toTrimmedUniqueText(values: readonly string[]) {
  const trimmedValues = values.map((value) => value.trim())
  const normalizedValues = new Set(
    trimmedValues.map((value) => value.toLocaleLowerCase('ko-KR')),
  )

  if (
    trimmedValues.length === 0 ||
    !trimmedValues.every(Boolean) ||
    normalizedValues.size !== trimmedValues.length
  ) {
    throw new Error('상품 정보를 확인해주세요.')
  }

  return trimmedValues
}

function toPositiveIntegers(values: readonly string[]) {
  if (values.length === 0) throw new Error('상품 정보를 확인해주세요.')

  const numbers: number[] = []

  for (const value of values) {
    const number = toSafeNonNegativeInteger(value)

    if (number === null || number <= 0) {
      throw new Error('상품 정보를 확인해주세요.')
    }

    numbers.push(number)
  }

  return numbers
}

export function toProductMutationInput(
  form: ProductFormState,
  status: ProductStatus,
): ProductMutationInput {
  const name = form.name.trim()
  const type = form.productType.trim()
  const designPrintEstimate = toSafeNonNegativeInteger(form.designPrintEstimate)
  const planningEstimate = toSafeNonNegativeInteger(form.planningEstimate)

  if (!name || !type || designPrintEstimate === null || planningEstimate === null) {
    throw new Error('상품 정보를 확인해주세요.')
  }

  const unitPrices: Record<string, number> = {}

  for (const [key, value] of Object.entries(form.unitPrices)) {
    if (!value.trim()) continue

    const price = toSafeNonNegativeInteger(value)

    if (price === null) throw new Error('상품 정보를 확인해주세요.')

    unitPrices[key] = price
  }

  return {
    design_print_estimate: designPrintEstimate,
    name,
    order_quantities: toPositiveIntegers(form.orderQuantities),
    page_counts: toPositiveIntegers(form.pageCounts),
    paper_types: toTrimmedUniqueText(form.paperTypes),
    planning_estimate: planningEstimate,
    status,
    type,
    unit_prices: unitPrices as Json,
  }
}

function isJsonObject(value: Json): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function toProductFormState(product: TableRow<'products'>): ProductFormState {
  const unitPrices: Record<string, string> = {}

  if (isJsonObject(product.unit_prices)) {
    for (const [key, value] of Object.entries(product.unit_prices)) {
      if (typeof value === 'number') unitPrices[key] = formatNumericValue(String(value))
    }
  }

  return {
    designPrintEstimate: formatNumericValue(String(product.design_print_estimate)),
    name: product.name,
    orderQuantities: product.order_quantities.map((value) => formatNumericValue(String(value))),
    pageCounts: product.page_counts.map((value) => formatNumericValue(String(value))),
    paperTypes: product.paper_types,
    planningEstimate: formatNumericValue(String(product.planning_estimate)),
    productType: product.type,
    unitPrices,
  }
}

function getUnitPrices(value: Json) {
  if (!isJsonObject(value)) return []

  return Object.values(value).filter(
    (unitPrice): unitPrice is number => typeof unitPrice === 'number' && Number.isFinite(unitPrice),
  )
}

export function toProductListRow(product: TableRow<'products'>): ProductListRow {
  const unitPrices = getUnitPrices(product.unit_prices)
  const lowestUnitPrice = unitPrices.length > 0 ? Math.min(...unitPrices) : null

  return {
    createdAt: formatAdminDate(product.created_at),
    detailHref: '/products/' + product.id,
    id: product.id,
    name: product.name,
    price: lowestUnitPrice === null ? '-' : new Intl.NumberFormat('ko-KR').format(lowestUnitPrice) + '원',
    status: product.status,
    type: product.type,
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
