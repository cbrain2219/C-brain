import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { ContentEntity } from '@repo/content/types'
import {
  createInitialManagedContentValue,
  managedContentIsEmpty,
  type ManagedContentFormValue,
} from '../../lib/managedContent'
import { AdminContentEditor } from './AdminContentEditor'

describe('AdminContentEditor with the real editor', () => {
  it.each([
    ['blog', '저장할 블로그 본문'],
    ['notice', '저장할 공지 본문'],
    ['portfolio', '저장할 포트폴리오 본문'],
    ['review', '저장할 후기 본문'],
  ] as const)('%s writes typed canonical content into form state before publish emptiness validation', async (entity, body) => {
    const initial: ManagedContentFormValue = createInitialManagedContentValue()

    function Harness() {
      const [value, setValue] = useState(initial)
      return (
        <>
          <output aria-label="publish emptiness">{String(managedContentIsEmpty(value))}</output>
          <AdminContentEditor
            documentKey={`${entity}:real-editor`}
            entity={entity as ContentEntity}
            onBusyChange={vi.fn()}
            onChange={setValue}
            onPendingAssetCountChange={vi.fn()}
            value={value}
          />
        </>
      )
    }

    render(<Harness />)
    const editor = await screen.findByRole('textbox', { name: '본문 WYSIWYG 편집기' })
    await userEvent.setup().type(editor, body)

    await waitFor(() => {
      expect(screen.getByLabelText('publish emptiness').textContent).toBe('false')
    })
  })
})
