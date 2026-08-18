import { Extension, mergeAttributes, type Editor } from '@tiptap/core'
import FileHandler from '@tiptap/extension-file-handler'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'

export const managedImageMimeTypes = ['image/png', 'image/jpeg', 'image/webp'] as const

const managedImageMimeTypeSet = new Set<string>(managedImageMimeTypes)
const allowedEditorLinkProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const bareHostnamePattern =
  /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#].*)?$/i
const hiddenUriCodePoints = new Set([0x200b, 0x200c, 0x200d, 0x2060, 0xfeff])
const maxEncodedUriDecodeDepth = 4
const percentEscapePattern = /%[\da-f]{2}/i
const malformedPercentPattern = /%(?![\da-f]{2})/i
const canonicalUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const allowedNodeTypes = new Set([
  'doc',
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'horizontalRule',
  'image',
  'text',
  'hardBreak',
])
const allowedMarkTypes = new Set(['bold', 'italic', 'underline', 'strike', 'link'])
const allowedAttributes = new Map<string, ReadonlySet<string>>([
  ['doc', new Set()],
  ['paragraph', new Set(['textAlign'])],
  ['heading', new Set(['level', 'textAlign'])],
  ['bulletList', new Set()],
  ['orderedList', new Set(['start', 'type'])],
  ['listItem', new Set()],
  ['blockquote', new Set()],
  ['horizontalRule', new Set()],
  ['image', new Set(['src', 'alt', 'title', 'width', 'height', 'altReviewed', 'decorative', 'uploadId'])],
  ['text', new Set()],
  ['hardBreak', new Set()],
])
const allowedLinkAttributes = new Set(['href', 'target', 'rel', 'class', 'title'])

function hasUnsafeUriCharacters(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0)
    if (
      /\s/u.test(character) ||
      codePoint === undefined ||
      codePoint <= 0x1f ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      hiddenUriCodePoints.has(codePoint)
    ) {
      return true
    }
  }

  return false
}

function hasEncodedUnsafeUriCharacters(value: string): boolean {
  let decoded = value

  for (let depth = 0; depth < maxEncodedUriDecodeDepth && decoded.includes('%'); depth += 1) {
    if (!percentEscapePattern.test(decoded)) return depth === 0
    if (malformedPercentPattern.test(decoded)) return true

    try {
      const next = decodeURIComponent(decoded)
      if (hasUnsafeUriCharacters(next)) return true
      if (next === decoded) return false
      decoded = next
    } catch {
      return true
    }
  }

  return percentEscapePattern.test(decoded)
}

function parseEditorLinkHref(href: string, allowBareHostname: boolean): string | null {
  if (
    href.length === 0 ||
    href.includes('\\') ||
    hasUnsafeUriCharacters(href) ||
    hasEncodedUnsafeUriCharacters(href)
  ) {
    return null
  }

  const candidate = bareHostnamePattern.test(href)
    ? allowBareHostname
      ? `https://${href}`
      : null
    : href
  if (candidate === null) return null

  const lowerCandidate = candidate.toLowerCase()
  if (
    !lowerCandidate.startsWith('http://') &&
    !lowerCandidate.startsWith('https://') &&
    !lowerCandidate.startsWith('mailto:') &&
    !lowerCandidate.startsWith('tel:')
  ) {
    return null
  }

  try {
    const url = new URL(candidate)
    if (!allowedEditorLinkProtocols.has(url.protocol.toLowerCase())) return null

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.hostname.length > 0 ? url.toString() : null
    }

    if (lowerCandidate.startsWith(`${url.protocol}//`) || url.pathname.length === 0) return null
    return url.toString()
  } catch {
    return null
  }
}

export type EditorImageInsertionPosition =
  | number
  | {
      readonly from: number
      readonly to: number
    }

/** Storage/lifecycle ownership stays with Task 4; this core only reports accepted files. */
export type HandleEditorImageFiles = (
  editor: Editor,
  files: readonly File[],
  position: EditorImageInsertionPosition,
) => void

export function isAllowedEditorLinkHref(href: unknown): href is string {
  return typeof href === 'string' && parseEditorLinkHref(href, false) !== null
}

export function normalizeEditorLinkHref(input: string | null): string | null {
  return input === null ? null : parseEditorLinkHref(input, true)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnlyAllowedKeys(value: Readonly<Record<string, unknown>>, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key))
}

function isValidTextAlign(value: unknown): boolean {
  return value === undefined || value === null || value === 'left' || value === 'center' || value === 'right'
}

function isCanonicalUploadId(value: unknown): value is string {
  return typeof value === 'string' && canonicalUuidPattern.test(value)
}

/**
 * Accepts only a persisted owned image or a lifecycle-owned transient image.
 * A transient upload can retain its UUID while its source moves from blob to
 * the final owned URL, but canonical emission rejects every transient node.
 */
export function isAllowedManagedEditorImageAttributes(
  attrs: unknown,
  isAllowedImageUrl: (url: string) => boolean,
): boolean {
  if (!isRecord(attrs) || !hasOnlyAllowedKeys(attrs, allowedAttributes.get('image')!)) return false
  const src = attrs.src
  if (typeof src !== 'string') return false
  if (attrs.alt !== undefined && attrs.alt !== null && typeof attrs.alt !== 'string') return false
  if (attrs.title !== undefined && attrs.title !== null && typeof attrs.title !== 'string') return false
  if (attrs.width !== undefined && attrs.width !== null && (typeof attrs.width !== 'number' || !Number.isFinite(attrs.width) || attrs.width < 0)) return false
  if (attrs.height !== undefined && attrs.height !== null && (typeof attrs.height !== 'number' || !Number.isFinite(attrs.height) || attrs.height < 0)) return false
  if (attrs.altReviewed !== undefined && typeof attrs.altReviewed !== 'boolean') return false
  if (attrs.decorative !== undefined && typeof attrs.decorative !== 'boolean') return false

  const uploadId = attrs.uploadId
  if (uploadId === undefined || uploadId === null) {
    try {
      return isAllowedImageUrl(src)
    } catch {
      return false
    }
  }

  if (!isCanonicalUploadId(uploadId)) return false
  if (src.startsWith('blob:')) return true
  try {
    return isAllowedImageUrl(src)
  } catch {
    return false
  }
}

function isAllowedMark(mark: unknown): boolean {
  if (!isRecord(mark) || typeof mark.type !== 'string' || !allowedMarkTypes.has(mark.type)) return false
  const attrs = mark.attrs
  if (mark.type !== 'link') return attrs === undefined || (isRecord(attrs) && Object.keys(attrs).length === 0)
  if (!isRecord(attrs) || !hasOnlyAllowedKeys(attrs, allowedLinkAttributes)) return false
  if (!isAllowedEditorLinkHref(attrs.href)) return false
  return ['target', 'rel', 'class', 'title'].every((key) => {
    const value = attrs[key]
    return value === undefined || value === null || typeof value === 'string'
  })
}

function isAllowedEditorNode(
  node: unknown,
  isAllowedImageUrl: (url: string) => boolean,
): boolean {
  if (!isRecord(node) || typeof node.type !== 'string' || !allowedNodeTypes.has(node.type)) return false
  const attrs = node.attrs === undefined ? {} : node.attrs
  const allowed = allowedAttributes.get(node.type)
  if (!allowed || !isRecord(attrs) || !hasOnlyAllowedKeys(attrs, allowed)) return false
  if (node.type === 'heading' && attrs.level !== 2 && attrs.level !== 3 && attrs.level !== 4) return false
  if ((node.type === 'heading' || node.type === 'paragraph') && !isValidTextAlign(attrs.textAlign)) return false
  if (node.type === 'orderedList' && attrs.start !== undefined && (!Number.isInteger(attrs.start) || Number(attrs.start) < 1)) return false
  if (node.type === 'orderedList' && attrs.type !== undefined && attrs.type !== null && typeof attrs.type !== 'string') return false
  if (node.type === 'text' && typeof node.text !== 'string') return false
  if (node.type !== 'text' && node.text !== undefined) return false
  if (node.type === 'image' && !isAllowedManagedEditorImageAttributes(attrs, isAllowedImageUrl)) return false
  if (node.marks !== undefined && (!Array.isArray(node.marks) || !node.marks.every(isAllowedMark))) return false
  if (node.content !== undefined && (!Array.isArray(node.content) || !node.content.every((child) => isAllowedEditorNode(child, isAllowedImageUrl)))) return false
  return true
}

/** Fail closed for pasted, input-rule, and programmatic document transactions. */
export function isAllowedEditorDocument(
  document: unknown,
  isAllowedImageUrl: (url: string) => boolean,
): boolean {
  return isAllowedEditorNode(document, isAllowedImageUrl)
}

export const ManagedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      altReviewed: { default: false, rendered: false },
      decorative: { default: false, rendered: false },
      uploadId: { default: null, rendered: false },
    }
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        alt: node.attrs.decorative ? '' : (node.attrs.alt ?? ''),
      }),
    ]
  },
})

export function isManagedEditorImageFile(file: File): boolean {
  return managedImageMimeTypeSet.has(file.type)
}

function acceptedImageFiles(files: FileList | readonly File[]): File[] {
  return Array.from(files).filter(isManagedEditorImageFile)
}

function createManagedImagePasteExtension(
  onImageFiles: HandleEditorImageFiles,
  isAllowedImageUrl: (url: string) => boolean,
) {
  return Extension.create({
    name: 'managedImagePaste',
    priority: 1_000,

    addProseMirrorPlugins() {
      const editor = this.editor

      return [
        new Plugin({
          key: new PluginKey('managedImagePaste'),
          filterTransaction: (transaction) =>
            !transaction.docChanged || isAllowedEditorDocument(transaction.doc.toJSON(), isAllowedImageUrl),
          props: {
            handlePaste: (_view, event) => {
              const files = acceptedImageFiles(event.clipboardData?.files ?? [])
              if (files.length === 0) return false

              const { from, to } = editor.state.selection
              event.preventDefault()
              event.stopPropagation()
              onImageFiles(editor, files, { from, to })
              return true
            },
          },
        }),
      ]
    },
  })
}

export function createContentEditorExtensions(
  onImageFiles: HandleEditorImageFiles,
  isAllowedImageUrl: (url: string) => boolean = () => false,
) {
  return [
    StarterKit.configure({
      code: false,
      codeBlock: false,
      heading: { levels: [2, 3, 4] },
      link: {
        defaultProtocol: 'https',
        isAllowedUri: (href) => isAllowedEditorLinkHref(href),
        openOnClick: false,
        protocols: ['http', 'https', 'mailto', 'tel'],
      },
    }),
    ManagedImage.configure({ allowBase64: false, inline: false }),
    Placeholder.configure({ placeholder: '본문을 작성해 주세요.' }),
    TextAlign.configure({
      alignments: ['left', 'center', 'right'],
      types: ['heading', 'paragraph'],
    }),
    createManagedImagePasteExtension(onImageFiles, isAllowedImageUrl),
    FileHandler.configure({
      allowedMimeTypes: [...managedImageMimeTypes],
      onDrop: (editor, files, position) => onImageFiles(editor, files, position),
    }),
  ]
}
