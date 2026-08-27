import { listAdminEbooks } from '@repo/supabase'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { renderAdminContentStatus } from '../components/admin-table/AdminContentTableCells'
import { AdminDataTableSection } from '../components/admin-table/AdminDataTableSection'
import type { AdminTableColumn } from '../components/admin-table/AdminDataTableSection'
import { supabase } from '../lib/supabase'
import { toEbookListRow } from './ebookData'
import type { EbookListRow } from './ebookData'
import './EbookPage.css'
import './PortfolioPage.css'

function EbookCopyButton({ publicUrl }: { readonly publicUrl: string }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast.success('E-book 링크를 복사했습니다.')
    } catch {
      toast.error('E-book 링크를 복사하지 못했습니다.')
    }
  }

  return (
    <button
      className="ebook-page__copy-button"
      onClick={() => void handleCopy()}
      type="button"
    >
      복사
    </button>
  )
}

function EbookLinkActions({
  previewUrl,
  publicUrl,
}: {
  readonly previewUrl: string
  readonly publicUrl: string
}) {
  return (
    <span className="ebook-page__link-actions">
      <a
        className="ebook-page__preview-link"
        href={previewUrl}
        rel="noreferrer"
        target="_blank"
      >
        미리보기
      </a>
      <EbookCopyButton publicUrl={publicUrl} />
    </span>
  )
}

const ebookColumns = [
  {
    header: '상태',
    id: 'status',
    renderCell: (row) => renderAdminContentStatus(row.status),
    track: '120fr',
  },
  {
    header: 'E-book 제목 (Title)',
    id: 'title',
    renderCell: (row) => (
      <span className="admin-data-table__title-cell">{row.title}</span>
    ),
    track: '896fr',
  },
  {
    header: '링크',
    id: 'link',
    renderCell: (row) => (
      <EbookLinkActions previewUrl={row.previewUrl} publicUrl={row.publicUrl} />
    ),
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
      <Link
        className="admin-data-table__link"
        reloadDocument
        to={row.detailHref}
      >
        상세
      </Link>
    ),
    track: '120fr',
  },
] satisfies readonly AdminTableColumn<EbookListRow>[]

export function EbookPage() {
  const publicOrigin =
    import.meta.env.VITE_EBOOK_PUBLIC_URL || 'https://ebook.cbrain.kr'
  const userAppOrigin =
    import.meta.env.VITE_USER_APP_URL || 'http://localhost:3000'
  const [rows, setRows] = useState<readonly EbookListRow[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR')

    if (!normalizedQuery) return rows

    return rows.filter((row) =>
      row.title.toLocaleLowerCase('ko-KR').includes(normalizedQuery),
    )
  }, [query, rows])

  useEffect(() => {
    let isCurrent = true

    void listAdminEbooks(supabase)
      .then((ebooks) => {
        if (isCurrent) {
          setRows(
            ebooks.map((ebook) =>
              toEbookListRow(ebook, publicOrigin, userAppOrigin),
            ),
          )
        }
      })
      .catch(() => {
        if (!isCurrent) return
        setLoadError('E-book을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        toast.error('E-book 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [publicOrigin, userAppOrigin])

  return (
    <main className="portfolio-page" aria-label="E-book 관리">
      <AdminDataTableSection
        bottomAction={{ href: '/ebook/new', label: '신규 E-book 등록' }}
        columns={ebookColumns}
        emptyMessage={
          loadError ||
          (isLoading
            ? 'E-book을 불러오는 중입니다.'
            : '조회할 데이터가 없습니다.')
        }
        filters={[]}
        getRowKey={(row) => row.id}
        onSearchValueChange={setQuery}
        rows={filteredRows}
        search={{ label: '검색', placeholder: 'E-book 제목으로 검색해주세요.' }}
        searchValue={query}
        title="E-book 등록 현황"
      />
    </main>
  )
}
