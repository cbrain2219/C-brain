import { listAdminPosts, reorderPosts } from '@repo/supabase'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { renderAdminContentStatus, renderAdminPublicationState } from '../components/admin-table/AdminContentTableCells'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type { AdminTableColumn, AdminTableFilter } from '../components/admin-table/AdminDataTableSection'
import { supabase } from '../lib/supabase'
import { filterBlogRows, toBlogListRow } from './blogData'
import type { BlogListRow, BlogStatusLabel } from './blogData'
import './PortfolioPage.css'

const statusFilterOptions = ['전체', '임시저장', '게시됨'] as const

const blogColumns = [
  {
    header: '상태',
    id: 'status',
    renderCell: (row) => renderAdminContentStatus(row.publicationStatus),
    track: '120fr',
  },
  {
    header: '유형',
    id: 'type',
    renderCell: (row) => row.type,
    track: '160fr',
  },
  {
    header: '블로그 제목',
    id: 'title',
    renderCell: (row) => <span className="admin-data-table__title-cell">{row.title}</span>,
    track: '360fr',
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
    header: '배너',
    id: 'banner',
    renderCell: (row) => renderAdminPublicationState(row.bannerStatus),
    track: '120fr',
  },
  {
    header: '인기',
    id: 'popular',
    renderCell: (row) => renderAdminPublicationState(row.popularStatus),
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
] satisfies readonly AdminTableColumn<BlogListRow>[]

export function BlogPage() {
  const [rows, setRows] = useState<readonly BlogListRow[]>([])
  const [filters, setFilters] = useState<{ status: BlogStatusLabel | '전체'; type: string }>({
    status: '전체',
    type: '전체',
  })
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)
  const [loadError, setLoadError] = useState('')
  const isReorderingRef = useRef(false)

  const blogFilters = useMemo(
    () =>
      [
        { id: 'type', label: '유형 필터', options: ['전체', ...new Set(rows.map((row) => row.type))] },
        { id: 'status', label: '상태 필터', options: statusFilterOptions },
      ] satisfies readonly AdminTableFilter[],
    [rows],
  )
  const filteredRows = useMemo(
    () => filterBlogRows(rows, { ...filters, query }),
    [filters, query, rows],
  )

  useEffect(() => {
    let isCurrent = true

    void listAdminPosts(supabase, 'blog')
      .then((posts) => {
        if (isCurrent) setRows(posts.map(toBlogListRow))
      })
      .catch(() => {
        if (!isCurrent) return
        setLoadError('블로그를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        toast.error('블로그 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  function handleFilterValueChange(filterId: string, value: string) {
    if (filterId === 'status') {
      setFilters((current) => ({ ...current, status: value as BlogStatusLabel | '전체' }))
      return
    }

    if (filterId === 'type') setFilters((current) => ({ ...current, type: value }))
  }

  async function handleRowsReorder(nextRows: readonly BlogListRow[]) {
    if (isReorderingRef.current) return

    const previousRows = rows
    isReorderingRef.current = true
    setIsReordering(true)
    setRows(nextRows)

    try {
      await reorderPosts(
        supabase,
        'blog',
        nextRows.map((row) => row.id),
      )
      toast.success('블로그 순서를 변경했습니다.')
    } catch {
      setRows(previousRows)
      toast.error('블로그 순서를 저장하지 못했습니다.')
      window.alert('블로그 순서를 저장하지 못했습니다. 다시 시도해주세요.')
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
    <main className="portfolio-page" aria-label="블로그 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/blog/new', label: '신규 블로그 등록' }}
        columns={blogColumns}
        emptyMessage={loadError || (isLoading ? '블로그를 불러오는 중입니다.' : '조회할 데이터가 없습니다.')}
        filters={blogFilters}
        filterValues={filters}
        getRowKey={(row) => row.id}
        isAcceptDrag={isAcceptDrag}
        onFilterValueChange={handleFilterValueChange}
        onRowsReorder={handleRowsReorder}
        onSearchValueChange={setQuery}
        rows={filteredRows}
        search={{ label: '검색', placeholder: '블로그 제목으로 검색해주세요.' }}
        searchValue={query}
        title="블로그 등록 현황"
      />
    </main>
  )
}
