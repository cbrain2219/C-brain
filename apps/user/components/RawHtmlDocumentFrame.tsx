"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./RawHtmlDocumentFrame.module.css";
import {
  createFramedHtml,
  getTrustedFrameResizeHeight,
} from "./rawHtmlFrameHelpers";

type RawHtmlDocumentFrameProps = {
  html: string;
  title: string;
};

export function RawHtmlDocumentFrame({
  html,
  title,
}: RawHtmlDocumentFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const tokenRef = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const framedHtml = useMemo(
    () => (token ? createFramedHtml(html, token) : undefined),
    [html, token],
  );

  useEffect(() => {
    function handleMessage(event: MessageEvent<unknown>) {
      const frame = frameRef.current;
      if (!frame) return;
      const height = getTrustedFrameResizeHeight({
        data: event.data,
        expectedSource: frame.contentWindow,
        expectedToken: tokenRef.current,
        source: event.source,
      });
      if (height === null) return;
      frame.style.height = `${height}px`;
    }

    window.addEventListener("message", handleMessage);

    const nextToken = window.crypto.randomUUID();
    tokenRef.current = nextToken;
    setToken(nextToken);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className={styles.boundary}>
      <iframe
        className={styles.frame}
        ref={frameRef}
        sandbox="allow-scripts"
        scrolling="no"
        srcDoc={framedHtml}
        title={`${title} 원문`}
      />
    </div>
  );
}
