import { describe, expect, it, vi } from 'vitest'
import { deleteRowThenCleanContentScope } from './contentEditorDeletion'

describe('deleteRowThenCleanContentScope', () => {
  it('continues to navigation after a successful delete and rejected body cleanup', async () => {
    const events: string[] = []
    const deleteRow = vi.fn(async () => { events.push('row-delete') })
    const cleanScope = vi.fn(async () => { throw new Error('Storage unavailable') })
    const reportCleanupFailure = vi.fn(() => { events.push('cleanup-warning') })

    await deleteRowThenCleanContentScope(deleteRow, cleanScope, reportCleanupFailure)
    events.push('navigate')

    expect(events).toEqual(['row-delete', 'cleanup-warning', 'navigate'])
    expect(deleteRow).toHaveBeenCalledTimes(1)
    expect(cleanScope).toHaveBeenCalledTimes(1)
  })
})
