import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import { NotFoundContent } from "./_components/NotFoundContent";
import pageStyles from "./page.module.css";

export default function NotFound() {
  return (
    <div className={pageStyles.page}>
      <Header />
      <main className={pageStyles.siteMain}>
        <NotFoundContent />
      </main>
      <Footer />
    </div>
  );
}
