const BLOG_LIST_HISTORY_KEY = "cbrain:blog-list-history";
const BLOG_LIST_SCROLL_RESTORE_KEY = "cbrain:blog-list-scroll-restore";

type BlogListHistoryEntry = {
  detailHref: string;
  listHref: string;
  scrollY: number;
};

type BlogListScrollRestoreEntry = {
  listHref: string;
  scrollY: number;
};

export function rememberBlogListHistory(
  listHref: string,
  detailHref: string,
  scrollY: number,
) {
  try {
    const entry: BlogListHistoryEntry = {
      detailHref,
      listHref,
      scrollY,
    };

    window.sessionStorage.setItem(BLOG_LIST_HISTORY_KEY, JSON.stringify(entry));
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function consumeBlogListHistory(listHref: string, detailHref: string) {
  try {
    const storedEntry = window.sessionStorage.getItem(BLOG_LIST_HISTORY_KEY);
    window.sessionStorage.removeItem(BLOG_LIST_HISTORY_KEY);

    if (!storedEntry) return null;

    const entry = JSON.parse(storedEntry) as Partial<BlogListHistoryEntry>;
    if (
      entry.listHref === listHref &&
      entry.detailHref === detailHref &&
      typeof entry.scrollY === "number" &&
      Number.isFinite(entry.scrollY)
    ) {
      return entry.scrollY;
    }

    return null;
  } catch {
    return null;
  }
}

export function rememberBlogListScrollRestore(
  listHref: string,
  scrollY: number,
) {
  try {
    const entry: BlogListScrollRestoreEntry = { listHref, scrollY };

    window.sessionStorage.setItem(
      BLOG_LIST_SCROLL_RESTORE_KEY,
      JSON.stringify(entry),
    );
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function consumeBlogListScrollRestore(listHref: string) {
  try {
    const storedEntry = window.sessionStorage.getItem(
      BLOG_LIST_SCROLL_RESTORE_KEY,
    );
    window.sessionStorage.removeItem(BLOG_LIST_SCROLL_RESTORE_KEY);

    if (!storedEntry) return null;

    const entry = JSON.parse(
      storedEntry,
    ) as Partial<BlogListScrollRestoreEntry>;
    return entry.listHref === listHref &&
      typeof entry.scrollY === "number" &&
      Number.isFinite(entry.scrollY)
      ? entry.scrollY
      : null;
  } catch {
    return null;
  }
}
