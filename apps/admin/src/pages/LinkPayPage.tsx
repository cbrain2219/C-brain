import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type { AdminTableColumn, AdminTableFilter } from '../components/admin-table/AdminDataTableSection'
import './PortfolioPage.css'

type LinkPayRow = {
  readonly id: string
}

const linkPayFilters = [
  { id: 'client', label: '고객사 필터', options: ['전체'] },
  { id: 'status', label: '상태 필터', options: ['결제전', '결제완료'] },
] satisfies readonly AdminTableFilter[]

const linkPayRows: readonly LinkPayRow[] = []

const linkPayColumns: readonly AdminTableColumn<LinkPayRow>[] = [
  {
    header: '상태',
    id: 'status',
    renderCell: () => null,
    track: '160fr',
  },
  {
    header: '고객사명',
    id: 'client',
    renderCell: () => null,
    track: '240fr',
  },
  {
    header: '결제명',
    id: 'paymentName',
    renderCell: () => null,
    track: '496fr',
  },
  {
    header: '결제금액',
    id: 'amount',
    renderCell: () => null,
    track: '200fr',
  },
  {
    header: '복사',
    id: 'copy',
    renderCell: () => null,
    track: '140fr',
  },
  {
    header: '상세',
    id: 'detail',
    renderCell: () => null,
    track: '140fr',
  },
]

export function LinkPayPage() {
  return (
    <main className="portfolio-page" aria-label="링크페이 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/linkpay/new', label: '링크페이 생성하기' }}
        columns={linkPayColumns}
        emptyMessage="조회할 데이터가 없습니다."
        filters={linkPayFilters}
        getRowKey={(row) => row.id}
        rows={linkPayRows}
        search={{ label: '검색', placeholder: '결제명으로 검색해주세요.' }}
        title="링크페이 등록 현황"
      />
    </main>
  )
}
