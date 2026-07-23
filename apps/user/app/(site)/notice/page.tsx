import { PageHero } from "../../../components/PageHero";
import { SectionLayout } from "../../../components/SectionLayout";
import { JsonLdScript } from "../../_components/JsonLdScript";
import { createPageMetadata } from "../../_content/seo";
import { createStaticPageStructuredData } from "../../_content/structured-data";
import { NoticeBoard } from "./_components/NoticeBoard";
import { getNoticePageData, resolveNoticeCategory } from "./_data/notices";
import styles from "./page.module.css";

export const metadata = createPageMetadata("notice");

type NoticePageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function NoticePage({ searchParams }: NoticePageProps) {
  const { category } = await searchParams;
  const activeCategory = resolveNoticeCategory(category);
  const noticePageData = await getNoticePageData(activeCategory);

  return (
    <>
      <JsonLdScript
        data={createStaticPageStructuredData("notice", {
          pageType: "CollectionPage",
        })}
      />
      <PageHero
        backgroundAlt="편집디자인 전문회사 씨브레인 로고"
        backgroundImage="/figma-assets/notice-hero-background.webp"
        badge="C · Brain Notice"
        description={<p>씨브레인의 공식 소식과 안내를 빠르게 확인하세요.</p>}
        mobileBackgroundPosition="70% center"
        title="씨브레인 공지사항"
        tone="dark"
      />

      <SectionLayout
        badge="C · Brain 공지사항"
        badgeClassName={styles.sectionBadge}
        className={styles.noticeSection}
        headerClassName={styles.sectionHeader}
        innerClassName={styles.sectionInner}
        title={
          <>
            전체 공지사항 <strong>{noticePageData.totalCount}</strong>
          </>
        }
        titleClassName={styles.sectionTitle}
      >
        <NoticeBoard
          activeCategory={activeCategory}
          categories={noticePageData.categories}
          notices={noticePageData.notices}
        />
      </SectionLayout>
    </>
  );
}
