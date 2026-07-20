export const contentTypeFilterOptions = ['임시저장', '게시됨'] as const

export function getUserTagOptions(tags: readonly string[], additionalOptions: readonly string[] = []) {
  return [...new Set([...tags, ...additionalOptions].map((tag) => tag.trim()).filter((tag) => tag.length > 0))]
}
