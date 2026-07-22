import { listAdminInquiries } from '@repo/supabase'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type {
  AdminTableColumn,
  AdminTableFilter,
} from '../components/admin-table/AdminDataTableSection'
import { supabase } from '../lib/supabase'
import {
  complaintStatusLabels,
  filterComplaintRows,
  toComplaintRow,
} from './complaintData'
import type { ComplaintFilters, ComplaintRow } from './complaintData'
import './PortfolioPage.css'

const initialFilters: ComplaintFilters = {
  query: '',
  status: '전체',
  type: '전체',
}

function renderComplaintStatus(row: ComplaintRow) {
  return (
    <span className="admin-data-table__status">
      <span className="admin-data-table__status-dot" />
      <span>{complaintStatusLabels[row.status]}</span>
    </span>
  )
}

const complaintColumns = [
  {
    header: '처리상태',
    id: 'status',
    renderCell: renderComplaintStatus,
    track: '120fr',
  },
  {
    header: '불편 유형',
    id: 'complaintType',
    renderCell: (row) => row.complaintType,
    track: '180fr',
  },
  {
    header: '이용 서비스',
    id: 'service',
    renderCell: (row) => row.service,
    track: '200fr',
  },
  {
    header: '접수자',
    id: 'name',
    renderCell: (row) => row.name,
    track: '120fr',
  },
  {
    header: '접수 내용',
    id: 'detail',
    renderCell: (row) => (
      <span className="admin-data-table__summary-cell" title={row.detail}>
        {row.detail}
      </span>
    ),
    track: '456fr',
  },
  {
    header: '첨부',
    id: 'attachments',
    renderCell: (row) => (row.attachmentCount > 0 ? `${row.attachmentCount}개` : '-'),
    track: '100fr',
  },
  {
    header: '접수일자',
    id: 'createdAt',
    renderCell: (row) => row.createdAt,
    track: '120fr',
  },
  {
    header: '상세',
    id: 'detailLink',
    renderCell: (row) => (
      <Link className="admin-data-table__link" to={row.detailHref}>
        상세
      </Link>
    ),
    track: '80fr',
  },
] satisfies readonly AdminTableColumn<ComplaintRow>[]

export function ComplaintPage() {
  const [rows, setRows] = useState<ComplaintRow[]>([])
  const [filters, setFilters] = useState(initialFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadComplaints() {
      try {
        const inquiries = await listAdminInquiries(supabase)

        if (isCurrent) setRows(inquiries.map(toComplaintRow))
      } catch {
        if (!isCurrent) return
        setLoadError('불편접수 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        toast.error('불편접수 내역을 불러오지 못했습니다.')
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadComplaints()

    return () => {
      isCurrent = false
    }
  }, [])

  const complaintFilters = [
    {
      id: 'status',
      label: '처리상태',
      options: ['전체', ...Object.values(complaintStatusLabels)],
    },
    {
      id: 'type',
      label: '불편 유형',
      options: ['전체', ...new Set(rows.map((row) => row.complaintType))],
    },
  ] satisfies readonly AdminTableFilter[]
  const filteredRows = filterComplaintRows(rows, filters)

  function handleFilterValueChange(filterId: string, value: string) {
    if (filterId !== 'status' && filterId !== 'type') return

    setFilters((current) => ({ ...current, [filterId]: value }))
  }

  return (
    <main className="portfolio-page" aria-label="불편접수 관리">
      <AdminDataTableSection
        columns={complaintColumns}
        emptyMessage={
          loadError ||
          (isLoading ? '불편접수 내역을 불러오는 중입니다.' : '접수된 불편사항이 없습니다.')
        }
        filters={complaintFilters}
        filterValues={{ status: filters.status, type: filters.type }}
        getRowKey={(row) => row.id}
        onFilterValueChange={handleFilterValueChange}
        onSearchValueChange={(query) => setFilters((current) => ({ ...current, query }))}
        rows={filteredRows}
        search={{
          label: '검색',
          placeholder: '접수자 또는 접수 내용으로 검색해주세요.',
        }}
        searchValue={filters.query}
        title="불편접수 현황"
      />
    </main>
  )
}
