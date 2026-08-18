import {
  SUPPORTED_CONTENT_SCHEMA_VERSION,
  type ContentAuthoringMode,
  type ContentMode,
  type ManagedContentValue,
  type TiptapDocument,
  type TiptapNode,
} from '@repo/content/types'
import { parseContentAssetScope } from '@repo/content/asset-url'

export type ManagedContentMutation = {
  readonly content: string
  readonly content_asset_scope: string
  readonly content_authoring_mode: ContentAuthoringMode
  readonly content_json: TiptapDocument | null
  readonly content_mode: ContentMode
  readonly content_schema_version: typeof SUPPORTED_CONTENT_SCHEMA_VERSION
  readonly content_source_backup: string | null
}

export type ManagedContentRow = {
  readonly content: unknown
  readonly content_asset_scope: unknown
  readonly content_authoring_mode: unknown
  readonly content_json: unknown
  readonly content_mode: unknown
  readonly content_schema_version: unknown
  readonly content_source_backup: unknown
}

export type ManagedContentFormValue = ManagedContentValue

function deepFreeze<Value>(value: Value): Value {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }

  return value
}

export const EMPTY_TIPTAP_DOCUMENT = deepFreeze({
  content: [{ type: 'paragraph' }],
  type: 'doc',
}) as TiptapDocument

export const managedContentSchemaErrorMessage =
  '이 글은 현재 에디터보다 새로운 형식이어서 수정할 수 없습니다.'

export class ManagedContentSchemaError extends Error {
  override readonly name = 'ManagedContentSchemaError'

  constructor() {
    super(managedContentSchemaErrorMessage)
  }
}

function isContentAuthoringMode(value: unknown): value is ContentAuthoringMode {
  return value === 'raw_html' || value === 'wysiwyg'
}

function isContentMode(value: unknown): value is ContentMode {
  return value === 'html' || value === 'markdown'
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isTiptapNode(value: unknown): value is TiptapNode {
  if (!isPlainObject(value) || typeof value.type !== 'string') return false

  if ('content' in value && (!Array.isArray(value.content) || !value.content.every(isTiptapNode))) {
    return false
  }

  if ('text' in value && typeof value.text !== 'string') return false
  if ('attrs' in value && !isPlainObject(value.attrs)) return false
  if ('marks' in value && (!Array.isArray(value.marks) || !value.marks.every(isPlainObject))) {
    return false
  }

  return true
}

function isTiptapDocument(value: unknown): value is TiptapDocument {
  return isTiptapNode(value) && value.type === 'doc'
}

function canonicalContentAssetScope(value: unknown): string | null {
  try {
    return parseContentAssetScope(value)
  } catch {
    return null
  }
}

type SupportedManagedContentRow = ManagedContentRow & {
  readonly content: string
  readonly content_authoring_mode: ContentAuthoringMode
  readonly content_json: TiptapDocument | null
  readonly content_mode: ContentMode
  readonly content_source_backup: string | null
}

function hasSupportedShape(value: ManagedContentRow): value is SupportedManagedContentRow {
  if (
    typeof value.content !== 'string' ||
    value.content_schema_version !== SUPPORTED_CONTENT_SCHEMA_VERSION ||
    !isContentAuthoringMode(value.content_authoring_mode) ||
    !isContentMode(value.content_mode) ||
    (value.content_source_backup !== null && typeof value.content_source_backup !== 'string')
  ) {
    return false
  }

  if (value.content_json !== null && !isTiptapDocument(value.content_json)) return false

  return value.content_authoring_mode !== 'wysiwyg' ||
    (value.content_mode === 'html' && value.content_json !== null)
}

export function managedContentFormFromRow(row: ManagedContentRow): ManagedContentFormValue {
  const contentAssetScope = canonicalContentAssetScope(row.content_asset_scope)

  if (!contentAssetScope || !hasSupportedShape(row)) throw new ManagedContentSchemaError()

  return {
    content: row.content,
    contentAssetScope,
    contentAuthoringMode: row.content_authoring_mode,
    contentJson: row.content_json,
    contentMode: row.content_mode,
    contentSchemaVersion: SUPPORTED_CONTENT_SCHEMA_VERSION,
    contentSourceBackup: row.content_source_backup,
  }
}

export function createInitialManagedContentValue(): ManagedContentFormValue {
  return {
    content: '',
    contentAssetScope: crypto.randomUUID().toLowerCase(),
    contentAuthoringMode: 'wysiwyg',
    contentJson: EMPTY_TIPTAP_DOCUMENT,
    contentMode: 'html',
    contentSchemaVersion: SUPPORTED_CONTENT_SCHEMA_VERSION,
    contentSourceBackup: null,
  }
}

export function managedContentInputFromForm(
  form: ManagedContentFormValue,
): ManagedContentMutation | null {
  const contentAssetScope = canonicalContentAssetScope(form.contentAssetScope)

  if (
    !contentAssetScope ||
    typeof form.content !== 'string' ||
    form.contentSchemaVersion !== SUPPORTED_CONTENT_SCHEMA_VERSION ||
    !isContentAuthoringMode(form.contentAuthoringMode) ||
    !isContentMode(form.contentMode) ||
    (form.contentSourceBackup !== null && typeof form.contentSourceBackup !== 'string') ||
    (form.contentJson !== null && !isTiptapDocument(form.contentJson))
  ) {
    return null
  }

  if (
    form.contentAuthoringMode === 'wysiwyg' &&
    (form.contentMode !== 'html' || form.contentJson === null)
  ) {
    return null
  }

  return {
    content: form.content,
    content_asset_scope: contentAssetScope,
    content_authoring_mode: form.contentAuthoringMode,
    content_json: form.contentJson,
    content_mode: form.contentMode,
    content_schema_version: SUPPORTED_CONTENT_SCHEMA_VERSION,
    content_source_backup: form.contentSourceBackup,
  }
}

function documentHasVisibleContent(node: TiptapNode): boolean {
  if (node.type === 'image' || node.type === 'horizontalRule') return true
  if (typeof node.text === 'string' && node.text.trim().length > 0) return true
  return node.content?.some(documentHasVisibleContent) ?? false
}

export function managedContentIsEmpty(
  form: Pick<ManagedContentFormValue, 'content' | 'contentAuthoringMode' | 'contentJson' | 'contentMode'>,
): boolean {
  if (form.contentAuthoringMode === 'raw_html' || form.contentMode === 'markdown') {
    return form.content.trim().length === 0
  }

  return !form.contentJson ||
    !isTiptapDocument(form.contentJson) ||
    !documentHasVisibleContent(form.contentJson)
}

export function switchRawToWysiwyg(
  value: ManagedContentFormValue,
  strategy: 'restore_previous' | 'new_from_current_backup',
): ManagedContentFormValue {
  const rawSource = value.content

  return {
    ...value,
    content: '',
    contentAuthoringMode: 'wysiwyg',
    contentJson:
      strategy === 'restore_previous'
        ? (value.contentJson ?? EMPTY_TIPTAP_DOCUMENT)
        : EMPTY_TIPTAP_DOCUMENT,
    contentMode: 'html',
    contentSourceBackup: rawSource,
  }
}

export function switchWysiwygToRaw(
  value: ManagedContentFormValue,
  strategy: 'backup' | 'generated',
): ManagedContentFormValue {
  return {
    ...value,
    content: strategy === 'backup' ? (value.contentSourceBackup ?? value.content) : value.content,
    contentAuthoringMode: 'raw_html',
    contentMode: 'html',
  }
}

export function escapeLegacyText(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&#39;'
      default:
        return character
    }
  })
}

export function legacyTextToRawHtml(value: string): string {
  return `<p>${escapeLegacyText(value).replace(/\r\n|\r|\n/gu, '<br>')}</p>`
}

export function legacyTextToTiptapDocument(value: string): TiptapDocument {
  const content: TiptapNode[] = []

  for (const part of value.split(/(\r\n|\r|\n)/gu)) {
    if (part === '\r\n' || part === '\r' || part === '\n') {
      content.push({ type: 'hardBreak' })
    } else if (part) {
      content.push({ text: part, type: 'text' })
    }
  }

  return {
    content: [content.length > 0 ? { content, type: 'paragraph' } : { type: 'paragraph' }],
    type: 'doc',
  }
}

export function convertLegacyTextToRaw(
  value: ManagedContentFormValue,
): ManagedContentFormValue {
  const escapedSource = legacyTextToRawHtml(value.content)

  return {
    ...value,
    content: escapedSource,
    contentAuthoringMode: 'raw_html',
    contentMode: 'html',
    contentSourceBackup: value.contentSourceBackup ?? escapedSource,
  }
}

export function convertLegacyTextToWysiwyg(
  value: ManagedContentFormValue,
): ManagedContentFormValue {
  const escapedSource = legacyTextToRawHtml(value.content)

  return {
    ...value,
    content: '',
    contentAuthoringMode: 'wysiwyg',
    contentJson: legacyTextToTiptapDocument(value.content),
    contentMode: 'html',
    contentSourceBackup: value.contentSourceBackup ?? escapedSource,
  }
}
