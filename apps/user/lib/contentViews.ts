export const contentViewTypes = ["blog", "portfolio", "interview"] as const;

export type ContentViewType = (typeof contentViewTypes)[number];

export type ContentViewRequest = {
  contentId: string;
  contentType: ContentViewType;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseContentViewRequest(
  value: unknown,
): ContentViewRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const { contentId, contentType } = value as Record<string, unknown>;

  if (
    typeof contentId !== "string" ||
    !uuidPattern.test(contentId) ||
    typeof contentType !== "string" ||
    !contentViewTypes.some((type) => type === contentType)
  ) {
    return null;
  }

  return { contentId, contentType: contentType as ContentViewType };
}
