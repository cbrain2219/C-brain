"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./page.module.css";

const MIN_FRAME_HEIGHT = 320;
const MAX_FRAME_HEIGHT = 100_000;
const RESIZE_MESSAGE_TYPE = "cbrain:blog-html-resize";

function createFramedHtml(html: string, token: string) {
  const document = new DOMParser().parseFromString(html, "text/html");

  document.querySelectorAll("script").forEach((script) => script.remove());

  const policy = document.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content = [
    "default-src http: https: data: blob:",
    "script-src 'nonce-" + token + "'",
    "style-src 'unsafe-inline' http: https:",
    "img-src http: https: data: blob:",
    "font-src http: https: data:",
    "media-src http: https: data: blob:",
    "connect-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "form-action 'none'",
  ].join("; ");
  document.head.prepend(policy);

  const resizeScript = `<script nonce=${JSON.stringify(token)}>(() => {
    const sendHeight = () => {
      const body = document.body;
      const root = document.documentElement;
      const height = Math.max(
        body?.offsetHeight ?? 0,
        body?.scrollHeight ?? 0,
        root.offsetHeight,
        root.scrollHeight,
      );

      window.parent.postMessage(
        { type: ${JSON.stringify(RESIZE_MESSAGE_TYPE)}, token: ${JSON.stringify(token)}, height },
        "*",
      );
    };

    window.addEventListener("load", sendHeight);
    document.fonts?.ready.then(sendHeight);
    requestAnimationFrame(sendHeight);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(sendHeight);
      observer.observe(document.documentElement);
      if (document.body) observer.observe(document.body);
    }
  })();</script>`;

  const serializedDocument = document.documentElement.outerHTML;

  return `<!DOCTYPE html>\n${serializedDocument.replace(
    /<\/body>/i,
    `${resizeScript}</body>`,
  )}`;
}

type BlogHtmlDocumentFrameProps = {
  html: string;
  title: string;
};

export function BlogHtmlDocumentFrame({
  html,
  title,
}: BlogHtmlDocumentFrameProps) {
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
      const data = event.data;

      if (
        !frame ||
        event.source !== frame.contentWindow ||
        !data ||
        typeof data !== "object" ||
        !("type" in data) ||
        data.type !== RESIZE_MESSAGE_TYPE ||
        !("token" in data) ||
        data.token !== tokenRef.current ||
        !("height" in data) ||
        typeof data.height !== "number" ||
        !Number.isFinite(data.height)
      ) {
        return;
      }

      const height = Math.min(
        MAX_FRAME_HEIGHT,
        Math.max(MIN_FRAME_HEIGHT, Math.ceil(data.height)),
      );
      frame.style.height = `${height}px`;
    }

    window.addEventListener("message", handleMessage);

    const nextToken = window.crypto.randomUUID();
    tokenRef.current = nextToken;
    setToken(nextToken);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className={styles.blogHtmlDocumentBoundary}>
      <iframe
        className={styles.blogHtmlDocumentFrame}
        ref={frameRef}
        sandbox="allow-scripts"
        srcDoc={framedHtml}
        title={`${title} 원문`}
      />
    </div>
  );
}
