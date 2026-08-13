import { AboutSection } from "../_components/AboutSection";
import { BlogSection } from "../_components/BlogSection";
import { FIXED_PRICE_ACTION } from "../_components/ContactActionButtons";
import { CtaSection } from "../_components/CtaSection";
import { CustomerReviewSection } from "../_components/CustomerReviewSection";
import { FaqSection } from "../_components/FaqSection";
import { Hero } from "../_components/Hero";
import { JsonLdScript } from "../_components/JsonLdScript";
import { Metrics } from "../_components/Metrics";
import { PortfolioSection } from "../_components/PortfolioSection";
import { ServicesSection } from "../_components/ServicesSection";
import { landingFaqs } from "../_content/faqs";
import { getLandingCustomerTestimonials } from "../_content/customerReviews";
import {
  getPortfolioCategoryIdFromValue,
  landingPortfolioCategorySearchParam,
} from "../_content/portfolio";
import { createPageMetadata } from "../_content/seo";
import { createHomeStructuredData } from "../_content/structured-data";
import { createServiceItems } from "../_content/services";
import {
  getPublishedBlogPosts,
  getPublishedPortfolioItems,
  getPublishedOrderProducts,
} from "../../lib/publicContent";

export const metadata = createPageMetadata("home");

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const [
    resolvedSearchParams,
    publishedBlogPosts,
    publishedPortfolioItems,
    landingCustomerTestimonials,
    publishedOrderProducts,
  ] = await Promise.all([
    searchParams,
    getPublishedBlogPosts(),
    getPublishedPortfolioItems(),
    getLandingCustomerTestimonials(),
    getPublishedOrderProducts(),
  ]);
  const initialPortfolioCategoryId = getPortfolioCategoryIdFromValue(
    resolvedSearchParams?.[landingPortfolioCategorySearchParam],
  );

  return (
    <>
      <JsonLdScript data={createHomeStructuredData()} />
      <Hero />
      <Metrics />
      <PortfolioSection
        initialCategoryId={initialPortfolioCategoryId}
        items={publishedPortfolioItems}
      />
      <ServicesSection services={createServiceItems(publishedOrderProducts)} />
      <AboutSection />
      <CustomerReviewSection reviews={landingCustomerTestimonials} />
      <BlogSection posts={publishedBlogPosts} />
      <CtaSection
        badge="지금 바로 시작하세요"
        description="빠른 상담 · 전국 납품 · 소량부터 대량까지"
        descriptionSize="md"
        id="contact"
        secondaryAction={FIXED_PRICE_ACTION}
        titleLines={[
          "실패 없는 홍보물 디자인 제작,",
          <>
            지금 바로 <strong>씨브레인</strong>에 맡기세요
          </>,
        ]}
      />
      <FaqSection items={landingFaqs} />
    </>
  );
}
