import type { MetadataRoute } from "next";

import { blogPosts } from "./(site)/blog/_data/blogPosts";
import { getNoticePageData } from "./(site)/notice/_data/notices";
import { customerInterviews } from "./_content/customerReviews";
import { portfolioItems } from "./_content/portfolio";
import {
  createSitemapEntries,
  type SitemapDynamicRoute,
} from "./_content/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  const portfolioRoutes = portfolioItems.map((item) => ({
    changeFrequency: "monthly",
    path: `/portfolio/${item.slug}`,
    priority: 0.7,
  })) satisfies SitemapDynamicRoute[];
  const noticePageData = getNoticePageData("all");
  const blogRoutes = blogPosts.map((post) => ({
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
  const reviewRoutes = customerInterviews.map((interview) => ({
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
