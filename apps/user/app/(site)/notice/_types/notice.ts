import type { PublicManagedContent } from "../../../../components/ManagedContent";

export type NoticeCategoryValue =
  | "all"
  | "notice"
  | "event"
  | "holiday"
  | "service"
  | "news";

export type NoticeCategory = {
  label: string;
  value: NoticeCategoryValue;
};

export type NoticeSummary = {
  author: string;
  category: Exclude<NoticeCategoryValue, "all">;
  excerpt: string;
  id: string;
  isPinned: boolean;
  publishedAt: string;
  title: string;
};

export type NoticeContentBlock =
  | {
      text: string;
      type: "paragraph";
    }
  | {
      items: readonly {
        details: readonly string[];
        title: string;
      }[];
      type: "ordered-list";
    };

export type NoticeDetail = NoticeSummary & {
  content: readonly NoticeContentBlock[];
  managedContent: PublicManagedContent;
};

export type NoticePageData = {
  categories: readonly NoticeCategory[];
  notices: readonly NoticeSummary[];
  totalCount: number;
};
