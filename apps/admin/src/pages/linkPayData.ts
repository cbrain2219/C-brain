import type {
  PaymentLinkStatus,
  TableInsert,
  TableRow,
} from '@repo/supabase/types'
import { formatNumericValue } from './productData.ts'

export type LinkPayFormState = {
  amount: string
  client: string
  paymentName: string
}

export type LinkPayListRow = {
  amount: string
  client: string
  detailHref: string
  id: string
  paymentName: string
  publicToken: string
  status: PaymentLinkStatus
}

export type PaymentLinkInput = Pick<
  TableInsert<'payment_links'>,
  'amount' | 'client_name' | 'payment_name'
>

export type LinkPayFilters = {
  client: string
  query: string
  status: '전체' | '결제전' | '결제완료'
}

export function createInitialLinkPayForm(): LinkPayFormState {
  return {
    amount: '',
    client: '',
    paymentName: '',
  }
}

export function toPaymentLinkInput(form: LinkPayFormState): PaymentLinkInput {
  const amountText = form.amount.replaceAll(',', '')
  const clientName = form.client.trim()
  const paymentName = form.paymentName.trim()

  if (!clientName || !paymentName || !/^\d+$/.test(amountText)) {
    throw new Error('링크페이 정보를 확인해주세요.')
  }

  const amount = Number(amountText)

  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 999_999_999_999) {
    throw new Error('링크페이 정보를 확인해주세요.')
  }

  return {
    amount,
    client_name: clientName,
    payment_name: paymentName,
  }
}

export function toLinkPayFormState(
  paymentLink: TableRow<'payment_links'>,
): LinkPayFormState {
  return {
    amount: formatNumericValue(String(paymentLink.amount)),
    client: paymentLink.client_name,
    paymentName: paymentLink.payment_name,
  }
}

export function toLinkPayListRow(
  paymentLink: TableRow<'payment_links'>,
): LinkPayListRow {
  return {
    amount: `${new Intl.NumberFormat('ko-KR').format(paymentLink.amount)}원`,
    client: paymentLink.client_name,
    detailHref: `/linkpay/${paymentLink.id}`,
    id: paymentLink.id,
    paymentName: paymentLink.payment_name,
    publicToken: paymentLink.public_token,
    status: paymentLink.status,
  }
}

export function filterLinkPayRows(
  rows: readonly LinkPayListRow[],
  filters: LinkPayFilters,
) {
  const query = filters.query.trim().toLocaleLowerCase('ko-KR')
  const status =
    filters.status === '결제전'
      ? 'pending'
      : filters.status === '결제완료'
        ? 'paid'
        : '전체'

  return rows.filter(
    (row) =>
      (filters.client === '전체' || row.client === filters.client) &&
      (status === '전체' || row.status === status) &&
      row.paymentName.toLocaleLowerCase('ko-KR').includes(query),
  )
}

export function buildLinkPayUrl(publicToken: string, userAppUrl: string) {
  return new URL(`/linkpay/${encodeURIComponent(publicToken)}`, userAppUrl).toString()
}
