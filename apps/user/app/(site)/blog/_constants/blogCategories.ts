import { BLOG_CATEGORY_VALUES } from "../_types/blog";

export const BLOG_CATEGORIES = ["전체", ...BLOG_CATEGORY_VALUES] as const;

export type BlogCategoryFilter = (typeof BLOG_CATEGORIES)[number];

export function resolveBlogCategory(category: string | undefined) {
  return BLOG_CATEGORIES.includes(category as BlogCategoryFilter)
    ? (category as BlogCategoryFilter)
    : "전체";
}
