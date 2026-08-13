import {
  blogAllCategory,
  getBlogCategoryOptions,
  normalizeBlogCategory,
} from "@repo/supabase/categories";
import type { BlogPost } from "../_types/blog";

export const BLOG_CATEGORIES = [
  blogAllCategory,
  ...getBlogCategoryOptions([]),
] as const;

export type BlogCategoryFilter = string;

export function getBlogCategories(
  posts: readonly Pick<BlogPost, "category">[],
) {
  return [
    blogAllCategory,
    ...getBlogCategoryOptions(posts.map((post) => post.category)),
  ];
}

export function resolveBlogCategory(
  category: string | undefined,
  categories: readonly string[] = BLOG_CATEGORIES,
) {
  const normalizedCategory = normalizeBlogCategory(category ?? "");

  return (
    categories.find(
      (candidate) =>
        candidate.toLocaleLowerCase("ko-KR") ===
        normalizedCategory.toLocaleLowerCase("ko-KR"),
    ) ?? blogAllCategory
  );
}
