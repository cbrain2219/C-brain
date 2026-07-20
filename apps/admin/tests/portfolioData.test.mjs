import assert from 'node:assert/strict'
import test from 'node:test'
import { getPortfolioSettingCounts } from '../src/pages/portfolioData.ts'

test('portfolio setting counts come from portfolio rows', () => {
  const counts = getPortfolioSettingCounts([
    { isPinned: true, landingStatus: 'published' },
    { isPinned: false, landingStatus: 'none' },
    { isPinned: true, landingStatus: 'published' },
  ])

  assert.deepEqual(counts, { landing: 2, pinned: 2 })
})
