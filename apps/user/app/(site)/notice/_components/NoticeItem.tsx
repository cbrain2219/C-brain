import Link from "next/link";

import type {
  NoticeCategoryValue,
  NoticeSummary,
} from "../_types/notice";
import { formatPublishedDate } from "../_utils/formatPublishedDate";
import styles from "../page.module.css";
import { NoticeAuthorMark } from "./NoticeAuthorMark";

type NoticeItemProps = {
  activeCategory: NoticeCategoryValue;
  notice: NoticeSummary;
};

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.pinIcon}
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d="m7.85 1.5 2.65 2.65-1.7.57-1.65 1.65.25 1.8-.72.72-1.78-1.8-2.68 2.68-.7-.7L4.2 6.39 2.4 4.61l.72-.72 1.8.25 1.65-1.65.58-1.7.7.71Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function NoticeItem({ activeCategory, notice }: NoticeItemProps) {
  return (
    <article className={styles.noticeArticle}>
      <Link
        className={`${styles.noticeItem} ${
          notice.isPinned ? styles.noticeItemPinned : ""
        }`}
        href={`/notice/${notice.id}?from=${activeCategory}`}
      >
        <div className={styles.noticeTopRow}>
          <div className={styles.noticeTags}>
            <span className={styles.categoryTag}>{notice.categoryLabel}</span>
            {notice.isPinned ? (
              <span className={styles.pinnedTag}>
                <PinIcon />
                고정됨
              </span>
            ) : null}
          </div>
          <p className={styles.noticeMeta}>
            <NoticeAuthorMark
              className={styles.authorMark}
              iconClassName={styles.authorMarkIcon}
            />
            <span>
              {notice.author} <strong>·</strong>{" "}
              {formatPublishedDate(notice.publishedAt)}
            </span>
          </p>
        </div>
        <div className={styles.noticeCopy}>
          <h3>{notice.title}</h3>
          <p>{notice.excerpt}</p>
        </div>
      </Link>
    </article>
  );
}
