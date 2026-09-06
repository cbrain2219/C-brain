import { getAdminSalesDashboard } from '@repo/supabase'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { SalesPage } from './SalesPage'

vi.mock('@repo/supabase', () => ({ getAdminSalesDashboard: vi.fn() }))
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn() } },
}))

afterEach(() => vi.unstubAllGlobals())

it('shows date-filtered visitors, zero, and the latest result while keeping sales on GA failure', async () => {
  vi.mocked(getAdminSalesDashboard).mockResolvedValue({
    summary: {
      monthlyPaymentAmount: 45000, monthlyPaymentCount: 3, monthlyVisitorCount: null,
      scheduledSettlementAmount: 30000, settlementDate: '2026-09-06',
    },
    transactions: [],
  })
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { access_token: 'admin-token' } }, error: null,
  } as Awaited<ReturnType<typeof supabase.auth.getSession>>)
  const pending: { options: RequestInit; resolve: (response: Response) => void }[] = []
  vi.stubGlobal('fetch', vi.fn((_url: URL, options: RequestInit) => new Promise<Response>((resolve) => {
    pending.push({ options, resolve })
  })))
  const view = render(<SalesPage />)
  const count = () => view.getByText('기간 내 방문자 수').closest('article')?.querySelector('strong')?.textContent
  const changeFrom = (value: string) => fireEvent.change(view.getByLabelText('매출 조회 시작일'), { target: { value } })
  await waitFor(() => expect(pending).toHaveLength(1))
  const firstInput = JSON.parse(String(pending[0].options.body))
  expect(firstInput).toEqual({
    from: (view.getByLabelText('매출 조회 시작일') as HTMLInputElement).value,
    to: (view.getByLabelText('매출 조회 종료일') as HTMLInputElement).value,
  })
  expect(pending[0].options.headers).toMatchObject({ Authorization: 'Bearer admin-token' })
  expect(count()).toBe('—')
  await act(async () => pending[0].resolve(Response.json({ visitorCount: 1234 })))
  expect(count()).toBe('1,234명')

  changeFrom('2026-01-01')
  await waitFor(() => expect(pending).toHaveLength(2))
  expect(count()).toBe('—')
  expect(JSON.parse(String(pending[1].options.body))).toEqual({ from: '2026-01-01', to: firstInput.to })
  changeFrom('2026-01-02')
  await waitFor(() => expect(pending).toHaveLength(3))
  await act(async () => pending[2].resolve(Response.json({ visitorCount: 0 })))
  expect(count()).toBe('0명')
  await act(async () => pending[1].resolve(Response.json({ visitorCount: 99 })))
  expect(count()).toBe('0명')

  for (const [index, response] of [Response.json({ error: 'GA unavailable' }, { status: 502 }), Response.json({ visitorCount: -1 })].entries()) {
    changeFrom(`2026-01-0${index + 3}`)
    await waitFor(() => expect(pending).toHaveLength(index + 4))
    await act(async () => pending[index + 3].resolve(response))
    expect(count()).toBe('—')
    expect(view.getByRole('alert').textContent).toContain('방문자 수를 불러오지 못했습니다.')
    expect(view.getByText('이번 달 결제 금액').closest('article')?.textContent).toContain('45,000원')
  }
  fireEvent.click(view.getByRole('button', { name: '다시 불러오기' }))
  await waitFor(() => expect(pending).toHaveLength(6))
  await act(async () => pending[5].resolve(Response.json({ visitorCount: 7 })))
  expect(count()).toBe('7명')
  expect(view.queryByRole('alert')).toBeNull()
})
