import { listAdminPortfolioItems, reorderPortfolioItems } from '@repo/supabase'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type {
  AdminTableColumn,
  AdminTableFilter,
} from '../components/admin-table/AdminDataTableSection'
import { supabase } from '../lib/supabase'
import { filterPortfolioRows, toPortfolioListRow } from './portfolioData'
import type { PortfolioRow } from './portfolioData'
import './PortfolioPage.css'

const statusFilterOptions = ['전체', '임시저장', '게시됨', '보관됨'] as const

function renderStatus(row: PortfolioRow) {
  const label =
    row.status === 'published' ? '게시됨' : row.status === 'archived' ? '보관됨' : '임시저장'

  return (
    <span
      className={
        row.status === 'published'
          ? 'admin-data-table__status'
          : 'admin-data-table__status admin-data-table__status--draft'
      }
    >
      <span className="admin-data-table__status-dot" />
      <span>{label}</span>
    </span>
  )
}

function renderLanding(row: PortfolioRow) {
  if (row.landingStatus === 'published') {
    return <span className="admin-data-table__brand-text">게시됨</span>
  }

  return <span>-</span>
}

const portfolioColumns = [
  {
    header: '상태',
    id: 'status',
    renderCell: renderStatus,
    track: '120fr',
  },
  {
    header: '유형',
    id: 'type',
    renderCell: (row) => row.type,
    track: '160fr',
  },
  {
    header: '포트폴리오 제목',
    id: 'title',
    renderCell: (row) => <span className="admin-data-table__title-cell">{row.title}</span>,
    track: '456fr',
  },
  {
    header: '고객사',
    id: 'client',
    renderCell: (row) => row.client,
    track: '160fr',
  },
  {
    header: '랜딩',
    id: 'landing',
    renderCell: renderLanding,
    track: '120fr',
  },
  {
    header: '조회수',
    id: 'views',
    renderCell: (row) => row.views,
    track: '120fr',
  },
  {
    header: '등록일자',
    id: 'createdAt',
    renderCell: (row) => row.createdAt,
    track: '120fr',
  },
  {
    header: '상세',
    id: 'detail',
    renderCell: (row) => (
      <Link className="admin-data-table__link" to={row.detailHref}>
        상세
      </Link>
    ),
    track: '120fr',
  },
] satisfies readonly AdminTableColumn<PortfolioRow>[]

export function PortfolioPage() {
  const [rows, setRows] = useState<readonly PortfolioRow[]>([])
  const [filters, setFilters] = useState({ status: '전체', type: '전체' })
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)
  const [loadError, setLoadError] = useState('')
  const isReorderingRef = useRef(false)
  const portfolioFilters = useMemo(
    () =>
      [
        {
          id: 'type',
          label: '유형 필터',
          options: ['전체', ...new Set(rows.map((row) => row.type))],
        },
        { id: 'status', label: '상태 필터', options: statusFilterOptions },
      ] satisfies readonly AdminTableFilter[],
    [rows],
  )
  const filteredRows = useMemo(
    () => filterPortfolioRows(rows, { ...filters, query }),
    [filters, query, rows],
  )

  useEffect(() => {
    let isCurrent = true

    void listAdminPortfolioItems(supabase)
      .then((items) => {
        if (isCurrent) setRows(items.map(toPortfolioListRow))
      })
      .catch(() => {
        if (!isCurrent) return
        setLoadError('포트폴리오를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        toast.error('포트폴리오 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  function handleFilterValueChange(filterId: string, value: string) {
    if (filterId === 'status' || filterId === 'type') {
      setFilters((current) => ({ ...current, [filterId]: value }))
    }
  }

  async function handleRowsReorder(nextRows: readonly PortfolioRow[]) {
    if (isReorderingRef.current) return

    const previousRows = rows
    isReorderingRef.current = true
    setIsReordering(true)
    setRows(nextRows)

    try {
      await reorderPortfolioItems(
        supabase,
        nextRows.map((row) => row.id),
      )
      toast.success('포트폴리오 순서를 변경했습니다.')
    } catch {
      setRows(previousRows)
      toast.error('포트폴리오 순서를 저장하지 못했습니다.')
      window.alert('포트폴리오 순서를 저장하지 못했습니다. 다시 시도해주세요.')
    } finally {
      isReorderingRef.current = false
      setIsReordering(false)
    }
  }

  const isAcceptDrag =
    !isLoading &&
    !isReordering &&
    !loadError &&
    !query.trim() &&
    filters.status === '전체' &&
    filters.type === '전체'

  return (
    <main className="portfolio-page" aria-label="포트폴리오 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/portfolio/new', label: '신규 포폴 등록' }}
        columns={portfolioColumns}
        emptyMessage={
          loadError || (isLoading ? '포트폴리오를 불러오는 중입니다.' : '조회할 데이터가 없습니다.')
        }
        filters={portfolioFilters}
        filterValues={filters}
        getRowKey={(row) => row.id}
        isAcceptDrag={isAcceptDrag}
        onFilterValueChange={handleFilterValueChange}
        onRowsReorder={handleRowsReorder}
        onSearchValueChange={setQuery}
        rows={filteredRows}
        search={{ label: '검색', placeholder: '포트폴리오 제목으로 검색해주세요.' }}
        searchValue={query}
        title="포트폴리오 등록 현황"
      />
    </main>
  )
}
