import { NoticeAuthorMark } from "../../_components/NoticeAuthorMark";
import type {
  NoticeCategoryValue,
  NoticeDetail,
} from "../../_types/notice";
import { formatPublishedDate } from "../../_utils/formatPublishedDate";
import styles from "../page.module.css";
import { NoticeBackButton } from "./NoticeBackButton";

type NoticeDetailArticleProps = {
  backCategory: NoticeCategoryValue;
  notice: NoticeDetail;
  restoreListHistory: boolean;
};

export function NoticeDetailArticle({
  backCategory,
  notice,
  restoreListHistory,
}: NoticeDetailArticleProps) {
  const backHref =
    backCategory === "all"
      ? "/notice"
      : `/notice?category=${backCategory}`;

  return (
    <section className={styles.detailSection}>
      <div className={styles.detailInner}>
        <p className={styles.categoryBadge}>{notice.categoryLabel}</p>

        <article className={styles.article}>
          <header className={styles.articleHeader}>
            <h1 className={styles.title}>{notice.title}</h1>
            <div className={styles.meta}>
              <div className={styles.metaGroup}>
                <strong>작성자</strong>
                <span className={styles.author}>
                  <NoticeAuthorMark
                    className={styles.authorMark}
                    iconClassName={styles.authorMarkIcon}
                  />
                  {notice.author}
                </span>
              </div>
              <span aria-hidden="true" className={styles.metaSeparator} />
              <div className={styles.metaGroup}>
                <strong>작성일</strong>
                <time dateTime={notice.publishedAt}>
                  {formatPublishedDate(notice.publishedAt)}
                </time>
              </div>
            </div>
          </header>

          <div className={styles.noticeBody}>
            {notice.content.map((block, blockIndex) => {
              if (block.type === "paragraph") {
                return (
                  <p key={`paragraph-${blockIndex}`}>{block.text}</p>
                );
              }

              return (
                <ol
                  className={styles.orderedList}
                  key={`ordered-list-${blockIndex}`}
                >
                  {block.items.map((item) => (
                    <li key={item.title}>
                      <span className={styles.orderedListItemTitle}>
                        {item.title}
                      </span>
                      <ul className={styles.detailList}>
                        {item.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              );
            })}
          </div>
        </article>

        <NoticeBackButton
          className={styles.backButton}
          fallbackHref={backHref}
          restoreListHistory={restoreListHistory}
        />
      </div>
    </section>
  );
}
