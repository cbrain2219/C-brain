"use client";

import { useRouter } from "next/navigation";

import {
  consumeBlogListHistory,
  rememberBlogListScrollRestore,
} from "../_utils/blogListHistory";
import styles from "./page.module.css";

type BlogDetailBackLinkProps = {
  href: string;
};

export function BlogDetailBackLink({ href }: BlogDetailBackLinkProps) {
  const router = useRouter();

  const handleClick = () => {
    const detailHref = `${window.location.pathname}${window.location.search}`;
    const scrollY = consumeBlogListHistory(href, detailHref);

    if (scrollY !== null) {
      rememberBlogListScrollRestore(href, scrollY);
      router.back();
      return;
    }

    router.push(href);
  };

  return (
    <button className={styles.backLink} onClick={handleClick} type="button">
      목록으로
    </button>
  );
}
