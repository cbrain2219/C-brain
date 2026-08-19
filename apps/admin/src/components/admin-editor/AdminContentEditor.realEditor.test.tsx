import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { ContentEntity } from '@repo/content/types'
import {
  createInitialManagedContentValue,
  managedContentIsEmpty,
  type ManagedContentFormValue,
} from '../../lib/managedContent'
import { AdminContentEditor } from './AdminContentEditor'

function RealEditorHarness({
  documentKey,
  entity,
}: {
  readonly documentKey: string
  readonly entity: ContentEntity
}) {
  const [value, setValue] = useState<ManagedContentFormValue>(
    createInitialManagedContentValue,
  )

  return (
    <>
      <output aria-label={`${documentKey} publish emptiness`}>
        {String(managedContentIsEmpty(value))}
      </output>
      <AdminContentEditor
        documentKey={documentKey}
        entity={entity}
        onBusyChange={vi.fn()}
        onChange={setValue}
        onPendingAssetCountChange={vi.fn()}
        value={value}
      />
    </>
  )
}

async function expectTypedContentReachesForm(input: {
  readonly body: string
  readonly documentKey: string
  readonly entity: ContentEntity
}) {
  const view = render(
    <StrictMode>
      <RealEditorHarness
        documentKey={input.documentKey}
        entity={input.entity}
      />
    </StrictMode>,
  )
  const editor = await view.findByRole('textbox', {
    name: '본문 WYSIWYG 편집기',
  })

  await userEvent.setup().type(editor, input.body)

  await waitFor(() => {
    expect(
      view.getByLabelText(`${input.documentKey} publish emptiness`).textContent,
    ).toBe('false')
  })
  view.unmount()
}

describe('AdminContentEditor with the real editor', () => {
  it('writes cold and warm StrictMode editor content into every parent form', async () => {
    await expectTypedContentReachesForm({
      body: '콜드 로드 공지 본문',
      documentKey: 'notice:strict-cold',
      entity: 'notice',
    })

    for (const [entity, body] of [
      ['review', '저장할 인터뷰 · 후기 본문'],
      ['portfolio', '저장할 포트폴리오 본문'],
      ['blog', '저장할 블로그 본문'],
      ['notice', '저장할 공지 본문'],
    ] as const) {
      await expectTypedContentReachesForm({
        body,
        documentKey: `${entity}:strict-warm`,
        entity,
      })
    }
  })
})
