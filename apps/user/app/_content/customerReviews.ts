export const reviewHeroImage = "/figma-assets/review-hero-office.png";

export const reviewInterviewImage =
  "/figma-assets/review-interview-brochure.png";
export const reviewInterviewHealthcareImage =
  "/figma-assets/review-interview-healthcare.png";
export const reviewInterviewEducationImage =
  "/figma-assets/review-interview-education.png";
export const reviewPlayLargeIcon = "/figma-assets/review-play-large.svg";
export const reviewPlaySmallIcon = "/figma-assets/review-play-small.svg";
export const reviewQuoteMarkIcon = "/figma-assets/review-quote-mark.svg";

export type CustomerInterviewContentBlock =
  | {
      id: string;
      text: string;
      type: "paragraph";
    }
  | {
      id: string;
      text: string;
      type: "heading";
    }
  | {
      cite: string;
      id: string;
      text: string;
      type: "quote";
    };

export type CustomerInterviewProjectInfoId = "client" | "deliverable" | "usage";

export type CustomerInterviewProjectInfo = {
  id: CustomerInterviewProjectInfoId;
  label: string;
  value: string;
};

export type CustomerInterviewDetail = {
  author: string;
  category: string;
  company: string;
  content: readonly CustomerInterviewContentBlock[];
  keywords: readonly string[];
  projectInfo: readonly CustomerInterviewProjectInfo[];
  projectInfoTitle: string;
  publishedAt: string;
  seoDescription: string;
  slug: string;
  thumbnail: string;
  title: string;
  videoAlt: string;
  videoUrl?: string;
};

export type CustomerInterviewDetailSeo = {
  description: string;
  keywords: string[];
  title: string;
};

type CustomerInterviewFeaturedConfig = {
  headlineLines: readonly string[];
  projectName: string;
};

export type CustomerInterviewRecord = CustomerInterviewDetail & {
  featured?: CustomerInterviewFeaturedConfig;
  industry: string;
};

export type CustomerInterviewCard = {
  category: string;
  company: string;
  detailSlug: string;
  id: string;
  meta: string;
  publishedAt: string;
  quote: string;
  thumbnail: string;
  title: string;
  videoAlt: string;
};

export type FeaturedCustomerInterview = CustomerInterviewCard & {
  description: string;
  headlineLines: readonly string[];
  projectName: string;
};

export type CustomerTestimonial = {
  body: string;
  company: string;
  id: string;
  name: string;
  publishedAt: string;
  title: string;
};

export const customerInterviewRecords = [
  {
    author: "씨브레인",
    category: "고객 인터뷰",
    company: "서진인스텍",
    content: [
      {
        id: "intro",
        text: "서진인스텍은 전시회와 영업 현장에서 활용할 카탈로그·브로슈어 제작을 씨브레인에 의뢰한 사례입니다.",
        type: "paragraph",
      },
      {
        id: "situation-heading",
        text: "어떤 상황이었나요?",
        type: "heading",
      },
      {
        id: "situation",
        text: "제품 정보를 명확하게 전달하면서도 촉박한 일정 안에 인쇄까지 마무리해야 했습니다. 복잡한 내용을 보기 쉽게 정리하고 빠른 피드백이 가능한 제작 파트너가 필요했습니다.",
        type: "paragraph",
      },
      {
        id: "solution-heading",
        text: "씨브레인은 어떻게 해결했나요?",
        type: "heading",
      },
      {
        id: "solution",
        text: "브로슈어의 핵심 정보 구조를 정리하고 수정 요청을 빠르게 반영해 디자인과 인쇄를 함께 진행했습니다. 전시 일정에 맞춰 현장에서 바로 활용할 수 있는 제작물로 마무리했습니다.",
        type: "paragraph",
      },
      {
        id: "result-heading",
        text: "고객이 직접 말하는 결과",
        type: "heading",
      },
      {
        cite: "서진인스텍",
        id: "result-quote",
        text: "빠른 피드백과 함께 원하는 부분을 잘 반영해 주셔서 만족합니다.",
        type: "quote",
      },
    ],
    keywords: [
      "씨브레인",
      "고객 인터뷰",
      "서진인스텍",
      "카탈로그 제작",
      "브로슈어 디자인",
    ],
    projectInfo: [
      {
        id: "client",
        label: "의뢰처",
        value: "서진인스텍",
      },
      {
        id: "deliverable",
        label: "제작물",
        value: "카탈로그 · 브로슈어",
      },
      {
        id: "usage",
        label: "활용",
        value: "전시회 배포 · 영업 자료 활용",
      },
    ],
    projectInfoTitle: "프로젝트 정보",
    publishedAt: "2026-07-01T00:00:00+09:00",
    seoDescription:
      "서진인스텍의 카탈로그·브로슈어 제작 사례와 씨브레인 고객 인터뷰를 확인하세요.",
    industry: "제조",
    slug: "seojin-instech",
    thumbnail: reviewInterviewImage,
    title: "[카탈로그·브로슈어 제작] 서진인스텍이 씨브레인을 선택한 이유",
    videoAlt: "서진인스텍 카탈로그 브로슈어 제작 고객 인터뷰 영상",
  },
  {
    author: "씨브레인",
    category: "고객 인터뷰",
    company: "나인벨 헬스케어",
    content: [
      {
        id: "intro",
        text: "나인벨 헬스케어는 서비스와 제품 정보를 더 읽기 쉬운 형태로 전달하기 위해 씨브레인에 브로슈어·리플렛 제작을 의뢰한 사례입니다.",
        type: "paragraph",
      },
      {
        id: "situation-heading",
        text: "어떤 상황이었나요?",
        type: "heading",
      },
      {
        id: "situation",
        text: "전문적인 헬스케어 정보를 고객이 쉽게 이해할 수 있도록 정리해야 했습니다. 정보량이 많아 가독성 있는 구조와 안정적인 디자인 톤이 중요했습니다.",
        type: "paragraph",
      },
      {
        id: "solution-heading",
        text: "씨브레인은 어떻게 해결했나요?",
        type: "heading",
      },
      {
        id: "solution",
        text: "핵심 메시지를 우선순위에 맞게 재배치하고, 시각 요소와 문단 흐름을 정리해 현장에서 설명 자료로 바로 사용할 수 있는 브로슈어·리플렛으로 완성했습니다.",
        type: "paragraph",
      },
      {
        id: "result-heading",
        text: "고객이 직접 말하는 결과",
        type: "heading",
      },
      {
        cite: "나인벨 헬스케어",
        id: "result-quote",
        text: "효율적인 커뮤니케이션과 고품질 디자인으로 만족스러운 결과물을 얻었습니다.",
        type: "quote",
      },
    ],
    keywords: [
      "씨브레인",
      "고객 인터뷰",
      "나인벨 헬스케어",
      "브로슈어 제작",
      "리플렛 디자인",
    ],
    projectInfo: [
      {
        id: "client",
        label: "의뢰처",
        value: "나인벨 헬스케어",
      },
      {
        id: "deliverable",
        label: "제작물",
        value: "브로슈어 · 리플렛",
      },
      {
        id: "usage",
        label: "활용",
        value: "제품 소개 · 고객 상담 자료 활용",
      },
    ],
    projectInfoTitle: "프로젝트 정보",
    publishedAt: "2026-07-08T00:00:00+09:00",
    seoDescription:
      "나인벨 헬스케어의 브로슈어·리플렛 제작 사례와 씨브레인 고객 인터뷰를 확인하세요.",
    industry: "헬스케어",
    slug: "ninebell-healthcare",
    thumbnail: reviewInterviewHealthcareImage,
    title: "[브로슈어·리플렛 제작] 나인벨 헬스케어가 씨브레인을 선택한 이유",
    videoAlt: "나인벨 헬스케어 브로슈어 리플렛 제작 고객 인터뷰 영상",
  },
  {
    author: "씨브레인",
    category: "고객 인터뷰",
    company: "청강문화산업대학교 게임콘텐츠스쿨",
    content: [
      {
        id: "intro",
        text: "청강문화산업대학교 게임콘텐츠스쿨 졸업생들이 직접 개발한 게임 프로젝트를 전시회에서 선보이기 위해 씨브레인에 완료보고서 제작을 의뢰한 사례입니다.",
        type: "paragraph",
      },
      {
        id: "situation-heading",
        text: "어떤 상황이었나요?",
        type: "heading",
      },
      {
        id: "situation",
        text: "졸업생들이 직접 만든 게임을 업계 관계자와 일반 관람객에게 공개 전시할 예정이었습니다. 프로젝트의 완성도를 눈으로 전달할 수 있는 보고서가 필요했고, 단순 학교 과제물이 아닌 상용화 가능성을 보여줄 수 있는 퀄리티가 요구됐습니다.",
        type: "paragraph",
      },
      {
        id: "solution-heading",
        text: "씨브레인은 어떻게 해결했나요?",
        type: "heading",
      },
      {
        id: "solution",
        text: "게임의 콘셉트·개발 과정·결과물을 체계적으로 정리한 완료보고서를 제작했습니다. 전시 현장에서 외부 관람객이 실제로 상용화 가능성을 묻고 긍정적 피드백을 줄 수 있을 만큼의 디자인 완성도를 목표로 작업했습니다.",
        type: "paragraph",
      },
      {
        id: "result-heading",
        text: "고객이 직접 말하는 결과",
        type: "heading",
      },
      {
        cite: "청강문화산업대학교 게임콘텐츠스쿨",
        id: "result-quote",
        text: "완료보고서를 선보이면서 긍정적인 피드백을 받을 정도로 퀄리티가 좋았습니다.",
        type: "quote",
      },
    ],
    keywords: [
      "씨브레인",
      "고객 인터뷰",
      "청강문화산업대학교",
      "게임 졸업작품 완료보고서",
      "보고서 디자인",
    ],
    projectInfo: [
      {
        id: "client",
        label: "의뢰처",
        value: "청강문화산업대학교 게임콘텐츠스쿨",
      },
      {
        id: "deliverable",
        label: "제작물",
        value: "게임 졸업 프로젝트 완료보고서",
      },
      {
        id: "usage",
        label: "활용",
        value: "졸업작품 전시회 배포 · 상용화 피드백 수집",
      },
    ],
    projectInfoTitle: "프로젝트 정보",
    publishedAt: "2026-07-15T00:00:00+09:00",
    seoDescription:
      "청강문화산업대학교 게임콘텐츠스쿨의 게임 졸업 프로젝트 완료보고서 제작 사례와 씨브레인 고객 인터뷰를 확인하세요.",
    featured: {
      headlineLines: ["처음 맡겼는데", "결과물이 기대 이상이였어요."],
      projectName: "게임 졸업 프로젝트 완료 보고서",
    },
    industry: "교육",
    slug: "chungkang-college",
    thumbnail: reviewInterviewEducationImage,
    title:
      "[게임 졸업작품 완료보고서] 청강문화산업대학교가 씨브레인을 선택한 이유",
    videoAlt:
      "청강문화산업대학교 게임콘텐츠스쿨 완료보고서 제작 고객 인터뷰 영상",
  },
] as const satisfies readonly CustomerInterviewRecord[];

const customerInterviewRecordList: readonly CustomerInterviewRecord[] =
  customerInterviewRecords;

function getCustomerInterviewQuote(record: CustomerInterviewRecord) {
  return (
    record.content.find((block) => block.type === "quote")?.text ??
    record.seoDescription
  );
}

function getCustomerInterviewIntro(record: CustomerInterviewRecord) {
  return (
    record.content.find((block) => block.type === "paragraph")?.text ??
    record.seoDescription
  );
}

function getCustomerInterviewProjectValue(
  record: CustomerInterviewRecord,
  id: CustomerInterviewProjectInfoId,
) {
  return record.projectInfo.find((item) => item.id === id)?.value;
}

function getCustomerInterviewMeta(record: CustomerInterviewRecord) {
  const projectName = getCustomerInterviewProjectValue(record, "deliverable");

  return projectName ? `${record.company} · ${projectName}` : record.company;
}

function toCustomerInterviewCard(
  record: CustomerInterviewRecord,
): CustomerInterviewCard {
  return {
    category: record.industry,
    company: record.company,
    detailSlug: record.slug,
    id: record.slug,
    meta: getCustomerInterviewMeta(record),
    publishedAt: record.publishedAt,
    quote: getCustomerInterviewQuote(record),
    thumbnail: record.thumbnail,
    title: record.title,
    videoAlt: record.videoAlt,
  };
}

function toCustomerInterviewDetail(
  record: CustomerInterviewRecord,
): CustomerInterviewDetail {
  return {
    author: record.author,
    category: record.category,
    company: record.company,
    content: record.content,
    keywords: record.keywords,
    projectInfo: record.projectInfo,
    projectInfoTitle: record.projectInfoTitle,
    publishedAt: record.publishedAt,
    seoDescription: record.seoDescription,
    slug: record.slug,
    thumbnail: record.thumbnail,
    title: record.title,
    videoAlt: record.videoAlt,
    ...(record.videoUrl ? { videoUrl: record.videoUrl } : {}),
  };
}

function createFeaturedCustomerInterview(
  record: CustomerInterviewRecord | undefined,
): FeaturedCustomerInterview {
  if (!record) {
    throw new Error("고객 인터뷰 데이터가 필요합니다.");
  }

  const quote = getCustomerInterviewQuote(record);
  const projectName =
    record.featured?.projectName ??
    getCustomerInterviewProjectValue(record, "deliverable") ??
    record.company;

  return {
    ...toCustomerInterviewCard(record),
    description: getCustomerInterviewIntro(record),
    headlineLines: record.featured?.headlineLines ?? [quote],
    projectName,
  };
}

export const customerInterviews = customerInterviewRecords.map(
  toCustomerInterviewCard,
);

export const customerInterviewDetails = customerInterviewRecords.map(
  toCustomerInterviewDetail,
);

function getLatestCustomerInterviewRecord() {
  return customerInterviewRecordList.reduce<
    CustomerInterviewRecord | undefined
  >((latestRecord, record) => {
    if (!latestRecord) return record;

    return Date.parse(record.publishedAt) > Date.parse(latestRecord.publishedAt)
      ? record
      : latestRecord;
  }, undefined);
}

const featuredCustomerInterviewRecord =
  customerInterviewRecordList.find((record) => record.featured) ??
  getLatestCustomerInterviewRecord();

export const featuredCustomerInterview = createFeaturedCustomerInterview(
  featuredCustomerInterviewRecord,
);

export function getCustomerInterviewDetailBySlug(
  slug: string,
): CustomerInterviewDetail | undefined {
  return customerInterviewDetails.find((detail) => detail.slug === slug);
}

export function getCustomerInterviewDetailSeo(
  detail: CustomerInterviewDetail,
): CustomerInterviewDetailSeo {
  return {
    description: detail.seoDescription,
    keywords: [...detail.keywords],
    title: `${detail.title} | C-Brain`,
  };
}

export const customerTestimonials = [
  {
    body: "씨브레인에 카탈로그 제작할 때 당사의 브로슈어 니즈를 정확하게 파악해서 만족스러운 결과물이 나왔습니다. 9월 전시회를 앞두고 시간이 많지 않은 상황에서 빠른 인쇄를 해주셔서 감사했습니다.",
    company: "서진인스텍 · 제조업 · 경기도 성남",
    id: "seojin-instech-catalog-review",
    name: "최수* 책임님",
    publishedAt: "2026-07-01T00:00:00+09:00",
    title: "서진인스텍 카탈로그 제작 후기",
  },
  {
    body: "씨브레인의 가장 큰 장점은 가독성 있는 브로슈어 디자인입니다. 빠른 피드백과 원하는 방향을 신속하게 파악하여 효율적인 커뮤니케이션과 고품질 브로셔 디자인으로 만족스러운 결과물을 얻을 수 있었습니다.",
    company: "나인벨 헬스케어 · 헬스케어/제조업 · 경기도 성남",
    id: "ninebell-healthcare-brochure-review",
    name: "김윤* 팀장님",
    publishedAt: "2026-07-08T00:00:00+09:00",
    title: "나인벨 헬스케어 브로슈어 제작 후기",
  },
  {
    body: "씨브레인에 졸업 작품 완료 보고서 인쇄를 의뢰했습니다. 표지와 내지 퀄리티가 좋았고 3일 만에 완성되었습니다. 시간과 퀄리티 모두 지난해보다 매우 만족스럽습니다.",
    company: "청강문화산업대학교 · 교육기관 · 경기도 이천",
    id: "chungkang-college-report-review",
    name: "김현* 교수님",
    publishedAt: "2026-07-15T00:00:00+09:00",
    title: "청강문화산업대학교 완료보고서 제작 후기",
  },
  {
    body: "브로슈어에 담아야 할 정보가 많았는데, 복잡한 내용을 보기 쉽게 정리해 주셔서 영업 현장에서 바로 활용하기 좋았습니다.",
    company: "바이오 기업 · 제품 카탈로그 · 서울",
    id: "bio-company-product-catalog-review",
    name: "이수* 매니저님",
    publishedAt: "2026-07-16T00:00:00+09:00",
    title: "바이오 기업 제품 카탈로그 제작 후기",
  },
  {
    body: "담당 디자이너와 바로 소통할 수 있어서 수정 방향을 설명하기 편했습니다. 초안부터 납품까지 진행 상황이 명확했습니다.",
    company: "IT 기업 · 회사소개서 · 판교",
    id: "it-company-profile-review",
    name: "박민* 과장님",
    publishedAt: "2026-07-18T00:00:00+09:00",
    title: "IT 기업 회사소개서 제작 후기",
  },
  {
    body: "정찰제라 예산을 잡기 쉬웠고, 디자인과 인쇄를 한 번에 맡길 수 있어 내부 일정 관리 부담이 줄었습니다.",
    company: "공공기관 · 행사 홍보물 · 대전",
    id: "public-agency-promotion-review",
    name: "정다* 주임님",
    publishedAt: "2026-07-20T00:00:00+09:00",
    title: "공공기관 행사 홍보물 제작 후기",
  },
  {
    body: "분양 현장에서 사용할 브로슈어라 일정과 완성도가 모두 중요했습니다. 복잡한 입지 정보와 평면 자료를 보기 쉽게 정리해 주셨고, 인쇄와 납품 일정도 정확하게 맞춰주셨습니다.",
    company: "부동산 개발사 · 분양 브로슈어 · 서울",
    id: "real-estate-development-brochure-review",
    name: "윤서* 실장님",
    publishedAt: "2026-07-21T09:00:00+09:00",
    title: "부동산 개발사 분양 브로슈어 제작 후기",
  },
  {
    body: "환자분들이 검진 절차를 쉽게 이해할 수 있도록 안내책자의 정보 구조를 잘 정리해 주셨습니다. 수정 요청에도 빠르게 대응해 주셔서 원내 배포 일정에 맞춰 진행할 수 있었습니다.",
    company: "지역 종합병원 · 의료기관 · 경기도 수원",
    id: "general-hospital-health-guide-review",
    name: "한지* 주임님",
    publishedAt: "2026-07-21T13:00:00+09:00",
    title: "지역 종합병원 건강검진 안내책자 제작 후기",
  },
  {
    body: "연구 성과와 통계 자료가 많아 편집이 어려운 보고서였는데, 내용의 위계를 명확히 잡아주셔서 읽기 편한 결과물이 완성되었습니다. 교정 과정도 체계적이어서 안심하고 맡길 수 있었습니다.",
    company: "정부출연 연구기관 · 연구보고서 · 대전",
    id: "government-research-report-review",
    name: "오승* 선임님",
    publishedAt: "2026-07-22T09:00:00+09:00",
    title: "정부출연 연구기관 연차보고서 제작 후기",
  },
  {
    body: "제품 종류가 많고 사양도 복잡했지만 카테고리별로 한눈에 비교할 수 있도록 구성해 주셨습니다. 영업팀에서 고객 설명 자료로 활용하기 좋다는 반응이 많았습니다.",
    company: "건축 자재 기업 · 제품 카탈로그 · 인천",
    id: "building-material-catalog-review",
    name: "조현* 팀장님",
    publishedAt: "2026-07-22T15:00:00+09:00",
    title: "건축 자재 기업 제품 카탈로그 제작 후기",
  },
  {
    body: "공연 정보와 참여 단체 소개를 제한된 페이지 안에 효과적으로 배치해 주셨습니다. 현장 분위기와 잘 어울리는 디자인 덕분에 관람객 반응도 좋았습니다.",
    company: "지역 문화재단 · 행사 프로그램북 · 부산",
    id: "culture-foundation-program-book-review",
    name: "임가* 담당자님",
    publishedAt: "2026-07-23T10:00:00+09:00",
    title: "지역 문화재단 행사 프로그램북 제작 후기",
  },
  {
    body: "서비스의 장점을 짧고 명확하게 전달할 수 있도록 회사소개서의 흐름을 잡아주셨습니다. 미팅에서 바로 사용할 수 있는 PDF와 인쇄물을 함께 준비할 수 있어 효율적이었습니다.",
    company: "IT 스타트업 · 회사소개서 · 판교",
    id: "it-startup-company-profile-review",
    name: "강민* 대표님",
    publishedAt: "2026-07-24T09:00:00+09:00",
    title: "IT 스타트업 회사소개서 제작 후기",
  },
] as const satisfies readonly CustomerTestimonial[];

export type CustomerReviewPageData = {
  customerInterviews: CustomerInterviewCard[];
  customerTestimonials: CustomerTestimonial[];
  featuredCustomerInterview: FeaturedCustomerInterview | null;
};

export function getCustomerReviewPageData(): CustomerReviewPageData {
  return {
    customerInterviews: [...customerInterviews],
    customerTestimonials: [...customerTestimonials],
    featuredCustomerInterview,
  };
}

export function getLandingCustomerTestimonials(): CustomerTestimonial[] {
  return customerTestimonials.slice(0, 3);
}
