import assert from 'node:assert/strict'
import test from 'node:test'
import { moveItem } from '../src/components/admin-table/adminTableOrdering.ts'

test('moves a table row without mutating the original order', () => {
  const rows = ['a', 'b', 'c']

  assert.deepEqual(moveItem(rows, 0, 2), ['b', 'c', 'a'])
  assert.deepEqual(moveItem(rows, 2, 0), ['c', 'a', 'b'])
  assert.equal(moveItem(rows, 1, 1), rows)
  assert.equal(moveItem(rows, -1, 1), rows)
})
