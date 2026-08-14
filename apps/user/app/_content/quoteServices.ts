import type { IconName } from "../../components/Icon";

export type FixedQuoteService = {
  description: string;
  icon: IconName;
  id: string;
  isQuote: true;
  title: string;
};

export const fixedQuoteServices = [
  {
    id: "package-shopping-bag",
    icon: "package",
    title: "패키지 · 쇼핑백",
    description: "브랜드 아이덴티티를 담은 패키지 디자인 및 쇼핑백 제작.",
    isQuote: true,
  },
  {
    id: "photo-shoot",
    icon: "camera",
    title: "촬영",
    description: "제품·공간·인물 등 홍보물에 필요한 사진 촬영.\n견적 후 진행.",
    isQuote: true,
  },
  {
    id: "etc",
    icon: "dots-horizontal",
    title: "기타",
    description:
      "다이어리·캘린더, 스티커, 초청장 등 기타 맞춤 홍보물 제작. 외 품목은 카카오톡 1:1 문의.",
    isQuote: true,
  },
] as const satisfies readonly FixedQuoteService[];
