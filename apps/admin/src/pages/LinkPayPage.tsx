import { listAdminPaymentLinks } from '@repo/supabase'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type {
  AdminTableColumn,
  AdminTableFilter,
} from '../components/admin-table/AdminDataTableSection'
import { supabase } from '../lib/supabase'
import {
  buildLinkPayUrl,
  filterLinkPayRows,
  toLinkPayListRow,
} from './linkPayData'
import type { LinkPayFilters, LinkPayListRow } from './linkPayData'
import './PortfolioPage.css'
import './LinkPayPage.css'

const statusFilterOptions = ['전체', '활성', '중단'] as const
const userAppUrl = import.meta.env.VITE_USER_APP_URL || 'http://localhost:3000'

function renderPaymentStatus(status: LinkPayListRow['status']) {
  const isDisabled = status === 'disabled'

  return (
    <span
      className={
        isDisabled
          ? 'admin-data-table__status admin-data-table__status--draft'
          : 'admin-data-table__status'
      }
    >
      <span className="admin-data-table__status-dot" />
      <span>{isDisabled ? '중단' : '활성'}</span>
    </span>
  )
}

export function LinkPayPage() {
  const [rows, setRows] = useState<readonly LinkPayListRow[]>([])
  const [filters, setFilters] = useState<
    Pick<LinkPayFilters, 'client' | 'status'>
  >({
    client: '전체',
    status: '전체',
  })
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const tableFilters = useMemo(
    () =>
      [
        {
          id: 'client',
          label: '고객사 필터',
          options: ['전체', ...new Set(rows.map((row) => row.client))],
        },
        { id: 'status', label: '상태 필터', options: statusFilterOptions },
      ] satisfies readonly AdminTableFilter[],
    [rows],
  )
  const filteredRows = useMemo(
    () => filterLinkPayRows(rows, { ...filters, query }),
    [filters, query, rows],
  )

  useEffect(() => {
    let isCurrent = true

    void listAdminPaymentLinks(supabase)
      .then((paymentLinks) => {
        if (isCurrent) setRows(paymentLinks.map(toLinkPayListRow))
      })
      .catch(() => {
        if (!isCurrent) return
        setLoadError('링크페이를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        toast.error('링크페이 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  function handleFilterValueChange(filterId: string, value: string) {
    if (filterId === 'client') {
      setFilters((current) => ({ ...current, client: value }))
      return
    }

    if (filterId === 'status') {
      setFilters((current) => ({
        ...current,
        status: value as (typeof statusFilterOptions)[number],
      }))
    }
  }

  async function handleCopy(row: LinkPayListRow) {
    try {
      await navigator.clipboard.writeText(
        buildLinkPayUrl(row.publicToken, userAppUrl),
      )
      toast.success('링크페이 URL을 복사했습니다.')
    } catch {
      toast.error('링크페이 URL을 복사하지 못했습니다.')
      window.alert('링크페이 URL을 복사하지 못했습니다. 다시 시도해주세요.')
    }
  }

  const columns = [
    {
      header: '상태',
      id: 'status',
      renderCell: (row) => renderPaymentStatus(row.status),
      track: '160fr',
    },
    {
      header: '고객사명',
      id: 'client',
      renderCell: (row) => row.client,
      track: '240fr',
    },
    {
      header: '결제명',
      id: 'paymentName',
      renderCell: (row) => (
        <span className="admin-data-table__title-cell">{row.paymentName}</span>
      ),
      track: '496fr',
    },
    {
      header: '결제금액',
      id: 'amount',
      renderCell: (row) => row.amount,
      track: '200fr',
    },
    {
      header: '복사',
      id: 'copy',
      renderCell: (row) => (
        <button
          aria-label={`${row.paymentName} 링크 복사`}
          className="admin-data-table__link linkpay-page__copy-button"
          onClick={() => void handleCopy(row)}
          type="button"
        >
          복사
        </button>
      ),
      track: '140fr',
    },
    {
      header: '상세',
      id: 'detail',
      renderCell: (row) => (
        <Link className="admin-data-table__link" reloadDocument to={row.detailHref}>
          상세
        </Link>
      ),
      track: '140fr',
    },
  ] satisfies readonly AdminTableColumn<LinkPayListRow>[]

  return (
    <main className="portfolio-page" aria-label="링크페이 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/linkpay/new', label: '링크페이 생성하기' }}
        columns={columns}
        emptyMessage={
          loadError ||
          (isLoading ? '링크페이를 불러오는 중입니다.' : '조회할 데이터가 없습니다.')
        }
        filters={tableFilters}
        filterValues={filters}
        getRowKey={(row) => row.id}
        onFilterValueChange={handleFilterValueChange}
        onSearchValueChange={setQuery}
        rows={filteredRows}
        search={{ label: '검색', placeholder: '결제명으로 검색해주세요.' }}
        searchValue={query}
        title="링크페이 등록 현황"
      />
    </main>
  )
}
