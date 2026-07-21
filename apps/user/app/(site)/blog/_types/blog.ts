export const BLOG_CATEGORY_VALUES = [
  "브로슈어·카탈로그",
  "리플렛·팜플렛",
  "디자인 실무팁",
  "인쇄 실무팁",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORY_VALUES)[number];

export type BlogContentBlock =
  | {
      id: string;
      text: string;
      type: "paragraph" | "heading";
    }
  | {
      id: string;
      items: readonly string[];
      start?: number;
      type: "orderedList" | "unorderedList";
    }
  | {
      alt: string;
      id: string;
      label?: string;
      src?: string;
      type: "image";
      visibleOn?: "desktop";
    };

export type BlogPostDetail = {
  body: readonly BlogContentBlock[];
  keywords: readonly string[];
  seoDescription: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  category: BlogCategory;
  title: string;
  summary: string;
  publishedAt: string;
  publishedAtIso: string;
  author: string;
  image: string;
  landingRank?: number;
  bannerRank?: number;
  popularRank?: number;
  detail: BlogPostDetail;
};
