import type { TiptapDocument } from '@repo/content/types'
import { Editor, type JSONContent } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminRichTextEditor, type AdminRichTextEditorProps } from './AdminRichTextEditor'
import { AdminRichTextToolbar } from './AdminRichTextToolbar'
import { SelectedImagePanel } from './SelectedImagePanel'
import {
  createContentEditorExtensions,
  isAllowedEditorDocument,
  isAllowedEditorLinkHref,
  normalizeEditorLinkHref,
} from './contentEditorExtensions'
import {
  assertSemanticallyValidInitialDocument,
  canonicalValue,
} from './managedEditorDocument'

const imageUrl = 'https://storage.example.com/content/blog/scope/images/image.png'

const ownedImageUrl = (url: string) => url === imageUrl

function deferred<Value>() {
  let resolve!: (value: Value) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Value>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })
  return { promise, reject, resolve }
}

function createEditor(document: TiptapDocument, isAllowedImageUrl = ownedImageUrl) {
  return new Editor({
    content: document as JSONContent,
    extensions: createContentEditorExtensions(vi.fn(), isAllowedImageUrl),
  })
}

function editorProps(overrides: Partial<AdminRichTextEditorProps> = {}): AdminRichTextEditorProps {
  return {
    cleanupOrphanedImage: vi.fn().mockResolvedValue(undefined),
    disabled: false,
    document: { type: 'doc', content: [{ type: 'paragraph' }] },
    documentKey: 'content-a',
    isAllowedImageUrl: ownedImageUrl,
    onChange: vi.fn(),
    onContentError: vi.fn(),
    onCreate: vi.fn(),
    onPendingAssetWorkChange: vi.fn(),
    onUploadError: vi.fn(),
    uploadImage: vi.fn(),
    ...overrides,
  }
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('admin rich text editor contracts', () => {
  it('normalizes bare hostnames and rejects unsafe link schemes', () => {
    expect(normalizeEditorLinkHref('example.com/path')).toBe('https://example.com/path')
    expect(normalizeEditorLinkHref('mailto:hello@example.com')).toBe('mailto:hello@example.com')
    expect(normalizeEditorLinkHref('javascript:alert(1)')).toBeNull()
    expect(normalizeEditorLinkHref('java\\script:alert(1)')).toBeNull()
    expect(normalizeEditorLinkHref('java%2573cript:alert(1)')).toBeNull()
    expect(normalizeEditorLinkHref('java\u0000script:alert(1)')).toBeNull()
    expect(normalizeEditorLinkHref('https:%2f%2fevil.example')).toBeNull()
  })

  it('emits canonical JSON and HTML for the supported document allowlist', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, textAlign: 'center' },
          content: [{ type: 'text', text: '제목' }],
        },
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '항목' }] }] }],
        },
        {
          type: 'orderedList',
          content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '순서' }] }] }],
        },
        { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: '인용' }] }] },
        { type: 'horizontalRule' },
        {
          type: 'paragraph',
          attrs: { textAlign: 'right' },
          content: [
            {
              type: 'text',
              text: '서식 링크',
              marks: [
                { type: 'bold' },
                { type: 'italic' },
                { type: 'underline' },
                { type: 'strike' },
                { type: 'link', attrs: { href: 'https://example.com/' } },
              ],
            },
          ],
        },
        {
          type: 'image',
          attrs: { alt: '본문 이미지', altReviewed: true, decorative: false, src: imageUrl, uploadId: null },
        },
      ],
    })

    const value = canonicalValue(editor, ownedImageUrl)
    expect(value.document).toMatchObject({ type: 'doc' })
    expect(value.html).toContain('<h2 style="text-align: center;">제목</h2>')
    expect(value.html).toContain('<ul><li><p>항목</p></li></ul>')
    expect(value.html).toContain('<ol><li><p>순서</p></li></ol>')
    expect(value.html).toContain('<blockquote><p>인용</p></blockquote>')
    expect(value.html).toContain('<hr>')
    expect(value.html).toContain('<p style="text-align: right;"><a target="_blank" rel="noopener noreferrer nofollow" href="https://example.com/"><strong><em><s><u>서식 링크</u></s></em></strong></a></p>')
    expect(value.html).toContain(`<img src="${imageUrl}" alt="본문 이미지">`)
    editor.destroy()
  })

  it('rejects malformed stored links and transient image state before editing', () => {
    expect(isAllowedEditorLinkHref('https://example.com/path')).toBe(true)
    expect(isAllowedEditorLinkHref('example.com/path')).toBe(false)
    expect(() =>
      assertSemanticallyValidInitialDocument(
        {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'unsafe', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }],
            },
          ],
        },
        () => true,
      ),
    ).toThrow('unsupported nodes, marks, or attributes')
    expect(() =>
      assertSemanticallyValidInitialDocument(
        {
          type: 'doc',
          content: [{ type: 'image', attrs: { src: imageUrl, uploadId: 'pending-upload' } }],
        },
        (url) => url === imageUrl,
      ),
    ).toThrow('unsupported nodes, marks, or attributes')
  })

  it('fails closed for every unowned image insertion path and leaves only supported schema nodes', () => {
    const externalUrl = 'https://evil.example/asset.png'
    const siblingUrl = 'https://storage.example.com/content/blog/other-scope/images/image.png'
    const transientId = '550e8400-e29b-41d4-a716-446655440000'

    for (const content of [
      `<img src="${externalUrl}" alt="external">`,
      `<img src="${siblingUrl}" alt="sibling">`,
      { type: 'image', attrs: { src: 'blob:unmanaged-preview', alt: 'blob' } },
    ]) {
      const editor = createEditor({ type: 'doc', content: [{ type: 'paragraph' }] })
      act(() => {
        editor.commands.insertContentAt(1, content)
      })
      expect(editor.getJSON()).toEqual({ type: 'doc', content: [{ type: 'paragraph', attrs: { textAlign: null } }] })
      expect(isAllowedEditorDocument(editor.getJSON(), ownedImageUrl)).toBe(true)
      editor.destroy()
    }

    const editor = createEditor({ type: 'doc', content: [{ type: 'paragraph' }] })
    act(() => {
      editor.commands.insertContentAt(1, {
        type: 'image',
        attrs: { src: imageUrl, alt: 'owned', uploadId: null },
      })
    })
    expect(editor.getJSON().content?.[0]).toMatchObject({ type: 'image', attrs: { src: imageUrl, uploadId: null } })

    act(() => {
      editor.commands.insertContentAt(1, {
        type: 'image',
        attrs: { src: 'blob:lifecycle-preview', alt: 'pending', uploadId: transientId },
      })
    })
    expect(isAllowedEditorDocument(editor.getJSON(), ownedImageUrl)).toBe(true)
    expect(() => canonicalValue(editor, ownedImageUrl)).toThrow('transient image state')
    expect(editor.schema.nodes.code).toBeUndefined()
    expect(editor.schema.nodes.codeBlock).toBeUndefined()
    editor.destroy()
  })

  it('mounts only valid stored content, emits a canonical value once, and disables invalid content', async () => {
    const valid = editorProps()
    const { rerender } = render(<AdminRichTextEditor {...valid} />)

    await waitFor(() => expect(valid.onCreate).toHaveBeenCalledTimes(1))
    expect(valid.onCreate).toHaveBeenLastCalledWith(expect.objectContaining({ document: expect.objectContaining({ type: 'doc' }), html: '<p></p>' }))

    const invalid = editorProps({
      document: {
        type: 'doc',
        content: [{ type: 'codeBlock', content: [{ type: 'text', text: 'blocked' }] }],
      },
      documentKey: 'invalid-content',
    })
    rerender(<AdminRichTextEditor {...invalid} />)

    await waitFor(() => expect(invalid.onContentError).toHaveBeenCalledTimes(1))
    expect(invalid.onCreate).not.toHaveBeenCalled()
    expect(invalid.onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: '본문 WYSIWYG 편집기' }).getAttribute('aria-readonly')).toBe('true')
    expect(screen.getAllByRole('status').some((status) => status.textContent?.includes('저장된 본문 형식을 확인할 수 없습니다.'))).toBe(true)
  })

  it('does not leak queued A-generation errors or late upload cleanup errors into B', async () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:a-preview')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const pendingUpload = deferred<{ alt: string; path: string; url: string }>()
    const a = editorProps({
      cleanupOrphanedImage: vi.fn().mockRejectedValue(new Error('A cleanup failed')),
      documentKey: 'content-a',
      uploadImage: vi.fn(() => pendingUpload.promise),
    })
    const b = editorProps({ documentKey: 'content-b' })
    const { rerender } = render(<AdminRichTextEditor {...a} />)

    await waitFor(() => expect(a.onCreate).toHaveBeenCalledTimes(1))
    fireEvent.change(screen.getByLabelText('본문 이미지 파일 선택'), {
      target: { files: [new File(['image'], 'a.png', { type: 'image/png' })] },
    })
    await waitFor(() => expect(a.uploadImage).toHaveBeenCalledTimes(1))

    rerender(<AdminRichTextEditor {...b} />)
    pendingUpload.resolve({ alt: 'A image', path: 'content/blog/a/images/a.png', url: imageUrl })

    await waitFor(() => expect(a.cleanupOrphanedImage).toHaveBeenCalledWith(expect.objectContaining({ path: 'content/blog/a/images/a.png' }), 'editor_replaced'))
    await act(async () => { await Promise.resolve() })
    expect(b.onUploadError).not.toHaveBeenCalled()
    expect(b.onChange).not.toHaveBeenCalled()
    expect(b.onContentError).not.toHaveBeenCalled()
    await waitFor(() => expect(b.onCreate).toHaveBeenCalledTimes(1))
    createObjectUrl.mockRestore()
    revokeObjectUrl.mockRestore()
  })

  it('drops a queued malformed A document error when StrictMode changes to B', async () => {
    const a = editorProps({
      document: { type: 'doc', content: [{ type: 'codeBlock', content: [{ type: 'text', text: 'A' }] }] },
      documentKey: 'content-a-invalid',
    })
    const b = editorProps({ documentKey: 'content-b-valid' })
    const { rerender } = render(
      <StrictMode>
        <AdminRichTextEditor {...a} />
      </StrictMode>,
    )
    rerender(
      <StrictMode>
        <AdminRichTextEditor {...b} />
      </StrictMode>,
    )

    await waitFor(() => expect(b.onCreate).toHaveBeenCalledTimes(1))
    await act(async () => { await Promise.resolve() })
    expect(a.onContentError).not.toHaveBeenCalled()
    expect(b.onContentError).not.toHaveBeenCalled()
  })

  it('does not start image uploads from disabled paste or drop events', async () => {
    const props = editorProps({ disabled: true })
    render(<AdminRichTextEditor {...props} />)
    await waitFor(() => expect(props.onCreate).toHaveBeenCalledTimes(1))

    const textbox = screen.getByRole('textbox', { name: '본문 WYSIWYG 편집기' })
    const image = new File(['image'], 'disabled.png', { type: 'image/png' })
    fireEvent.paste(textbox, { clipboardData: { files: [image], getData: () => '', types: [] } })
    fireEvent.drop(textbox, { dataTransfer: { files: [image], getData: () => '', types: [] } })

    expect(props.uploadImage).not.toHaveBeenCalled()
    expect(props.onPendingAssetWorkChange).not.toHaveBeenCalled()
  })

  it('does not emit a duplicate create callback across StrictMode mount cleanup', async () => {
    const props = editorProps()
    const view = render(
      <StrictMode>
        <AdminRichTextEditor {...props} />
      </StrictMode>,
    )
    await waitFor(() => expect(props.onCreate).toHaveBeenCalledTimes(1))
    view.unmount()
    await act(async () => { await Promise.resolve() })
    expect(props.onChange).not.toHaveBeenCalled()
    expect(props.onContentError).not.toHaveBeenCalled()
  })

  it('exposes every C-Brain toolbar action by a Korean accessible name', () => {
    const editor = createEditor({ type: 'doc', content: [{ type: 'paragraph' }] })
    render(<AdminRichTextToolbar disabled={false} editor={editor} onImageFiles={vi.fn()} />)

    for (const label of [
      '실행 취소',
      '다시 실행',
      '제목 2',
      '제목 3',
      '제목 4',
      '글머리 기호 목록',
      '번호 목록',
      '인용문',
      '구분선',
      '굵게',
      '기울임',
      '밑줄',
      '취소선',
      '링크 설정',
      '왼쪽 정렬',
      '가운데 정렬',
      '오른쪽 정렬',
      '본문 이미지 업로드',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy()
    }

    expect(screen.getByRole('toolbar', { name: '본문 서식 도구' })).toBeTruthy()
    editor.destroy()
  })

  it('runs toolbar formatting and image-file actions while respecting disabled state', () => {
    const onImageFiles = vi.fn()
    const editor = createEditor({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '본문' }] }] })
    render(<AdminRichTextToolbar disabled={false} editor={editor} onImageFiles={onImageFiles} />)

    fireEvent.click(screen.getByRole('button', { name: '굵게' }))
    expect(editor.isActive('bold')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '제목 2' }))
    expect(editor.isActive('heading', { level: 2 })).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '가운데 정렬' }))
    expect(editor.getAttributes('heading').textAlign).toBe('center')

    const image = new File(['image'], 'editor.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('본문 이미지 파일 선택'), { target: { files: [image] } })
    expect(onImageFiles).toHaveBeenCalledWith(editor, [image], expect.objectContaining({ from: expect.any(Number), to: expect.any(Number) }))
    editor.destroy()
  })

  it('makes toolbar commands and image input inert when disabled', () => {
    const onImageFiles = vi.fn()
    const editor = createEditor({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '본문' }] }] })
    render(<AdminRichTextToolbar disabled editor={editor} onImageFiles={onImageFiles} />)

    expect((screen.getByRole('button', { name: '굵게' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('본문 이미지 파일 선택') as HTMLInputElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('본문 이미지 파일 선택'), {
      target: { files: [new File(['image'], 'editor.png', { type: 'image/png' })] },
    })
    expect(onImageFiles).not.toHaveBeenCalled()
    editor.destroy()
  })

  it('updates selected-image alt text and decorative state through the panel', async () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: imageUrl, alt: '', altReviewed: false, decorative: false, uploadId: null } },
        { type: 'paragraph' },
      ],
    })
    render(<SelectedImagePanel disabled={false} editor={editor} />)
    act(() => {
      editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)))
    })

    const alt = await screen.findByLabelText('대체 텍스트')
    fireEvent.change(alt, { target: { value: '접수 창구' } })
    expect(editor.state.doc.nodeAt(0)?.attrs).toMatchObject({ alt: '접수 창구', altReviewed: true, decorative: false })
    fireEvent.click(screen.getByLabelText('장식용 이미지'))
    expect(editor.state.doc.nodeAt(0)?.attrs).toMatchObject({ alt: '', altReviewed: true, decorative: true })
    expect((alt as HTMLInputElement).disabled).toBe(true)
    editor.destroy()
  })
})
