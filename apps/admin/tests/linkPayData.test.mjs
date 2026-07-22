import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildLinkPayUrl,
  createInitialLinkPayForm,
  filterLinkPayRows,
  toLinkPayFormState,
  toLinkPayListRow,
  toPaymentLinkInput,
} from '../src/pages/linkPayData.ts'

const paymentLink = {
  amount: 120000,
  client_name: '테스트 고객사',
  created_at: '2026-07-21T16:00:00.000Z',
  id: 'payment-link-id',
  payment_name: '브로슈어 제작비',
  public_token: '11111111-1111-4111-8111-111111111111',
  status: 'pending',
  updated_at: '2026-07-21T16:00:00.000Z',
}

test('payment link input trims text and stores integer won', () => {
  assert.deepEqual(
    toPaymentLinkInput({
      amount: '120,000',
      client: ' 테스트 고객사 ',
      paymentName: ' 브로슈어 제작비 ',
    }),
    {
      amount: 120000,
      client_name: '테스트 고객사',
      payment_name: '브로슈어 제작비',
    },
  )
})

test('payment link input rejects empty text and invalid amount', () => {
  for (const form of [
    { amount: '0', client: '고객사', paymentName: '결제명' },
    { amount: '1,000,000,000,000', client: '고객사', paymentName: '결제명' },
    { amount: '1,000', client: ' ', paymentName: '결제명' },
    { amount: '1,000', client: '고객사', paymentName: ' ' },
  ]) {
    assert.throws(() => toPaymentLinkInput(form), {
      message: '링크페이 정보를 확인해주세요.',
    })
  }
})

test('payment link input rejects malformed numeric text', () => {
  for (const amount of ['-1', '1.5', '1e3']) {
    assert.throws(
      () =>
        toPaymentLinkInput({
          amount,
          client: '고객사',
          paymentName: '결제명',
        }),
      { message: '링크페이 정보를 확인해주세요.' },
    )
  }
})

test('database rows map to editable form and formatted list values', () => {
  assert.deepEqual(toLinkPayFormState(paymentLink), {
    amount: '120,000',
    client: '테스트 고객사',
    paymentName: '브로슈어 제작비',
  })

  assert.deepEqual(toLinkPayListRow(paymentLink), {
    amount: '120,000원',
    client: '테스트 고객사',
    detailHref: '/linkpay/payment-link-id',
    id: 'payment-link-id',
    paymentName: '브로슈어 제작비',
    publicToken: '11111111-1111-4111-8111-111111111111',
    status: 'pending',
  })
})

test('list filtering combines client, payment status, and name query', () => {
  const rows = [
    toLinkPayListRow(paymentLink),
    {
      ...toLinkPayListRow(paymentLink),
      client: '완료 고객사',
      id: 'paid-id',
      paymentName: '명함 제작비',
      status: 'paid',
    },
  ]

  assert.deepEqual(
    filterLinkPayRows(rows, {
      client: '테스트 고객사',
      query: '브로',
      status: '결제전',
    }),
    [rows[0]],
  )
  assert.deepEqual(
    filterLinkPayRows(rows, {
      client: '전체',
      query: '',
      status: '결제완료',
    }),
    [rows[1]],
  )
})

test('public URL uses the configured user app origin and UUID token', () => {
  assert.equal(
    buildLinkPayUrl(
      paymentLink.public_token,
      'https://www.cbrain.co.kr/admin-path',
    ),
    'https://www.cbrain.co.kr/linkpay/11111111-1111-4111-8111-111111111111',
  )
})

test('initial form is empty', () => {
  assert.deepEqual(createInitialLinkPayForm(), {
    amount: '',
    client: '',
    paymentName: '',
  })
})
