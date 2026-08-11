export const productTypes = [
  '브로슈어 · 카탈로그',
  '리플렛 · 팜플렛',
  '포스터 · 전단지',
  '배너 · 족자 · 현수막',
  '명함 · 봉투',
  '로고',
] as const

export type ProductType = (typeof productTypes)[number]

export const productSubtypeOptions = {
  '브로슈어 · 카탈로그': [],
  '리플렛 · 팜플렛': [],
  '포스터 · 전단지': ['포스터', '전단지'],
  '배너 · 족자 · 현수막': ['배너', '족자', '현수막'],
  '명함 · 봉투': ['명함', '봉투'],
  로고: [],
} as const satisfies Record<ProductType, readonly string[]>

export type ProductSubtype = (typeof productSubtypeOptions)[ProductType][number]

export type ProductVariant = ProductType | ProductSubtype

export function getProductVariants(
  productType: ProductType,
): readonly ProductVariant[] {
  const subtypes = productSubtypeOptions[
    productType
  ] as readonly ProductSubtype[]

  return subtypes.length > 0 ? subtypes : [productType]
}

export type ProductOptionSectionKey =
  | 'pageCount'
  | 'paper'
  | 'thickness'
  | 'coverCoating'
  | 'size'
  | 'coating'
  | 'stand'
  | 'material'
  | 'side'
  | 'baseQuantity'
  | 'people'
  | 'logoType'
  | 'proposalCount'
  | 'rod'
  | 'hookCount'
  | 'cutting'
  | 'environment'
  | 'envelopeType'

export type ProductPriceSectionKey = 'quantity'

export type ProductUiSection =
  | {
      inputMode: 'numeric' | 'text'
      key: ProductOptionSectionKey
      kind: 'options'
      label: string
      valueUnit?: 'p' | '부' | '명' | '개' | '장' | '종'
    }
  | {
      key: ProductPriceSectionKey
      kind: 'quantity-prices'
      label: string
      quantityUnit: '부' | '개' | '장'
    }

export type ProductUiProfile = {
  estimateUnit: '페이지' | '시안'
  sections: readonly ProductUiSection[]
  showPlanningEstimate: boolean
}

export type QuantityPriceDraft = {
  quantity: string
  unitPrice: string
}

export type ServiceEstimateDraft = {
  designPrintEstimate: string
  planningEstimate: string
}

export type ProductUiDraft = {
  optionValues: Partial<Record<ProductOptionSectionKey, string[]>>
  priceRowsBySelection: Record<string, QuantityPriceDraft[]>
  productSubtype: ProductSubtype | ''
  productType: ProductType | ''
  selectedOptionIndexes: Partial<Record<ProductOptionSectionKey, number>>
  serviceEstimatesBySelection: Record<string, ServiceEstimateDraft>
}

const brochureProfile = {
  estimateUnit: '페이지',
  showPlanningEstimate: true,
  sections: [
    {
      key: 'pageCount',
      kind: 'options',
      label: '페이지 수 선택',
      inputMode: 'numeric',
      valueUnit: 'p',
    },
    { key: 'paper', kind: 'options', label: '용지 선택', inputMode: 'text' },
    {
      key: 'thickness',
      kind: 'options',
      label: '두께 선택',
      inputMode: 'text',
    },
    {
      key: 'coverCoating',
      kind: 'options',
      label: '표지 코팅 선택',
      inputMode: 'text',
    },
    {
      key: 'quantity',
      kind: 'quantity-prices',
      label: '수량 선택',
      quantityUnit: '부',
    },
  ],
} as const satisfies ProductUiProfile

const leafletProfile = {
  estimateUnit: '페이지',
  showPlanningEstimate: true,
  sections: [
    { key: 'size', kind: 'options', label: '사이즈 선택', inputMode: 'text' },
    { key: 'paper', kind: 'options', label: '용지 선택', inputMode: 'text' },
    {
      key: 'thickness',
      kind: 'options',
      label: '두께 선택',
      inputMode: 'text',
    },
    {
      key: 'coverCoating',
      kind: 'options',
      label: '표지 코팅 선택',
      inputMode: 'text',
    },
    {
      key: 'quantity',
      kind: 'quantity-prices',
      label: '수량 선택',
      quantityUnit: '부',
    },
  ],
} as const satisfies ProductUiProfile

const posterProfile = {
  estimateUnit: '페이지',
  showPlanningEstimate: true,
  sections: [
    { key: 'size', kind: 'options', label: '사이즈 선택', inputMode: 'text' },
    { key: 'paper', kind: 'options', label: '용지', inputMode: 'text' },
    {
      key: 'thickness',
      kind: 'options',
      label: '두께 선택',
      inputMode: 'text',
    },
    {
      key: 'coating',
      kind: 'options',
      label: '코팅 선택',
      inputMode: 'text',
    },
    {
      key: 'quantity',
      kind: 'quantity-prices',
      label: '수량 선택',
      quantityUnit: '장',
    },
  ],
} as const satisfies ProductUiProfile

const flyerProfile = {
  estimateUnit: '페이지',
  showPlanningEstimate: true,
  sections: [
    { key: 'size', kind: 'options', label: '사이즈 선택', inputMode: 'text' },
    { key: 'paper', kind: 'options', label: '용지', inputMode: 'text' },
    {
      key: 'thickness',
      kind: 'options',
      label: '두께 선택',
      inputMode: 'text',
    },
    { key: 'side', kind: 'options', label: '면 선택', inputMode: 'text' },
    {
      key: 'quantity',
      kind: 'quantity-prices',
      label: '수량 선택',
      quantityUnit: '장',
    },
  ],
} as const satisfies ProductUiProfile

const bannerProfile = {
  estimateUnit: '페이지',
  showPlanningEstimate: true,
  sections: [
    { key: 'size', kind: 'options', label: '사이즈', inputMode: 'text' },
    {
      key: 'stand',
      kind: 'options',
      label: '거치대 선택',
      inputMode: 'text',
    },
    { key: 'material', kind: 'options', label: '재질', inputMode: 'text' },
    { key: 'side', kind: 'options', label: '면', inputMode: 'text' },
    { key: 'coating', kind: 'options', label: '코팅', inputMode: 'text' },
    {
      key: 'quantity',
      kind: 'quantity-prices',
      label: '수량 선택',
      quantityUnit: '개',
    },
  ],
} as const satisfies ProductUiProfile

const scrollBannerProfile = {
  estimateUnit: '페이지',
  showPlanningEstimate: true,
  sections: [
    { key: 'size', kind: 'options', label: '사이즈 선택', inputMode: 'text' },
    {
      key: 'material',
      kind: 'options',
      label: '재질 선택',
      inputMode: 'text',
    },
    { key: 'rod', kind: 'options', label: '족자봉', inputMode: 'text' },
    {
      key: 'hookCount',
      kind: 'options',
      label: 'S고리',
      inputMode: 'numeric',
      valueUnit: '개',
    },
    {
      key: 'quantity',
      kind: 'quantity-prices',
      label: '수량 선택',
      quantityUnit: '개',
    },
  ],
} as const satisfies ProductUiProfile

const hangingBannerProfile = {
  estimateUnit: '페이지',
  showPlanningEstimate: true,
  sections: [
    { key: 'size', kind: 'options', label: '사이즈', inputMode: 'text' },
    { key: 'material', kind: 'options', label: '재질', inputMode: 'text' },
    { key: 'cutting', kind: 'options', label: '재단', inputMode: 'text' },
    {
      key: 'environment',
      kind: 'options',
      label: '사용 환경',
      inputMode: 'text',
    },
    {
      key: 'quantity',
      kind: 'quantity-prices',
      label: '수량 선택',
      quantityUnit: '개',
    },
  ],
} as const satisfies ProductUiProfile

const businessCardProfile = {
  estimateUnit: '페이지',
  showPlanningEstimate: true,
  sections: [
    { key: 'size', kind: 'options', label: '사이즈', inputMode: 'text' },
    {
      key: 'baseQuantity',
      kind: 'options',
      label: '기본 수량',
      inputMode: 'text',
      valueUnit: '장',
    },
    {
      key: 'material',
      kind: 'options',
      label: '재질 선택',
      inputMode: 'text',
    },
    {
      key: 'thickness',
      kind: 'options',
      label: '두께 선택',
      inputMode: 'text',
    },
    {
      key: 'people',
      kind: 'options',
      label: '인원 선택',
      inputMode: 'numeric',
      valueUnit: '명',
    },
  ],
} as const satisfies ProductUiProfile

const envelopeProfile = {
  estimateUnit: '페이지',
  showPlanningEstimate: true,
  sections: [
    { key: 'envelopeType', kind: 'options', label: '종류', inputMode: 'text' },
    { key: 'material', kind: 'options', label: '재질', inputMode: 'text' },
    {
      key: 'thickness',
      kind: 'options',
      label: '두께 선택',
      inputMode: 'text',
    },
    {
      key: 'quantity',
      kind: 'quantity-prices',
      label: '수량 선택',
      quantityUnit: '장',
    },
  ],
} as const satisfies ProductUiProfile

const logoProfile = {
  estimateUnit: '시안',
  showPlanningEstimate: false,
  sections: [
    { key: 'logoType', kind: 'options', label: '유형', inputMode: 'text' },
    {
      key: 'proposalCount',
      kind: 'options',
      label: '시안 개수',
      inputMode: 'numeric',
      valueUnit: '종',
    },
  ],
} as const satisfies ProductUiProfile

export const productUiProfiles = {
  '브로슈어 · 카탈로그': brochureProfile,
  '리플렛 · 팜플렛': leafletProfile,
  '포스터 · 전단지': posterProfile,
  '배너 · 족자 · 현수막': bannerProfile,
  '명함 · 봉투': businessCardProfile,
  로고: logoProfile,
} as const satisfies Record<ProductType, ProductUiProfile>

const productSubtypeUiProfiles = {
  포스터: posterProfile,
  전단지: flyerProfile,
  배너: bannerProfile,
  족자: scrollBannerProfile,
  현수막: hangingBannerProfile,
  명함: businessCardProfile,
  봉투: envelopeProfile,
} as const satisfies Record<ProductSubtype, ProductUiProfile>

export function getProductUiProfile(
  productType: ProductType,
  productSubtype: ProductSubtype | '' = '',
) {
  return productSubtype
    ? productSubtypeUiProfiles[productSubtype]
    : productUiProfiles[productType]
}

const sectionNumbers = ['III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const

function getProductVariant(
  productType: ProductType | '',
  productSubtype: ProductSubtype | '',
): ProductVariant | '' {
  return productSubtype || productType
}

const priceOptionKeysByVariant: Partial<
  Record<ProductVariant, readonly ProductOptionSectionKey[]>
> = {
  '브로슈어 · 카탈로그': ['pageCount', 'paper', 'thickness', 'coverCoating'],
  '리플렛 · 팜플렛': ['size', 'paper', 'thickness', 'coverCoating'],
  포스터: ['size', 'paper', 'thickness', 'coating'],
  전단지: ['size', 'paper', 'thickness', 'side'],
  배너: ['size', 'stand', 'material', 'side', 'coating'],
  족자: ['size', 'material', 'rod', 'hookCount'],
  현수막: ['size', 'material', 'cutting', 'environment'],
  봉투: ['envelopeType', 'material', 'thickness'],
}

const serviceOptionKeysByVariant: Partial<
  Record<ProductVariant, readonly ProductOptionSectionKey[]>
> = {
  '리플렛 · 팜플렛': ['size'],
  전단지: ['side'],
  명함: ['material', 'thickness'],
  로고: ['logoType'],
}

type ProductSelection = Pick<
  ProductUiDraft,
  'productSubtype' | 'productType' | 'selectedOptionIndexes'
>

function getSelectionKey(
  optionKeys: readonly ProductOptionSectionKey[],
  selectedOptionIndexes: ProductUiDraft['selectedOptionIndexes'],
) {
  return optionKeys
    .map((optionKey) => selectedOptionIndexes[optionKey] ?? 0)
    .join(':')
}

function getPriceOptionKeys(selection: ProductSelection) {
  const variant = getProductVariant(
    selection.productType,
    selection.productSubtype,
  )

  return variant ? (priceOptionKeysByVariant[variant] ?? []) : []
}

function getServiceOptionKeys(selection: ProductSelection) {
  const variant = getProductVariant(
    selection.productType,
    selection.productSubtype,
  )

  return variant ? (serviceOptionKeysByVariant[variant] ?? []) : []
}

function getSelectionKeys(
  optionKeys: readonly ProductOptionSectionKey[],
  optionValues: ProductUiDraft['optionValues'],
) {
  return optionKeys.reduce<string[]>(
    (selectionKeys, optionKey) => {
      const values = optionValues[optionKey] ?? []

      return selectionKeys.flatMap((selectionKey) =>
        values.map((_, index) =>
          selectionKey ? `${selectionKey}:${index}` : String(index),
        ),
      )
    },
    [''],
  )
}

function getSelectionIndexes(
  optionKeys: readonly ProductOptionSectionKey[],
  selectionKey: string,
) {
  const indexes = selectionKey.split(':').map(Number)

  return Object.fromEntries(
    optionKeys.map((optionKey, index) => [optionKey, indexes[index] ?? 0]),
  ) as ProductUiDraft['selectedOptionIndexes']
}

export function getProductPriceKey(selection: ProductSelection) {
  return getSelectionKey(
    getPriceOptionKeys(selection),
    selection.selectedOptionIndexes,
  )
}

export function getProductServiceKey(selection: ProductSelection) {
  return getSelectionKey(
    getServiceOptionKeys(selection),
    selection.selectedOptionIndexes,
  )
}

export function getProductPriceSelectionKeys(draft: ProductUiDraft) {
  return getSelectionKeys(getPriceOptionKeys(draft), draft.optionValues)
}

export function getProductServiceSelectionKeys(draft: ProductUiDraft) {
  return getSelectionKeys(getServiceOptionKeys(draft), draft.optionValues)
}

export function getProductPriceSelectionIndexes(
  draft: ProductUiDraft,
  selectionKey: string,
) {
  return getSelectionIndexes(getPriceOptionKeys(draft), selectionKey)
}

export function getProductServiceSelectionIndexes(
  draft: ProductUiDraft,
  selectionKey: string,
) {
  return getSelectionIndexes(getServiceOptionKeys(draft), selectionKey)
}

function removeSelectionOption<T>(
  valuesBySelection: Record<string, T>,
  optionKeys: readonly ProductOptionSectionKey[],
  optionKey: ProductOptionSectionKey,
  removeIndex: number,
) {
  const optionIndex = optionKeys.indexOf(optionKey)

  if (optionIndex < 0) return valuesBySelection

  const nextValuesBySelection: Record<string, T> = {}

  for (const [key, value] of Object.entries(valuesBySelection)) {
    const optionIndexes = key.split(':').map(Number)
    const currentIndex = optionIndexes[optionIndex]

    if (currentIndex === removeIndex) continue
    if (currentIndex > removeIndex)
      optionIndexes[optionIndex] = currentIndex - 1

    nextValuesBySelection[optionIndexes.join(':')] = value
  }

  return nextValuesBySelection
}

export function removeProductPriceOption(
  draft: ProductUiDraft,
  optionKey: ProductOptionSectionKey,
  removeIndex: number,
) {
  return removeSelectionOption(
    draft.priceRowsBySelection,
    getPriceOptionKeys(draft),
    optionKey,
    removeIndex,
  )
}

export function removeProductServiceOption(
  draft: ProductUiDraft,
  optionKey: ProductOptionSectionKey,
  removeIndex: number,
) {
  return removeSelectionOption(
    draft.serviceEstimatesBySelection,
    getServiceOptionKeys(draft),
    optionKey,
    removeIndex,
  )
}

export function formatProductSectionHeading(index: number, label: string) {
  const number = sectionNumbers[index]

  if (!number) throw new Error('상품 UI 섹션 번호를 확인해주세요.')

  return `${number}. ${label}`
}

function createBlankOptionValues(
  productType: ProductType | '',
  productSubtype: ProductSubtype | '',
) {
  const optionValues: ProductUiDraft['optionValues'] = {}

  if (!productType) return optionValues

  for (const section of getProductUiProfile(productType, productSubtype)
    .sections) {
    if (section.kind === 'options') optionValues[section.key] = ['']
  }

  return optionValues
}

function getDefaultProductSubtype(
  productType: ProductType | '',
): ProductSubtype | '' {
  if (!productType) return ''

  return productSubtypeOptions[productType][0] ?? ''
}

export function createProductUiDraft(
  productType: ProductType | '' = '',
  productSubtype: ProductSubtype | '' = getDefaultProductSubtype(productType),
): ProductUiDraft {
  const optionValues = createBlankOptionValues(productType, productSubtype)
  const selectedOptionIndexes: ProductUiDraft['selectedOptionIndexes'] = {}

  for (const optionKey of Object.keys(
    optionValues,
  ) as ProductOptionSectionKey[]) {
    selectedOptionIndexes[optionKey] = 0
  }

  return {
    optionValues,
    priceRowsBySelection: {},
    productSubtype,
    productType,
    selectedOptionIndexes,
    serviceEstimatesBySelection: {},
  }
}
