import type { ProductType } from "./categories.ts";

export const productSubtypeOptions = {
  "브로슈어 · 카탈로그": [],
  "리플렛 · 팜플렛": [],
  "포스터 · 전단지": ["포스터", "전단지"],
  "배너 · 족자 · 현수막": ["배너", "족자", "현수막"],
  "명함 · 봉투": ["명함", "봉투"],
  로고: [],
} as const satisfies Record<ProductType, readonly string[]>;

export type ProductSubtype =
  (typeof productSubtypeOptions)[ProductType][number];
export type ProductVariant = ProductType | ProductSubtype;

export const productOptionSectionKeys = [
  "pageCount",
  "paper",
  "thickness",
  "coverCoating",
  "size",
  "coating",
  "stand",
  "material",
  "side",
  "baseQuantity",
  "people",
  "logoType",
  "proposalCount",
  "rod",
  "hookCount",
  "cutting",
  "environment",
  "envelopeType",
] as const;

export type ProductOptionSectionKey =
  (typeof productOptionSectionKeys)[number];
export type ProductPriceSectionKey = "quantity";

export type ProductUiSection =
  | {
      inputMode: "numeric" | "text";
      key: ProductOptionSectionKey;
      kind: "options";
      label: string;
      valueUnit?: "p" | "부" | "명" | "개" | "장" | "종";
    }
  | {
      key: ProductPriceSectionKey;
      kind: "quantity-prices";
      label: string;
      quantityUnit: "부" | "개" | "장";
    };

export type ProductUiProfile = {
  estimateUnit: "페이지" | "시안";
  sections: readonly ProductUiSection[];
  showPlanningEstimate: boolean;
};

const brochureProfile = {
  estimateUnit: "페이지",
  showPlanningEstimate: true,
  sections: [
    {
      key: "pageCount",
      kind: "options",
      label: "페이지 수 선택",
      inputMode: "numeric",
      valueUnit: "p",
    },
    { key: "paper", kind: "options", label: "용지 선택", inputMode: "text" },
    {
      key: "thickness",
      kind: "options",
      label: "두께 선택",
      inputMode: "text",
    },
    {
      key: "coverCoating",
      kind: "options",
      label: "표지 코팅 선택",
      inputMode: "text",
    },
    {
      key: "quantity",
      kind: "quantity-prices",
      label: "수량 선택",
      quantityUnit: "부",
    },
  ],
} as const satisfies ProductUiProfile;

const leafletProfile = {
  estimateUnit: "페이지",
  showPlanningEstimate: true,
  sections: [
    { key: "size", kind: "options", label: "사이즈 선택", inputMode: "text" },
    { key: "paper", kind: "options", label: "용지 선택", inputMode: "text" },
    {
      key: "thickness",
      kind: "options",
      label: "두께 선택",
      inputMode: "text",
    },
    {
      key: "coverCoating",
      kind: "options",
      label: "표지 코팅 선택",
      inputMode: "text",
    },
    {
      key: "quantity",
      kind: "quantity-prices",
      label: "수량 선택",
      quantityUnit: "부",
    },
  ],
} as const satisfies ProductUiProfile;

const posterProfile = {
  estimateUnit: "페이지",
  showPlanningEstimate: true,
  sections: [
    { key: "size", kind: "options", label: "사이즈 선택", inputMode: "text" },
    { key: "paper", kind: "options", label: "용지", inputMode: "text" },
    {
      key: "thickness",
      kind: "options",
      label: "두께 선택",
      inputMode: "text",
    },
    { key: "coating", kind: "options", label: "코팅 선택", inputMode: "text" },
    {
      key: "quantity",
      kind: "quantity-prices",
      label: "수량 선택",
      quantityUnit: "장",
    },
  ],
} as const satisfies ProductUiProfile;

const flyerProfile = {
  estimateUnit: "페이지",
  showPlanningEstimate: true,
  sections: [
    { key: "size", kind: "options", label: "사이즈 선택", inputMode: "text" },
    { key: "paper", kind: "options", label: "용지", inputMode: "text" },
    {
      key: "thickness",
      kind: "options",
      label: "두께 선택",
      inputMode: "text",
    },
    { key: "side", kind: "options", label: "면 선택", inputMode: "text" },
    {
      key: "quantity",
      kind: "quantity-prices",
      label: "수량 선택",
      quantityUnit: "장",
    },
  ],
} as const satisfies ProductUiProfile;

const bannerProfile = {
  estimateUnit: "페이지",
  showPlanningEstimate: true,
  sections: [
    { key: "size", kind: "options", label: "사이즈", inputMode: "text" },
    { key: "stand", kind: "options", label: "거치대 선택", inputMode: "text" },
    { key: "material", kind: "options", label: "재질", inputMode: "text" },
    { key: "side", kind: "options", label: "면", inputMode: "text" },
    { key: "coating", kind: "options", label: "코팅", inputMode: "text" },
    {
      key: "quantity",
      kind: "quantity-prices",
      label: "수량 선택",
      quantityUnit: "개",
    },
  ],
} as const satisfies ProductUiProfile;

const scrollBannerProfile = {
  estimateUnit: "페이지",
  showPlanningEstimate: true,
  sections: [
    { key: "size", kind: "options", label: "사이즈 선택", inputMode: "text" },
    { key: "material", kind: "options", label: "재질 선택", inputMode: "text" },
    { key: "rod", kind: "options", label: "족자봉", inputMode: "text" },
    {
      key: "hookCount",
      kind: "options",
      label: "S고리",
      inputMode: "numeric",
      valueUnit: "개",
    },
    {
      key: "quantity",
      kind: "quantity-prices",
      label: "수량 선택",
      quantityUnit: "개",
    },
  ],
} as const satisfies ProductUiProfile;

const hangingBannerProfile = {
  estimateUnit: "페이지",
  showPlanningEstimate: true,
  sections: [
    { key: "size", kind: "options", label: "사이즈", inputMode: "text" },
    { key: "material", kind: "options", label: "재질", inputMode: "text" },
    { key: "cutting", kind: "options", label: "재단", inputMode: "text" },
    {
      key: "environment",
      kind: "options",
      label: "사용 환경",
      inputMode: "text",
    },
    {
      key: "quantity",
      kind: "quantity-prices",
      label: "수량 선택",
      quantityUnit: "개",
    },
  ],
} as const satisfies ProductUiProfile;

const businessCardProfile = {
  estimateUnit: "페이지",
  showPlanningEstimate: true,
  sections: [
    { key: "size", kind: "options", label: "사이즈", inputMode: "text" },
    {
      key: "baseQuantity",
      kind: "options",
      label: "기본 수량",
      inputMode: "text",
      valueUnit: "장",
    },
    {
      key: "material",
      kind: "options",
      label: "재질 선택",
      inputMode: "text",
    },
    {
      key: "thickness",
      kind: "options",
      label: "두께 선택",
      inputMode: "text",
    },
    {
      key: "people",
      kind: "options",
      label: "인원 선택",
      inputMode: "numeric",
      valueUnit: "명",
    },
  ],
} as const satisfies ProductUiProfile;

const envelopeProfile = {
  estimateUnit: "페이지",
  showPlanningEstimate: true,
  sections: [
    { key: "envelopeType", kind: "options", label: "종류", inputMode: "text" },
    { key: "material", kind: "options", label: "재질", inputMode: "text" },
    {
      key: "thickness",
      kind: "options",
      label: "두께 선택",
      inputMode: "text",
    },
    {
      key: "quantity",
      kind: "quantity-prices",
      label: "수량 선택",
      quantityUnit: "장",
    },
  ],
} as const satisfies ProductUiProfile;

const logoProfile = {
  estimateUnit: "시안",
  showPlanningEstimate: false,
  sections: [
    { key: "logoType", kind: "options", label: "유형", inputMode: "text" },
    {
      key: "proposalCount",
      kind: "options",
      label: "시안 개수",
      inputMode: "numeric",
      valueUnit: "종",
    },
  ],
} as const satisfies ProductUiProfile;

export const productUiProfiles = {
  "브로슈어 · 카탈로그": brochureProfile,
  "리플렛 · 팜플렛": leafletProfile,
  "포스터 · 전단지": posterProfile,
  "배너 · 족자 · 현수막": bannerProfile,
  "명함 · 봉투": businessCardProfile,
  로고: logoProfile,
} as const satisfies Record<ProductType, ProductUiProfile>;

const productSubtypeUiProfiles = {
  포스터: posterProfile,
  전단지: flyerProfile,
  배너: bannerProfile,
  족자: scrollBannerProfile,
  현수막: hangingBannerProfile,
  명함: businessCardProfile,
  봉투: envelopeProfile,
} as const satisfies Record<ProductSubtype, ProductUiProfile>;

const priceOptionKeysByVariant: Partial<
  Record<ProductVariant, readonly ProductOptionSectionKey[]>
> = {
  "브로슈어 · 카탈로그": [
    "pageCount",
    "paper",
    "thickness",
    "coverCoating",
  ],
  "리플렛 · 팜플렛": ["size", "paper", "thickness", "coverCoating"],
  포스터: ["size", "paper", "thickness", "coating"],
  전단지: ["size", "paper", "thickness", "side"],
  배너: ["size", "stand", "material", "side", "coating"],
  족자: ["size", "material", "rod", "hookCount"],
  현수막: ["size", "material", "cutting", "environment"],
  봉투: ["envelopeType", "material", "thickness"],
};

const serviceOptionKeysByVariant: Partial<
  Record<ProductVariant, readonly ProductOptionSectionKey[]>
> = {
  "리플렛 · 팜플렛": ["size"],
  전단지: ["side"],
  명함: ["material", "thickness"],
  로고: ["logoType"],
};

const estimateMultiplierOptionByVariant: Partial<
  Record<ProductVariant, ProductOptionSectionKey>
> = {
  "브로슈어 · 카탈로그": "pageCount",
  전단지: "side",
  명함: "people",
  로고: "proposalCount",
};

function getProductVariant(
  productType: ProductType,
  productSubtype: ProductSubtype | "" = "",
): ProductVariant {
  return productSubtype || productType;
}

function getPositiveInteger(value: string | undefined) {
  if (!value) return null;

  const match = value.replaceAll(",", "").match(/\d+/);
  if (!match) return null;

  const parsed = Number(match[0]);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getProductVariants(
  productType: ProductType,
): readonly ProductVariant[] {
  const subtypes = productSubtypeOptions[
    productType
  ] as readonly ProductSubtype[];

  return subtypes.length > 0 ? subtypes : [productType];
}

export function getProductUiProfile(
  productType: ProductType,
  productSubtype: ProductSubtype | "" = "",
) {
  return productSubtype
    ? productSubtypeUiProfiles[productSubtype]
    : productUiProfiles[productType];
}

export function getProductPriceOptionKeys(
  productType: ProductType,
  productSubtype: ProductSubtype | "" = "",
) {
  return priceOptionKeysByVariant[
    getProductVariant(productType, productSubtype)
  ] ?? [];
}

export function getProductServiceOptionKeys(
  productType: ProductType,
  productSubtype: ProductSubtype | "" = "",
) {
  return serviceOptionKeysByVariant[
    getProductVariant(productType, productSubtype)
  ] ?? [];
}

export function getProductSelectionKey(
  optionKeys: readonly ProductOptionSectionKey[],
  selectedOptionIndexes: Partial<Record<ProductOptionSectionKey, number>>,
) {
  return optionKeys
    .map((optionKey) => selectedOptionIndexes[optionKey] ?? 0)
    .join(":");
}

export function getProductEstimateMultiplier(
  productType: ProductType,
  productSubtype: ProductSubtype | "",
  selectedOptionValues: Partial<Record<ProductOptionSectionKey, string>>,
) {
  const variant = getProductVariant(productType, productSubtype);

  if (variant === "리플렛 · 팜플렛") return 6;

  const optionKey = estimateMultiplierOptionByVariant[variant];

  if (!optionKey) return 1;

  const value = selectedOptionValues[optionKey];

  if (optionKey === "side") {
    if (value?.includes("양면")) return 2;
    if (value?.includes("단면")) return 1;
  }

  return getPositiveInteger(value);
}
