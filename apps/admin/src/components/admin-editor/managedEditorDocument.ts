import type { TiptapDocument, TiptapNode } from '@repo/content/types'
import type { Editor } from '@tiptap/core'
import { managedContentDocumentIsEmpty } from '../../lib/managedContent'
import {
  isAllowedEditorDocument,
  isAllowedEditorLinkHref,
} from './contentEditorExtensions'

export type AdminRichTextCanonicalValue = {
  readonly document: TiptapDocument
  readonly html: string
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOwn(value: Readonly<Record<string, unknown>>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function assertSemanticallyValidNode(
  node: TiptapNode,
  isAllowedImageUrl: (url: string) => boolean,
): void {
  const attrs = isRecord(node.attrs) ? node.attrs : {}

  if (node.type === 'heading' && attrs.level !== 2 && attrs.level !== 3 && attrs.level !== 4) {
    throw new Error('Stored editor content contains an unsupported heading.')
  }

  if (
    (node.type === 'heading' || node.type === 'paragraph') &&
    hasOwn(attrs, 'textAlign') &&
    attrs.textAlign !== null &&
    attrs.textAlign !== 'left' &&
    attrs.textAlign !== 'center' &&
    attrs.textAlign !== 'right'
  ) {
    throw new Error('Stored editor content contains invalid text alignment.')
  }

  if (node.type === 'image') {
    if (typeof attrs.src !== 'string' || !isAllowedImageUrl(attrs.src)) {
      throw new Error('Stored editor content contains an invalid image URL.')
    }
    if (hasOwn(attrs, 'alt') && attrs.alt !== null && typeof attrs.alt !== 'string') {
      throw new Error('Stored editor content contains invalid image text.')
    }
    if (
      (hasOwn(attrs, 'altReviewed') && typeof attrs.altReviewed !== 'boolean') ||
      (hasOwn(attrs, 'decorative') && typeof attrs.decorative !== 'boolean') ||
      (hasOwn(attrs, 'uploadId') && attrs.uploadId !== null)
    ) {
      throw new Error('Stored editor content contains transient image state.')
    }
  }

  if (Array.isArray(node.marks)) {
    for (const mark of node.marks) {
      if (!isRecord(mark) || mark.type !== 'link') continue
      const markAttrs = isRecord(mark.attrs) ? mark.attrs : {}
      if (!isAllowedEditorLinkHref(markAttrs.href)) {
        throw new Error('Stored editor content contains an unsafe link.')
      }
    }
  }

  for (const child of node.content ?? []) assertSemanticallyValidNode(child, isAllowedImageUrl)
}

export function assertSemanticallyValidInitialDocument(
  document: TiptapDocument,
  isAllowedImageUrl: (url: string) => boolean,
): void {
  if (document.type !== 'doc') throw new Error('Stored editor content must have a doc root.')
  if (!isAllowedEditorDocument(document, isAllowedImageUrl)) {
    throw new Error('Stored editor content contains unsupported nodes, marks, or attributes.')
  }
  assertSemanticallyValidNode(document, isAllowedImageUrl)
}

export function canonicalValue(
  editor: Editor,
  isAllowedImageUrl: (url: string) => boolean = () => true,
): AdminRichTextCanonicalValue {
  const document = editor.getJSON() as TiptapDocument
  const value = {
    document,
    html: managedContentDocumentIsEmpty(document) ? '' : editor.getHTML(),
  }
  if (!isAllowedEditorDocument(value.document, isAllowedImageUrl)) {
    throw new Error('Editor produced a document outside the supported allowlist.')
  }
  if (hasTransientImageState(editor)) {
    throw new Error('Editor produced a document with transient image state.')
  }
  return value
}

export function canonicalFingerprint(value: AdminRichTextCanonicalValue): string {
  return `${JSON.stringify(value.document)}\u0000${value.html}`
}

export function hasTransientImageState(editor: Editor): boolean {
  let transient = false
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image' && (node.attrs.uploadId != null || String(node.attrs.src).startsWith('blob:'))) {
      transient = true
      return false
    }
    return !transient
  })
  return transient
}
