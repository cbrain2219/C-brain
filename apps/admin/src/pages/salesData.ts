export type SalesPreview = 'data' | 'empty' | 'refund' | 'refund-complete'
export type SalesTransactionStatus = 'refund-complete' | 'settled' | 'scheduled'

export type SalesSummary = {
  readonly monthlyPaymentAmount: number
  readonly monthlyPaymentCount: number
  readonly monthlyVisitorCount: number
  readonly scheduledSettlementAmount: number
  readonly settlementLabel: string
}

export type SalesTrendPoint = {
  readonly axisLabel: string
  readonly tooltipLabel: string
  readonly value: number
}

export type SalesTrendSeries = {
  readonly color: 'brand' | 'info'
  readonly id: 'all' | 'brochure-catalog'
  readonly label: string
  readonly points: readonly SalesTrendPoint[]
}

export type SalesTransaction = {
  readonly cardFee: number
  readonly customerName: string
  readonly id: string
  readonly productName: string
  readonly receiptHref: string | null
  readonly refundable: boolean
  readonly settlementAmount: number
  readonly status: SalesTransactionStatus
  readonly transactionAmount: number
  readonly transactionDate: string
}

export type SalesDashboardData = {
  readonly series: readonly SalesTrendSeries[]
  readonly summary: SalesSummary
  readonly transactions: readonly SalesTransaction[]
}

export type ChartPoint = {
  readonly x: number
  readonly y: number
}

const numberFormatter = new Intl.NumberFormat('ko-KR')

const allValues = [
  720_000, 980_000, 610_000, 1_280_000, 1_520_000, 910_000, 1_810_000,
  1_980_000, 2_140_000, 1_660_000, 1_940_000, 2_330_000,
] as const

const brochureValues = [
  410_000, 590_000, 400_000, 610_000, 890_000, 470_000, 1_010_000, 880_000,
  1_245_500, 720_000, 1_000_000, 1_540_000,
] as const

function makePoints(values: readonly number[]): readonly SalesTrendPoint[] {
  return values.map((value, index) => ({
    axisLabel: String(index + 1),
    tooltipLabel: `2월 ${index + 1}일 판매 금액`,
    value,
  }))
}

const salesSeries = [
  {
    color: 'brand',
    id: 'all',
    label: '전체',
    points: makePoints(allValues),
  },
  {
    color: 'info',
    id: 'brochure-catalog',
    label: '브로슈어·카탈로그',
    points: makePoints(brochureValues),
  },
] satisfies readonly SalesTrendSeries[]

const salesTransactions = [
  {
    cardFee: 0,
    customerName: '이동규',
    id: 'refund-001',
    productName: '[현대로템] 명함',
    receiptHref: null,
    refundable: false,
    settlementAmount: -3_000,
    status: 'refund-complete',
    transactionAmount: -3_000,
    transactionDate: '26. 03. 16',
  },
  {
    cardFee: 598,
    customerName: '이동규',
    id: 'settled-002',
    productName: '[현대로템] 명함',
    receiptHref: '#receipt-settled-002',
    refundable: true,
    settlementAmount: 15_303,
    status: 'settled',
    transactionAmount: 16_000,
    transactionDate: '26. 03. 16',
  },
  {
    cardFee: 598,
    customerName: '김민지',
    id: 'settled-003',
    productName: '[노코더스] 브로슈어·카탈로그',
    receiptHref: '#receipt-settled-003',
    refundable: true,
    settlementAmount: 15_303,
    status: 'settled',
    transactionAmount: 16_000,
    transactionDate: '26. 03. 16',
  },
  {
    cardFee: 598,
    customerName: '박서준',
    id: 'settled-004',
    productName: '[CJ ENM] 브로슈어·카탈로그',
    receiptHref: '#receipt-settled-004',
    refundable: true,
    settlementAmount: 15_303,
    status: 'settled',
    transactionAmount: 16_000,
    transactionDate: '26. 03. 16',
  },
  {
    cardFee: 598,
    customerName: '최유진',
    id: 'scheduled-005',
    productName: '[연세대학교] 리플렛·팜플렛',
    receiptHref: '#receipt-scheduled-005',
    refundable: true,
    settlementAmount: 15_303,
    status: 'scheduled',
    transactionAmount: 16_000,
    transactionDate: '26. 03. 16',
  },
  {
    cardFee: 598,
    customerName: '정하늘',
    id: 'scheduled-006',
    productName: '[롯데] 명함',
    receiptHref: '#receipt-scheduled-006',
    refundable: true,
    settlementAmount: 15_303,
    status: 'scheduled',
    transactionAmount: 16_000,
    transactionDate: '26. 03. 16',
  },
] satisfies readonly SalesTransaction[]

export const salesDashboardFixture: SalesDashboardData = {
  series: salesSeries,
  summary: {
    monthlyPaymentAmount: 2_525_000,
    monthlyPaymentCount: 1_453,
    monthlyVisitorCount: 3_520,
    scheduledSettlementAmount: 2_452_423,
    settlementLabel: '26. 03. 18. (수) 정산',
  },
  transactions: salesTransactions,
}

export const emptySalesDashboardFixture: SalesDashboardData = {
  series: salesSeries.map((series) => ({ ...series, points: [] })),
  summary: {
    monthlyPaymentAmount: 0,
    monthlyPaymentCount: 0,
    monthlyVisitorCount: 0,
    scheduledSettlementAmount: 0,
    settlementLabel: '26. 03. 18. (수) 정산',
  },
  transactions: [],
}

export const refundPreviewTransaction: SalesTransaction = {
  cardFee: 0,
  customerName: '이동규',
  id: 'refund-preview',
  productName: '[현대로템] 명함',
  receiptHref: null,
  refundable: true,
  settlementAmount: 38_000,
  status: 'settled',
  transactionAmount: 38_000,
  transactionDate: '26. 03. 16',
}

export function getSalesPreview(value: string | null): SalesPreview {
  if (value === 'empty' || value === 'refund' || value === 'refund-complete')
    return value
  return 'data'
}

export function formatSalesNumber(value: number) {
  return numberFormatter.format(value)
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
    return `거래금액 ${formatSalesNumber(maximum)}원을 초과할 수 없습니다.`
  }

  return null
}

export function applyLocalRefund(
  transaction: SalesTransaction,
  amount: number,
): SalesTransaction {
  return {
    ...transaction,
    cardFee: 0,
    receiptHref: null,
    refundable: false,
    settlementAmount: -amount,
    status: 'refund-complete',
    transactionAmount: -amount,
  }
}
