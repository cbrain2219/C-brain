"use client";

import { useEffect } from "react";

import type { ContentViewType } from "../../lib/contentViews";

type ContentViewTrackerProps = {
  contentId: string;
  contentType: ContentViewType;
};

const trackedContentViews = new Set<string>();

function removeSessionView(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // View tracking is best-effort when browser storage is unavailable.
  }
}

export function ContentViewTracker({
  contentId,
  contentType,
}: ContentViewTrackerProps) {
  useEffect(() => {
    const key = `cbrain:content-view:v1:${contentType}:${contentId}`;

    if (trackedContentViews.has(key)) return;

    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "pending");
    } catch {
      // The in-memory guard still prevents duplicate effects in this tab.
    }

    trackedContentViews.add(key);

    void fetch("/api/views", {
      body: JSON.stringify({ contentId, contentType }),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to record content view.");

        try {
          window.sessionStorage.setItem(key, "counted");
        } catch {
          // The successful in-memory guard remains active for this tab.
        }
      })
      .catch(() => {
        trackedContentViews.delete(key);
        removeSessionView(key);
      });
  }, [contentId, contentType]);

  return null;
}
