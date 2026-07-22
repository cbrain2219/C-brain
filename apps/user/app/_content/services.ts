import type { IconName } from "../../components/Icon";

export type ServiceItem = {
  description: string;
  icon: IconName;
  id: string;
  isQuote: boolean;
  price: string;
  title: string;
};

export const services = [
  {
    id: "brochure-catalog",
    icon: "book-open",
    title: "브로슈어 · 카탈로그",
    description:
      "기업소개, 제품 카탈로그 등 핵심 홍보물.\n기획부터 인쇄까지 원스톱",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    id: "leaflet-pamphlet",
    icon: "file-text",
    title: "리플렛 · 팜플렛",
    description: "단면, 양면, 접지 등 다양한 형태의 소책자 및 안내물 제작",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    id: "poster-flyer",
    icon: "megaphone",
    title: "포스터 · 전단지",
    description: "행사·이벤트·홍보용 포스터와 전단지. 빠른 납기 대응 가능.",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    id: "banner-display",
    icon: "flag",
    title: "배너 · 족자 · 현수막",
    description: "박람회, 매장, 행사장용 대형 출력물. 설치·운송 상담 가능.",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    id: "business-card-envelope",
    icon: "credit-card",
    title: "명함 · 봉투",
    description: "소량 명함부터 기업용 봉투 · 레터헤드까지 정찰제 가격 제공.",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    id: "logo",
    icon: "pen-tool",
    title: "로고",
    description:
      "브랜드의 첫인상을 결정하는 로고. 전략적 기획 + 감각적 디자인.",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    id: "package-shopping-bag",
    icon: "package",
    title: "패키지 · 쇼핑백",
    description: "브랜드 아이덴티티를 담은 패키지 디자인 및 쇼핑백 제작.",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    id: "photo-shoot",
    icon: "camera",
    title: "촬영",
    description: "제품·공간·인물 등 홍보물에 필요한 사진 촬영.\n견적 후 진행.",
    isQuote: true,
    price: "상담 후 견적",
  },
  {
    id: "etc",
    icon: "dots-horizontal",
    title: "기타",
    description:
      "다이어리·캘린더, 스티커, 초청장 등 기타 맞춤 홍보물 제작. 외 품목은 카카오톡 1:1 문의.",
    isQuote: true,
    price: "상담 후 견적",
  },
] as const satisfies ReadonlyArray<ServiceItem>;
