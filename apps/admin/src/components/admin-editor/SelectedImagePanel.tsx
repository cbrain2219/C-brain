import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'
import { useId } from 'react'
import styles from './AdminRichTextEditor.module.css'

type SelectedImagePanelProps = {
  readonly disabled: boolean
  readonly editor: Editor
}

function updateImageAtPosition(
  editor: Editor,
  position: number,
  attributes: Readonly<Record<string, unknown>>,
): void {
  const node = editor.state.doc.nodeAt(position)
  if (!node || node.type.name !== 'image') return
  editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, { ...node.attrs, ...attributes }))
}

export function SelectedImagePanel({ disabled, editor }: SelectedImagePanelProps) {
  const altInputId = useId()
  const decorativeInputId = useId()
  const selectedImage = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (currentEditor.isDestroyed) return null
      const { selection } = currentEditor.state
      if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') return null

      return {
        alt: String(selection.node.attrs.alt ?? ''),
        altReviewed: selection.node.attrs.altReviewed === true,
        decorative: selection.node.attrs.decorative === true,
        pending: typeof selection.node.attrs.uploadId === 'string',
        position: selection.from,
      }
    },
  })

  if (!selectedImage) return null
  const metadataDisabled = disabled || selectedImage.pending
  const reviewCopy = selectedImage.pending
    ? '업로드가 끝나면 이미지 설명을 설정할 수 있습니다.'
    : selectedImage.decorative
      ? '장식용 이미지로 검토했습니다.'
      : selectedImage.altReviewed
        ? '대체 텍스트를 검토했습니다.'
        : '게시 전에 의미 있는 대체 텍스트를 검토해 주세요.'

  return (
    <fieldset className={styles.imagePanel}>
      <legend className={styles.imagePanelLegend}>선택한 이미지 설정</legend>
      <div className={styles.imageField}>
        <label className={styles.imageLabel} htmlFor={altInputId}>
          대체 텍스트
        </label>
        <input
          aria-describedby={`${altInputId}-description`}
          className={styles.imageInput}
          disabled={metadataDisabled || selectedImage.decorative}
          id={altInputId}
          onBlur={() => {
            if (selectedImage.alt.trim()) {
              updateImageAtPosition(editor, selectedImage.position, { altReviewed: true })
            }
          }}
          onChange={(event) => {
            const alt = event.currentTarget.value
            updateImageAtPosition(editor, selectedImage.position, {
              alt,
              altReviewed: alt.trim().length > 0,
              decorative: false,
            })
          }}
          value={selectedImage.alt}
        />
        <p className={styles.imageDescription} id={`${altInputId}-description`}>
          {reviewCopy}
        </p>
      </div>
      <label className={styles.decorativeOption} htmlFor={decorativeInputId}>
        <input
          checked={selectedImage.decorative}
          disabled={metadataDisabled}
          id={decorativeInputId}
          onChange={(event) => {
            const decorative = event.currentTarget.checked
            updateImageAtPosition(editor, selectedImage.position, {
              alt: decorative ? '' : selectedImage.alt,
              altReviewed: decorative,
              decorative,
            })
          }}
          type="checkbox"
        />
        <span>장식용 이미지</span>
      </label>
    </fieldset>
  )
}
