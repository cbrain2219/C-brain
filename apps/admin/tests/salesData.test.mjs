import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  buildSalesTrendSeries,
  formatSalesDateLabel,
  formatRefundAmountInput,
  formatSalesNumber,
  formatSettlementLabel,
  getChartPoints,
  getRefundAmountError,
  getRefundCapabilityError,
  getSalesChartProductColor,
  orderSelectedProductSeries,
  reconcileSelectedProductIds,
  salesChartProductColors,
} from '../src/pages/salesData.ts'

test('sales values use Korean thousands separators', () => {
  assert.equal(formatSalesNumber(2_452_423), '2,452,423')
  assert.equal(formatSalesNumber(-3_000), '-3,000')
})

test('sales dates keep the existing compact period label', () => {
  assert.equal(formatSalesDateLabel('2026-08-10'), '26. 08. 10')
})

test('settlement dates include the KST weekday', () => {
  assert.equal(
    formatSettlementLabel('2026-08-10'),
    '26. 08. 10. (월) 정산',
  )
})

test('chart points span the full width and keep larger values higher', () => {
  const points = getChartPoints([0, 50, 100], 200, 100)

  assert.deepEqual(points, [
    { x: 0, y: 100 },
    { x: 100, y: 50 },
    { x: 200, y: 0 },
  ])
})

test('sales trend series groups gross payment amounts by normalized product', () => {
  const series = buildSalesTrendSeries(
    [
      {
        occurredAt: '2026-08-08T03:00:00.000Z',
        productId: 'brochure',
        productLabel: '브로셔',
        transactionAmount: 10_000,
      },
      {
        occurredAt: '2026-08-09T03:00:00.000Z',
        productId: 'linkpay:컨설팅',
        productLabel: '컨설팅',
        transactionAmount: 4_000,
      },
      {
        occurredAt: '2026-08-10T03:00:00.000Z',
        productId: 'brochure',
        productLabel: '브로셔',
        transactionAmount: 7_000,
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
        id: 'all',
        labels: ['08.08', '08.09', '08.10'],
        values: [10_000, 4_000, 7_000],
      },
      {
        id: 'product:brochure',
        labels: ['08.08', '08.09', '08.10'],
        values: [10_000, 0, 7_000],
      },
      {
        id: 'product:linkpay:컨설팅',
        labels: ['08.08', '08.09', '08.10'],
        values: [0, 4_000, 0],
      },
    ],
  )

  assert.deepEqual(
    series.map((item) => ({
      color: item.color,
      label: item.label,
      productId: item.productId,
    })),
    [
      { color: 'brand', label: '전체', productId: null },
      { color: 'info', label: '브로셔', productId: 'brochure' },
      { color: 'info', label: '컨설팅', productId: 'linkpay:컨설팅' },
    ],
  )

  assert.equal(series[0].points[0].tooltipLabel, '8월 8일 판매 금액')
})

test('sales trend keeps a product whose normalized ID is all distinct from the aggregate', () => {
  const series = buildSalesTrendSeries(
    [
      {
        occurredAt: '2026-08-08T03:00:00.000Z',
        productId: 'all',
        productLabel: '전체 패키지',
        transactionAmount: 10_000,
      },
    ],
    { channel: 'all', from: '2026-08-08', to: '2026-08-08' },
  )

  assert.deepEqual(
    series.map(({ id, productId }) => ({ id, productId })),
    [
      { id: 'all', productId: null },
      { id: 'product:all', productId: 'all' },
    ],
  )
})

test('selected chart products keep selection order and cycle through rainbow colors', () => {
  const productSeries = Array.from(
    { length: 8 },
    (_, index) => ({
      color: 'info',
      id: `product:${index + 1}`,
      label: `상품 ${index + 1}`,
      points: [],
      productId: String(index + 1),
    }),
  )
  const ordered = orderSelectedProductSeries(productSeries, [
    'product:3',
    'product:1',
    'product:8',
  ])

  assert.deepEqual(
    ordered.map((item) => item.id),
    ['product:3', 'product:1', 'product:8'],
  )
  assert.deepEqual(salesChartProductColors, [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'indigo',
    'violet',
  ])
  assert.equal(getSalesChartProductColor(0), 'red')
  assert.equal(getSalesChartProductColor(6), 'violet')
  assert.equal(getSalesChartProductColor(7), 'red')
  assert.equal(getSalesChartProductColor(Number.NaN), 'red')
  assert.equal(getSalesChartProductColor(Number.POSITIVE_INFINITY), 'red')
})

test('chart selection reconciles unavailable products without restoring a cleared selection', () => {
  const makeSeries = (...ids) =>
    ids.map((id) => ({
      color: 'info',
      id,
      label: id,
      points: [],
      productId: id,
    }))

  let selectedIds = reconcileSelectedProductIds(
    makeSeries('product:a'),
    ['product:a'],
    false,
  )
  selectedIds = reconcileSelectedProductIds(
    makeSeries('product:b'),
    selectedIds,
    false,
  )
  assert.deepEqual(selectedIds, ['product:b'])

  selectedIds = reconcileSelectedProductIds(
    makeSeries('product:a', 'product:c'),
    selectedIds,
    false,
  )
  assert.deepEqual(selectedIds, ['product:a'])
  assert.deepEqual(
    reconcileSelectedProductIds(makeSeries('product:a'), [], true),
    [],
  )
})

test('sales trend labels multi-day buckets as ranges and caps buckets at 12', () => {
  const series = buildSalesTrendSeries(
    [
      {
        occurredAt: '2026-08-01T03:00:00.000Z',
        productId: 'brochure',
        productLabel: '브로셔',
        transactionAmount: 10_000,
      },
    ],
    { channel: 'all', from: '2026-08-01', to: '2026-08-25' },
  )

  assert.equal(series[0].points.length, 12)
  assert.equal(series[0].points[0].tooltipLabel, '8월 1일~8월 2일 판매 금액')
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

test('refund amount input accepts only digits and clamps over-limit values', () => {
  assert.equal(formatRefundAmountInput('', 38_000), '')
  assert.equal(formatRefundAmountInput('0012300', 38_000), '12,300')
  assert.equal(formatRefundAmountInput('12,300', 38_000), '12,300')
  assert.equal(formatRefundAmountInput('38,001', 38_000), '38,000')
  assert.equal(formatRefundAmountInput('999999999999999999', 38_000), '38,000')
  assert.equal(formatRefundAmountInput('3.5', 38_000), null)
  assert.equal(formatRefundAmountInput('1e3', 38_000), null)
  assert.equal(formatRefundAmountInput('-5000', 38_000), null)
})

test('explicit provider capability blocks only partial cancellation amounts', () => {
  assert.equal(getRefundCapabilityError('3,000', 38_000, false), '결제사 정책상 남은 환불 가능 금액 전액만 취소할 수 있습니다.')
  assert.equal(getRefundCapabilityError('38,000', 38_000, false), null)
  assert.equal(getRefundCapabilityError('3,000', 38_000, null), null)
  assert.equal(getRefundCapabilityError('3,000', 38_000, true), null)
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
  assert.match(source, /transaction\.refundableAmount > 0/)
  assert.doesNotMatch(source, /SalesEvent/)
  assert.match(source, /rows\.map\(\(row\) =>/)
})

test('consolidated sales data keeps the exact eight-column payment table', async () => {
  const [
    pageSource,
    summarySource,
    tableSource,
    dialogSource,
    chartSource,
    cssSource,
  ] = await Promise.all([
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
    readFile(
      new URL(
        '../src/components/admin-sales/RefundDialog.tsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/components/admin-sales/SalesTrendChart.tsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(new URL('../src/pages/SalesPage.css', import.meta.url), 'utf8'),
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
    '카드수수료',
    '정산금',
    '거래영수증',
    '환불',
  ]
  const renderedHeaders = Array.from(
    headerSource.matchAll(/["']([^"']+)["'],/g),
    (match) => match[1],
  )

  assert.deepEqual(renderedHeaders, expectedHeaders)
  assert.match(tableSource, /rows\.map\(\(row\) =>/)
  assert.match(tableSource, /\[\{row\.customerLabel\}\] \{row\.productLabel\}/)
  assert.match(tableSource, /row\.transactionAmount/)
  assert.match(tableSource, /row\.cardFee/)
  assert.match(tableSource, /row\.settlementAmount/)
  assert.match(tableSource, /row\.status === 'refund-complete'/)
  assert.match(tableSource, /!isFullRefund && row\.receiptUrl/)
  assert.match(tableSource, /!isFullRefund && canRefund\(row\)/)
  assert.match(tableSource, /transaction\.refundableAmount > 0/)
  assert.match(tableSource, /refund-complete[\s\S]*?환불완료/)
  assert.match(tableSource, /partial-refund[\s\S]*?부분환불/)
  assert.match(tableSource, /settled[\s\S]*?정산완료/)
  assert.match(tableSource, /scheduled[\s\S]*?정산예정/)
  assert.match(
    dialogSource,
    /getRefundCapabilityError\([\s\S]*?transaction\.canPartCancel/,
  )
  assert.match(
    dialogSource,
    /formatRefundAmountInput\(\s*event\.currentTarget\.value,\s*transaction\.refundableAmount/,
  )
  assert.match(
    dialogSource,
    /if \(amountInputError\)[\s\S]*?amountInput\.reportValidity\(\)[\s\S]*?return/,
  )
  assert.match(dialogSource, /ADMIN_REFUND_REASON/)
  assert.match(dialogSource, /reason: ADMIN_REFUND_REASON/)
  assert.match(dialogSource, /transaction\.refundableAmount/)
  assert.match(
    dialogSource,
    /환불이 완료되었습니다/,
  )
  assert.match(
    dialogSource,
    /환불 금액은 이후 나이스페이먼츠\(PG사\)에서 정산 될 금액에서\s*차감됩니다\./,
  )
  assert.doesNotMatch(dialogSource, />환불 사유</)
  assert.doesNotMatch(
    dialogSource,
    /transaction\.canPartCancel !== true/,
  )
  assert.match(
    chartSource,
    /admin-sales-chart-chip--product admin-sales-chart-color--\$\{visualColor\}/,
  )
  assert.match(
    chartSource,
    /<g[\s\S]*?admin-sales-chart-color--\$\{visualColor\}/,
  )
  assert.match(
    chartSource,
    /admin-sales-chart-tooltip[\s\S]*?admin-sales-chart-color--\$\{point\.visualColor\}/,
  )
  assert.match(
    cssSource,
    /\.admin-sales-chart-chip--product\s*{[^}]*color: var\(--admin-sales-series-color\)/,
  )
  assert.match(
    cssSource,
    /\.admin-sales-chart__line--product\s*{[^}]*stroke: var\(--admin-sales-series-color\)/,
  )
  assert.match(
    cssSource,
    /\.admin-sales-chart__point--product\s*{[^}]*fill: var\(--admin-sales-series-color\)/,
  )
  assert.match(
    cssSource,
    /\.admin-sales-chart-tooltip--product rect\s*{[^}]*fill: var\(--admin-sales-series-color\)/,
  )
  assert.match(
    cssSource,
    /\.admin-sales-chart__point-hit-area\s*{[^}]*outline: none;[^}]*pointer-events: all;/,
  )
  assert.match(
    cssSource,
    /\.admin-sales-chart-tooltip\s*{[^}]*pointer-events: none;/,
  )
  for (const color of salesChartProductColors) {
    assert.match(
      cssSource,
      new RegExp(
        `\\.admin-sales-chart-color--${color}\\s*\\{[^}]*--admin-sales-series-color:`,
      ),
    )
  }
  assert.match(
    cssSource,
    /\.admin-refund-dialog\s*{[\s\S]*?width: min\(600px,[\s\S]*?height: 344px/,
  )
  assert.match(
    cssSource,
    /\.admin-refund-dialog--complete\s*{[\s\S]*?width: min\(609px,[\s\S]*?height: 207px/,
  )
})
