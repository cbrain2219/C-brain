export type BlogCategory = string;

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
  imageAlt: string;
  landingRank?: number;
  bannerRank?: number;
  popularRank?: number;
  detail: BlogPostDetail;
};
