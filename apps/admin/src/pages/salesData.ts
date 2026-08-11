import type { SalesTransaction } from '@repo/supabase'

export type SalesChannel = 'all' | 'linkpay' | 'site'

export type SalesFilters = {
  readonly channel: SalesChannel
  readonly from: string
  readonly to: string
}

export type SalesTrendPoint = {
  readonly axisLabel: string
  readonly tooltipLabel: string
  readonly value: number
}

export type SalesTrendSeries = {
  readonly color: 'brand' | 'info'
  readonly id: string
  readonly label: string
  readonly points: readonly SalesTrendPoint[]
  readonly productId: string | null
}

export const salesChartProductColors = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'indigo',
  'violet',
] as const

export type SalesChartProductColor = (typeof salesChartProductColors)[number]

export type ChartPoint = {
  readonly x: number
  readonly y: number
}

const numberFormatter = new Intl.NumberFormat('ko-KR')
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000
const kstDateFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Seoul',
  year: 'numeric',
})

export function formatSalesNumber(value: number) {
  return numberFormatter.format(value)
}

export function formatRefundAmountInput(
  value: string,
  maximum: number,
): string | null {
  if (!/^[\d,]*$/.test(value)) return null

  const digits = value.replace(/\D/g, '')

  if (digits === '') return ''

  const normalized = digits.replace(/^0+(?=\d)/, '')
  const amount = Number(normalized)

  if (!Number.isSafeInteger(amount) || amount > maximum) return null

  return formatSalesNumber(Math.max(0, amount))
}

export function getSalesChartProductColor(
  selectionIndex: number,
): SalesChartProductColor {
  const safeSelectionIndex =
    Number.isInteger(selectionIndex) && selectionIndex >= 0 ? selectionIndex : 0
  const index = safeSelectionIndex % salesChartProductColors.length

  return salesChartProductColors[index]
}

export function reconcileSelectedProductIds(
  productSeries: readonly SalesTrendSeries[],
  selectedIds: readonly SalesTrendSeries['id'][],
  selectionWasCleared: boolean,
): readonly SalesTrendSeries['id'][] {
  const availableIds = new Set(productSeries.map((item) => item.id))
  const retainedIds = selectedIds.filter((id) => availableIds.has(id))

  if (retainedIds.length > 0 || selectionWasCleared || !productSeries[0]) {
    return retainedIds
  }

  return [productSeries[0].id]
}

export function orderSelectedProductSeries(
  productSeries: readonly SalesTrendSeries[],
  selectedIds: readonly SalesTrendSeries['id'][],
): readonly SalesTrendSeries[] {
  const seriesById = new Map(productSeries.map((item) => [item.id, item]))

  return selectedIds.flatMap((id) => {
    const item = seriesById.get(id)

    return item ? [item] : []
  })
}

export function formatSalesDateLabel(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  return match ? `${match[1].slice(2)}. ${match[2]}. ${match[3]}` : value
}

const koreanWeekdays = ['일', '월', '화', '수', '목', '금', '토'] as const

export function formatSettlementLabel(isoDate: string) {
  const milliseconds = parseDateInput(isoDate)

  if (milliseconds === null) return `${formatSalesDateLabel(isoDate)} 정산`

  return `${formatSalesDateLabel(isoDate)}. (${koreanWeekdays[new Date(milliseconds).getUTCDay()]}) 정산`
}

export function getChartPoints(
  values: readonly number[],
  width: number,
  height: number,
  maximum = Math.max(...values, 1),
): readonly ChartPoint[] {
  if (values.length === 0) return []

  const denominator = Math.max(values.length - 1, 1)
  const safeMaximum = Math.max(maximum, 1)

  return values.map((value, index) => ({
    x: (width * index) / denominator,
    y: height - (height * value) / safeMaximum,
  }))
}

type TrendBucket = {
  readonly axisLabel: string
  readonly endOffset: number
  readonly startOffset: number
  readonly tooltipLabel: string
}

function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const milliseconds = Date.UTC(year, month - 1, day)
  const date = new Date(milliseconds)

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return milliseconds
}

function formatMonthDay(milliseconds: number) {
  const date = new Date(milliseconds)
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${month}.${day}`
}

function formatKoreanMonthDay(milliseconds: number) {
  const date = new Date(milliseconds)

  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`
}

function getKstDateMilliseconds(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  const parts = Object.fromEntries(
    kstDateFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  )

  return parseDateInput(`${parts.year}-${parts.month}-${parts.day}`)
}

function makeTrendBuckets(from: number, dayCount: number) {
  const bucketCount = Math.min(12, dayCount)

  return Array.from({ length: bucketCount }, (_, index): TrendBucket => {
    const startOffset = Math.floor((index * dayCount) / bucketCount)
    const endOffset = Math.floor(((index + 1) * dayCount) / bucketCount) - 1
    const start = from + startOffset * DAY_IN_MILLISECONDS
    const end = from + endOffset * DAY_IN_MILLISECONDS
    const startLabel = formatKoreanMonthDay(start)
    const endLabel = formatKoreanMonthDay(end)

    return {
      axisLabel: formatMonthDay(start),
      endOffset,
      startOffset,
      tooltipLabel:
        startOffset === endOffset
          ? `${startLabel} 판매 금액`
          : `${startLabel}~${endLabel} 판매 금액`,
    }
  })
}

export function buildSalesTrendSeries(
  transactions: readonly SalesTransaction[],
  filters: SalesFilters,
): readonly SalesTrendSeries[] {
  const from = parseDateInput(filters.from)
  const to = parseDateInput(filters.to)

  if (from === null || to === null || from > to) {
    return [
      {
        color: 'brand',
        id: 'all',
        label: '전체',
        points: [],
        productId: null,
      },
    ]
  }

  const dayCount = Math.floor((to - from) / DAY_IN_MILLISECONDS) + 1
  const buckets = makeTrendBuckets(from, dayCount)
  const allValues = buckets.map(() => 0)
  const products = new Map<
    string,
    { label: string; total: number; values: number[] }
  >()
  let hasTransactions = false

  for (const transaction of transactions) {
    const occurredOn = getKstDateMilliseconds(transaction.occurredAt)

    if (occurredOn === null || occurredOn < from || occurredOn > to) continue

    const dayOffset = Math.floor((occurredOn - from) / DAY_IN_MILLISECONDS)
    const bucketIndex = buckets.findIndex(
      (bucket) =>
        dayOffset >= bucket.startOffset && dayOffset <= bucket.endOffset,
    )

    if (bucketIndex < 0) continue

    const product = products.get(transaction.productId) ?? {
      label: transaction.productLabel,
      total: 0,
      values: buckets.map(() => 0),
    }

    product.total += transaction.transactionAmount
    product.values[bucketIndex] += transaction.transactionAmount
    allValues[bucketIndex] += transaction.transactionAmount
    products.set(transaction.productId, product)
    hasTransactions = true
  }

  const makePoints = (values: readonly number[]): readonly SalesTrendPoint[] =>
    hasTransactions
      ? buckets.map((bucket, index) => ({
          axisLabel: bucket.axisLabel,
          tooltipLabel: bucket.tooltipLabel,
          value: values[index],
        }))
      : []

  return [
    {
      color: 'brand',
      id: 'all',
      label: '전체',
      points: makePoints(allValues),
      productId: null,
    },
    ...[...products.entries()]
      .sort(([leftId, left], [rightId, right]) =>
        right.total - left.total ||
        left.label.localeCompare(right.label, 'ko') ||
        leftId.localeCompare(rightId),
      )
      .map(([productId, product]) => ({
        color: 'info' as const,
        id: `product:${productId}`,
        label: product.label,
        points: makePoints(product.values),
        productId,
      })),
  ]
}

function parseRefundAmount(value: string) {
  const normalized = value.replaceAll(',', '').trim()

  if (!/^\d+$/.test(normalized)) return null

  return Number(normalized)
}

export function getRefundAmountError(
  value: string,
  maximum: number,
): string | null {
  if (value.trim() === '') return '환불 금액을 입력해주세요.'

  const amount = parseRefundAmount(value)

  if (amount === null || !Number.isSafeInteger(amount)) {
    return '환불 금액은 원 단위 숫자로 입력해주세요.'
  }

  if (amount < 1) return '환불 금액은 1원 이상이어야 합니다.'

  if (amount > maximum) {
    return `환불 가능 금액 ${formatSalesNumber(maximum)}원을 초과할 수 없습니다.`
  }

  return null
}

export function getRefundCapabilityError(
  value: string,
  maximum: number,
  canPartCancel: boolean | null,
): string | null {
  if (canPartCancel !== false) return null

  return parseRefundAmount(value) === maximum
    ? null
    : '결제사 정책상 남은 환불 가능 금액 전액만 취소할 수 있습니다.'
}
