import type { ReactNode } from "react";

import {
  getManagedContentRenderDecision,
  type PublicManagedContent,
} from "../lib/managedContentRendering";
import { sanitizeRichContent } from "../lib/sanitizeRichContent";

export type { PublicManagedContent } from "../lib/managedContentRendering";
export { getManagedContentAssetBaseUrl } from "../lib/managedContentRendering";

type ManagedContentProps = {
  legacyFallback: ReactNode;
  value: PublicManagedContent | undefined;
};

/** Renders generated editor content only after server-side allowlist sanitization. */
export function ManagedContent({
  legacyFallback,
  value,
}: ManagedContentProps) {
  const decision = getManagedContentRenderDecision(value);
  if (!value || decision.kind === "legacy") {
    return legacyFallback;
  }

  return (
    <div
      className="rich-content"
      dangerouslySetInnerHTML={{
        __html: sanitizeRichContent(value.content, {
          allowedImageBaseUrl: decision.allowedImageBaseUrl,
        }),
      }}
    />
  );
}
