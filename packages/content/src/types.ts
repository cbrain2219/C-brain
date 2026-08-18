export const contentAuthoringModes = ['raw_html', 'wysiwyg'] as const
export type ContentAuthoringMode = (typeof contentAuthoringModes)[number]

export const contentModes = ['html', 'markdown'] as const
export type ContentMode = (typeof contentModes)[number]

export type ContentEntity = 'blog' | 'notice' | 'portfolio' | 'review'

export const SUPPORTED_CONTENT_SCHEMA_VERSION = 1 as const

export type TiptapNode = {
  readonly attrs?: Readonly<Record<string, unknown>>
  readonly content?: readonly TiptapNode[]
  readonly marks?: readonly Readonly<Record<string, unknown>>[]
  readonly text?: string
  readonly type: string
}

export type TiptapDocument = TiptapNode & {
  readonly type: 'doc'
}

export type ManagedContentValue = {
  readonly content: string
  readonly contentAssetScope: string
  readonly contentAuthoringMode: ContentAuthoringMode
  readonly contentJson: TiptapDocument | null
  readonly contentMode: ContentMode
  readonly contentSchemaVersion: typeof SUPPORTED_CONTENT_SCHEMA_VERSION
  readonly contentSourceBackup: string | null
}
