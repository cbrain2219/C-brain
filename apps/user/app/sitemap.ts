import type { MetadataRoute } from "next";

import { getNoticePageData } from "./(site)/notice/_data/notices";
import { getCustomerReviewPageData } from "./_content/customerReviews";
import {
  createSitemapEntries,
  type SitemapDynamicRoute,
} from "./_content/sitemap";
import {
  getPublishedBlogPosts,
  getPublishedPortfolioItems,
} from "../lib/publicContent";

export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, items, reviewPageData, noticePageData] = await Promise.all([
    getPublishedBlogPosts(),
    getPublishedPortfolioItems(),
    getCustomerReviewPageData(),
    getNoticePageData("all"),
  ]);
  const portfolioRoutes = items.map((item) => ({
    changeFrequency: "monthly",
    path: `/portfolio/${item.slug}`,
    priority: 0.7,
  })) satisfies SitemapDynamicRoute[];
  const blogRoutes = posts.map((post) => ({
    changeFrequency: "monthly",
    lastModified: post.publishedAtIso,
    path: `/blog/${post.slug}`,
    priority: 0.65,
  })) satisfies SitemapDynamicRoute[];
  const noticeRoutes = noticePageData.notices.map((notice) => ({
    changeFrequency: "monthly",
    lastModified: notice.publishedAt,
    path: `/notice/${notice.id}`,
    priority: notice.isPinned ? 0.65 : 0.55,
  })) satisfies SitemapDynamicRoute[];
  const reviewRoutes = reviewPageData.customerInterviews.map((interview) => ({
    changeFrequency: "monthly",
    lastModified: interview.publishedAt,
    path: `/reviews/${interview.detailSlug}`,
    priority: 0.6,
  })) satisfies SitemapDynamicRoute[];

  return createSitemapEntries([
    ...portfolioRoutes,
    ...blogRoutes,
    ...reviewRoutes,
    ...noticeRoutes,
  ]);
}
