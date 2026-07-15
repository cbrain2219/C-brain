import Link from "next/link";

import { HorizontalDragScroll } from "../../../../components/HorizontalDragScroll";
import type {
  NoticeCategory,
  NoticeCategoryValue,
  NoticeSummary,
} from "../_types/notice";
import styles from "../page.module.css";
import { NoticeItem } from "./NoticeItem";

type NoticeBoardProps = {
  activeCategory: NoticeCategoryValue;
  categories: readonly NoticeCategory[];
  notices: readonly NoticeSummary[];
};

function getCategoryHref(category: NoticeCategoryValue) {
  return category === "all" ? "/notice" : `/notice?category=${category}`;
}

export function NoticeBoard({
  activeCategory,
  categories,
  notices,
}: NoticeBoardProps) {
  const pinnedNotices = notices.filter((notice) => notice.isPinned);
  const regularNotices = notices.filter((notice) => !notice.isPinned);

  return (
    <div className={styles.noticeBoard}>
      <HorizontalDragScroll
        ariaLabel="공지사항 카테고리"
        className={styles.categoryRail}
        role="navigation"
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.value;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`${styles.categoryLink} ${
                isActive ? styles.categoryLinkActive : ""
              }`}
              href={getCategoryHref(category.value)}
              key={category.value}
              scroll={false}
            >
              {category.label}
            </Link>
          );
        })}
      </HorizontalDragScroll>

      {notices.length > 0 ? (
        <div className={styles.noticeList}>
          {pinnedNotices.length > 0 ? (
            <div className={styles.pinnedNoticeList}>
              {pinnedNotices.map((notice) => (
                <NoticeItem
                  activeCategory={activeCategory}
                  key={notice.id}
                  notice={notice}
                />
              ))}
            </div>
          ) : null}
          {regularNotices.map((notice) => (
            <NoticeItem
              activeCategory={activeCategory}
              key={notice.id}
              notice={notice}
            />
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>등록된 공지사항이 없습니다.</p>
      )}
    </div>
  );
}
