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
      text: string;
      type: "paragraph";
    }
  | {
      text: string;
      type: "heading";
    }
  | {
      cite: string;
      text: string;
      type: "quote";
    };

export type CustomerInterviewProjectInfo = {
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
  seoDescription: string;
  slug: string;
  thumbnail: string;
  title: string;
  videoAlt: string;
};

export type CustomerInterviewDetailSeo = {
  description: string;
  keywords: string[];
  title: string;
};

export const featuredCustomerInterview = {
  company: "서진인스텍",
  title: "서진인스텍 — 씨브레인 고객 인터뷰",
  headline: "처음 맡겼는데 결과물이 기대 이상이였어요.",
  headlineLines: ["처음 맡겼는데", "결과물이 기대 이상이였어요."],
  body: [
    "청강문화산업대학교 게임콘텐츠스쿨 졸업생들이 직접 개발한 게임 프로젝트를 전시회에서 선보이기 위해 씨브레인에 완료보고서 제작을 의뢰한 사례입니다.",
    "고객이 직접 말하는 결과",
    "청강문화산업대학교 게임콘텐츠스쿨",
  ],
  quote:
    "완료보고서를 선보이면서 긍정적인 피드백을 받을 정도로 퀄리티가 좋았습니다.",
  detailSlug: "chungkang-college",
  meta: "서진인스텍 · 카탈로그 · 브로슈어",
  thumbnail: reviewInterviewImage,
  videoAlt: "서진인스텍 카탈로그 브로슈어 제작 고객 인터뷰 영상",
} as const;

export const customerInterviews = [
  {
    id: "seojin-instech",
    category: "제조",
    company: "서진인스텍",
    title: "서진인스텍 — 씨브레인 고객 인터뷰",
    quote: "빠른 피드백과 함께 원하는 부분을 잘 반영해 주셔서 만족합니다.",
    detailSlug: "seojin-instech",
    meta: "서진인스텍 · 카탈로그 · 브로슈어",
    thumbnail: reviewInterviewImage,
    videoAlt: "서진인스텍 카탈로그 브로슈어 제작 고객 인터뷰 영상",
  },
  {
    id: "ninebell-healthcare",
    category: "헬스케어",
    company: "나인벨 헬스케어",
    title: "나인벨 헬스케어 — 씨브레인 고객 인터뷰",
    quote:
      "효율적인 커뮤니케이션과 고품질 디자인으로 만족스러운 결과물을 얻었습니다.",
    detailSlug: "ninebell-healthcare",
    meta: "나인벨 헬스케어 · 브로슈어 · 리플렛",
    thumbnail: reviewInterviewHealthcareImage,
    videoAlt: "나인벨 헬스케어 브로슈어 리플렛 제작 고객 인터뷰 영상",
  },
  {
    id: "chungkang-college",
    category: "교육",
    company: "청강문화산업대학교",
    title: "청강문화산업대학교 — 씨브레인 고객 인터뷰",
    quote:
      "완료 보고서를 선보이면 긍정의 피드백을 받을 정도로 퀄리티가 좋았습니다.",
    detailSlug: "chungkang-college",
    meta: "청강문화산업대학교 · 보고서 · 책자",
    thumbnail: reviewInterviewEducationImage,
    videoAlt: "청강문화산업대학교 보고서 책자 제작 고객 인터뷰 영상",
  },
  {
    id: "seojin-instech-repeat",
    category: "제조",
    company: "서진인스텍",
    title: "서진인스텍 — 씨브레인 고객 인터뷰",
    quote: "빠른 피드백과 함께 원하는 부분을 잘 반영해 주셔서 만족합니다.",
    detailSlug: "seojin-instech",
    meta: "서진인스텍 · 카탈로그 · 브로슈어",
    thumbnail: reviewInterviewImage,
    videoAlt: "서진인스텍 카탈로그 브로슈어 제작 고객 인터뷰 영상",
  },
  {
    id: "ninebell-healthcare-repeat",
    category: "헬스케어",
    company: "나인벨 헬스케어",
    title: "나인벨 헬스케어 — 씨브레인 고객 인터뷰",
    quote:
      "효율적인 커뮤니케이션과 고품질 디자인으로 만족스러운 결과물을 얻었습니다.",
    detailSlug: "ninebell-healthcare",
    meta: "나인벨 헬스케어 · 브로슈어 · 리플렛",
    thumbnail: reviewInterviewHealthcareImage,
    videoAlt: "나인벨 헬스케어 브로슈어 리플렛 제작 고객 인터뷰 영상",
  },
  {
    id: "chungkang-college-repeat",
    category: "교육",
    company: "청강문화산업대학교",
    title: "청강문화산업대학교 — 씨브레인 고객 인터뷰",
    quote:
      "완료 보고서를 선보이면 긍정의 피드백을 받을 정도로 퀄리티가 좋았습니다.",
    detailSlug: "chungkang-college",
    meta: "청강문화산업대학교 · 보고서 · 책자",
    thumbnail: reviewInterviewEducationImage,
    videoAlt: "청강문화산업대학교 보고서 책자 제작 고객 인터뷰 영상",
  },
] as const;

export const customerInterviewDetails = [
  {
    author: "씨브레인",
    category: "고객 인터뷰",
    company: "서진인스텍",
    content: [
      {
        text: "서진인스텍은 전시회와 영업 현장에서 활용할 카탈로그·브로슈어 제작을 씨브레인에 의뢰한 사례입니다.",
        type: "paragraph",
      },
      {
        text: "어떤 상황이었나요?",
        type: "heading",
      },
      {
        text: "제품 정보를 명확하게 전달하면서도 촉박한 일정 안에 인쇄까지 마무리해야 했습니다. 복잡한 내용을 보기 쉽게 정리하고 빠른 피드백이 가능한 제작 파트너가 필요했습니다.",
        type: "paragraph",
      },
      {
        text: "씨브레인은 어떻게 해결했나요?",
        type: "heading",
      },
      {
        text: "브로슈어의 핵심 정보 구조를 정리하고 수정 요청을 빠르게 반영해 디자인과 인쇄를 함께 진행했습니다. 전시 일정에 맞춰 현장에서 바로 활용할 수 있는 제작물로 마무리했습니다.",
        type: "paragraph",
      },
      {
        text: "고객이 직접 말하는 결과",
        type: "heading",
      },
      {
        cite: "서진인스텍",
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
        label: "의뢰처",
        value: "서진인스텍",
      },
      {
        label: "제작물",
        value: "카탈로그 · 브로슈어",
      },
      {
        label: "활용",
        value: "전시회 배포 · 영업 자료 활용",
      },
    ],
    projectInfoTitle: "프로젝트 정보",
    seoDescription:
      "서진인스텍의 카탈로그·브로슈어 제작 사례와 씨브레인 고객 인터뷰를 확인하세요.",
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
        text: "나인벨 헬스케어는 서비스와 제품 정보를 더 읽기 쉬운 형태로 전달하기 위해 씨브레인에 브로슈어·리플렛 제작을 의뢰한 사례입니다.",
        type: "paragraph",
      },
      {
        text: "어떤 상황이었나요?",
        type: "heading",
      },
      {
        text: "전문적인 헬스케어 정보를 고객이 쉽게 이해할 수 있도록 정리해야 했습니다. 정보량이 많아 가독성 있는 구조와 안정적인 디자인 톤이 중요했습니다.",
        type: "paragraph",
      },
      {
        text: "씨브레인은 어떻게 해결했나요?",
        type: "heading",
      },
      {
        text: "핵심 메시지를 우선순위에 맞게 재배치하고, 시각 요소와 문단 흐름을 정리해 현장에서 설명 자료로 바로 사용할 수 있는 브로슈어·리플렛으로 완성했습니다.",
        type: "paragraph",
      },
      {
        text: "고객이 직접 말하는 결과",
        type: "heading",
      },
      {
        cite: "나인벨 헬스케어",
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
        label: "의뢰처",
        value: "나인벨 헬스케어",
      },
      {
        label: "제작물",
        value: "브로슈어 · 리플렛",
      },
      {
        label: "활용",
        value: "제품 소개 · 고객 상담 자료 활용",
      },
    ],
    projectInfoTitle: "프로젝트 정보",
    seoDescription:
      "나인벨 헬스케어의 브로슈어·리플렛 제작 사례와 씨브레인 고객 인터뷰를 확인하세요.",
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
        text: "청강문화산업대학교 게임콘텐츠스쿨 졸업생들이 직접 개발한 게임 프로젝트를 전시회에서 선보이기 위해 씨브레인에 완료보고서 제작을 의뢰한 사례입니다.",
        type: "paragraph",
      },
      {
        text: "어떤 상황이었나요?",
        type: "heading",
      },
      {
        text: "졸업생들이 직접 만든 게임을 업계 관계자와 일반 관람객에게 공개 전시할 예정이었습니다. 프로젝트의 완성도를 눈으로 전달할 수 있는 보고서가 필요했고, 단순 학교 과제물이 아닌 상용화 가능성을 보여줄 수 있는 퀄리티가 요구됐습니다.",
        type: "paragraph",
      },
      {
        text: "씨브레인은 어떻게 해결했나요?",
        type: "heading",
      },
      {
        text: "게임의 콘셉트·개발 과정·결과물을 체계적으로 정리한 완료보고서를 제작했습니다. 전시 현장에서 외부 관람객이 실제로 상용화 가능성을 묻고 긍정적 피드백을 줄 수 있을 만큼의 디자인 완성도를 목표로 작업했습니다.",
        type: "paragraph",
      },
      {
        text: "고객이 직접 말하는 결과",
        type: "heading",
      },
      {
        cite: "청강문화산업대학교 게임콘텐츠스쿨",
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
        label: "의뢰처",
        value: "청강문화산업대학교 게임콘텐츠스쿨",
      },
      {
        label: "제작물",
        value: "게임 졸업 프로젝트 완료보고서",
      },
      {
        label: "활용",
        value: "졸업작품 전시회 배포 · 상용화 피드백 수집",
      },
    ],
    projectInfoTitle: "프로젝트 정보",
    seoDescription:
      "청강문화산업대학교 게임콘텐츠스쿨의 게임 졸업 프로젝트 완료보고서 제작 사례와 씨브레인 고객 인터뷰를 확인하세요.",
    slug: "chungkang-college",
    thumbnail: reviewInterviewImage,
    title:
      "[게임 졸업작품 완료보고서] 청강문화산업대학교가 씨브레인을 선택한 이유",
    videoAlt:
      "청강문화산업대학교 게임콘텐츠스쿨 완료보고서 제작 고객 인터뷰 영상",
  },
] as const satisfies readonly CustomerInterviewDetail[];

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
    name: "최수* 책임님",
    company: "서진인스텍 · 제조업 · 경기도 성남",
  },
  {
    body: "씨브레인의 가장 큰 장점은 가독성 있는 브로슈어 디자인입니다. 빠른 피드백과 원하는 방향을 신속하게 파악하여 효율적인 커뮤니케이션과 고품질 브로셔 디자인으로 만족스러운 결과물을 얻을 수 있었습니다.",
    name: "김윤* 팀장님",
    company: "나인벨 헬스케어 · 헬스케어/제조업 · 경기도 성남",
  },
  {
    body: "씨브레인에 학생들의 졸업 작품 완료 보고서 인쇄 제작을 의뢰했습니다. 표지와 내지의 퀄리티가 정말 좋았고, 인쇄는 3일 만에 완성되었습니다. 시간적으로나 퀄리티 측면에서 지난해보다 매우 만족스럽게 진행되었습니다.",
    name: "김현* 교수님",
    company: "청강문화산업대학교 · 교육기관 · 경기도 이천",
  },
  {
    body: "브로슈어에 담아야 할 정보가 많았는데, 복잡한 내용을 보기 쉽게 정리해 주셔서 영업 현장에서 바로 활용하기 좋았습니다.",
    name: "이수* 매니저님",
    company: "바이오 기업 · 제품 카탈로그 · 서울",
  },
  {
    body: "담당 디자이너와 바로 소통할 수 있어서 수정 방향을 설명하기 편했습니다. 초안부터 납품까지 진행 상황이 명확했습니다.",
    name: "박민* 과장님",
    company: "IT 기업 · 회사소개서 · 판교",
  },
  {
    body: "정찰제라 예산을 잡기 쉬웠고, 디자인과 인쇄를 한 번에 맡길 수 있어 내부 일정 관리 부담이 줄었습니다.",
    name: "정다* 주임님",
    company: "공공기관 · 행사 홍보물 · 대전",
  },
] as const;
