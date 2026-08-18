import type { ManagedContentValue, TiptapNode } from '@repo/content/types'

export type ManagedContentPublishIssue =
  | 'pending_upload'
  | 'alt_review_required'
  | 'nondecorative_alt_required'
  | 'decorative_alt_must_be_empty'
  | 'invalid_image_url'

export type ManagedContentPublishValidationContext = {
  readonly pendingAssetCount: number
  readonly isOwnedUrl: (url: string) => boolean
}

function nonNegativeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

function imageIssue(node: TiptapNode, context: ManagedContentPublishValidationContext): ManagedContentPublishIssue | null {
  if (node.type !== 'image') return null
  const attrs = node.attrs ?? {}
  const src = attrs.src
  // Persisted documents may only contain the extension's null/default value.
  // Treat 0, false, empty strings, and arbitrary objects as transient rather
  // than allowing a malformed upload identity through publication.
  if (attrs.uploadId !== undefined && attrs.uploadId !== null) return 'pending_upload'
  if (typeof src !== 'string' || src.length === 0) return 'invalid_image_url'
  if (typeof attrs.alt !== 'string' || typeof attrs.decorative !== 'boolean') {
    return 'invalid_image_url'
  }
  if (attrs.altReviewed !== true) return 'alt_review_required'
  if (attrs.decorative && attrs.alt.length > 0) return 'decorative_alt_must_be_empty'
  if (!attrs.decorative && attrs.alt.trim().length === 0) return 'nondecorative_alt_required'
  return context.isOwnedUrl(src) ? null : 'invalid_image_url'
}

function firstImageIssue(node: TiptapNode, context: ManagedContentPublishValidationContext): ManagedContentPublishIssue | null {
  const ownIssue = imageIssue(node, context)
  if (ownIssue) return ownIssue
  for (const child of node.content ?? []) {
    const childIssue = firstImageIssue(child, context)
    if (childIssue) return childIssue
  }
  return null
}

/**
 * Publish-only validation. It walks all nested Tiptap children in document
 * order, so an image in a blockquote/list/table-like extension cannot evade
 * accessibility or exact record-scope ownership checks.
 */
export function validateManagedContentForPublish(
  value: ManagedContentValue,
  context: ManagedContentPublishValidationContext,
): ManagedContentPublishIssue | null {
  if (nonNegativeCount(context.pendingAssetCount) > 0) return 'pending_upload'
  if (value.contentAuthoringMode !== 'wysiwyg' || !value.contentJson) return null
  return firstImageIssue(value.contentJson, context)
}
