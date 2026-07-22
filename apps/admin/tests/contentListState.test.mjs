import assert from 'node:assert/strict'
import test from 'node:test'

import {
  filterContentRows,
  formatAdminDate,
  toDateInputValue,
  toPublishedAt,
} from '../src/pages/contentListState.ts'

const rows = [
  { status: '임시저장', title: '첫 글', type: '공지' },
  { status: '게시됨', title: '두 번째 글', type: '이벤트' },
]

test('filterContentRows combines query, status, and type filters', () => {
  assert.deepEqual(
    filterContentRows(rows, { query: '두 번째', status: '게시됨', type: '이벤트' }),
    [rows[1]],
  )
  assert.deepEqual(filterContentRows(rows, { query: '', status: '전체', type: '전체' }), rows)
})

test('date helpers convert between DB and form values', () => {
  assert.equal(toDateInputValue('2026-07-21T03:00:00.000Z'), '2026-07-21')
  assert.equal(toDateInputValue(null), '')
  assert.equal(toPublishedAt(''), null)
  assert.match(toPublishedAt('2026-07-21') ?? '', /^2026-07-20T15:00:00\.000Z$/)
  assert.equal(toDateInputValue(toPublishedAt('2026-07-22')), '2026-07-22')
  assert.notEqual(formatAdminDate('2026-07-21T00:00:00.000Z'), '-')
})
