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
  priceRows: Partial<Record<ProductPriceSectionKey, QuantityPriceDraft[]>>
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
const priceFormatter = new Intl.NumberFormat('ko-KR')

const brochureQuantities = ['100', '200', '300'] as const
const leafletQuantities = [
  ['100', '200', '750'],
  ['100', '300', '500'],
  ['100', '500', '1000'],
] as const
const posterQuantities = ['100', '300', '500'] as const
const flyerQuantities = ['100', '300', '4000'] as const
const displayQuantities = ['1', '2', '3'] as const
const envelopeQuantities = ['500', '1000'] as const

const brochurePriceMatrix = [
  [
    [
      [850000, 1010000, 1130000],
      [1240000, 1440000, 1620000],
      [1610000, 1870000, 1910000],
    ],
    [
      [860000, 1020000, 1140000],
      [1250000, 1450000, 1630000],
      [1620000, 1900000, 1940000],
    ],
    [
      [860000, 1030000, 1160000],
      [1250000, 1470000, 1660000],
      [1620000, 1900000, 2000000],
    ],
  ],
  [
    [
      [880000, 1060000, 1210000],
      [1280000, 1510000, 1720000],
      [1650000, 1960000, 2090000],
    ],
    [
      [890000, 1080000, 1230000],
      [1290000, 1540000, 1760000],
      [1670000, 1990000, 2150000],
    ],
    [
      [900000, 1100000, 1260000],
      [1300000, 1560000, 1790000],
      [1680000, 2010000, 2240000],
    ],
  ],
] as const

const leafletPriceMatrix = [
  [
    [
      [780000, 970000, 1020000],
      [780000, 970000, 1040000],
      [790000, 980000, 1080000],
    ],
    [
      [780000, 1000000, 1230000],
      [800000, 1020000, 1250000],
      [840000, 1060000, 1290000],
    ],
  ],
  [
    [
      [640000, 790000, 910000],
      [640000, 790000, 930000],
      [640000, 800000, 950000],
    ],
    [
      [660000, 750000, 1010000],
      [660000, 850000, 1030000],
      [660000, 840000, 1010000],
    ],
  ],
  [
    [
      [370000, 520000, 670000],
      [370000, 520000, 690000],
      [370000, 530000, 710000],
    ],
    [
      [380000, 560000, 780000],
      [380000, 570000, 790000],
      [380000, 560000, 780000],
    ],
  ],
] as const

const posterPriceMatrix = [
  [
    [520000, 590000, 650000],
    [550000, 660000, 740000],
  ],
  [
    [440000, 540000, 560000],
    [450000, 570000, 610000],
  ],
] as const

const flyerPriceMatrix = [
  [
    [130000, 160000, 190000],
    [190000, 250000, 260000],
  ],
  [
    [130000, 170000, 290000],
    [200000, 260000, 360000],
  ],
] as const

const scrollBannerPriceMatrix = [
  [130000, 140000],
  [130000, 160000],
] as const

const envelopePriceMatrix = [
  [
    [90000, 120000],
    [470000, 560000],
  ],
  [
    [90000, 120000],
    [470000, 560000],
  ],
  [
    [220000, 260000],
    [560000, 720000],
  ],
] as const

type ProductVariant = ProductType | ProductSubtype

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

function formatPrice(value: number | null | undefined) {
  return value === null || value === undefined
    ? ''
    : priceFormatter.format(value)
}

function createPriceRows(
  quantities: readonly string[],
  prices: readonly (number | null)[],
) {
  return quantities.map((quantity, index) => ({
    quantity,
    unitPrice: formatPrice(prices[index]),
  }))
}

function setPriceRows(
  rowsBySelection: ProductUiDraft['priceRowsBySelection'],
  optionIndexes: readonly number[],
  quantities: readonly string[],
  prices: readonly (number | null)[],
) {
  rowsBySelection[optionIndexes.join(':')] = createPriceRows(quantities, prices)
}

function createPriceRowsBySelection(
  productType: ProductType | '',
  productSubtype: ProductSubtype | '',
) {
  const rowsBySelection: ProductUiDraft['priceRowsBySelection'] = {}
  const variant = getProductVariant(productType, productSubtype)

  if (variant === '브로슈어 · 카탈로그') {
    brochurePriceMatrix.forEach((thicknessPrices, paperIndex) => {
      thicknessPrices.forEach((pagePrices, thicknessIndex) => {
        pagePrices.forEach((prices, pageCountIndex) => {
          for (let coatingIndex = 0; coatingIndex < 2; coatingIndex += 1) {
            setPriceRows(
              rowsBySelection,
              [pageCountIndex, paperIndex, thicknessIndex, coatingIndex],
              brochureQuantities,
              prices,
            )
          }
        })
      })
    })
  }

  if (variant === '리플렛 · 팜플렛') {
    leafletPriceMatrix.forEach((paperPrices, sizeIndex) => {
      paperPrices.forEach((thicknessPrices, paperIndex) => {
        thicknessPrices.forEach((prices, thicknessIndex) => {
          for (let coatingIndex = 0; coatingIndex < 2; coatingIndex += 1) {
            setPriceRows(
              rowsBySelection,
              [sizeIndex, paperIndex, thicknessIndex, coatingIndex],
              leafletQuantities[sizeIndex],
              prices,
            )
          }
        })
      })
    })
  }

  if (variant === '포스터') {
    posterPriceMatrix.forEach((thicknessPrices, sizeIndex) => {
      thicknessPrices.forEach((prices, thicknessIndex) => {
        for (let coatingIndex = 0; coatingIndex < 2; coatingIndex += 1) {
          setPriceRows(
            rowsBySelection,
            [sizeIndex, 0, thicknessIndex, coatingIndex],
            posterQuantities,
            prices,
          )
        }
      })
    })
  }

  if (variant === '전단지') {
    flyerPriceMatrix.forEach((sidePrices, thicknessIndex) => {
      sidePrices.forEach((prices, sideIndex) => {
        setPriceRows(
          rowsBySelection,
          [0, 0, thicknessIndex, sideIndex],
          flyerQuantities,
          prices,
        )
      })
    })
  }

  if (variant === '배너') {
    ;[110000, 130000].forEach((price, standIndex) => {
      setPriceRows(
        rowsBySelection,
        [0, standIndex, 0, 0, 0],
        displayQuantities,
        [price, null, null],
      )
    })
  }

  if (variant === '족자') {
    scrollBannerPriceMatrix.forEach((materialPrices, sizeIndex) => {
      materialPrices.forEach((price, materialIndex) => {
        setPriceRows(
          rowsBySelection,
          [sizeIndex, materialIndex, 0, 0],
          displayQuantities,
          [price, null, null],
        )
      })
    })
  }

  if (variant === '현수막') {
    ;[80000, 100000].forEach((price, environmentIndex) => {
      setPriceRows(
        rowsBySelection,
        [0, 0, 0, environmentIndex],
        displayQuantities,
        [price, null, null],
      )
    })
  }

  if (variant === '봉투') {
    envelopePriceMatrix.forEach((thicknessPrices, envelopeTypeIndex) => {
      thicknessPrices.forEach((prices, thicknessIndex) => {
        setPriceRows(
          rowsBySelection,
          [envelopeTypeIndex, 0, thicknessIndex],
          envelopeQuantities,
          prices,
        )
      })
    })
  }

  return rowsBySelection
}

function createServiceEstimate(
  designPrintEstimate: number,
  planningEstimate?: number,
) {
  return {
    designPrintEstimate: formatPrice(designPrintEstimate),
    planningEstimate: formatPrice(planningEstimate),
  }
}

function createServiceEstimatesBySelection(
  productType: ProductType | '',
  productSubtype: ProductSubtype | '',
): ProductUiDraft['serviceEstimatesBySelection'] {
  const variant = getProductVariant(productType, productSubtype)

  if (variant === '리플렛 · 팜플렛') {
    return {
      '0': createServiceEstimate(80000, 50000),
      '1': createServiceEstimate(80000, 50000),
      '2': createServiceEstimate(40000, 30000),
    }
  }

  if (variant === '전단지') {
    return {
      '0': createServiceEstimate(100000, 60000),
      '1': createServiceEstimate(75000, 40000),
    }
  }

  if (variant === '로고') {
    return {
      '0': createServiceEstimate(50000),
      '2': createServiceEstimate(80000),
    }
  }

  if (variant === '명함') {
    return {
      '0:0': createServiceEstimate(50000, 20000),
      '0:1': createServiceEstimate(60000, 20000),
      '1:0': createServiceEstimate(50000, 20000),
      '1:1': createServiceEstimate(60000, 20000),
    }
  }

  const servicePrices: Partial<
    Record<ProductVariant, readonly [number, number]>
  > = {
    '브로슈어 · 카탈로그': [80000, 50000],
    포스터: [250000, 200000],
    배너: [80000, 50000],
    족자: [80000, 50000],
    현수막: [50000, 30000],
    봉투: [30000, 20000],
  }
  const prices = variant ? servicePrices[variant] : undefined

  return prices ? { '': createServiceEstimate(...prices) } : {}
}

function createBlankPriceRows(quantities: readonly string[]) {
  return quantities.map((quantity) => ({ quantity, unitPrice: '' }))
}

function createTypeSpecificState(
  productType: ProductType | '',
  productSubtype: ProductSubtype | '',
) {
  const optionValues: ProductUiDraft['optionValues'] = {}
  const priceRows: ProductUiDraft['priceRows'] = {}
  const variant = getProductVariant(productType, productSubtype)

  if (variant === '브로슈어 · 카탈로그') {
    return {
      optionValues: {
        pageCount: ['8', '12', '16'],
        paper: ['일반지(스노우지)', '고급지(랑데뷰)'],
        thickness: ['얇은', '보통', '두꺼운'],
        coverCoating: ['무광', '유광'],
      },
      priceRows: { quantity: createBlankPriceRows(brochureQuantities) },
    }
  }

  if (variant === '리플렛 · 팜플렛') {
    return {
      optionValues: {
        size: ['국3절(620x297mm)', 'A3(420x297mm)', 'A4(297x210mm)'],
        paper: ['일반지(스노우지)', '고급지(량데뷰)'],
        thickness: ['얇은', '보통', '두꺼운'],
        coverCoating: ['무광', '유광'],
      },
      priceRows: { quantity: createBlankPriceRows(leafletQuantities[0]) },
    }
  }

  if (variant === '포스터') {
    return {
      optionValues: {
        size: ['A1(594x841mm)', 'A2(420x594mm)'],
        paper: ['일반지(아트지)'],
        thickness: ['얇은', '두꺼운'],
        coating: ['무광', '유광'],
      },
      priceRows: { quantity: createBlankPriceRows(posterQuantities) },
    }
  }

  if (variant === '전단지') {
    return {
      optionValues: {
        size: ['A4(210x297mm)'],
        paper: ['일반지(아트지)'],
        thickness: ['얇은', '두꺼운'],
        side: ['단면', '양면'],
      },
      priceRows: { quantity: createBlankPriceRows(flyerQuantities) },
    }
  }

  if (variant === '배너') {
    return {
      optionValues: {
        size: ['600x1800mm'],
        stand: ['실내용', '실외용(물통포함)'],
        material: ['패트지'],
        side: ['단면'],
        coating: ['무광'],
      },
      priceRows: { quantity: createBlankPriceRows(displayQuantities) },
    }
  }

  if (variant === '족자') {
    return {
      optionValues: {
        size: ['900x1500mm', '900x2300mm'],
        material: ['현수막천', '패트지(무광코팅)'],
        rod: ['원형족자봉(상, 하)'],
        hookCount: ['2'],
      },
      priceRows: { quantity: createBlankPriceRows(displayQuantities) },
    }
  }

  if (variant === '현수막') {
    return {
      optionValues: {
        size: ['5000x900mm'],
        material: ['현수막천'],
        cutting: ['열재단(10mm 여백)'],
        environment: ['실내용', '실외용'],
      },
      priceRows: { quantity: createBlankPriceRows(displayQuantities) },
    }
  }

  if (variant === '명함') {
    return {
      optionValues: {
        size: ['90x50mm'],
        baseQuantity: ['일반지 500', '고급지 200'],
        material: ['일반지(스노우, 무광코팅)', '고급지(랑데뷰)'],
        thickness: ['보통', '두꺼운'],
        people: ['1', '2', '3'],
      },
      priceRows: {},
    }
  }

  if (variant === '봉투') {
    return {
      optionValues: {
        envelopeType: [
          '소봉투 일반형(220x105mm)',
          '소봉투 자켓형(220x105mm)',
          '대봉투(330x245mm)',
        ],
        material: ['일반 봉투재질(백모조지)'],
        thickness: ['보통', '두꺼운'],
      },
      priceRows: { quantity: createBlankPriceRows(envelopeQuantities) },
    }
  }

  if (variant === '로고') {
    return {
      optionValues: {
        logoType: ['워드마크 타입', '심볼타입', '워드마크+심볼 타입'],
        proposalCount: ['1', '2', '3'],
      },
      priceRows: {},
    }
  }

  return { optionValues, priceRows }
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
  const typeSpecificState = createTypeSpecificState(productType, productSubtype)
  const selectedOptionIndexes: ProductUiDraft['selectedOptionIndexes'] = {}

  for (const optionKey of Object.keys(
    typeSpecificState.optionValues,
  ) as ProductOptionSectionKey[]) {
    selectedOptionIndexes[optionKey] = 0
  }

  return {
    priceRowsBySelection: createPriceRowsBySelection(
      productType,
      productSubtype,
    ),
    productSubtype,
    productType,
    selectedOptionIndexes,
    serviceEstimatesBySelection: createServiceEstimatesBySelection(
      productType,
      productSubtype,
    ),
    ...typeSpecificState,
  }
}

export function changeProductUiType(
  _draft: ProductUiDraft,
  productType: ProductType,
) {
  return createProductUiDraft(productType)
}

export function changeProductUiSubtype(
  draft: ProductUiDraft,
  productSubtype: ProductSubtype,
) {
  return draft.productType
    ? createProductUiDraft(draft.productType, productSubtype)
    : draft
}
