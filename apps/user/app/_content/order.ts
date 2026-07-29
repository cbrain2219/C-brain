type OrderStepState = "active" | "inactive";
type OrderMethodTone = "brand" | "quote";

export type OrderStepId = "category" | "option" | "customer";

export const orderServiceSearchParam = "service";

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

export type OrderUnitPriceQuote = {
  pageId: string;
  paperId: string;
  quantityId: string;
  unitPrice: number;
};

export type OrderQuantityOption = {
  id: string;
  printFee: number;
  quantity: string;
  total: number;
  unitPrice: string;
  unitPriceAmount: number;
};

export type OrderServiceOption = {
  badge: string;
  description: string;
  fee: number;
  note: string;
  priceLabel: string;
  title: string;
};

export type AdminOrderProduct = {
  design_print_estimate: number;
  id: string;
  name: string;
  order_quantities: ReadonlyArray<number>;
  page_counts: ReadonlyArray<number>;
  paper_types: ReadonlyArray<string>;
  planning_estimate: number;
  type: string;
  unit_prices: Readonly<Record<string, number>>;
};

export type OrderProductRegistration = {
  designPrintService: OrderServiceOption;
  pageOptions: ReadonlyArray<OrderOptionChoice>;
  pageSectionTitle: string;
  paperOptions: ReadonlyArray<OrderOptionChoice>;
  paperSectionTitle: string;
  planningService: OrderServiceOption;
  quantities: ReadonlyArray<number>;
  serviceId: string;
  unitPriceQuotes: ReadonlyArray<OrderUnitPriceQuote>;
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
  quantities: ReadonlyArray<number>;
  selectedService: OrderServiceOption;
  serviceId: string;
  unitPriceQuotes: ReadonlyArray<OrderUnitPriceQuote>;
};

export type OrderSelectedOptionIds = {
  hasPlanning: boolean;
  pageId: string;
  paperId: string;
  quantityId: string;
  serviceId: string;
  unitPrice: number;
};

export type OrderSelectionSummary = {
  categoryLabel: string;
  ids: OrderSelectedOptionIds;
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

const orderQuantityUnit = "부";
const defaultPageSectionTitle = "III. 페이지 수 선택";
const defaultPaperSectionTitle = "IV. 용지 선택";

export const formatOrderCurrency = (amount: number) =>
  `${amount.toLocaleString("ko-KR")}원`;

const formatOrderQuantity = (amount: number) =>
  `${amount.toLocaleString("ko-KR")}${orderQuantityUnit}`;

const getAdminUnitPriceKey = (
  paperIndex: number,
  pageIndex: number,
  quantityIndex: number,
) => [paperIndex, pageIndex, quantityIndex].join(":");

const createAdminUnitPrices = (
  paperTypes: ReadonlyArray<string>,
  pageCounts: ReadonlyArray<number>,
  orderQuantities: ReadonlyArray<number>,
  unitPricesByQuantity: ReadonlyArray<number>,
) => {
  const unit_prices: Record<string, number> = {};

  paperTypes.forEach((_, paperIndex) => {
    pageCounts.forEach((__, pageIndex) => {
      orderQuantities.forEach((___, quantityIndex) => {
        const unitPrice = unitPricesByQuantity[quantityIndex];

        if (unitPrice !== undefined) {
          unit_prices[getAdminUnitPriceKey(paperIndex, pageIndex, quantityIndex)] =
            unitPrice;
        }
      });
    });
  });

  return unit_prices;
};

const createAdminOrderProduct = ({
  unitPricesByQuantity,
  ...product
}: Omit<AdminOrderProduct, "unit_prices"> & {
  unitPricesByQuantity: ReadonlyArray<number>;
}): AdminOrderProduct => ({
  ...product,
  unit_prices: createAdminUnitPrices(
    product.paper_types,
    product.page_counts,
    product.order_quantities,
    unitPricesByQuantity,
  ),
});

const toPageChoice = (pageCount: number): OrderOptionChoice => ({
  id: String(pageCount),
  label: `${pageCount}p`,
});

const toPaperChoice = (paperType: string, index: number): OrderOptionChoice => ({
  id: `paper-${index}`,
  label: paperType,
});

const toQuantityId = (quantity: number) => String(quantity);

const createPriceLabel = (fee: number) => `${formatOrderCurrency(fee)} ~`;
const createAdditionalPriceLabel = (fee: number) =>
  `+${formatOrderCurrency(fee)} ~`;

export function fromAdminProductToOrderRegistration(
  product: AdminOrderProduct,
): OrderProductRegistration {
  return {
    designPrintService: {
      badge: "기본 포함",
      description: "편집 디자인·후가공·인쇄 원스톱 진행",
      fee: product.design_print_estimate,
      note: "용지·페이지·수량에 따라 상이",
      priceLabel: createPriceLabel(product.design_print_estimate),
      title: "디자인 + 인쇄",
    },
    pageOptions: product.page_counts.map(toPageChoice),
    pageSectionTitle: defaultPageSectionTitle,
    paperOptions: product.paper_types.map(toPaperChoice),
    paperSectionTitle: defaultPaperSectionTitle,
    planningService: {
      badge: "+ 선택 추가",
      description: "컨셉 방향·구성안·카피라이팅",
      fee: product.planning_estimate,
      note: "페이지당 N만원",
      priceLabel: createAdditionalPriceLabel(product.planning_estimate),
      title: "기획",
    },
    quantities: product.order_quantities,
    serviceId: product.id,
    unitPriceQuotes: product.paper_types.flatMap((_, paperIndex) =>
      product.page_counts.flatMap((pageCount, pageIndex) =>
        product.order_quantities.flatMap((quantity, quantityIndex) => {
          const unitPrice =
            product.unit_prices[
              getAdminUnitPriceKey(paperIndex, pageIndex, quantityIndex)
            ];

          return unitPrice === undefined
            ? []
            : [
                {
                  pageId: String(pageCount),
                  paperId: `paper-${paperIndex}`,
                  quantityId: toQuantityId(quantity),
                  unitPrice,
                },
              ];
        }),
      ),
    ),
  };
}

const findUnitPriceQuote = (
  unitPriceQuotes: ReadonlyArray<OrderUnitPriceQuote>,
  pageId: string,
  paperId: string,
  quantityId: string,
) =>
  unitPriceQuotes.find(
    (quote) =>
      quote.pageId === pageId &&
      quote.paperId === paperId &&
      quote.quantityId === quantityId,
  );

function createQuantityOption(
  selectedService: OrderServiceOption,
  quantity: number,
  quote: OrderUnitPriceQuote,
): OrderQuantityOption {
  const total = quote.unitPrice * quantity;

  return {
    id: toQuantityId(quantity),
    printFee: Math.max(total - selectedService.fee, 0),
    quantity: formatOrderQuantity(quantity),
    total,
    unitPrice: formatOrderCurrency(quote.unitPrice),
    unitPriceAmount: quote.unitPrice,
  };
}

const createQuantityOptions = (
  source: Pick<
    OrderOptionConfig,
    "quantities" | "selectedService" | "unitPriceQuotes"
  >,
  pageId: string,
  paperId: string,
): ReadonlyArray<OrderQuantityOption> =>
  source.quantities.flatMap((quantity) => {
    const quote = findUnitPriceQuote(
      source.unitPriceQuotes,
      pageId,
      paperId,
      toQuantityId(quantity),
    );

    return quote
      ? [createQuantityOption(source.selectedService, quantity, quote)]
      : [];
  });

function createOrderOptionConfig(product: AdminOrderProduct): OrderOptionConfig {
  const registration = fromAdminProductToOrderRegistration(product);
  const selectedService = registration.designPrintService;
  const defaultPage = registration.pageOptions[0];
  const defaultPaper = registration.paperOptions[0];

  if (!defaultPage || !defaultPaper) {
    throw new Error(`Order option config for ${product.id} needs defaults.`);
  }

  const quantityOptions = createQuantityOptions(
    {
      quantities: registration.quantities,
      selectedService,
      unitPriceQuotes: registration.unitPriceQuotes,
    },
    defaultPage.id,
    defaultPaper.id,
  );
  const defaultQuantity = quantityOptions[0];

  if (!defaultQuantity) {
    throw new Error(`Order option config for ${product.id} needs prices.`);
  }

  return {
    defaultPageId: defaultPage.id,
    defaultPaperId: defaultPaper.id,
    defaultQuantityId: defaultQuantity.id,
    pageOptions: registration.pageOptions,
    pageSectionTitle: registration.pageSectionTitle,
    paperOptions: registration.paperOptions,
    paperSectionTitle: registration.paperSectionTitle,
    planningService: registration.planningService,
    quantities: registration.quantities,
    selectedService,
    serviceId: registration.serviceId,
    unitPriceQuotes: registration.unitPriceQuotes,
  };
}

export const getOrderQuantityOptions = (
  optionConfig: OrderOptionConfig,
  pageId: string,
  paperId: string,
): ReadonlyArray<OrderQuantityOption> =>
  createQuantityOptions(optionConfig, pageId, paperId);

const standardPaperTypes = ["일반지 (스노우지 유광)", "고급지 (랑데뷰 무광)"];
const standardPageCounts = [8, 16, 24];
const standardOrderQuantities = [500, 1000, 2000, 3000];

export const orderProductRegistrations = {
  "brochure-catalog": createAdminOrderProduct({
    design_print_estimate: 850000,
    id: "brochure-catalog",
    name: "브로슈어 · 카탈로그",
    order_quantities: standardOrderQuantities,
    page_counts: standardPageCounts,
    paper_types: standardPaperTypes,
    planning_estimate: 100000,
    type: "기업소개, 제품 카탈로그 등 핵심 홍보물. 기획부터 인쇄까지 원스톱",
    unitPricesByQuantity: [1040, 700, 520, 463],
  }),
  "leaflet-pamphlet": createAdminOrderProduct({
    design_print_estimate: 370000,
    id: "leaflet-pamphlet",
    name: "리플렛 · 팜플렛",
    order_quantities: standardOrderQuantities,
    page_counts: [2, 4, 6],
    paper_types: ["아트지 150g", "스노우지 180g"],
    planning_estimate: 100000,
    type: "단면, 양면, 접지 등 다양한 형태의 소책자 및 안내물 제작",
    unitPricesByQuantity: [840, 560, 410, 363],
  }),
  "poster-flyer": createAdminOrderProduct({
    design_print_estimate: 130000,
    id: "poster-flyer",
    name: "포스터 · 전단지",
    order_quantities: [100, 300, 500, 1000],
    page_counts: [1, 2, 3],
    paper_types: ["일반지 (스노우지 유광)", "고급지 250g"],
    planning_estimate: 100000,
    type: "행사·이벤트·홍보용 포스터와 전단지. 빠른 납기 대응 가능.",
    unitPricesByQuantity: [3000, 1333, 960, 680],
  }),
  "banner-display": createAdminOrderProduct({
    design_print_estimate: 80000,
    id: "banner-display",
    name: "배너 · 족자 · 현수막",
    order_quantities: [1, 3, 5, 10],
    page_counts: [1, 2, 3],
    paper_types: ["PET 배너", "패브릭 현수막"],
    planning_estimate: 100000,
    type: "박람회, 매장, 행사장용 대형 출력물. 설치·운송 상담 가능.",
    unitPricesByQuantity: [250000, 123333, 96000, 72000],
  }),
  "business-card-envelope": createAdminOrderProduct({
    design_print_estimate: 50000,
    id: "business-card-envelope",
    name: "명함 · 봉투",
    order_quantities: [200, 500, 1000, 2000],
    page_counts: [1, 2, 3],
    paper_types: ["일반지", "고급지"],
    planning_estimate: 100000,
    type: "소량 명함부터 기업용 봉투 · 레터헤드까지 정찰제 가격 제공.",
    unitPricesByQuantity: [1150, 560, 370, 260],
  }),
  logo: createAdminOrderProduct({
    design_print_estimate: 50000,
    id: "logo",
    name: "로고",
    order_quantities: [1, 2, 3, 4],
    page_counts: [1, 2, 3],
    paper_types: ["디지털 파일", "가이드 포함"],
    planning_estimate: 100000,
    type: "브랜드의 첫인상을 결정하는 로고. 전략적 기획 + 감각적 디자인.",
    unitPricesByQuantity: [360000, 260000, 226667, 210000],
  }),
  "package-shopping-bag": createAdminOrderProduct({
    design_print_estimate: 160000,
    id: "package-shopping-bag",
    name: "패키지 · 쇼핑백",
    order_quantities: standardOrderQuantities,
    page_counts: [1, 2, 3],
    paper_types: ["일반 패키지지", "고급 패키지지"],
    planning_estimate: 100000,
    type: "브랜드 아이덴티티를 담은 패키지 디자인 및 쇼핑백 제작.",
    unitPricesByQuantity: [1240, 940, 740, 663],
  }),
} as const satisfies Record<string, AdminOrderProduct>;

export type DirectOrderServiceId = keyof typeof orderProductRegistrations;

export type OrderDirectServiceHref =
  `/order?${typeof orderServiceSearchParam}=${DirectOrderServiceId}`;

export const getOrderDirectServiceHref = (
  serviceId: DirectOrderServiceId,
): OrderDirectServiceHref => `/order?${orderServiceSearchParam}=${serviceId}`;

export const orderOptionCatalog = Object.fromEntries(
  Object.entries(orderProductRegistrations).map(([serviceId, product]) => [
    serviceId,
    createOrderOptionConfig(product),
  ]),
) as Record<keyof typeof orderProductRegistrations, OrderOptionConfig>;

export const getOrderOptionConfig = (
  serviceId: string,
): OrderOptionConfig | undefined =>
  orderOptionCatalog[serviceId as keyof typeof orderOptionCatalog];
