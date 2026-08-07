import assert from 'node:assert/strict'
import test from 'node:test'
import {
  changeProductUiSubtype,
  changeProductUiType,
  createProductUiDraft,
  formatProductSectionHeading,
  getProductPriceKey,
  getProductServiceKey,
  getProductUiProfile,
  productSubtypeOptions,
  productTypes,
  removeProductPriceOption,
  removeProductServiceOption,
} from '../src/pages/productFormUi.ts'

const headings = (type, subtype = '') =>
  getProductUiProfile(type, subtype).sections.map((section, index) =>
    formatProductSectionHeading(index, section.label),
  )

const currentService = (draft) =>
  draft.serviceEstimatesBySelection[getProductServiceKey(draft)]

test('product types are fixed in display order', () => {
  assert.deepEqual(productTypes, [
    '브로슈어 · 카탈로그',
    '리플렛 · 팜플렛',
    '포스터 · 전단지',
    '배너 · 족자 · 현수막',
    '명함 · 봉투',
    '로고',
  ])
})

test('compound product types expose subtypes and select the first by default', () => {
  assert.deepEqual(productSubtypeOptions['포스터 · 전단지'], [
    '포스터',
    '전단지',
  ])
  assert.deepEqual(productSubtypeOptions['배너 · 족자 · 현수막'], [
    '배너',
    '족자',
    '현수막',
  ])
  assert.deepEqual(productSubtypeOptions['명함 · 봉투'], ['명함', '봉투'])

  assert.equal(createProductUiDraft('포스터 · 전단지').productSubtype, '포스터')
  assert.equal(
    createProductUiDraft('배너 · 족자 · 현수막').productSubtype,
    '배너',
  )
  assert.equal(createProductUiDraft('명함 · 봉투').productSubtype, '명함')
  assert.equal(createProductUiDraft('리플렛 · 팜플렛').productSubtype, '')
})

test('every product and subtype starts its custom sections at III', () => {
  assert.deepEqual(headings('브로슈어 · 카탈로그'), [
    'III. 페이지 수 선택',
    'IV. 용지 선택',
    'V. 두께 선택',
    'VI. 표지 코팅 선택',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('리플렛 · 팜플렛'), [
    'III. 사이즈 선택',
    'IV. 용지 선택',
    'V. 두께 선택',
    'VI. 표지 코팅 선택',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('포스터 · 전단지', '포스터'), [
    'III. 사이즈 선택',
    'IV. 용지',
    'V. 두께 선택',
    'VI. 코팅 선택',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('포스터 · 전단지', '전단지'), [
    'III. 사이즈 선택',
    'IV. 용지',
    'V. 두께 선택',
    'VI. 면 선택',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('배너 · 족자 · 현수막', '족자'), [
    'III. 사이즈 선택',
    'IV. 재질 선택',
    'V. 족자봉',
    'VI. S고리',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('배너 · 족자 · 현수막', '현수막'), [
    'III. 사이즈',
    'IV. 재질',
    'V. 재단',
    'VI. 사용 환경',
    'VII. 수량 선택',
  ])
  assert.deepEqual(headings('명함 · 봉투', '봉투'), [
    'III. 종류',
    'IV. 재질',
    'V. 두께 선택',
    'VI. 수량 선택',
  ])
  assert.deepEqual(headings('로고'), ['III. 유형', 'IV. 시안 개수'])
})

test('brochure defaults reproduce every spreadsheet price combination', () => {
  const brochure = createProductUiDraft('브로슈어 · 카탈로그')

  assert.deepEqual(brochure.optionValues.pageCount, ['8', '12', '16'])
  assert.deepEqual(brochure.optionValues.paper, [
    '일반지(스노우지)',
    '고급지(랑데뷰)',
  ])
  assert.deepEqual(brochure.optionValues.thickness, ['얇은', '보통', '두꺼운'])
  assert.deepEqual(brochure.optionValues.coverCoating, ['무광', '유광'])
  assert.equal(Object.keys(brochure.priceRowsBySelection).length, 36)
  assert.deepEqual(brochure.priceRowsBySelection['0:0:0:0'], [
    { quantity: '100', unitPrice: '850,000' },
    { quantity: '200', unitPrice: '1,010,000' },
    { quantity: '300', unitPrice: '1,130,000' },
  ])
  assert.deepEqual(brochure.priceRowsBySelection['2:1:2:1'], [
    { quantity: '100', unitPrice: '1,680,000' },
    { quantity: '200', unitPrice: '2,010,000' },
    { quantity: '300', unitPrice: '2,240,000' },
  ])
  assert.equal(getProductPriceKey(brochure), '0:0:0:0')
  assert.deepEqual(currentService(brochure), {
    designPrintEstimate: '80,000',
    planningEstimate: '50,000',
  })
})

test('removing a priced option keeps remaining combinations aligned', () => {
  const brochure = createProductUiDraft('브로슈어 · 카탈로그')
  const remapped = removeProductPriceOption(brochure, 'pageCount', 0)

  assert.equal(Object.keys(remapped).length, 24)
  assert.deepEqual(
    remapped['0:0:0:0'],
    brochure.priceRowsBySelection['1:0:0:0'],
  )
  assert.deepEqual(
    remapped['1:1:2:1'],
    brochure.priceRowsBySelection['2:1:2:1'],
  )
  assert.equal(remapped['2:1:2:1'], undefined)
})

test('leaflet uses one size-dependent quantity table and service estimate', () => {
  const leaflet = createProductUiDraft('리플렛 · 팜플렛')

  assert.deepEqual(leaflet.optionValues, {
    size: ['국3절(620x297mm)', 'A3(420x297mm)', 'A4(297x210mm)'],
    paper: ['일반지(스노우지)', '고급지(량데뷰)'],
    thickness: ['얇은', '보통', '두꺼운'],
    coverCoating: ['무광', '유광'],
  })
  assert.equal(Object.keys(leaflet.priceRowsBySelection).length, 36)
  assert.deepEqual(leaflet.priceRowsBySelection['0:0:0:0'], [
    { quantity: '100', unitPrice: '780,000' },
    { quantity: '200', unitPrice: '970,000' },
    { quantity: '750', unitPrice: '1,020,000' },
  ])
  assert.deepEqual(leaflet.priceRowsBySelection['1:1:2:1'], [
    { quantity: '100', unitPrice: '660,000' },
    { quantity: '300', unitPrice: '840,000' },
    { quantity: '500', unitPrice: '1,010,000' },
  ])
  assert.deepEqual(leaflet.priceRowsBySelection['2:1:1:0'], [
    { quantity: '100', unitPrice: '380,000' },
    { quantity: '500', unitPrice: '570,000' },
    { quantity: '1000', unitPrice: '790,000' },
  ])

  leaflet.selectedOptionIndexes.size = 2
  assert.deepEqual(currentService(leaflet), {
    designPrintEstimate: '40,000',
    planningEstimate: '30,000',
  })

  const pricesAfterRemoval = removeProductPriceOption(leaflet, 'size', 0)
  const servicesAfterRemoval = removeProductServiceOption(leaflet, 'size', 0)
  assert.equal(Object.keys(pricesAfterRemoval).length, 24)
  assert.deepEqual(
    pricesAfterRemoval['0:1:2:1'],
    leaflet.priceRowsBySelection['1:1:2:1'],
  )
  assert.deepEqual(servicesAfterRemoval['1'], {
    designPrintEstimate: '40,000',
    planningEstimate: '30,000',
  })
})

test('poster and flyer load their subtype-specific spreadsheet prices', () => {
  const poster = createProductUiDraft('포스터 · 전단지')

  assert.equal(poster.productSubtype, '포스터')
  assert.deepEqual(poster.optionValues, {
    size: ['A1(594x841mm)', 'A2(420x594mm)'],
    paper: ['일반지(아트지)'],
    thickness: ['얇은', '두꺼운'],
    coating: ['무광', '유광'],
  })
  assert.equal(Object.keys(poster.priceRowsBySelection).length, 8)
  assert.deepEqual(poster.priceRowsBySelection['1:0:1:1'], [
    { quantity: '100', unitPrice: '450,000' },
    { quantity: '300', unitPrice: '570,000' },
    { quantity: '500', unitPrice: '610,000' },
  ])
  assert.deepEqual(currentService(poster), {
    designPrintEstimate: '250,000',
    planningEstimate: '200,000',
  })

  const flyer = changeProductUiSubtype(poster, '전단지')
  assert.deepEqual(flyer.optionValues, {
    size: ['A4(210x297mm)'],
    paper: ['일반지(아트지)'],
    thickness: ['얇은', '두꺼운'],
    side: ['단면', '양면'],
  })
  assert.equal(Object.keys(flyer.priceRowsBySelection).length, 4)
  assert.deepEqual(flyer.priceRowsBySelection['0:0:1:1'], [
    { quantity: '100', unitPrice: '200,000' },
    { quantity: '300', unitPrice: '260,000' },
    { quantity: '4000', unitPrice: '360,000' },
  ])
  assert.deepEqual(currentService(flyer), {
    designPrintEstimate: '100,000',
    planningEstimate: '60,000',
  })
  flyer.selectedOptionIndexes.side = 1
  assert.deepEqual(currentService(flyer), {
    designPrintEstimate: '75,000',
    planningEstimate: '40,000',
  })
})

test('banner, scroll banner, and hanging banner load every supplied price', () => {
  const banner = createProductUiDraft('배너 · 족자 · 현수막')

  assert.equal(banner.productSubtype, '배너')
  assert.equal(Object.keys(banner.priceRowsBySelection).length, 2)
  assert.deepEqual(banner.priceRowsBySelection['0:0:0:0:0'], [
    { quantity: '1', unitPrice: '110,000' },
    { quantity: '2', unitPrice: '' },
    { quantity: '3', unitPrice: '' },
  ])
  assert.deepEqual(banner.priceRowsBySelection['0:1:0:0:0'][0], {
    quantity: '1',
    unitPrice: '130,000',
  })
  assert.deepEqual(currentService(banner), {
    designPrintEstimate: '80,000',
    planningEstimate: '50,000',
  })

  const scrollBanner = changeProductUiSubtype(banner, '족자')
  assert.deepEqual(scrollBanner.optionValues, {
    size: ['900x1500mm', '900x2300mm'],
    material: ['현수막천', '패트지(무광코팅)'],
    rod: ['원형족자봉(상, 하)'],
    hookCount: ['2'],
  })
  assert.equal(Object.keys(scrollBanner.priceRowsBySelection).length, 4)
  assert.equal(
    scrollBanner.priceRowsBySelection['1:1:0:0'][0].unitPrice,
    '160,000',
  )
  assert.deepEqual(currentService(scrollBanner), {
    designPrintEstimate: '80,000',
    planningEstimate: '50,000',
  })

  const hangingBanner = changeProductUiSubtype(scrollBanner, '현수막')
  assert.deepEqual(hangingBanner.optionValues.environment, ['실내용', '실외용'])
  assert.equal(Object.keys(hangingBanner.priceRowsBySelection).length, 2)
  assert.equal(
    hangingBanner.priceRowsBySelection['0:0:0:1'][0].unitPrice,
    '100,000',
  )
  assert.deepEqual(currentService(hangingBanner), {
    designPrintEstimate: '50,000',
    planningEstimate: '30,000',
  })
})

test('business card and envelope load their available spreadsheet prices', () => {
  const businessCard = createProductUiDraft('명함 · 봉투')

  assert.equal(businessCard.productSubtype, '명함')
  assert.deepEqual(businessCard.optionValues, {
    size: ['90x50mm'],
    baseQuantity: ['일반지 500', '고급지 200'],
    material: ['일반지(스노우, 무광코팅)', '고급지(랑데뷰)'],
    thickness: ['보통', '두꺼운'],
    people: ['1', '2', '3'],
  })
  assert.deepEqual(currentService(businessCard), {
    designPrintEstimate: '50,000',
    planningEstimate: '20,000',
  })
  businessCard.selectedOptionIndexes.thickness = 1
  assert.deepEqual(currentService(businessCard), {
    designPrintEstimate: '60,000',
    planningEstimate: '20,000',
  })

  const envelope = changeProductUiSubtype(businessCard, '봉투')
  assert.deepEqual(envelope.optionValues, {
    envelopeType: [
      '소봉투 일반형(220x105mm)',
      '소봉투 자켓형(220x105mm)',
      '대봉투(330x245mm)',
    ],
    material: ['일반 봉투재질(백모조지)'],
    thickness: ['보통', '두꺼운'],
  })
  assert.equal(Object.keys(envelope.priceRowsBySelection).length, 6)
  assert.deepEqual(envelope.priceRowsBySelection['0:0:0'], [
    { quantity: '500', unitPrice: '90,000' },
    { quantity: '1000', unitPrice: '120,000' },
  ])
  assert.deepEqual(envelope.priceRowsBySelection['1:0:1'], [
    { quantity: '500', unitPrice: '470,000' },
    { quantity: '1000', unitPrice: '560,000' },
  ])
  assert.deepEqual(envelope.priceRowsBySelection['2:0:1'], [
    { quantity: '500', unitPrice: '560,000' },
    { quantity: '1000', unitPrice: '720,000' },
  ])
  assert.deepEqual(currentService(envelope), {
    designPrintEstimate: '30,000',
    planningEstimate: '20,000',
  })
})

test('logo loads only the combinations priced by the spreadsheet', () => {
  const logo = createProductUiDraft('로고')

  assert.deepEqual(logo.optionValues, {
    logoType: ['워드마크 타입', '심볼타입', '워드마크+심볼 타입'],
    proposalCount: ['1', '2', '3'],
  })
  assert.deepEqual(currentService(logo), {
    designPrintEstimate: '50,000',
    planningEstimate: '',
  })
  assert.deepEqual(logo.serviceEstimatesBySelection['2'], {
    designPrintEstimate: '80,000',
    planningEstimate: '',
  })
  assert.equal(logo.serviceEstimatesBySelection['1'], undefined)
  logo.selectedOptionIndexes.proposalCount = 2
  assert.deepEqual(currentService(logo), {
    designPrintEstimate: '50,000',
    planningEstimate: '',
  })
  assert.deepEqual(logo.priceRows, {})
})

test('changing type or subtype resets to its own spreadsheet defaults', () => {
  const brochure = createProductUiDraft('브로슈어 · 카탈로그')
  brochure.optionValues.pageCount = ['8', '16']
  brochure.serviceEstimatesBySelection[''].designPrintEstimate = '1'

  const poster = changeProductUiType(brochure, '포스터 · 전단지')
  assert.equal(poster.productSubtype, '포스터')
  assert.deepEqual(currentService(poster), {
    designPrintEstimate: '250,000',
    planningEstimate: '200,000',
  })
  assert.deepEqual(poster.optionValues.pageCount, undefined)

  const flyer = changeProductUiSubtype(poster, '전단지')
  assert.equal(flyer.productSubtype, '전단지')
  assert.deepEqual(flyer.optionValues.side, ['단면', '양면'])
  assert.equal(flyer.optionValues.coating, undefined)
})
