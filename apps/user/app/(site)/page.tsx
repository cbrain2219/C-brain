import { AboutSection } from "../_components/AboutSection";
import { BlogSection } from "../_components/BlogSection";
import { CtaSection } from "../_components/CtaSection";
import { CustomerReviewSection } from "../_components/CustomerReviewSection";
import { FaqSection } from "../_components/FaqSection";
import { Hero } from "../_components/Hero";
import { JsonLdScript } from "../_components/JsonLdScript";
import { Metrics } from "../_components/Metrics";
import { PortfolioSection } from "../_components/PortfolioSection";
import { ServicesSection } from "../_components/ServicesSection";
import { landingFaqs } from "../_content/faqs";
import { createPageMetadata } from "../_content/seo";
import { createHomeStructuredData } from "../_content/structured-data";

export const metadata = createPageMetadata("home");

export default function Home() {
  return (
    <>
      <JsonLdScript data={createHomeStructuredData()} />
      <Hero />
      <Metrics />
      <PortfolioSection />
      <ServicesSection />
      <AboutSection />
      <CustomerReviewSection />
      <BlogSection />
      <CtaSection
        badge="지금 바로 시작하세요"
        description="빠른 상담 · 전국 납품 · 소량부터 대량까지"
        descriptionSize="md"
        id="contact"
        secondaryAction={{
          label: "정찰제 가격 보기",
          href: "/#services",
        }}
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
