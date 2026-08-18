import type { Editor } from '@tiptap/core'
import { useRef, type ChangeEvent, type ReactNode } from 'react'
import { AdminIcon } from '../AdminIcon'
import {
  type HandleEditorImageFiles,
  isManagedEditorImageFile,
  normalizeEditorLinkHref,
} from './contentEditorExtensions'
import styles from './AdminRichTextEditor.module.css'

type AdminRichTextToolbarProps = {
  readonly disabled: boolean
  readonly editor: Editor
  readonly onImageFiles: HandleEditorImageFiles
}

type ToolbarButtonProps = {
  readonly active?: boolean
  readonly children: ReactNode
  readonly disabled: boolean
  readonly label: string
  readonly onClick: () => void
  readonly shortcut?: string
}

function ToolbarButton({
  active = false,
  children,
  disabled,
  label,
  onClick,
  shortcut,
}: ToolbarButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={styles.toolbarButton}
      data-active={active || undefined}
      disabled={disabled}
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      type="button"
    >
      {children}
    </button>
  )
}

function ToolbarGroup({ children }: { readonly children: ReactNode }) {
  return <div className={styles.toolbarGroup}>{children}</div>
}

export function AdminRichTextToolbar({
  disabled,
  editor,
  onImageFiles,
}: AdminRichTextToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  // A controlled parent can replace an editor between React renders. Tiptap
  // nulls its command manager during destroy, so never call `can`, `chain`,
  // or state access after that boundary.
  const editorAvailable = !editor.isDestroyed
  const toolbarDisabled = disabled || !editorAvailable || !editor.isEditable

  function run(command: () => boolean): void {
    if (!toolbarDisabled && !editor.isDestroyed) command()
  }

  function changeImage(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.currentTarget.files ?? []).filter(isManagedEditorImageFile)
    event.currentTarget.value = ''
    if (toolbarDisabled || editor.isDestroyed || files.length === 0) return

    const { from, to } = editor.state.selection
    onImageFiles(editor, files, { from, to })
  }

  function setLink(): void {
    if (toolbarDisabled || editor.isDestroyed) return
    const currentHref = editor.getAttributes('link').href as string | undefined
    const input = window.prompt('링크 주소를 입력해 주세요.', currentHref ?? '')
    if (input === null) return

    const href = normalizeEditorLinkHref(input.trim())
    if (href === null) {
      window.alert('http, https, mailto, tel 형식의 안전한 링크만 사용할 수 있습니다.')
      return
    }

    run(() => editor.chain().focus().extendMarkRange('link').setLink({ href }).run())
  }

  return (
    <div aria-label="본문 서식 도구" className={styles.toolbar} role="toolbar">
      <ToolbarGroup>
        <ToolbarButton
          disabled={toolbarDisabled || !editor.can().undo()}
          label="실행 취소"
          onClick={() => run(() => editor.chain().focus().undo().run())}
          shortcut="Ctrl+Z"
        >
          <AdminIcon name="undo" />
        </ToolbarButton>
        <ToolbarButton
          disabled={toolbarDisabled || !editor.can().redo()}
          label="다시 실행"
          onClick={() => run(() => editor.chain().focus().redo().run())}
          shortcut="Ctrl+Shift+Z"
        >
          <AdminIcon name="redo" />
        </ToolbarButton>
      </ToolbarGroup>

      <span aria-hidden="true" className={styles.toolbarDivider} />

      <ToolbarGroup>
        {[2, 3, 4].map((level) => (
          <ToolbarButton
            active={editorAvailable && editor.isActive('heading', { level })}
            disabled={toolbarDisabled}
            key={level}
            label={`제목 ${level}`}
            onClick={() => run(() => editor.chain().focus().toggleHeading({ level: level as 2 | 3 | 4 }).run())}
          >
            <span className={styles.headingLevel}>H{level}</span>
          </ToolbarButton>
        ))}
        <ToolbarButton
          active={editorAvailable && editor.isActive('bulletList')}
          disabled={toolbarDisabled}
          label="글머리 기호 목록"
          onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
        >
          <AdminIcon name="list-bullet" />
        </ToolbarButton>
        <ToolbarButton
          active={editorAvailable && editor.isActive('orderedList')}
          disabled={toolbarDisabled}
          label="번호 목록"
          onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
        >
          <AdminIcon name="list-ordered" />
        </ToolbarButton>
        <ToolbarButton
          active={editorAvailable && editor.isActive('blockquote')}
          disabled={toolbarDisabled}
          label="인용문"
          onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())}
        >
          <AdminIcon name="quote" />
        </ToolbarButton>
        <ToolbarButton
          disabled={toolbarDisabled}
          label="구분선"
          onClick={() => run(() => editor.chain().focus().setHorizontalRule().run())}
        >
          <AdminIcon name="divider" />
        </ToolbarButton>
      </ToolbarGroup>

      <span aria-hidden="true" className={styles.toolbarDivider} />

      <ToolbarGroup>
        <ToolbarButton
          active={editorAvailable && editor.isActive('bold')}
          disabled={toolbarDisabled}
          label="굵게"
          onClick={() => run(() => editor.chain().focus().toggleBold().run())}
          shortcut="Ctrl+B"
        >
          <AdminIcon name="bold" />
        </ToolbarButton>
        <ToolbarButton
          active={editorAvailable && editor.isActive('italic')}
          disabled={toolbarDisabled}
          label="기울임"
          onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
          shortcut="Ctrl+I"
        >
          <AdminIcon name="italic" />
        </ToolbarButton>
        <ToolbarButton
          active={editorAvailable && editor.isActive('underline')}
          disabled={toolbarDisabled}
          label="밑줄"
          onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
          shortcut="Ctrl+U"
        >
          <AdminIcon name="underline" />
        </ToolbarButton>
        <ToolbarButton
          active={editorAvailable && editor.isActive('strike')}
          disabled={toolbarDisabled}
          label="취소선"
          onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
        >
          <AdminIcon name="strike" />
        </ToolbarButton>
        <ToolbarButton
          active={editorAvailable && editor.isActive('link')}
          disabled={toolbarDisabled}
          label="링크 설정"
          onClick={setLink}
        >
          <AdminIcon name="link" />
        </ToolbarButton>
      </ToolbarGroup>

      <span aria-hidden="true" className={styles.toolbarDivider} />

      <ToolbarGroup>
        {(['left', 'center', 'right'] as const).map((alignment) => (
          <ToolbarButton
            active={editorAvailable && editor.isActive({ textAlign: alignment })}
            disabled={toolbarDisabled}
            key={alignment}
            label={`${alignment === 'left' ? '왼쪽' : alignment === 'center' ? '가운데' : '오른쪽'} 정렬`}
            onClick={() => run(() => editor.chain().focus().setTextAlign(alignment).run())}
          >
            <AdminIcon name={`align-${alignment}`} />
          </ToolbarButton>
        ))}
      </ToolbarGroup>

      <span aria-hidden="true" className={styles.toolbarDivider} />

      <ToolbarGroup>
        <input
          accept="image/png,image/jpeg,image/webp"
          aria-label="본문 이미지 파일 선택"
          className={styles.fileInput}
          disabled={toolbarDisabled}
          onChange={changeImage}
          ref={imageInputRef}
          type="file"
        />
        <ToolbarButton
          disabled={toolbarDisabled}
          label="본문 이미지 업로드"
          onClick={() => imageInputRef.current?.click()}
        >
          <AdminIcon name="image" />
        </ToolbarButton>
      </ToolbarGroup>
    </div>
  )
}
