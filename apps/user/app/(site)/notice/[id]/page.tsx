import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getNoticeById, resolveNoticeCategory } from "../_data/notices";
import { NoticeDetailArticle } from "./_components/NoticeDetailArticle";

type NoticeDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export async function generateMetadata({
  params,
}: NoticeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const notice = await getNoticeById(id);

  if (!notice) {
    return { title: "공지사항을 찾을 수 없습니다 | 씨브레인" };
  }

  return {
    title: `${notice.title} | 씨브레인`,
    description: notice.excerpt,
  };
}

export default async function NoticeDetailPage({
  params,
  searchParams,
}: NoticeDetailPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const notice = await getNoticeById(id);
  const backCategory = resolveNoticeCategory(from);

  if (!notice) notFound();

  return (
    <NoticeDetailArticle
      backCategory={backCategory}
      notice={notice}
      restoreListHistory={from === backCategory}
    />
  );
}
