"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./page.module.css";

type MoreBlogPreviewTextProps = {
  mobileMaxLines?: number;
  text: string;
};

function createPreviewText(text: string, endIndex: number) {
  const candidate = text.slice(0, endIndex).trimEnd();
  const previewText = `${candidate}...`;

  return { candidate, previewText };
}

export function MoreBlogPreviewText({
  mobileMaxLines,
  text,
}: MoreBlogPreviewTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [displayText, setDisplayText] = useState(text);
  const [lineCount, setLineCount] = useState(1);

  const getCurrentMaxLines = useCallback(() => {
    if (!mobileMaxLines) return 1;

    return window.matchMedia("(max-width: 480px)").matches ? mobileMaxLines : 1;
  }, [mobileMaxLines]);

  const fitsWithinMaxLines = useCallback(
    (element: HTMLSpanElement, maxLines: number) => {
      if (maxLines <= 1) return element.scrollWidth <= element.clientWidth;

      const computedStyle = window.getComputedStyle(element);
      const lineHeight =
        Number.parseFloat(computedStyle.lineHeight) ||
        Number.parseFloat(computedStyle.fontSize) * 1.5;
      const maxHeight = lineHeight * maxLines;

      return element.scrollHeight <= maxHeight + 1;
    },
    [],
  );

  const updateDisplayText = useCallback(() => {
    const element = textRef.current;
    if (!element) return;

    const maxLines = getCurrentMaxLines();
    setLineCount(maxLines);
    element.dataset.lines = String(maxLines);

    const { clientWidth } = element;
    if (clientWidth <= 0) {
      setDisplayText(text);
      return;
    }

    element.textContent = text;
    if (fitsWithinMaxLines(element, maxLines)) {
      setDisplayText(text);
      return;
    }

    let low = 0;
    let high = text.length;

    while (low < high) {
      const midpoint = Math.ceil((low + high) / 2);
      const { candidate, previewText } = createPreviewText(text, midpoint);

      element.textContent = previewText;

      if (
        candidate.length > 0 &&
        fitsWithinMaxLines(element, maxLines)
      ) {
        low = midpoint;
      } else {
        high = midpoint - 1;
      }
    }

    const { candidate, previewText } = createPreviewText(text, low);
    setDisplayText(candidate.length > 0 ? previewText : "...");
  }, [fitsWithinMaxLines, getCurrentMaxLines, text]);

  useEffect(() => {
    setDisplayText(text);
    updateDisplayText();

    const element = textRef.current;
    if (!element) return undefined;

    const resizeObserver = new ResizeObserver(updateDisplayText);
    resizeObserver.observe(element);
    const mediaQuery = window.matchMedia("(max-width: 480px)");
    mediaQuery.addEventListener("change", updateDisplayText);
    void document.fonts?.ready.then(updateDisplayText);

    return () => {
      resizeObserver.disconnect();
      mediaQuery.removeEventListener("change", updateDisplayText);
    };
  }, [text, updateDisplayText]);

  return (
    <>
      <span
        aria-hidden="true"
        className={styles.moreBlogPreviewText}
        data-lines={lineCount}
        ref={textRef}
      >
        {displayText}
      </span>
      <span className={styles.visuallyHidden}>{text}</span>
    </>
  );
}
