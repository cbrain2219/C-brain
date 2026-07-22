import { listAdminReviews, reorderReviews } from '@repo/supabase'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  renderAdminContentStatus,
  renderAdminPublicationState,
} from '../components/admin-table/AdminContentTableCells'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type {
  AdminTableColumn,
  AdminTableFilter,
} from '../components/admin-table/AdminDataTableSection'
import { supabase } from '../lib/supabase'
import { filterContentRows } from './contentListState'
import { toReviewListRow } from './reviewData'
import type { ReviewListRow } from './reviewData'
import './PortfolioPage.css'

const statusFilterOptions = ['전체', '임시저장', '게시됨', '보관됨'] as const

function renderReviewStatus(row: ReviewListRow) {
  if (row.status !== 'archived') return renderAdminContentStatus(row.status)

  return (
    <span className="admin-data-table__status admin-data-table__status--draft">
      <span className="admin-data-table__status-dot" />
      <span>보관됨</span>
    </span>
  )
}

const reviewColumns = [
  {
    header: '상태',
    id: 'status',
    renderCell: renderReviewStatus,
    track: '120fr',
  },
  {
    header: '유형',
    id: 'type',
    renderCell: (row) => row.type,
    track: '160fr',
  },
  {
    header: '인터뷰 · 후기 제목',
    id: 'title',
    renderCell: (row) => <span className="admin-data-table__title-cell">{row.title}</span>,
    track: '600fr',
  },
  {
    header: '조회수',
    id: 'views',
    renderCell: (row) => row.views,
    track: '120fr',
  },
  {
    header: '랜딩',
    id: 'landing',
    renderCell: (row) => renderAdminPublicationState(row.landingStatus),
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
] satisfies readonly AdminTableColumn<ReviewListRow>[]

export function ReviewPage() {
  const [rows, setRows] = useState<readonly ReviewListRow[]>([])
  const [filters, setFilters] = useState({ status: '전체', type: '전체' })
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)
  const [loadError, setLoadError] = useState('')
  const isReorderingRef = useRef(false)
  const reviewFilters = useMemo(
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
  const filteredRows = useMemo(() => {
    const status =
      filters.status === '임시저장'
        ? 'draft'
        : filters.status === '게시됨'
          ? 'published'
          : filters.status === '보관됨'
            ? 'archived'
            : '전체'

    return filterContentRows(rows, { query, status, type: filters.type })
  }, [filters, query, rows])

  useEffect(() => {
    let isCurrent = true

    void listAdminReviews(supabase)
      .then((reviews) => {
        if (isCurrent) setRows(reviews.map(toReviewListRow))
      })
      .catch(() => {
        if (!isCurrent) return
        setLoadError('인터뷰 · 후기 목록을 불러오지 못했습니다.')
        toast.error('인터뷰 · 후기 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  function handleFilterValueChange(filterId: string, value: string) {
    if (filterId !== 'status' && filterId !== 'type') return

    setFilters((current) => ({ ...current, [filterId]: value }))
  }

  async function handleRowsReorder(nextRows: readonly ReviewListRow[]) {
    if (isReorderingRef.current) return

    const previousRows = rows
    isReorderingRef.current = true
    setIsReordering(true)
    setRows(nextRows)

    try {
      await reorderReviews(
        supabase,
        nextRows.map((row) => row.id),
      )
      toast.success('인터뷰 · 후기 순서를 변경했습니다.')
    } catch {
      setRows(previousRows)
      toast.error('인터뷰 · 후기 순서를 저장하지 못했습니다.')
      window.alert('인터뷰 · 후기 순서를 저장하지 못했습니다. 다시 시도해주세요.')
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
    <main className="portfolio-page" aria-label="고객 인터뷰 · 후기 관리">
      <AdminDataTableSection
        bottomAction={{
          href: '/reviews/new',
          label: '신규 인터뷰 · 후기 등록',
        }}
        columns={reviewColumns}
        emptyMessage={
          loadError ||
          (isLoading ? '인터뷰 · 후기를 불러오는 중입니다.' : '조회할 데이터가 없습니다.')
        }
        filterValues={filters}
        filters={reviewFilters}
        getRowKey={(row) => row.id}
        isAcceptDrag={isAcceptDrag}
        onFilterValueChange={handleFilterValueChange}
        onRowsReorder={handleRowsReorder}
        onSearchValueChange={setQuery}
        rows={filteredRows}
        search={{
          label: '검색',
          placeholder: '인터뷰 · 후기 제목으로 검색해주세요.',
        }}
        searchValue={query}
        title="고객 인터뷰 · 후기 현황"
      />
    </main>
  )
}
