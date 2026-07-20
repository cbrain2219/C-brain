import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyLocalRefund,
  emptySalesDashboardFixture,
  formatSalesNumber,
  getChartPoints,
  getRefundAmountError,
  getSalesPreview,
  salesDashboardFixture,
} from '../src/pages/salesData.ts'

test('sales preview accepts only the four supported fixture states', () => {
  assert.equal(getSalesPreview(null), 'data')
  assert.equal(getSalesPreview('empty'), 'empty')
  assert.equal(getSalesPreview('refund'), 'refund')
  assert.equal(getSalesPreview('refund-complete'), 'refund-complete')
  assert.equal(getSalesPreview('unexpected'), 'data')
})

test('populated and empty fixtures expose the two Figma data states', () => {
  assert.equal(salesDashboardFixture.transactions.length, 6)
  assert.equal(
    salesDashboardFixture.summary.scheduledSettlementAmount,
    2_452_423,
  )
  assert.equal(emptySalesDashboardFixture.transactions.length, 0)
  assert.equal(emptySalesDashboardFixture.summary.scheduledSettlementAmount, 0)
  assert.equal(
    emptySalesDashboardFixture.series.every(
      (series) => series.points.length === 0,
    ),
    true,
  )
})

test('sales values use Korean thousands separators', () => {
  assert.equal(formatSalesNumber(2_452_423), '2,452,423')
  assert.equal(formatSalesNumber(-3_000), '-3,000')
})

test('chart points span the full width and keep larger values higher', () => {
  const points = getChartPoints([0, 50, 100], 200, 100)

  assert.deepEqual(points, [
    { x: 0, y: 100 },
    { x: 100, y: 50 },
    { x: 200, y: 0 },
  ])
})

test('refund amount must be a whole won amount within the transaction limit', () => {
  assert.equal(getRefundAmountError('', 38_000), '환불 금액을 입력해주세요.')
  assert.equal(getRefundAmountError('3,000', 38_000), null)
  assert.equal(
    getRefundAmountError('0', 38_000),
    '환불 금액은 1원 이상이어야 합니다.',
  )
  assert.equal(
    getRefundAmountError('38,001', 38_000),
    '거래금액 38,000원을 초과할 수 없습니다.',
  )
  assert.equal(
    getRefundAmountError('3.5', 38_000),
    '환불 금액은 원 단위 숫자로 입력해주세요.',
  )
})

test('local refund returns a refund-complete row without mutating the source row', () => {
  const source = salesDashboardFixture.transactions[1]
  const refunded = applyLocalRefund(source, 3_000)

  assert.notEqual(refunded, source)
  assert.equal(source.status, 'settled')
  assert.deepEqual(refunded, {
    ...source,
    cardFee: 0,
    receiptHref: null,
    refundable: false,
    settlementAmount: -3_000,
    status: 'refund-complete',
    transactionAmount: -3_000,
  })
})
