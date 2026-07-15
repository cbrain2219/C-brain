import type { Metadata } from "next";

import { PageHero } from "../../../components/PageHero";
import { SectionLayout } from "../../../components/SectionLayout";
import { NoticeBoard } from "./_components/NoticeBoard";
import {
  getNoticePageData,
  resolveNoticeCategory,
} from "./_data/notices";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "공지사항 | 씨브레인",
  description: "씨브레인의 공식 소식과 안내를 빠르게 확인하세요.",
};

type NoticePageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function NoticePage({ searchParams }: NoticePageProps) {
  const { category } = await searchParams;
  const activeCategory = resolveNoticeCategory(category);
  const noticePageData = await getNoticePageData(activeCategory);

  return (
    <>
      <PageHero
        backgroundImage="/figma-assets/notice-hero-background.png"
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
