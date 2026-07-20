import assert from 'node:assert/strict'
import test from 'node:test'
import { contentTypeFilterOptions, getUserTagOptions } from '../src/components/admin-table/adminTableFilters.ts'

test('content filters keep publication choices and distinct user tags', () => {
  assert.deepEqual(contentTypeFilterOptions, ['임시저장', '게시됨'])
  assert.deepEqual(getUserTagOptions([' 브로슈어 ', '', '브로슈어', '인쇄 가이드'], ['일반상품']), ['브로슈어', '인쇄 가이드', '일반상품'])
})
