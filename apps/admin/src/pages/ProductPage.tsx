import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type { AdminTableColumn, AdminTableFilter } from '../components/admin-table/AdminDataTableSection'
import { contentTypeFilterOptions, getUserTagOptions } from '../components/admin-table/adminTableFilters'
import './PortfolioPage.css'

type ProductRow = {
  readonly id: string
  readonly type: string
}

const productRows: readonly ProductRow[] = []

const productFilters = [
  { id: 'type', label: '유형 필터', options: contentTypeFilterOptions },
  {
    id: 'status',
    label: '상태 필터',
    options: getUserTagOptions(
      productRows.map((row) => row.type),
      ['일반상품'],
    ),
  },
] satisfies readonly AdminTableFilter[]

const productColumns: readonly AdminTableColumn<ProductRow>[] = [
  {
    header: '상태',
    id: 'status',
    renderCell: () => null,
    track: '120px',
  },
  {
    header: '유형',
    id: 'type',
    renderCell: () => null,
    track: '120px',
  },
  {
    header: '상품명',
    id: 'name',
    renderCell: () => null,
    track: 'minmax(0, 1fr)',
  },
  {
    header: '등록일자',
    id: 'createdAt',
    renderCell: () => null,
    track: '120px',
  },
  {
    header: '상품가',
    id: 'price',
    renderCell: () => null,
    track: '120px',
  },
  {
    header: '상세',
    id: 'detail',
    renderCell: () => null,
    track: '120px',
  },
]

export function ProductPage() {
  return (
    <main className="portfolio-page" aria-label="상품 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/products/new', label: '신규 상품 등록' }}
        columns={productColumns}
        emptyMessage="조회할 데이터가 없습니다."
        filters={productFilters}
        getRowKey={(row) => row.id}
        rows={productRows}
        search={{
          label: '검색',
          placeholder: '포트폴리오 제목으로 검색해주세요.',
        }}
        title="상품 등록 현황"
      />
    </main>
  )
}
