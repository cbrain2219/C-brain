import { listAdminProducts, reorderProducts } from '@repo/supabase'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { renderAdminContentStatus } from '../components/admin-table/AdminContentTableCells'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type { AdminTableColumn, AdminTableFilter } from '../components/admin-table/AdminDataTableSection'
import { supabase } from '../lib/supabase'
import { filterProductRows, toProductListRow } from './productData'
import type { ProductListRow } from './productData'
import './PortfolioPage.css'

const statusFilterOptions = ['전체', '임시저장', '게시됨'] as const

const productColumns = [
  {
    header: '상태',
    id: 'status',
    renderCell: (row) => renderAdminContentStatus(row.status),
    track: '120px',
  },
  {
    header: '유형',
    id: 'type',
    renderCell: (row) => row.type,
    track: '120px',
  },
  {
    header: '상품명',
    id: 'name',
    renderCell: (row) => <span className="admin-data-table__title-cell">{row.name}</span>,
    track: 'minmax(0, 1fr)',
  },
  {
    header: '등록일자',
    id: 'createdAt',
    renderCell: (row) => row.createdAt,
    track: '120px',
  },
  {
    header: '상품가',
    id: 'price',
    renderCell: (row) => row.price,
    track: '120px',
  },
  {
    header: '상세',
    id: 'detail',
    renderCell: (row) => (
      <Link className="admin-data-table__link" to={row.detailHref}>
        상세
      </Link>
    ),
    track: '120px',
  },
] satisfies readonly AdminTableColumn<ProductListRow>[]

export function ProductPage() {
  const [rows, setRows] = useState<readonly ProductListRow[]>([])
  const [filters, setFilters] = useState({ status: '전체' as (typeof statusFilterOptions)[number], type: '전체' })
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)
  const [loadError, setLoadError] = useState('')
  const isReorderingRef = useRef(false)
  const productFilters = useMemo(
    () =>
      [
        { id: 'type', label: '유형 필터', options: ['전체', ...new Set(rows.map((row) => row.type))] },
        { id: 'status', label: '상태 필터', options: statusFilterOptions },
      ] satisfies readonly AdminTableFilter[],
    [rows],
  )
  const filteredRows = useMemo(
    () => filterProductRows(rows, { query, status: filters.status, type: filters.type }),
    [filters, query, rows],
  )

  useEffect(() => {
    let isCurrent = true

    void listAdminProducts(supabase)
      .then((products) => {
        if (isCurrent) setRows(products.map(toProductListRow))
      })
      .catch(() => {
        if (!isCurrent) return
        setLoadError('상품을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        toast.error('상품 목록을 불러오지 못했습니다.')
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
      setFilters((current) => ({
        ...current,
        status: value as (typeof statusFilterOptions)[number],
      }))
      return
    }

    if (filterId === 'type') {
      setFilters((current) => ({ ...current, type: value }))
    }
  }

  async function handleRowsReorder(nextRows: readonly ProductListRow[]) {
    if (isReorderingRef.current) return

    const previousRows = rows
    isReorderingRef.current = true
    setIsReordering(true)
    setRows(nextRows)

    try {
      await reorderProducts(
        supabase,
        nextRows.map((row) => row.id),
      )
      toast.success('상품 순서를 변경했습니다.')
    } catch {
      setRows(previousRows)
      toast.error('상품 순서를 저장하지 못했습니다.')
      window.alert('상품 순서를 저장하지 못했습니다. 다시 시도해주세요.')
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
    <main className="portfolio-page" aria-label="상품 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/products/new', label: '신규 상품 등록' }}
        columns={productColumns}
        emptyMessage={loadError || (isLoading ? '상품을 불러오는 중입니다.' : '조회할 데이터가 없습니다.')}
        filters={productFilters}
        getRowKey={(row) => row.id}
        isAcceptDrag={isAcceptDrag}
        filterValues={filters}
        onFilterValueChange={handleFilterValueChange}
        onRowsReorder={handleRowsReorder}
        onSearchValueChange={setQuery}
        rows={filteredRows}
        search={{
          label: '검색',
          placeholder: '상품명으로 검색해주세요.',
        }}
        searchValue={query}
        title="상품 등록 현황"
      />
    </main>
  )
}
