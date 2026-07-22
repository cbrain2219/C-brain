import { useEffect, useId, useState } from 'react'
import type { CSSProperties, DragEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './AdminDataTableSection.css'
import { moveItem } from './adminTableOrdering'

const ADMIN_TABLE_DESIGN_WIDTH = 1376
const ADMIN_TABLE_VIEWPORT_PADDING = 64
const ADMIN_TABLE_MIN_VIEWPORT_PADDING = 32
const ADMIN_TABLE_MIN_PC_VIEWPORT = 1080
const ADMIN_TABLE_MIN_PC_WIDTH = ADMIN_TABLE_MIN_PC_VIEWPORT - ADMIN_TABLE_MIN_VIEWPORT_PADDING
const ADMIN_TABLE_BASE_HEIGHT = 194
const ADMIN_TABLE_ROW_HEIGHT = 60
const ADMIN_TABLE_MIN_SCALE = 0.24

export type AdminTableFilter = {
  readonly id: string
  readonly label: string
  readonly options: readonly string[]
}

export type AdminTableSearch = {
  readonly label: string
  readonly placeholder: string
}

export type AdminTableAction = {
  readonly href: string
  readonly label: string
}

export type AdminTableColumn<Row> = {
  readonly id: string
  readonly header: string
  readonly renderCell: (row: Row) => ReactNode
  readonly track: string
}

export type AdminDataTableSectionProps<Row> = {
  readonly bottomAction?: AdminTableAction
  readonly columns: readonly AdminTableColumn<Row>[]
  readonly emptyMessage?: string
  readonly filters: readonly AdminTableFilter[]
  readonly filterValues?: Readonly<Record<string, string>>
  readonly getRowKey: (row: Row) => string
  readonly isAcceptDrag?: boolean
  readonly onFilterValueChange?: (filterId: string, value: string) => void
  readonly onRowsReorder?: (rows: readonly Row[]) => void
  readonly onSearchValueChange?: (value: string) => void
  readonly rows: readonly Row[]
  readonly search: AdminTableSearch
  readonly searchValue?: string
  readonly title: string
}

type AdminTableLayout = {
  readonly scale: number
  readonly width: number
}

type AdminTableGridStyle = CSSProperties & {
  readonly '--admin-data-table-columns': string
}

function getAdminTableLayout(viewportWidth: number): AdminTableLayout {
  if (viewportWidth < ADMIN_TABLE_MIN_PC_VIEWPORT) {
    const availableWidth = viewportWidth - ADMIN_TABLE_MIN_VIEWPORT_PADDING
    const scale = availableWidth / ADMIN_TABLE_MIN_PC_WIDTH

    return {
      scale: Math.max(ADMIN_TABLE_MIN_SCALE, scale),
      width: ADMIN_TABLE_MIN_PC_WIDTH,
    }
  }

  const padding =
    viewportWidth >= ADMIN_TABLE_DESIGN_WIDTH + ADMIN_TABLE_VIEWPORT_PADDING
      ? ADMIN_TABLE_VIEWPORT_PADDING
      : ADMIN_TABLE_MIN_VIEWPORT_PADDING

  return {
    scale: 1,
    width: Math.min(ADMIN_TABLE_DESIGN_WIDTH, viewportWidth - padding),
  }
}

function getInitialLayout() {
  if (typeof window === 'undefined') {
    return {
      scale: 1,
      width: ADMIN_TABLE_DESIGN_WIDTH,
    }
  }

  return getAdminTableLayout(window.innerWidth)
}

function useAdminTableLayout() {
  const [layout, setLayout] = useState(getInitialLayout)

  useEffect(() => {
    function handleResize() {
      setLayout(getAdminTableLayout(window.innerWidth))
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return layout
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="admin-data-table__icon" viewBox="0 0 20 20">
      <path
        d="M5.83398 8.33325L10.0013 12.1499L14.1673 8.33325"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="admin-data-table__icon"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.1057 14.2L17 17M9.5 6C11.1569 6 12.5 7.34315 12.5 9M16.0667 9.53333C16.0667 13.1416 13.1416 16.0667 9.53333 16.0667C5.92507 16.0667 3 13.1416 3 9.53333C3 5.92507 5.92507 3 9.53333 3C13.1416 3 16.0667 5.92507 16.0667 9.53333Z"
        fill="none"
        stroke="#1E293B"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg aria-hidden="true" className="admin-data-table__icon" viewBox="0 0 20 20">
      <path
        d="M3.5 6.75L10 3l6.5 3.75v6.5L10 17l-6.5-3.75v-6.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M3.75 7L10 10.6 16.25 7M10 10.6V17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function AdminDataTableSection<Row>({
  bottomAction,
  columns,
  emptyMessage = '표시할 데이터가 없습니다.',
  filters,
  filterValues,
  getRowKey,
  isAcceptDrag = false,
  onFilterValueChange,
  onRowsReorder,
  onSearchValueChange,
  rows,
  search,
  searchValue,
  title,
}: AdminDataTableSectionProps<Row>) {
  const titleId = useId()
  const layout = useAdminTableLayout()
  const [draggedRowKey, setDraggedRowKey] = useState<string | null>(null)
  const [dragOverRowKey, setDragOverRowKey] = useState<string | null>(null)
  const isDragEnabled = isAcceptDrag && onRowsReorder !== undefined
  const gridTemplateColumns = columns.map((column) => column.track).join(' ')
  const layoutHeight = ADMIN_TABLE_BASE_HEIGHT + ADMIN_TABLE_ROW_HEIGHT * rows.length
  const frameStyle = {
    height: layoutHeight * layout.scale,
    width: layout.width * layout.scale,
  } satisfies CSSProperties
  const sectionStyle = {
    transform: `scale(${layout.scale})`,
    width: layout.width,
  } satisfies CSSProperties
  const tableStyle: AdminTableGridStyle = {
    '--admin-data-table-columns': gridTemplateColumns,
  }

  function clearDragState() {
    setDraggedRowKey(null)
    setDragOverRowKey(null)
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, rowKey: string) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', rowKey)
    setDraggedRowKey(rowKey)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, rowKey: string) {
    if (!draggedRowKey || draggedRowKey === rowKey) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverRowKey(rowKey)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, targetRowKey: string) {
    event.preventDefault()

    const sourceRowKey = draggedRowKey ?? event.dataTransfer.getData('text/plain')
    const sourceIndex = rows.findIndex((row) => getRowKey(row) === sourceRowKey)
    const targetIndex = rows.findIndex((row) => getRowKey(row) === targetRowKey)

    if (sourceIndex >= 0 && targetIndex >= 0 && sourceIndex !== targetIndex) {
      onRowsReorder?.(moveItem(rows, sourceIndex, targetIndex))
    }

    clearDragState()
  }
  return (
    <div className="admin-data-table-frame" style={frameStyle}>
      <section className="admin-data-table-section" style={sectionStyle} aria-labelledby={titleId}>
        <div className="admin-data-table-section__content">
          <div className="admin-data-table-section__topbar">
            <h1 className="admin-data-table-section__title pretendard-bold-18" id={titleId}>
              {title}
            </h1>

            <div className="admin-data-table-toolbar" aria-label={`${title} 도구`}>
              {filters.map((filter) => (
                <label className="admin-data-table-filter" key={filter.id}>
                  <span className="admin-data-table-filter__label pretendard-bold-14">{filter.label}</span>
                  <span className="admin-data-table-filter__select-wrap">
                    <select
                      className="admin-data-table-filter__select pretendard-medium-14"
                      disabled={filter.options.length === 0}
                      name={filter.id}
                      onChange={(event) => onFilterValueChange?.(filter.id, event.currentTarget.value)}
                      value={filterValues?.[filter.id]}
                    >
                      {filter.options.length === 0 ? (
                        <option>생성된 태그 없음</option>
                      ) : (
                        filter.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDownIcon />
                  </span>
                </label>
              ))}

              <label className="admin-data-table-search">
                <span className="admin-data-table-search__label pretendard-bold-14">{search.label}</span>
                <span className="admin-data-table-search__control">
                  <SearchIcon />
                  <input
                    aria-label={search.placeholder}
                    className="admin-data-table-search__input pretendard-medium-14"
                    onChange={(event) => onSearchValueChange?.(event.currentTarget.value)}
                    placeholder={search.placeholder}
                    type="search"
                    value={searchValue}
                  />
                </span>
              </label>
            </div>
          </div>

          <div className="admin-data-table" role="table" aria-label={title} style={tableStyle}>
            <div className="admin-data-table__header" role="row">
              {columns.map((column) => (
                <div className="admin-data-table__heading pretendard-bold-14" key={column.id} role="columnheader">
                  {column.header}
                </div>
              ))}
            </div>

            <div className="admin-data-table__body" role="rowgroup">
              {rows.length > 0 ? (
                rows.map((row) => {
                  const rowKey = getRowKey(row)
                  const rowClassName = [
                    'admin-data-table__row',
                    isDragEnabled ? 'admin-data-table__row--draggable' : '',
                    draggedRowKey === rowKey ? 'admin-data-table__row--dragging' : '',
                    dragOverRowKey === rowKey ? 'admin-data-table__row--drag-over' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <div
                      className={rowClassName}
                      draggable={isDragEnabled}
                      key={rowKey}
                      onDragEnd={isDragEnabled ? clearDragState : undefined}
                      onDragOver={isDragEnabled ? (event) => handleDragOver(event, rowKey) : undefined}
                      onDragStart={isDragEnabled ? (event) => handleDragStart(event, rowKey) : undefined}
                      onDrop={isDragEnabled ? (event) => handleDrop(event, rowKey) : undefined}
                      role="row"
                    >
                      {columns.map((column) => (
                        <div className="admin-data-table__cell pretendard-medium-14" key={column.id} role="cell">
                          {column.renderCell(row)}
                        </div>
                      ))}
                    </div>
                  )
                })
              ) : (
                <div className="admin-data-table__empty pretendard-medium-14">{emptyMessage}</div>
              )}
            </div>
          </div>
        </div>

        {bottomAction ? (
          <Link className="admin-data-table-section__action pretendard-bold-14" to={bottomAction.href}>
            <PackageIcon />
            <span>{bottomAction.label}</span>
          </Link>
        ) : null}
      </section>
    </div>
  )
}
