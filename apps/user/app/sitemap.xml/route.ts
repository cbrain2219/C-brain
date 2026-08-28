import type { MetadataRoute } from "next";

import { getNoticePageData } from "../(site)/notice/_data/notices";
import { getCustomerReviewPageData } from "../_content/customerReviews";
import {
  getOrderCategoryHref,
  orderCategories,
} from "../_content/order";
import { getPortfolioDetailPath } from "../_content/portfolio";
import {
  createSitemapEntries,
  serializeSitemap,
  type SitemapDynamicRoute,
} from "../_content/sitemap";
import {
  getPublishedBlogPosts,
  getPublishedPortfolioItems,
} from "../../lib/publicContent";

export const revalidate = 0;

export async function GET() {
  const [posts, items, reviewPageData, noticePageData] = await Promise.all([
    getPublishedBlogPosts(),
    getPublishedPortfolioItems(),
    getCustomerReviewPageData(),
    getNoticePageData("all"),
  ]);
  const portfolioRoutes = items.map((item) => ({
    changeFrequency: "monthly",
    path: getPortfolioDetailPath(item),
    priority: 0.7,
  })) satisfies SitemapDynamicRoute[];
  const orderCategoryRoutes = orderCategories.map((category) => ({
    changeFrequency: "monthly",
    path: getOrderCategoryHref(category.id),
    priority: 0.75,
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
    path: `/customer-review/${interview.detailSlug}`,
    priority: 0.6,
  })) satisfies SitemapDynamicRoute[];
  const entries: MetadataRoute.Sitemap = createSitemapEntries([
    ...orderCategoryRoutes,
    ...portfolioRoutes,
    ...blogRoutes,
    ...reviewRoutes,
    ...noticeRoutes,
  ]);

  return new Response(serializeSitemap(entries), {
    headers: {
      "Cache-Control":
        "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
