import Link from "next/link";

import { Icon } from "../../../../components/Icon";
import { getNoticeCategoryLabel } from "../_constants/noticeCategories";
import type { NoticeCategoryValue, NoticeSummary } from "../_types/notice";
import { formatPublishedDate } from "../_utils/formatPublishedDate";
import styles from "../page.module.css";
import { NoticeAuthorMark } from "./NoticeAuthorMark";

type NoticeItemProps = {
  activeCategory: NoticeCategoryValue;
  notice: NoticeSummary;
};

export function NoticeItem({ activeCategory, notice }: NoticeItemProps) {
  const detailHref = `/notice/${notice.id}?from=${activeCategory}`;

  return (
    <article className={styles.noticeArticle}>
      <Link
        className={`${styles.noticeItem} ${
          notice.isPinned ? styles.noticeItemPinned : ""
        }`}
        data-notice-detail-href={detailHref}
        href={detailHref}
      >
        <div className={styles.noticeTopRow}>
          <div className={styles.noticeTags}>
            <span className={styles.categoryTag}>
              {getNoticeCategoryLabel(notice.category)}
            </span>
            {notice.isPinned ? (
              <span className={styles.pinnedTag}>
                <Icon className={styles.pinIcon} name="pin" size={12} />
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
