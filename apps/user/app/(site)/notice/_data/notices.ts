import { noticeCategories } from "../_constants/noticeCategories";
import type {
  NoticeCategoryValue,
  NoticeDetail,
  NoticePageData,
} from "../_types/notice";

const noticeFixtures = [
  {
    id: "summer-sale",
    category: "notice",
    title: "여름 특별 할인 프로모션 — 최대 30% 할인",
    excerpt:
      "6월 한 달 간 홈페이지 제작 패키지 전 상품 최대 30% 할인 이벤트를 진행합니다. 상담 신청 시 추가 혜택도 제공됩니다.",
    author: "씨브레인",
    publishedAt: "2026-11-02T00:00:00+09:00",
    isPinned: true,
    content: [
      {
        type: "paragraph",
        text: "6월 한 달 간 홈페이지 제작 패키지 전 상품 최대 30% 할인 이벤트를 진행합니다. 상담 신청 시 추가 혜택도 제공됩니다.",
      },
    ],
  },
  {
    id: "update-2-1-0",
    category: "notice",
    title: "2026년 2월 정기 업데이트 안내 (Ver 2.1.0)",
    excerpt:
      "사용자분들께 더 나은 경험을 제공하기 위해 2.1.0 버전 업데이트가 진행되었습니다.",
    author: "씨브레인",
    publishedAt: "2026-02-09T00:00:00+09:00",
    isPinned: false,
    content: [
      {
        type: "paragraph",
        text: "안녕하세요, [서비스명] 팀입니다. 사용자분들께 더 나은 경험을 제공하기 위해 2.1.0 버전 업데이트가 진행되었습니다.",
      },
      {
        type: "paragraph",
        text: "이번 업데이트에서는 많은 분들이 요청해주셨던 다크 모드(Dark Mode) 지원과 검색 속도 개선에 중점을 두었습니다. 상세 내용은 아래를 확인해 주세요.",
      },
      { type: "paragraph", text: "[주요 업데이트 내역]" },
      {
        type: "ordered-list",
        items: [
          {
            title: "다크 모드 공식 지원",
            details: [
              "이제 어두운 환경에서도 눈의 피로 없이 서비스를 이용하실 수 있습니다.",
              "설정 방법: [마이페이지] > [설정] > [화면 테마]에서 '다크 모드'를 선택하세요.",
            ],
          },
          {
            title: "검색 엔진 성능 최적화",
            details: [
              "데이터 검색 로직을 개선하여, 검색 결과 로딩 속도가 기존 대비 약 2배 빨라졌습니다.",
              "오타가 있어도 유사한 결과를 찾아주는 '추천 검색어' 기능이 고도화되었습니다.",
            ],
          },
          {
            title: "버그 수정 및 안정성 향상",
            details: [
              "간헐적으로 푸시 알림이 중복 발송되던 현상을 수정했습니다.",
              "iOS 환경에서 일부 이미지가 깨져 보이던 문제를 해결했습니다.",
              "기타 서버 안정화 작업이 진행되었습니다.",
            ],
          },
        ],
      },
      {
        type: "paragraph",
        text: "항상 [서비스명]을 이용해 주셔서 감사합니다. 앞으로도 소중한 의견을 반영하여 발전하는 서비스가 되겠습니다.",
      },
      { type: "paragraph", text: "감사합니다." },
    ],
  },
] as const satisfies readonly NoticeDetail[];

export function resolveNoticeCategory(
  category: string | undefined,
): NoticeCategoryValue {
  return noticeCategories.some((item) => item.value === category) && category
    ? (category as NoticeCategoryValue)
    : "all";
}

export function getNoticePageData(
  activeCategory: NoticeCategoryValue,
): NoticePageData {
  const filteredNotices =
    activeCategory === "all"
      ? noticeFixtures
      : noticeFixtures.filter((notice) => notice.category === activeCategory);

  return {
    categories: noticeCategories,
    notices: [...filteredNotices].sort(
      (firstNotice, secondNotice) =>
        Date.parse(secondNotice.publishedAt) -
        Date.parse(firstNotice.publishedAt),
    ),
    totalCount: noticeFixtures.length,
  };
}

export function getNoticeById(id: string): NoticeDetail | undefined {
  return noticeFixtures.find((notice) => notice.id === id);
}
