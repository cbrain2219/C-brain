import type { IconName } from "../../components/Icon";

import { KAKAO_CHANNEL_URL } from "./contact";

export const companyMetrics = [
  { label: "업력", value: "26년", description: "2000년 씨브레인 설립" },
  {
    label: "누적 고객사",
    value: "1,200곳+",
    description: "전국 기업 · 공공기관",
  },
  {
    label: "누적 제작 건수",
    value: "4,000건+",
    description: "브로슈어 · 카탈로그 · 리플렛 등",
  },
  {
    label: "대형 박람회 협력",
    value: "15년 연속",
    description: "킨텍스 · 나라장터 엑스포",
  },
] as const;

export const companyReasons = [
  {
    label: "STRENGTH 01 · 26년 업력",
    title: "2000년부터 홍보물 한 분야에만 집중",
    description:
      "누적된 노하우가 결과물의 퀄리티를 보장합니다. 26년간 쌓아온 경험은 어떤 업종, 어떤 규모의 홍보물도 자신 있게 소화할 수 있는 기반입니다.",
  },
  {
    label: "STRENGTH 02 · 전담 디자이너",
    title: "담당자가 처음부터 끝까지 책임 진행",
    description:
      "1:1 전담 디자이너가 처음부터 끝까지 빠르게 소통하며 책임 진행합니다. 중간에 담당자가 바뀌지 않습니다.",
  },
  {
    label: "STRENGTH 03 · 원스톱 제작",
    title: "기획부터 납품까지 씨브레인 한 곳에서 완결",
    description:
      "별도 인쇄소·디자인 에이전시가 필요 없습니다. 소통 비용과 시간을 줄이고, 일관된 품질로 완성도 높은 홍보물을 받아보실 수 있습니다.",
  },
  {
    label: "STRENGTH 04 · 정찰제 가격",
    title: "복잡한 견적 없이 합리적인 정찰제 공개",
    description:
      "불필요한 가격 협상에 시간을 낭비하지 않습니다. 명확한 가격 기준으로 신뢰를 드립니다.",
  },
  {
    label: "STRENGTH 05 · 박람회 협력",
    title: "킨텍스 코리아나라장터엑스포 등 대형 박람회 15년 연속 공식 협력",
    description:
      "전시·박람회 홍보물 제작의 실전 노하우로 박람회 일정에 맞춘 빠른 납기와 현장 경험에서 나온 최적의 홍보물 솔루션을 제안해 드립니다.",
  },
] as const;

export const companyHistorySummary = [
  "코리아나라장터엑스포 15년 연속 공식 협력",
  "성남시·경기도교육청·정부조달우수제품협회 등 공공기관 다수",
  "제조·병원·의료·교육·바이오·IT·부동산·공공기관 등 전 산업군 1,200건+ 파트너십 보유",
] as const;

export const companyTimelineDesktop = [
  {
    year: "2000",
    title:
      "브로슈어·카탈로그 및 각종 홍보물 기획·디자인·인쇄 전문 기업으로 창립",
    detail: "(상호명 : 원음디자인)",
  },
  {
    year: "2004",
    title: "상호명 씨브레인으로 변경",
  },
  {
    year: "2006",
    title:
      "누적 파트너십 120사 달성, 제조·교육·의료 업종 다변화 및 인쇄 통합 제작 시작",
  },
  {
    year: "2010",
    title: "코리아 나라장터엑스포 공식 협력사 선정",
    detail: "이후 15년 연속 협력 지속",
    tag: "15년 연속",
  },
  {
    year: "2010",
    title: "수송장비엑스포 공식 협력사 선정",
  },
  {
    year: "2011",
    title: "베이비키즈페어 공식 협력사 선정",
    detail: "이후 8년 연속 협력 지속",
    tag: "8년 연속",
  },
  {
    year: "2011",
    title: [{ text: "안티에이징 엑스포 공식 협력사 선정", strong: true }],
  },
  {
    year: "2013",
    title: "세계여성발명품 박람회 공식 협력사 선정",
    detail: "4년 연속 협력 지속",
    tag: "4년 연속",
  },
  {
    year: "2015",
    title: [{ text: "누적 450사 달성", strong: true }],
    detail: "킨텍스 대형 박람회 협력 확대 및 원스톱 시스템 완성",
  },
  {
    year: "2020",
    title: [{ text: "누적 800사 달성", strong: true }],
    detail: "바이오·IT·부동산·공공기관 등 전 산업군으로 확장",
  },
  {
    year: "2025",
    title: [
      { text: "누적 1,200+사 이상", strong: true },
      ", 15년 나라장터 협력",
    ],
  },
  {
    year: "2026",
    title:
      "26년 업력·제조·병원·의료·교육·바이오·IT·부동산·공공기관 등 전 산업군 대응",
    tag: "현재",
  },
] as const;

export const companyTimelineCompact = [
  {
    year: "2000",
    title:
      "브로슈어·카탈로그 및 각종 홍보물 기획·디자인·인쇄 전문 기업으로 창립",
    detail: "(상호명: 원음디자인)",
  },
  {
    year: "2004",
    title: [
      "상호명 ",
      { text: "씨브레인(C-Brain)", strong: true },
      "으로 변경",
    ],
  },
  {
    year: "2005",
    title: [
      "경기도 성남시 소재, 홈페이지 ",
      { text: "cbrain.kr", strong: true },
      " 운영 시작",
    ],
  },
  {
    year: "2006",
    title: ["누적 파트너십 ", { text: "120사 달성", strong: true }],
    detail: "제조·교육·의료 업종 다변화 및 인쇄 통합 제작 시작",
  },
  {
    year: "2010",
    title: [{ text: "코리아나라장터엑스포 공식 협력사 선정", strong: true }],
    detail: "이후 15년 연속 협력 지속 / 수송장비엑스포 공식 협력사 선정",
    tag: "15년 연속",
  },
  {
    year: "2011",
    title: [{ text: "베이비키즈페어 공식 협력사 선정", strong: true }],
    detail: "이후 8년 연속 협력 지속 / 안티에이징 엑스포 공식 협력사 선정",
  },
  {
    year: "2013",
    title: [{ text: "세계여성발명품 박람회 공식 협력사 선정", strong: true }],
    detail: "4년 연속 협력 지속",
  },
  {
    year: "2015",
    title: ["누적 ", { text: "450사 달성", strong: true }],
    detail: "킨텍스 대형 박람회 협력 확대 및 원스톱 시스템 완성",
  },
  {
    year: "2020",
    title: ["누적 ", { text: "800사 달성", strong: true }],
    detail: "바이오·IT·부동산·공공기관 등 전 산업군으로 확장",
  },
  {
    year: "2026",
    title: ["누적 ", { text: "1,200+사 달성", strong: true }],
    detail: "26년 업력·15년 나라장터 연속 협력",
    tag: "현재",
  },
] as const;

export const companyChannels: {
  icon: IconName;
  title: string;
  description: string;
  href: string;
}[] = [
  {
    icon: "channel-message-typing",
    title: "카카오톡 1:1 상담",
    description: "빠른 견적 및 상담",
    href: KAKAO_CHANNEL_URL,
  },
  {
    icon: "channel-home-02",
    title: "공식 홈페이지",
    description: "cbrain.kr",
    href: "https://cbrain.kr",
  },
  {
    icon: "channel-naver-blog",
    title: "네이버 블로그",
    description: "제작 가이드 & 노하우",
    href: "https://blog.naver.com/cbrain_design_group",
  },
  {
    icon: "channel-instagram",
    title: "인스타그램",
    description: "포트폴리오 & 디자인 꿀팁",
    href: "https://instagram.com/cbrain_design_group",
  },
  {
    icon: "channel-youtube",
    title: "유튜브",
    description: "회사소개 & 고객인터뷰",
    href: "https://www.youtube.com/@CreateDesigngroup",
  },
];

export const companyInfoRows = [
  { label: "회사명", value: "씨브레인 (C-Brain)" },
  { label: "대표자", value: "정혜영" },
  {
    label: "소재지",
    value: [
      "경기도 성남시 중원구 사기막골로 99",
      "센트럴비즈타워2차 B타워 218호 (13201)",
    ],
  },
  {
    label: "취급 서비스",
    value: [
      "브로슈어·카탈로그·리플렛·팜플렛·포스터·명함·배너·패키지 등",
      "홍보물 기획·디자인·인쇄",
    ],
  },
  { label: "서비스 지역", value: "전국 납품 가능" },
  { label: "전화", value: "070-8830-2219" },
  {
    label: "운영시간",
    value: ["월~목 8:00–17:00 / 금 8:00–16:00", "점심시간 11:00–12:30"],
  },
  { label: "이메일", value: "jhy@cbrain.kr" },
  { label: "사업자등록번호", value: "120-07-84415" },
  { label: "통신판매 신고번호", value: "2022-성남중원-0006" },
] as const;
