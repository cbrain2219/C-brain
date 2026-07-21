"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect } from "react";

import {
  consumeBlogListScrollRestore,
  rememberBlogListHistory,
} from "../_utils/blogListHistory";

type BlogHistoryBoundaryProps = {
  children: ReactNode;
  className?: string;
  listHref: string;
};

export function BlogHistoryBoundary({
  children,
  className,
  listHref,
}: BlogHistoryBoundaryProps) {
  useEffect(() => {
    const scrollY = consumeBlogListScrollRestore(listHref);

    if (scrollY !== null) {
      window.scrollTo(0, scrollY);
    }
  }, [listHref]);

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !(event.target instanceof Element)
    ) {
      return;
    }

    const blogLink =
      event.target.closest<HTMLAnchorElement>("[data-blog-detail-href]");
    const detailHref = blogLink?.dataset.blogDetailHref;

    if (!blogLink || !detailHref || !event.currentTarget.contains(blogLink)) {
      return;
    }

    rememberBlogListHistory(listHref, detailHref, window.scrollY);
  };

  return (
    <div className={className} onClickCapture={handleClickCapture}>
      {children}
    </div>
  );
}
