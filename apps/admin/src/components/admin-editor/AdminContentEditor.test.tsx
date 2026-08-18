import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  switchWysiwygToRaw,
  createInitialManagedContentValue,
  type ManagedContentFormValue,
} from '../../lib/managedContent'
import { useManagedContentEditorState } from '../../hooks/useManagedContentEditorState'
import { AdminContentEditor } from './AdminContentEditor'
import { getManagedContentPublishError } from './contentEditorPublish'
import { GenerationPendingAssetRegistry, createPendingAssetProducerKey } from './generationPendingAssetRegistry'

const richEditorHarness = vi.hoisted(() => ({
  createHandlers: new Map<string, (value: { document: unknown; html: string }) => void>(),
  errorHandlers: new Map<string, (error: unknown) => void>(),
  pendingHandlers: new Map<string, (event: { count: number; generation: string; producerKey: symbol }) => void>(),
  producerKeys: new Map<string, symbol>(),
}))

vi.mock('./AdminRichTextEditor', async () => {
  const { useEffect } = await import('react')
  const producerKey = Symbol('test-editor')

  return {
    AdminRichTextEditor: ({ documentKey, onContentError, onCreate, onPendingAssetWorkChange }: {
      readonly documentKey: string
      readonly onContentError: (error: unknown) => void
      readonly onCreate: (value: { document: unknown; html: string }) => void
      readonly onPendingAssetWorkChange: (event: { count: number; generation: string; producerKey: symbol }) => void
    }) => {
      useEffect(() => {
        richEditorHarness.createHandlers.set(documentKey, onCreate)
        richEditorHarness.errorHandlers.set(documentKey, onContentError)
        richEditorHarness.pendingHandlers.set(documentKey, onPendingAssetWorkChange)
        richEditorHarness.producerKeys.set(documentKey, producerKey)
        onPendingAssetWorkChange({ count: 1, generation: documentKey, producerKey })
        return () => onPendingAssetWorkChange({ count: 0, generation: documentKey, producerKey })
      // Intentionally capture the producer callback for this document key so
      // the test can invoke it after the wrapper has moved to another record.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [documentKey])

      return <div>테스트 TEXT Editor</div>
    },
  }
})

describe('AdminContentEditor', () => {
  it('keeps the established mode labels and owns the raw HTML textarea', () => {
    const value = {
      ...switchWysiwygToRaw(createInitialManagedContentValue(), 'generated'),
      content: '<p>원문</p>',
    }
    const onChange = vi.fn()

    render(
      <AdminContentEditor
        documentKey="blog:record-a"
        entity="blog"
        onBusyChange={vi.fn()}
        onChange={onChange}
        onPendingAssetCountChange={vi.fn()}
        value={value}
      />,
    )

    expect(screen.getByRole('button', { name: 'HTML 작성' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'TEXT Editor 작성' })).toBeTruthy()
    fireEvent.change(screen.getByRole('textbox', { name: '본문 HTML' }), {
      target: { value: '<p>변경됨</p>' },
    })
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ content: '<p>변경됨</p>' }))
  })

  it('clears a stale A producer before A is visited again after B', () => {
    const registry = new GenerationPendingAssetRegistry()
    const producer = createPendingAssetProducerKey()

    registry.update({ count: 1, generation: 'record-a', producerKey: producer })
    registry.update({ count: 1, generation: 'record-b', producerKey: producer })
    // The unmounted A editor may deliver this after B is already visible.
    registry.update({ count: 0, generation: 'record-a', producerKey: producer })

    expect(registry.countForGeneration('record-b')).toBe(1)
    expect(registry.countForGeneration('record-a')).toBe(0)
  })

  it('does not publish a stale A pending callback after document B is active', async () => {
    const value = createInitialManagedContentValue()
    const pendingCounts: number[] = []
    const props = {
      entity: 'blog' as const,
      onBusyChange: vi.fn(),
      onChange: vi.fn(),
      onPendingAssetCountChange: (count: number) => pendingCounts.push(count),
      value,
    }
    const view = render(<AdminContentEditor {...props} documentKey="blog:record-a" />)

    await screen.findByText('테스트 TEXT Editor')
    await waitFor(() => expect(pendingCounts.at(-1)).toBe(1))
    view.rerender(<AdminContentEditor {...props} documentKey="blog:record-b" />)
    await waitFor(() => expect(pendingCounts.at(-1)).toBe(1))
    const countAfterB = pendingCounts.length

    act(() => {
      richEditorHarness.pendingHandlers.get('blog:record-a')?.({
        count: 0,
        generation: 'blog:record-a',
        producerKey: Symbol('late-a'),
      })
    })

    expect(pendingCounts).toHaveLength(countAfterB)
  })

  it('keeps B action state after the parent hook receives a late A producer callback', async () => {
    richEditorHarness.createHandlers.clear()
    richEditorHarness.errorHandlers.clear()
    richEditorHarness.pendingHandlers.clear()
    richEditorHarness.producerKeys.clear()
    const value = createInitialManagedContentValue()

    function Harness() {
      const [documentKey, setDocumentKey] = useState('blog:record-a')
      const editorState = useManagedContentEditorState(documentKey, true)
      return (
        <>
          <button onClick={() => setDocumentKey('blog:record-b')} type="button">
            B로 전환
          </button>
          <output aria-label="parent editor state">{`${editorState.busy}:${editorState.pendingAssetCount}`}</output>
          <AdminContentEditor
            documentKey={documentKey}
            entity="blog"
            onBusyChange={editorState.onBusyChange}
            onChange={vi.fn()}
            onPendingAssetCountChange={editorState.onPendingAssetCountChange}
            value={value}
          />
        </>
      )
    }

    render(<StrictMode><Harness /></StrictMode>)
    await screen.findByText('테스트 TEXT Editor')
    await waitFor(() => expect(screen.getByLabelText('parent editor state').textContent).toBe('true:1'))
    fireEvent.click(screen.getByRole('button', { name: 'B로 전환' }))
    await waitFor(() => expect(screen.getByLabelText('parent editor state').textContent).toBe('true:1'))

    act(() => {
      richEditorHarness.pendingHandlers.get('blog:record-a')?.({
        count: 0,
        generation: 'blog:record-a',
        producerKey: Symbol('late-a'),
      })
    })

    expect(screen.getByLabelText('parent editor state').textContent).toBe('true:1')
  })

  it('requires a new onCreate after returning to WYSIWYG for the same record', async () => {
    richEditorHarness.createHandlers.clear()
    richEditorHarness.errorHandlers.clear()
    richEditorHarness.pendingHandlers.clear()
    richEditorHarness.producerKeys.clear()
    const initialValue = createInitialManagedContentValue()
    const canonicalValue = {
      document: initialValue.contentJson,
      html: '<p>본문</p>',
    }

    function Harness() {
      const [value, setValue] = useState(initialValue)
      const editorState = useManagedContentEditorState('blog:single', value.contentAuthoringMode === 'wysiwyg')
      return (
        <>
          <output aria-label="same-record editor state">{`${editorState.busy}:${editorState.pendingAssetCount}`}</output>
          <AdminContentEditor
            documentKey="blog:single"
            entity="blog"
            onBusyChange={editorState.onBusyChange}
            onChange={setValue}
            onPendingAssetCountChange={editorState.onPendingAssetCountChange}
            value={value}
          />
        </>
      )
    }

    render(<Harness />)
    await screen.findByText('테스트 TEXT Editor')
    const firstGeneration = [...richEditorHarness.createHandlers.keys()].at(-1)
    expect(firstGeneration).toBeTruthy()
    act(() => {
      richEditorHarness.pendingHandlers.get(firstGeneration ?? '')?.({
        count: 0,
        generation: firstGeneration ?? '',
        producerKey: richEditorHarness.producerKeys.get(firstGeneration ?? '') ?? Symbol('missing-first'),
      })
      richEditorHarness.createHandlers.get(firstGeneration ?? '')?.(canonicalValue)
    })
    await waitFor(() => expect(screen.getByLabelText('same-record editor state').textContent).toBe('false:0'))

    fireEvent.click(screen.getByRole('button', { name: 'HTML 작성' }))
    await screen.findByRole('textbox', { name: '본문 HTML' })
    fireEvent.click(screen.getByRole('button', { name: 'TEXT Editor 작성' }))
    await screen.findByText('테스트 TEXT Editor')
    const secondGeneration = [...richEditorHarness.createHandlers.keys()].at(-1)
    expect(secondGeneration).not.toBe(firstGeneration)

    act(() => {
      richEditorHarness.pendingHandlers.get(secondGeneration ?? '')?.({
        count: 0,
        generation: secondGeneration ?? '',
        producerKey: richEditorHarness.producerKeys.get(secondGeneration ?? '') ?? Symbol('missing-second'),
      })
      richEditorHarness.createHandlers.get(firstGeneration ?? '')?.(canonicalValue)
    })
    expect(screen.getByLabelText('same-record editor state').textContent).toBe('true:0')

    act(() => {
      richEditorHarness.createHandlers.get(secondGeneration ?? '')?.(canonicalValue)
    })
    await waitFor(() => expect(screen.getByLabelText('same-record editor state').textContent).toBe('false:0'))
  })

  it('keeps raw HTML lossless through TEXT Editor round trips', async () => {
    richEditorHarness.createHandlers.clear()
    richEditorHarness.errorHandlers.clear()
    richEditorHarness.pendingHandlers.clear()
    richEditorHarness.producerKeys.clear()
    const rawValue: ManagedContentFormValue = {
      ...createInitialManagedContentValue(),
      content: '<p>원본 HTML</p>',
      contentAuthoringMode: 'raw_html' as const,
      contentMode: 'html' as const,
    }

    function Harness() {
      const [value, setValue] = useState(rawValue)
      return (
        <AdminContentEditor
          documentKey="blog:round-trip"
          entity="blog"
          onBusyChange={vi.fn()}
          onChange={setValue}
          onPendingAssetCountChange={vi.fn()}
          value={value}
        />
      )
    }

    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'TEXT Editor 작성' }))
    await screen.findByText('테스트 TEXT Editor')
    const firstGeneration = [...richEditorHarness.createHandlers.keys()].at(-1) ?? ''
    act(() => {
      richEditorHarness.pendingHandlers.get(firstGeneration)?.({
        count: 0,
        generation: firstGeneration,
        producerKey: richEditorHarness.producerKeys.get(firstGeneration) ?? Symbol('first'),
      })
      richEditorHarness.createHandlers.get(firstGeneration)?.({
        document: rawValue.contentJson,
        html: '<p>에디터 HTML</p>',
      })
    })
    fireEvent.click(screen.getByRole('button', { name: 'HTML 작성' }))
    expect((screen.getByRole('textbox', { name: '본문 HTML' }) as HTMLTextAreaElement).value).toBe('<p>원본 HTML</p>')

    fireEvent.change(screen.getByRole('textbox', { name: '본문 HTML' }), {
      target: { value: '<p>수정한 HTML</p>' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'TEXT Editor 작성' }))
    await screen.findByText('테스트 TEXT Editor')
    const secondGeneration = [...richEditorHarness.createHandlers.keys()].at(-1) ?? ''
    act(() => {
      richEditorHarness.pendingHandlers.get(secondGeneration)?.({
        count: 0,
        generation: secondGeneration,
        producerKey: richEditorHarness.producerKeys.get(secondGeneration) ?? Symbol('second'),
      })
      richEditorHarness.createHandlers.get(secondGeneration)?.({
        document: rawValue.contentJson,
        html: '<p>다시 에디터 HTML</p>',
      })
    })
    fireEvent.click(screen.getByRole('button', { name: 'HTML 작성' }))
    expect((screen.getByRole('textbox', { name: '본문 HTML' }) as HTMLTextAreaElement).value).toBe('<p>수정한 HTML</p>')
  })

  it('requires an explicit conversion before changing legacy Markdown', () => {
    const legacyValue = {
      ...createInitialManagedContentValue(),
      content: '**기존 TEXT**',
      contentAuthoringMode: 'raw_html' as const,
      contentMode: 'markdown' as const,
      contentJson: null,
    }
    const onChange = vi.fn()
    const view = render(
      <AdminContentEditor
        documentKey="notice:legacy"
        entity="notice"
        onBusyChange={vi.fn()}
        onChange={onChange}
        onPendingAssetCountChange={vi.fn()}
        value={legacyValue}
      />,
    )

    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'HTML로 변환' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      content: '<p>**기존 TEXT**</p>',
      contentAuthoringMode: 'raw_html',
      contentMode: 'html',
    }))

    onChange.mockClear()
    view.rerender(
      <AdminContentEditor
        documentKey="notice:legacy"
        entity="notice"
        onBusyChange={vi.fn()}
        onChange={onChange}
        onPendingAssetCountChange={vi.fn()}
        value={legacyValue}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'TEXT Editor로 변환' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      content: '',
      contentAuthoringMode: 'wysiwyg',
      contentMode: 'html',
    }))
  })

  it('keeps mode controls disabled while upload work is pending', async () => {
    richEditorHarness.createHandlers.clear()
    richEditorHarness.errorHandlers.clear()
    richEditorHarness.pendingHandlers.clear()
    richEditorHarness.producerKeys.clear()
    render(
      <AdminContentEditor
        documentKey="blog:pending"
        entity="blog"
        onBusyChange={vi.fn()}
        onChange={vi.fn()}
        onPendingAssetCountChange={vi.fn()}
        value={createInitialManagedContentValue()}
      />,
    )

    await screen.findByText('테스트 TEXT Editor')
    const rawModeButton = screen.getByRole('button', { name: 'HTML 작성' })
    expect((rawModeButton as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(rawModeButton)
    expect(screen.queryByRole('textbox', { name: '본문 HTML' })).toBeNull()
  })

  it('fails closed for malformed documents while leaving raw recovery available', async () => {
    const onBusyChange = vi.fn()
    const onChange = vi.fn()
    const malformed = { ...createInitialManagedContentValue(), contentJson: null }
    render(
      <AdminContentEditor
        documentKey="blog:malformed"
        entity="blog"
        onBusyChange={onBusyChange}
        onChange={onChange}
        onPendingAssetCountChange={vi.fn()}
        value={malformed}
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain('이 글은 현재 에디터보다 새로운 형식이어서 수정할 수 없습니다.')
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(true))
    fireEvent.click(screen.getByRole('button', { name: 'HTML 작성' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ contentAuthoringMode: 'raw_html' }))
  })

  it('surfaces editor content errors and honours the disabled state', async () => {
    richEditorHarness.createHandlers.clear()
    richEditorHarness.errorHandlers.clear()
    richEditorHarness.pendingHandlers.clear()
    richEditorHarness.producerKeys.clear()
    const value = createInitialManagedContentValue()
    const onBusyChange = vi.fn()
    const view = render(
      <AdminContentEditor
        documentKey="blog:error"
        entity="blog"
        onBusyChange={onBusyChange}
        onChange={vi.fn()}
        onPendingAssetCountChange={vi.fn()}
        value={value}
      />,
    )
    await screen.findByText('테스트 TEXT Editor')
    const generation = [...richEditorHarness.errorHandlers.keys()].at(-1) ?? ''
    act(() => {
      richEditorHarness.pendingHandlers.get(generation)?.({
        count: 0,
        generation,
        producerKey: richEditorHarness.producerKeys.get(generation) ?? Symbol('error'),
      })
      richEditorHarness.createHandlers.get(generation)?.({ document: value.contentJson, html: '' })
      richEditorHarness.errorHandlers.get(generation)?.(new Error('malformed editor payload'))
    })
    expect((await screen.findByRole('alert')).textContent).toContain('이 글은 현재 에디터보다 새로운 형식이어서 수정할 수 없습니다.')
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(true))

    view.rerender(
      <AdminContentEditor
        disabled
        documentKey="blog:disabled"
        entity="blog"
        onBusyChange={vi.fn()}
        onChange={vi.fn()}
        onPendingAssetCountChange={vi.fn()}
        value={{ ...switchWysiwygToRaw(value, 'generated'), contentMode: 'markdown' }}
      />,
    )
    expect((screen.getByRole('button', { name: 'HTML 작성' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'TEXT Editor 작성' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'HTML로 변환' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('textbox', { name: '본문 HTML' }) as HTMLTextAreaElement).disabled).toBe(true)
  })

  it('maps publish validation failures to stable Korean messages', () => {
    const value = createInitialManagedContentValue()
    const withImage = (attrs: Record<string, unknown>) => ({
      ...value,
      contentJson: { content: [{ attrs, type: 'image' as const }], type: 'doc' as const },
    })

    expect(getManagedContentPublishError('blog', value, 1)).toBe('본문 이미지 업로드가 완료된 뒤 게시할 수 있습니다.')
    expect(getManagedContentPublishError('blog', withImage({
      alt: '설명',
      altReviewed: false,
      decorative: false,
      src: 'https://attacker.example/image.png',
    }), 0)).toBe('본문 이미지의 대체 텍스트를 검토한 뒤 게시할 수 있습니다.')
    expect(getManagedContentPublishError('blog', withImage({
      alt: '',
      altReviewed: true,
      decorative: false,
      src: 'https://attacker.example/image.png',
    }), 0)).toBe('본문 이미지에 대체 텍스트를 입력한 뒤 게시할 수 있습니다.')
    expect(getManagedContentPublishError('blog', withImage({
      alt: '장식',
      altReviewed: true,
      decorative: true,
      src: 'https://attacker.example/image.png',
    }), 0)).toBe('장식용 본문 이미지의 대체 텍스트는 비워주세요.')
    expect(getManagedContentPublishError('blog', withImage({
      alt: '설명',
      altReviewed: true,
      decorative: false,
      src: 'https://attacker.example/image.png',
    }), 0)).toBe('본문 이미지의 저장 위치를 확인한 뒤 게시할 수 있습니다.')
  })
})
