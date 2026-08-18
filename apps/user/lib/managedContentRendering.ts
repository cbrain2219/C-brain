import { createContentAssetBaseUrl } from "@repo/content/asset-url";
import type {
  ContentAuthoringMode,
  ContentEntity,
  ContentMode,
} from "@repo/content/types";

export type PublicManagedContent = {
  readonly content: string;
  readonly contentAssetScope: string;
  readonly contentAuthoringMode: ContentAuthoringMode;
  readonly contentMode: ContentMode;
  readonly entity: ContentEntity;
  readonly title: string;
};

export type ManagedContentRenderDecision =
  | { readonly kind: "legacy" }
  | { readonly allowedImageBaseUrl: string; readonly kind: "wysiwyg" };

export function getManagedContentAssetBaseUrl(
  value: Pick<PublicManagedContent, "contentAssetScope" | "entity">,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
) {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for managed content.");
  }

  return createContentAssetBaseUrl({
    assetScope: value.contentAssetScope,
    entity: value.entity,
    supabaseUrl,
  });
}

/** Decides whether a public record may enter the generated-HTML boundary. */
export function getManagedContentRenderDecision(
  value: PublicManagedContent | undefined,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): ManagedContentRenderDecision {
  if (
    !value ||
    value.contentMode === "markdown" ||
    value.contentAuthoringMode === "raw_html"
  ) {
    return { kind: "legacy" };
  }

  try {
    return {
      allowedImageBaseUrl: getManagedContentAssetBaseUrl(value, supabaseUrl),
      kind: "wysiwyg",
    };
  } catch {
    // Historic malformed scopes must not widen image access or break the page.
    return { kind: "legacy" };
  }
}
