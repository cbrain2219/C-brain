import type {
  NoticeCategory,
  NoticeCategoryValue,
  NoticeContentBlock,
  NoticeDetail,
  NoticePageData,
  NoticeSummary,
} from "../_types/notice";

const categories = [
  { label: "전체", value: "all" },
  { label: "공지", value: "notice" },
  { label: "이벤트", value: "event" },
  { label: "휴무 안내", value: "holiday" },
  { label: "서비스 변경", value: "service" },
  { label: "수상 · 소식", value: "news" },
] as const satisfies readonly NoticeCategory[];

// Replace this fixture inside getNoticePageData when the admin API is ready.
const noticeFixtures = [
  {
    id: "notice-1",
    category: "notice",
    categoryLabel: "공지",
    title:
      "[필독] 2026년 여름 특별 할인 프로모션 및 주문 접수 일정과 제작·배송 운영 정책 변경 사항을 안내드립니다. 행사 기간 중 접수되는 브로슈어·카탈로그·리플렛 제작 건의 상세 내용을 꼭 확인해 주세요.",
    excerpt:
      "6월 한 달 동안 홈페이지 제작 패키지 전 상품을 대상으로 최대 30% 할인 이벤트를 진행합니다. 상담 신청 시 제공되는 추가 혜택과 품목별 제작 기간, 주문 접수 마감일, 전국 배송 일정이 서로 다르므로 주문 전에 공지사항의 전체 내용을 확인해 주세요.",
    author: "씨브레인",
    publishedAt: "2026-11-02T00:00:00+09:00",
    isPinned: true,
  },
  {
    id: "notice-2",
    category: "notice",
    categoryLabel: "공지",
    title:
      "씨브레인 고객센터 상담 운영시간 변경과 카카오톡 1:1 문의 순차 답변 일정에 관한 상세 안내입니다. 주문 및 제작 상담이 필요한 고객님께서는 변경된 시간을 확인해 주세요.",
    excerpt:
      "상담 품질 향상을 위해 고객센터 운영시간이 일부 변경됩니다. 운영시간 외 접수된 카카오톡 문의는 다음 영업일부터 순서대로 답변드리며, 주문 일정이 촉박한 경우에는 필요한 제작 품목과 수량, 납품 희망일을 함께 남겨 주세요.",
    author: "씨브레인",
    publishedAt: "2026-10-28T00:00:00+09:00",
    isPinned: false,
  },
  {
    id: "notice-3",
    category: "notice",
    categoryLabel: "공지",
    title:
      "전국 택배 물량 증가에 따른 홍보물 배송 지연 가능성과 지역별 납품 일정 확인 방법을 안내드립니다. 여러 지점으로 분할 발송을 요청하시는 고객님은 내용을 확인해 주세요.",
    excerpt:
      "택배사 물량 증가로 일부 지역의 배송이 평소보다 늦어질 수 있습니다. 행사나 박람회 일정에 맞춘 납품이 필요한 경우 충분한 여유를 두고 주문해 주시고, 여러 주소로 분할 발송할 때에는 지점별 수량과 수령인 정보를 상담 시 전달해 주세요.",
    author: "씨브레인",
    publishedAt: "2026-10-20T00:00:00+09:00",
    isPinned: false,
  },
  {
    id: "event-1",
    category: "event",
    categoryLabel: "이벤트",
    title: "여름 특별 할인 프로모션 — 제작 상품 최대 30% 할인",
    excerpt:
      "이벤트 기간 동안 브로슈어, 카탈로그, 리플렛 등 주요 제작 상품을 최대 30% 할인된 가격으로 만나보세요.",
    author: "씨브레인",
    publishedAt: "2026-10-15T00:00:00+09:00",
    isPinned: true,
  },
  {
    id: "event-2",
    category: "event",
    categoryLabel: "이벤트",
    title: "신규 고객 대상 무료 디자인 상담 이벤트 안내",
    excerpt:
      "씨브레인을 처음 이용하는 고객님께 전담 디자이너의 1:1 무료 상담과 제작 방향 제안을 제공합니다.",
    author: "씨브레인",
    publishedAt: "2026-10-10T00:00:00+09:00",
    isPinned: false,
  },
  {
    id: "event-3",
    category: "event",
    categoryLabel: "이벤트",
    title: "홍보물 제작 후기 작성 고객 감사 이벤트",
    excerpt:
      "제작 후기를 남겨 주신 고객님을 대상으로 추첨을 통해 다음 주문에 사용할 수 있는 할인 혜택을 드립니다.",
    author: "씨브레인",
    publishedAt: "2026-10-05T00:00:00+09:00",
    isPinned: false,
  },
  {
    id: "holiday-1",
    category: "holiday",
    categoryLabel: "휴무 안내",
    title: "광복절 고객센터 및 제작 업무 휴무 안내",
    excerpt:
      "광복절에는 상담과 제작 업무가 운영되지 않으며 접수된 문의는 다음 영업일부터 순차적으로 답변드립니다.",
    author: "씨브레인",
    publishedAt: "2026-08-10T00:00:00+09:00",
    isPinned: true,
  },
  {
    id: "holiday-2",
    category: "holiday",
    categoryLabel: "휴무 안내",
    title: "추석 연휴 제작 및 배송 일정 안내",
    excerpt:
      "추석 연휴 전 납품이 필요한 주문은 품목별 마감 일정을 확인하고 여유 있게 접수해 주세요.",
    author: "씨브레인",
    publishedAt: "2026-09-10T00:00:00+09:00",
    isPinned: false,
  },
  {
    id: "holiday-3",
    category: "holiday",
    categoryLabel: "휴무 안내",
    title: "연말 고객센터 단축 운영 및 신정 휴무 안내",
    excerpt:
      "연말에는 고객센터가 단축 운영되며 신정 휴무 기간에 접수된 문의는 업무 재개 후 순차 처리됩니다.",
    author: "씨브레인",
    publishedAt: "2026-12-20T00:00:00+09:00",
    isPinned: false,
  },
  {
    id: "service-1",
    category: "service",
    categoryLabel: "서비스 변경",
    title: "온라인 정찰제 견적서 발급 방식 변경 안내",
    excerpt:
      "품목과 수량을 선택하면 상세 견적서를 바로 확인하고 내려받을 수 있도록 발급 절차가 개선되었습니다.",
    author: "씨브레인",
    publishedAt: "2026-09-25T00:00:00+09:00",
    isPinned: true,
  },
  {
    id: "service-2",
    category: "service",
    categoryLabel: "서비스 변경",
    title: "대용량 디자인 원고 파일 업로드 기능 개선",
    excerpt:
      "주문 과정에서 대용량 원고와 참고 자료를 더욱 안정적으로 전달할 수 있도록 업로드 기능을 개선했습니다.",
    author: "씨브레인",
    publishedAt: "2026-09-18T00:00:00+09:00",
    isPinned: false,
  },
  {
    id: "service-3",
    category: "service",
    categoryLabel: "서비스 변경",
    title: "주문 결제 수단 및 세금계산서 신청 절차 변경",
    excerpt:
      "고객 편의를 위해 결제 수단을 확대하고 주문 단계에서 세금계산서를 신청할 수 있도록 절차를 변경했습니다.",
    author: "씨브레인",
    publishedAt: "2026-09-12T00:00:00+09:00",
    isPinned: false,
  },
  {
    id: "news-1",
    category: "news",
    categoryLabel: "수상 · 소식",
    title: "씨브레인, 2026 커뮤니케이션 디자인 어워드 수상",
    excerpt:
      "씨브레인이 제작한 기업 브로슈어 프로젝트가 브랜드 커뮤니케이션 부문 우수 디자인으로 선정되었습니다.",
    author: "씨브레인",
    publishedAt: "2026-08-30T00:00:00+09:00",
    isPinned: true,
  },
  {
    id: "news-2",
    category: "news",
    categoryLabel: "수상 · 소식",
    title: "씨브레인 디자인 제작 사례 4,000건 돌파",
    excerpt:
      "브로슈어, 카탈로그, 리플렛 등 씨브레인의 누적 디자인 제작 사례가 4,000건을 돌파했습니다.",
    author: "씨브레인",
    publishedAt: "2026-08-22T00:00:00+09:00",
    isPinned: false,
  },
  {
    id: "news-3",
    category: "news",
    categoryLabel: "수상 · 소식",
    title: "전국 납품 파트너 네트워크 확대 소식",
    excerpt:
      "더 빠르고 안전한 납품을 위해 전국 주요 권역의 제작 및 배송 파트너 네트워크를 확대했습니다.",
    author: "씨브레인",
    publishedAt: "2026-08-15T00:00:00+09:00",
    isPinned: false,
  },
] satisfies NoticeSummary[];

const sharedDetailContent = [
  {
    text: "안내드린 내용을 바탕으로 필요한 일정과 준비 사항을 미리 확인해 주세요. 자세한 내용은 아래를 확인해 주세요.",
    type: "paragraph",
  },
  {
    text: "[주요 안내 사항]",
    type: "paragraph",
  },
  {
    items: [
      {
        title: "주문 및 제작 일정 확인",
        details: [
          "품목과 수량에 따라 제작 기간이 달라질 수 있으므로 납품 희망일을 먼저 확인해 주세요.",
          "행사 일정이 정해진 경우 충분한 여유를 두고 상담을 신청해 주세요.",
        ],
      },
      {
        title: "상담 정보 전달",
        details: [
          "제작 품목, 수량, 규격과 참고 자료를 함께 전달하면 더욱 빠르게 안내받을 수 있습니다.",
          "추가 요청 사항은 카카오톡 1:1 상담을 통해 담당자에게 알려 주세요.",
        ],
      },
      {
        title: "납품 및 배송 안내",
        details: [
          "전국 어디든 안전하게 납품하며 여러 지점으로 분할 발송도 지원합니다.",
          "지역과 배송 방식에 따라 도착 일정이 달라질 수 있습니다.",
          "기타 궁금한 사항은 고객센터로 문의해 주세요.",
        ],
      },
    ],
    type: "ordered-list",
  },
  {
    text: "항상 씨브레인을 이용해 주셔서 감사합니다. 앞으로도 소중한 의견을 반영하여 더 나은 서비스를 제공하겠습니다.",
    type: "paragraph",
  },
  {
    text: "감사합니다.",
    type: "paragraph",
  },
] as const satisfies readonly NoticeContentBlock[];

export function resolveNoticeCategory(
  category: string | undefined,
): NoticeCategoryValue {
  return categories.some((item) => item.value === category) && category
    ? (category as NoticeCategoryValue)
    : "all";
}

export function getNoticePageData(
  activeCategory: NoticeCategoryValue,
): NoticePageData {
  const notices =
    activeCategory === "all"
      ? noticeFixtures
      : noticeFixtures.filter((notice) => notice.category === activeCategory);

  return {
    categories,
    notices,
    totalCount: noticeFixtures.length,
  };
}

export function getNoticeById(id: string): NoticeDetail | undefined {
  const notice = noticeFixtures.find((item) => item.id === id);

  if (!notice) return undefined;

  return {
    ...notice,
    content: [
      {
        text: notice.excerpt,
        type: "paragraph",
      },
      ...sharedDetailContent,
    ],
  };
}
