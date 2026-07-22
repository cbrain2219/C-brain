import type { FormEvent } from 'react'

export type ContentListFilters = {
  readonly query: string
  readonly status: string
  readonly type: string
}

export type ContentListRow = {
  readonly status: string
  readonly title: string
  readonly type: string
}

export function filterContentRows<Row extends ContentListRow>(
  rows: readonly Row[],
  filters: ContentListFilters,
) {
  const query = filters.query.trim().toLocaleLowerCase('ko-KR')

  return rows.filter((row) => {
    if (filters.status !== '전체' && row.status !== filters.status) return false
    if (filters.type !== '전체' && row.type !== filters.type) return false

    return !query || row.title.toLocaleLowerCase('ko-KR').includes(query)
  })
}

export function formatAdminDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('ko-KR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Seoul',
      year: '2-digit',
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return `${parts.year}. ${parts.month}. ${parts.day}`
}

export function toDateInputValue(value: string | null) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(date)
}

export function toPublishedAt(value: string) {
  return value ? new Date(`${value}T00:00:00+09:00`).toISOString() : null
}

export function getSubmitIntent(event: FormEvent<HTMLFormElement>) {
  const submitter = (event.nativeEvent as SubmitEvent).submitter

  return submitter instanceof HTMLButtonElement ? submitter.value : ''
}
