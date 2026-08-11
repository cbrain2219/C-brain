import { supabase } from './supabase'

type RefundPaymentInput = {
  readonly amount: number
  readonly reason: string
  readonly requestId: string
}

export type RefundPaymentResult = {
  readonly refundableAmount: number
  readonly refundedAmount: number
  readonly status: 'succeeded'
}

const userAppUrl = import.meta.env.VITE_USER_APP_URL || 'http://localhost:3000'

export async function refundPayment(
  paymentId: string,
  input: RefundPaymentInput,
): Promise<RefundPaymentResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error('관리자 로그인 정보를 확인할 수 없습니다.')

  const response = await fetch(
    new URL(`/api/admin/payments/${paymentId}/refund`, userAppUrl),
    {
      body: JSON.stringify(input),
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  )
  const body: unknown = await response.json().catch(() => null)

  if (
    response.ok &&
    typeof body === 'object' &&
    body !== null &&
    'status' in body &&
    body.status === 'succeeded' &&
    'refundedAmount' in body &&
    'refundableAmount' in body &&
    typeof body.refundedAmount === 'number' &&
    typeof body.refundableAmount === 'number'
  ) {
    return {
      refundableAmount: body.refundableAmount,
      refundedAmount: body.refundedAmount,
      status: 'succeeded',
    }
  }

  const error =
    response.status === 503
      ? '결제사 응답을 받지 못했습니다. 같은 창에서 다시 시도해주세요.'
      : typeof body === 'object' &&
          body !== null &&
          'error' in body &&
          typeof body.error === 'string'
        ? body.error
        : '환불을 진행하지 못했습니다. 잠시 후 다시 시도해주세요.'

  throw new Error(error)
}
