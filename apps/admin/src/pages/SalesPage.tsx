import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefundDialog } from '../components/admin-sales/RefundDialog'
import { SalesSummaryCards } from '../components/admin-sales/SalesSummaryCards'
import { SalesTransactionsTable } from '../components/admin-sales/SalesTransactionsTable'
import { SalesTrendChart } from '../components/admin-sales/SalesTrendChart'
import {
  applyLocalRefund,
  emptySalesDashboardFixture,
  getSalesPreview,
  refundPreviewTransaction,
  salesDashboardFixture,
} from './salesData'
import type { SalesPreview, SalesTransaction } from './salesData'
import './SalesPage.css'

type RefundFlow = {
  readonly step: 'complete' | 'confirm'
  readonly transaction: SalesTransaction
} | null

function SalesDashboard({ preview }: { readonly preview: SalesPreview }) {
  const fixture =
    preview === 'empty' ? emptySalesDashboardFixture : salesDashboardFixture
  const [transactions, setTransactions] = useState(() => [
    ...fixture.transactions,
  ])
  const [refundFlow, setRefundFlow] = useState<RefundFlow>(() => {
    if (preview === 'refund') {
      return { step: 'confirm', transaction: refundPreviewTransaction }
    }

    if (preview === 'refund-complete') {
      return { step: 'complete', transaction: refundPreviewTransaction }
    }

    return null
  })

  function completeRefund(amount: number) {
    if (!refundFlow) return

    const refunded = applyLocalRefund(refundFlow.transaction, amount)

    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === refunded.id ? refunded : transaction,
      ),
    )
    setRefundFlow({ step: 'complete', transaction: refunded })
  }

  return (
    <main className="admin-sales-page" aria-label="매출 관리">
      <div className="admin-sales-page__content">
        <SalesSummaryCards summary={fixture.summary} />
        <SalesTrendChart series={fixture.series} />
        <SalesTransactionsTable
          onRefund={(transaction) =>
            setRefundFlow({ step: 'confirm', transaction })
          }
          rows={transactions}
        />
      </div>

      {refundFlow ? (
        <RefundDialog
          key={`${refundFlow.transaction.id}-${refundFlow.step}`}
          onClose={() => setRefundFlow(null)}
          onConfirm={() => setRefundFlow(null)}
          onRefund={completeRefund}
          step={refundFlow.step}
          transaction={refundFlow.transaction}
        />
      ) : null}
    </main>
  )
}

export function SalesPage() {
  const [searchParams] = useSearchParams()
  const preview = getSalesPreview(searchParams.get('preview'))

  return <SalesDashboard key={preview} preview={preview} />
}
