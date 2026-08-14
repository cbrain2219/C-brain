import {
  getProductPriceOptionKeys as getSharedProductPriceOptionKeys,
  getProductSelectionKey,
  getProductServiceOptionKeys as getSharedProductServiceOptionKeys,
  getProductUiProfile,
  getProductVariants,
  productSubtypeOptions,
  productTypes,
  productUiProfiles,
} from '@repo/supabase'
import type {
  ProductOptionSectionKey,
  ProductPriceSectionKey,
  ProductSubtype,
  ProductType,
  ProductUiProfile,
  ProductUiSection,
  ProductVariant,
} from '@repo/supabase'

export {
  getProductUiProfile,
  getProductVariants,
  productSubtypeOptions,
  productTypes,
  productUiProfiles,
}
export type {
  ProductOptionSectionKey,
  ProductPriceSectionKey,
  ProductSubtype,
  ProductType,
  ProductUiProfile,
  ProductUiSection,
  ProductVariant,
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

const sectionNumbers = ['III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const

type ProductSelection = Pick<
  ProductUiDraft,
  'productSubtype' | 'productType' | 'selectedOptionIndexes'
>

function getPriceOptionKeys(selection: ProductSelection) {
  return selection.productType
    ? getSharedProductPriceOptionKeys(
        selection.productType,
        selection.productSubtype,
      )
    : []
}

function getServiceOptionKeys(selection: ProductSelection) {
  return selection.productType
    ? getSharedProductServiceOptionKeys(
        selection.productType,
        selection.productSubtype,
      )
    : []
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
  return getProductSelectionKey(
    getPriceOptionKeys(selection),
    selection.selectedOptionIndexes,
  )
}

export function getProductServiceKey(selection: ProductSelection) {
  return getProductSelectionKey(
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
