import { getAdminSalesDashboard } from '@repo/supabase'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SalesDashboardData, SalesEvent } from '@repo/supabase'
import { RefundDialog } from '../components/admin-sales/RefundDialog'
import { SalesSummaryCards } from '../components/admin-sales/SalesSummaryCards'
import { SalesTransactionsTable } from '../components/admin-sales/SalesTransactionsTable'
import { SalesTrendChart } from '../components/admin-sales/SalesTrendChart'
import { refundPayment } from '../lib/paymentApi'
import { supabase } from '../lib/supabase'
import { buildSalesTrendSeries } from './salesData'
import type { SalesFilters } from './salesData'
import './SalesPage.css'

type RefundFlow = {
  readonly requestId: string
  readonly state: 'complete' | 'confirm'
  readonly transaction: SalesEvent
} | null

function getKstDate(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).formatToParts(value)
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

function getInitialFilters(): SalesFilters {
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - 29)

  return { channel: 'all', from: getKstDate(from), to: getKstDate(today) }
}

function getExclusiveEnd(date: string) {
  const end = new Date(`${date}T00:00:00+09:00`)
  end.setUTCDate(end.getUTCDate() + 1)
  return end.toISOString()
}

function getStart(date: string) {
  return new Date(`${date}T00:00:00+09:00`).toISOString()
}

export function SalesPage() {
  const [filters, setFilters] = useState<SalesFilters>(getInitialFilters)
  const [dashboard, setDashboard] = useState<SalesDashboardData | null>(null)
  const [refundFlow, setRefundFlow] = useState<RefundFlow>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const dashboardRequest = useRef(0)

  const loadDashboard = useCallback(async () => {
    const request = dashboardRequest.current + 1
    dashboardRequest.current = request
    setIsLoading(true)
    setLoadError('')

    try {
      const nextDashboard = await getAdminSalesDashboard(supabase, {
        channel: filters.channel,
        from: getStart(filters.from),
        to: getExclusiveEnd(filters.to),
      })
      if (dashboardRequest.current === request) setDashboard(nextDashboard)
    } catch {
      if (dashboardRequest.current === request) {
        setLoadError(
          '매출 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
        )
      }
    } finally {
      if (dashboardRequest.current === request) setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void Promise.resolve().then(loadDashboard)
  }, [loadDashboard])

  async function handleRefund(input: { amount: number; reason: string }) {
    if (!refundFlow) return

    await refundPayment(refundFlow.transaction.paymentId, {
      ...input,
      requestId: refundFlow.requestId,
    })
    setRefundFlow((current) =>
      current ? { ...current, state: 'complete' } : null,
    )
    void loadDashboard()
  }

  function handleFilters(nextFilters: SalesFilters) {
    if (
      nextFilters.from === '' ||
      nextFilters.to === '' ||
      nextFilters.from > nextFilters.to
    ) {
      return
    }

    setFilters(nextFilters)
  }

  const emptyDashboard: SalesDashboardData = {
    events: [],
    summary: {
      grossSalesAmount: 0,
      netSalesAmount: 0,
      paymentCount: 0,
      refundedAmount: 0,
    },
  }
  const currentDashboard = dashboard ?? emptyDashboard
  const trendSeries = buildSalesTrendSeries(currentDashboard.events, filters)

  return (
    <main className="admin-sales-page" aria-label="매출 관리">
      <div className="admin-sales-page__content" aria-busy={isLoading}>
        <SalesSummaryCards
          filters={filters}
          onFilterChange={handleFilters}
          summary={currentDashboard.summary}
        />

        <SalesTrendChart
          filters={filters}
          onFilterChange={handleFilters}
          series={trendSeries}
        />

        {loadError ? (
          <div className="admin-sales-load-state" role="alert">
            <span className="pretendard-medium-14">{loadError}</span>
            <button
              className="admin-sales-reload pretendard-bold-14"
              onClick={() => void loadDashboard()}
              type="button"
            >
              다시 불러오기
            </button>
          </div>
        ) : null}

        <SalesTransactionsTable
          onRefund={(transaction) =>
            setRefundFlow({
              requestId: crypto.randomUUID(),
              state: 'confirm',
              transaction,
            })
          }
          rows={currentDashboard.events}
        />

        {isLoading ? (
          <p className="admin-sr-only" aria-live="polite">
            매출 데이터를 불러오는 중입니다.
          </p>
        ) : null}
      </div>

      {refundFlow ? (
        <RefundDialog
          onClose={() => setRefundFlow(null)}
          onRefund={handleRefund}
          state={refundFlow.state}
          transaction={refundFlow.transaction}
        />
      ) : null}
    </main>
  )
}
