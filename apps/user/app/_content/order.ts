type OrderStepState = "active" | "inactive";
type OrderMethodTone = "brand" | "quote";

export type OrderStepId = "category" | "option" | "customer";

export type OrderMethod = {
  description: string;
  id: string;
  label: string;
  state: OrderStepState;
  title: string;
  tone: OrderMethodTone;
};

export const orderSteps = [
  { label: "Ⅰ. 카테고리 선택", state: "active" },
  { label: "Ⅱ. 옵션 선택", state: "inactive" },
  { label: "Ⅲ. 정보 입력", state: "inactive" },
  { label: "Ⅳ. 결제 완료", state: "inactive" },
] as const satisfies ReadonlyArray<{
  label: string;
  state: OrderStepState;
}>;

export const orderMethods = [
  {
    description:
      "규격·사양이 정해진 표준 제품\n사양 선택 → 가격 확인 → 카드 즉시결제",
    id: "direct",
    label: "바로 주문",
    state: "active",
    title: "정찰제 즉시결제",
    tone: "brand",
  },
  {
    description:
      "규격 협의 필요하거나 대량 주문\n카카오톡 1:1 상담으로 빠른 견적",
    id: "quote",
    label: "견적 후 주문",
    state: "inactive",
    title: "맞춤·대량·촬영",
    tone: "quote",
  },
] as const satisfies ReadonlyArray<OrderMethod>;

export type OrderOptionChoice = {
  id: string;
  label: string;
};

export type OrderQuantityOption = {
  id: string;
  printFee: number;
  quantity: string;
  total: number;
  unitPrice: string;
};

export type OrderServiceOption = {
  badge: string;
  description: string;
  fee: number;
  note: string;
  priceLabel: string;
  title: string;
};

export type OrderOptionConfig = {
  defaultPageId: string;
  defaultPaperId: string;
  defaultQuantityId: string;
  pageOptions: ReadonlyArray<OrderOptionChoice>;
  pageSectionTitle: string;
  paperOptions: ReadonlyArray<OrderOptionChoice>;
  paperSectionTitle: string;
  planningService: OrderServiceOption;
  quantityOptions: ReadonlyArray<OrderQuantityOption>;
  selectedService: OrderServiceOption;
  serviceId: string;
};

export type OrderSelectionSummary = {
  pageLabel: string;
  paperLabel: string;
  priceRows: ReadonlyArray<{
    label: string;
    value: number;
  }>;
  quantityLabel: string;
  serviceLabel: string;
  totalPrice: number;
};

export const formatOrderCurrency = (amount: number) =>
  `${amount.toLocaleString("ko-KR")}원`;

const brochureQuantityOptions = [
  {
    id: "500",
    printFee: 360000,
    quantity: "500부",
    total: 520000,
    unitPrice: "1,040원",
  },
  {
    id: "1000",
    printFee: 540000,
    quantity: "1,000부",
    total: 700000,
    unitPrice: "700원",
  },
  {
    id: "2000",
    printFee: 880000,
    quantity: "2,000부",
    total: 1040000,
    unitPrice: "520원",
  },
  {
    id: "3000",
    printFee: 1230000,
    quantity: "3,000부",
    total: 1390000,
    unitPrice: "463원",
  },
] as const satisfies ReadonlyArray<OrderQuantityOption>;

const createOptionConfig = ({
  pageOptions,
  paperOptions,
  quantityOptions,
  serviceId,
  selectedService,
}: {
  pageOptions: ReadonlyArray<OrderOptionChoice>;
  paperOptions: ReadonlyArray<OrderOptionChoice>;
  quantityOptions: ReadonlyArray<OrderQuantityOption>;
  serviceId: string;
  selectedService: OrderServiceOption;
}): OrderOptionConfig => {
  const defaultPage = pageOptions[0];
  const defaultPaper = paperOptions[0];
  const defaultQuantity = quantityOptions[0];

  if (!defaultPage || !defaultPaper || !defaultQuantity) {
    throw new Error(`Order option config for ${serviceId} needs defaults.`);
  }

  return {
    defaultPageId: defaultPage.id,
    defaultPaperId: defaultPaper.id,
    defaultQuantityId: defaultQuantity.id,
    pageOptions,
    pageSectionTitle: "III. 페이지 수 선택",
    paperOptions,
    paperSectionTitle: "IV. 용지 선택",
    planningService: {
      badge: "+ 선택 추가",
      description: "컨셉 방향·구성안·카피라이팅",
      fee: 100000,
      note: "규모에 따라 별도 상담",
      priceLabel: "+100,000원 ~",
      title: "기획",
    },
    quantityOptions,
    selectedService,
    serviceId,
  };
};

export const orderOptionCatalog = {
  "brochure-catalog": createOptionConfig({
    pageOptions: [
      { id: "8p", label: "8p" },
      { id: "12p", label: "12p" },
      { id: "16p", label: "16p" },
    ],
    paperOptions: [
      { id: "snow", label: "일반지 (스노우지 유광)" },
      { id: "rendezvous", label: "고급지 (랑데뷰 무광)" },
    ],
    quantityOptions: brochureQuantityOptions,
    serviceId: "brochure-catalog",
    selectedService: {
      badge: "기본 포함",
      description: "편집 디자인·후가공·인쇄 원스톱 진행",
      fee: 160000,
      note: "용지·페이지·수량에 따라 상이",
      priceLabel: "160,000원 ~",
      title: "디자인 + 인쇄",
    },
  }),
  "leaflet-pamphlet": createOptionConfig({
    pageOptions: [
      { id: "2fold", label: "2단" },
      { id: "3fold", label: "3단" },
      { id: "4fold", label: "4단" },
    ],
    paperOptions: [
      { id: "art", label: "아트지 150g" },
      { id: "snow", label: "스노우지 180g" },
    ],
    quantityOptions: [
      {
        id: "500",
        printFee: 260000,
        quantity: "500부",
        total: 420000,
        unitPrice: "840원",
      },
      {
        id: "1000",
        printFee: 400000,
        quantity: "1,000부",
        total: 560000,
        unitPrice: "560원",
      },
      {
        id: "2000",
        printFee: 660000,
        quantity: "2,000부",
        total: 820000,
        unitPrice: "410원",
      },
      {
        id: "3000",
        printFee: 930000,
        quantity: "3,000부",
        total: 1090000,
        unitPrice: "363원",
      },
    ],
    serviceId: "leaflet-pamphlet",
    selectedService: {
      badge: "기본 포함",
      description: "접지 구성·편집 디자인·인쇄 진행",
      fee: 160000,
      note: "접지·수량에 따라 상이",
      priceLabel: "160,000원 ~",
      title: "디자인 + 인쇄",
    },
  }),
  "poster-flyer": createOptionConfig({
    pageOptions: [
      { id: "a3", label: "A3" },
      { id: "a2", label: "A2" },
      { id: "a1", label: "A1" },
    ],
    paperOptions: [
      { id: "standard", label: "일반지 (스노우지 유광)" },
      { id: "thick", label: "고급지 250g" },
    ],
    quantityOptions: [
      {
        id: "100",
        printFee: 140000,
        quantity: "100부",
        total: 300000,
        unitPrice: "3,000원",
      },
      {
        id: "300",
        printFee: 240000,
        quantity: "300부",
        total: 400000,
        unitPrice: "1,333원",
      },
      {
        id: "500",
        printFee: 320000,
        quantity: "500부",
        total: 480000,
        unitPrice: "960원",
      },
      {
        id: "1000",
        printFee: 520000,
        quantity: "1,000부",
        total: 680000,
        unitPrice: "680원",
      },
    ],
    serviceId: "poster-flyer",
    selectedService: {
      badge: "기본 포함",
      description: "포스터·전단 편집 디자인 및 인쇄",
      fee: 160000,
      note: "규격·수량에 따라 상이",
      priceLabel: "160,000원 ~",
      title: "디자인 + 인쇄",
    },
  }),
  "banner-display": createOptionConfig({
    pageOptions: [
      { id: "basic", label: "기본형" },
      { id: "wide", label: "와이드" },
      { id: "custom", label: "맞춤형" },
    ],
    paperOptions: [
      { id: "pet", label: "PET 배너" },
      { id: "fabric", label: "패브릭 현수막" },
    ],
    quantityOptions: [
      {
        id: "1",
        printFee: 90000,
        quantity: "1개",
        total: 250000,
        unitPrice: "250,000원",
      },
      {
        id: "3",
        printFee: 210000,
        quantity: "3개",
        total: 370000,
        unitPrice: "123,333원",
      },
      {
        id: "5",
        printFee: 320000,
        quantity: "5개",
        total: 480000,
        unitPrice: "96,000원",
      },
      {
        id: "10",
        printFee: 560000,
        quantity: "10개",
        total: 720000,
        unitPrice: "72,000원",
      },
    ],
    serviceId: "banner-display",
    selectedService: {
      badge: "기본 포함",
      description: "배너 디자인·출력·후가공 진행",
      fee: 160000,
      note: "규격·소재에 따라 상이",
      priceLabel: "160,000원 ~",
      title: "디자인 + 출력",
    },
  }),
  "business-card-envelope": createOptionConfig({
    pageOptions: [
      { id: "business-card", label: "명함" },
      { id: "envelope", label: "봉투" },
      { id: "letterhead", label: "레터헤드" },
    ],
    paperOptions: [
      { id: "standard", label: "일반지" },
      { id: "premium", label: "고급지" },
    ],
    quantityOptions: [
      {
        id: "200",
        printFee: 70000,
        quantity: "200매",
        total: 230000,
        unitPrice: "1,150원",
      },
      {
        id: "500",
        printFee: 120000,
        quantity: "500매",
        total: 280000,
        unitPrice: "560원",
      },
      {
        id: "1000",
        printFee: 210000,
        quantity: "1,000매",
        total: 370000,
        unitPrice: "370원",
      },
      {
        id: "2000",
        printFee: 360000,
        quantity: "2,000매",
        total: 520000,
        unitPrice: "260원",
      },
    ],
    serviceId: "business-card-envelope",
    selectedService: {
      badge: "기본 포함",
      description: "명함·봉투 편집 디자인 및 인쇄",
      fee: 160000,
      note: "품목·수량에 따라 상이",
      priceLabel: "160,000원 ~",
      title: "디자인 + 인쇄",
    },
  }),
  logo: createOptionConfig({
    pageOptions: [
      { id: "basic", label: "베이직" },
      { id: "standard", label: "스탠다드" },
      { id: "premium", label: "프리미엄" },
    ],
    paperOptions: [
      { id: "digital", label: "디지털 파일" },
      { id: "guide", label: "가이드 포함" },
    ],
    quantityOptions: [
      {
        id: "1",
        printFee: 0,
        quantity: "1식",
        total: 360000,
        unitPrice: "360,000원",
      },
      {
        id: "2",
        printFee: 0,
        quantity: "2안",
        total: 520000,
        unitPrice: "260,000원",
      },
      {
        id: "3",
        printFee: 0,
        quantity: "3안",
        total: 680000,
        unitPrice: "226,667원",
      },
      {
        id: "4",
        printFee: 0,
        quantity: "4안",
        total: 840000,
        unitPrice: "210,000원",
      },
    ],
    serviceId: "logo",
    selectedService: {
      badge: "기본 포함",
      description: "로고 콘셉트 설계 및 디자인",
      fee: 360000,
      note: "제안안 수에 따라 상이",
      priceLabel: "360,000원 ~",
      title: "로고 디자인",
    },
  }),
  "package-shopping-bag": createOptionConfig({
    pageOptions: [
      { id: "label", label: "라벨" },
      { id: "box", label: "박스" },
      { id: "bag", label: "쇼핑백" },
    ],
    paperOptions: [
      { id: "standard", label: "일반 패키지지" },
      { id: "premium", label: "고급 패키지지" },
    ],
    quantityOptions: [
      {
        id: "500",
        printFee: 460000,
        quantity: "500개",
        total: 620000,
        unitPrice: "1,240원",
      },
      {
        id: "1000",
        printFee: 780000,
        quantity: "1,000개",
        total: 940000,
        unitPrice: "940원",
      },
      {
        id: "2000",
        printFee: 1320000,
        quantity: "2,000개",
        total: 1480000,
        unitPrice: "740원",
      },
      {
        id: "3000",
        printFee: 1830000,
        quantity: "3,000개",
        total: 1990000,
        unitPrice: "663원",
      },
    ],
    serviceId: "package-shopping-bag",
    selectedService: {
      badge: "기본 포함",
      description: "패키지 지기구조 디자인 및 인쇄",
      fee: 160000,
      note: "형태·후가공에 따라 상이",
      priceLabel: "160,000원 ~",
      title: "디자인 + 제작",
    },
  }),
} as const satisfies Record<string, OrderOptionConfig>;

export const getOrderOptionConfig = (serviceId: string): OrderOptionConfig =>
  orderOptionCatalog[serviceId as keyof typeof orderOptionCatalog] ??
  orderOptionCatalog["brochure-catalog"];
