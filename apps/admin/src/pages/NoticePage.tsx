import { listAdminPosts, reorderPosts } from '@repo/supabase'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { renderAdminContentStatus, renderAdminPinnedState } from '../components/admin-table/AdminContentTableCells'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type { AdminTableColumn, AdminTableFilter } from '../components/admin-table/AdminDataTableSection'
import { supabase } from '../lib/supabase'
import { filterContentRows } from './contentListState'
import { toNoticeListRow } from './noticeData'
import type { NoticeListRow } from './noticeData'
import './PortfolioPage.css'

const statusFilterOptions = ['전체', '임시저장', '게시됨'] as const

const noticeColumns = [
  {
    header: '상태',
    id: 'status',
    renderCell: (row) => renderAdminContentStatus(row.status),
    track: '120fr',
  },
  {
    header: '유형',
    id: 'type',
    renderCell: (row) => row.type,
    track: '160fr',
  },
  {
    header: '공지사항 제목',
    id: 'title',
    renderCell: (row) => <span className="admin-data-table__title-cell">{row.title}</span>,
    track: '720fr',
  },
  {
    header: '상단고정',
    id: 'pinned',
    renderCell: (row) => renderAdminPinnedState(row.pinnedStatus),
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
] satisfies readonly AdminTableColumn<NoticeListRow>[]

export function NoticePage() {
  const [rows, setRows] = useState<readonly NoticeListRow[]>([])
  const [filters, setFilters] = useState({ status: '전체', type: '전체' })
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)
  const [loadError, setLoadError] = useState('')
  const isReorderingRef = useRef(false)
  const noticeFilters = useMemo(
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
          : filters.status

    return filterContentRows(rows, { query, status, type: filters.type })
  }, [filters, query, rows])

  useEffect(() => {
    let isCurrent = true

    void listAdminPosts(supabase, 'notice')
      .then((posts) => {
        if (isCurrent) setRows(posts.map(toNoticeListRow))
      })
      .catch(() => {
        if (!isCurrent) return
        setLoadError('공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        toast.error('공지사항 목록을 불러오지 못했습니다.')
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

  async function handleRowsReorder(nextRows: readonly NoticeListRow[]) {
    if (isReorderingRef.current) return

    const previousRows = rows
    isReorderingRef.current = true
    setIsReordering(true)
    setRows(nextRows)

    try {
      await reorderPosts(
        supabase,
        'notice',
        nextRows.map((row) => row.id),
      )
      toast.success('공지사항 순서를 변경했습니다.')
    } catch {
      setRows(previousRows)
      toast.error('공지사항 순서를 저장하지 못했습니다.')
      window.alert('공지사항 순서를 저장하지 못했습니다. 다시 시도해주세요.')
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
    <main className="portfolio-page" aria-label="공지사항 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/notices/new', label: '신규 공지사항 등록' }}
        columns={noticeColumns}
        emptyMessage={
          loadError || (isLoading ? '공지사항을 불러오는 중입니다.' : '조회할 데이터가 없습니다.')
        }
        filters={noticeFilters}
        filterValues={filters}
        getRowKey={(row) => row.id}
        isAcceptDrag={isAcceptDrag}
        onFilterValueChange={handleFilterValueChange}
        onRowsReorder={handleRowsReorder}
        onSearchValueChange={setQuery}
        rows={filteredRows}
        search={{ label: '검색', placeholder: '공지사항 제목으로 검색해주세요.' }}
        searchValue={query}
        title="공지사항 현황"
      />
    </main>
  )
}
