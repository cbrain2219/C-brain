import type { SalesEvent } from '@repo/supabase'

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
  readonly id: 'payments' | 'refunds'
  readonly label: string
  readonly points: readonly SalesTrendPoint[]
}

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

export function formatSalesDateLabel(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  return match ? `${match[1].slice(2)}. ${match[2]}. ${match[3]}` : value
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

type TrendEvent = Pick<SalesEvent, 'amount' | 'kind' | 'occurredAt' | 'status'>

type TrendBucket = {
  readonly axisLabel: string
  readonly endOffset: number
  readonly startOffset: number
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

    return {
      axisLabel: formatMonthDay(start),
      endOffset,
      startOffset,
    }
  })
}

export function buildSalesTrendSeries(
  events: readonly TrendEvent[],
  filters: SalesFilters,
): readonly SalesTrendSeries[] {
  const from = parseDateInput(filters.from)
  const to = parseDateInput(filters.to)

  if (from === null || to === null || from > to) {
    return [
      { color: 'brand', id: 'payments', label: '결제 금액', points: [] },
      { color: 'info', id: 'refunds', label: '환불 금액', points: [] },
    ]
  }

  const dayCount = Math.floor((to - from) / DAY_IN_MILLISECONDS) + 1
  const buckets = makeTrendBuckets(from, dayCount)
  const paymentValues = buckets.map(() => 0)
  const refundValues = buckets.map(() => 0)
  let hasVerifiedEvent = false

  for (const event of events) {
    const occurredAt = event.occurredAt

    if (!occurredAt) continue

    const occurredOn = getKstDateMilliseconds(occurredAt)

    if (occurredOn === null || occurredOn < from || occurredOn > to) continue

    const isPayment =
      event.kind === 'payment' &&
      (event.status === 'paid' ||
        event.status === 'partial_cancelled' ||
        event.status === 'cancelled')
    const isRefund = event.kind === 'refund' && event.status === 'succeeded'

    if (!isPayment && !isRefund) continue

    const dayOffset = Math.floor((occurredOn - from) / DAY_IN_MILLISECONDS)
    const bucketIndex = buckets.findIndex(
      (bucket) =>
        dayOffset >= bucket.startOffset && dayOffset <= bucket.endOffset,
    )

    if (bucketIndex < 0) continue

    if (isPayment) paymentValues[bucketIndex] += event.amount
    if (isRefund) refundValues[bucketIndex] += event.amount
    hasVerifiedEvent = true
  }

  const makePoints = (
    values: readonly number[],
    valueLabel: string,
  ): readonly SalesTrendPoint[] =>
    hasVerifiedEvent
      ? buckets.map((bucket, index) => ({
          axisLabel: bucket.axisLabel,
          tooltipLabel: `${bucket.axisLabel} ${valueLabel}`,
          value: values[index],
        }))
      : []

  return [
    {
      color: 'brand',
      id: 'payments',
      label: '결제 금액',
      points: makePoints(paymentValues, '결제 금액'),
    },
    {
      color: 'info',
      id: 'refunds',
      label: '환불 금액',
      points: makePoints(refundValues, '환불 금액'),
    },
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

export function getRefundReasonError(value: string): string | null {
  const length = value.trim().length

  if (length === 0) return '환불 사유를 입력해주세요.'
  if (length > 100) return '환불 사유는 100자 이하여야 합니다.'

  return null
}
