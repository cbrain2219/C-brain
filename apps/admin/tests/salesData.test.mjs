import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { summarizeSalesEvents } from '@repo/supabase'
import {
  buildSalesTrendSeries,
  formatSalesDateLabel,
  formatSalesNumber,
  getChartPoints,
  getRefundAmountError,
  getRefundReasonError,
} from '../src/pages/salesData.ts'

test('sales summary counts only verified payment and refund events', () => {
  assert.deepEqual(
    summarizeSalesEvents([
      { amount: 10_000, kind: 'payment', status: 'paid' },
      { amount: 7_000, kind: 'payment', status: 'paid' },
      { amount: 4_000, kind: 'refund', status: 'succeeded' },
      { amount: 9_000, kind: 'payment', status: 'unknown' },
    ]),
    {
      grossSalesAmount: 17_000,
      netSalesAmount: 13_000,
      paymentCount: 2,
      refundedAmount: 4_000,
    },
  )
})

test('sales values use Korean thousands separators', () => {
  assert.equal(formatSalesNumber(2_452_423), '2,452,423')
  assert.equal(formatSalesNumber(-3_000), '-3,000')
})

test('sales dates keep the existing compact period label', () => {
  assert.equal(formatSalesDateLabel('2026-08-10'), '26. 08. 10')
})

test('chart points span the full width and keep larger values higher', () => {
  const points = getChartPoints([0, 50, 100], 200, 100)

  assert.deepEqual(points, [
    { x: 0, y: 100 },
    { x: 100, y: 50 },
    { x: 200, y: 0 },
  ])
})

test('sales trend series buckets verified DB events by KST date', () => {
  const series = buildSalesTrendSeries(
    [
      {
        amount: 10_000,
        kind: 'payment',
        occurredAt: '2026-08-08T03:00:00.000Z',
        status: 'paid',
      },
      {
        amount: 4_000,
        kind: 'refund',
        occurredAt: '2026-08-09T03:00:00.000Z',
        status: 'succeeded',
      },
    ],
    { channel: 'all', from: '2026-08-08', to: '2026-08-10' },
  )

  assert.deepEqual(
    series.map((item) => ({
      id: item.id,
      labels: item.points.map((point) => point.axisLabel),
      values: item.points.map((point) => point.value),
    })),
    [
      {
        id: 'payments',
        labels: ['08.08', '08.09', '08.10'],
        values: [10_000, 0, 0],
      },
      {
        id: 'refunds',
        labels: ['08.08', '08.09', '08.10'],
        values: [0, 4_000, 0],
      },
    ],
  )
})

test('refund amount must be a whole won amount within the refundable balance', () => {
  assert.equal(getRefundAmountError('', 38_000), '환불 금액을 입력해주세요.')
  assert.equal(getRefundAmountError('3,000', 38_000), null)
  assert.equal(
    getRefundAmountError('0', 38_000),
    '환불 금액은 1원 이상이어야 합니다.',
  )
  assert.equal(
    getRefundAmountError('38,001', 38_000),
    '환불 가능 금액 38,000원을 초과할 수 없습니다.',
  )
  assert.equal(
    getRefundAmountError('3.5', 38_000),
    '환불 금액은 원 단위 숫자로 입력해주세요.',
  )
})

test('refund reason must be trimmed and no longer than 100 characters', () => {
  assert.equal(getRefundReasonError('  '), '환불 사유를 입력해주세요.')
  assert.equal(getRefundReasonError('고객 요청'), null)
  assert.equal(
    getRefundReasonError('가'.repeat(101)),
    '환불 사유는 100자 이하여야 합니다.',
  )
})

test('refund actions depend only on the verified payment balance', async () => {
  const source = await readFile(
    new URL(
      '../src/components/admin-sales/SalesTransactionsTable.tsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(source, /canRefund\(row\)/)
  assert.doesNotMatch(source, /status === ["']unknown["']/)
  assert.match(source, /rows\.map\(\(row\) =>/)
})

test('verified sales data keeps the original card, chart, and eight-column UI', async () => {
  const [pageSource, summarySource, tableSource] = await Promise.all([
    readFile(new URL('../src/pages/SalesPage.tsx', import.meta.url), 'utf8'),
    readFile(
      new URL(
        '../src/components/admin-sales/SalesSummaryCards.tsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/components/admin-sales/SalesTransactionsTable.tsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(pageSource, /<SalesTrendChart/)
  assert.match(summarySource, /admin-sales-summary-card__icon/)

  const headerSource = tableSource.slice(
    tableSource.indexOf('const headers'),
    tableSource.indexOf('] as const'),
  )
  const expectedHeaders = [
    '상태',
    '상품명',
    '거래일자',
    '거래금액',
    '고객',
    '환불가능액',
    '거래영수증',
    '환불',
  ]
  const renderedHeaders = Array.from(
    headerSource.matchAll(/["']([^"']+)["'],/g),
    (match) => match[1],
  )

  assert.deepEqual(renderedHeaders, expectedHeaders)
})
