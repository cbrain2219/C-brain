import { AboutSection } from "./_components/AboutSection";
import { BlogSection } from "./_components/BlogSection";
import { CtaSection } from "./_components/CtaSection";
import { FaqSection } from "./_components/FaqSection";
import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import { Hero } from "./_components/Hero";
import { Metrics } from "./_components/Metrics";
import { PortfolioSection } from "./_components/PortfolioSection";
import { ServicesSection } from "./_components/ServicesSection";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <Header />
      <Hero />
      <Metrics />
      <PortfolioSection />
      <ServicesSection />
      <AboutSection />
      <BlogSection />
      <CtaSection />
      <FaqSection />
      <Footer />
    </main>
  );
}
