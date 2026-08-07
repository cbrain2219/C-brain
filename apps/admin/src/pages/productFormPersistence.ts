import type {
  Json,
  ProductInsert,
  ProductRecord,
  ProductStatus,
} from '@repo/supabase'
import { formatNumericValue } from './productData.ts'
import { createProductFormDraft } from './productFormGroup.ts'
import type { ProductFormDraft } from './productFormGroup.ts'
import {
  createProductUiDraft,
  getProductVariants,
  getProductUiProfile,
  productSubtypeOptions,
  productTypes,
} from './productFormUi.ts'
import type {
  ProductOptionSectionKey,
  ProductSubtype,
  ProductType,
  ProductUiDraft,
  QuantityPriceDraft,
  ServiceEstimateDraft,
} from './productFormUi.ts'

type JsonObject = Record<string, Json | undefined>

export type ProductWriteInput = Required<
  Pick<ProductInsert, 'configuration' | 'product_type' | 'status'>
>

function isJsonObject(value: Json | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isProductType(value: string): value is ProductType {
  return productTypes.some((productType) => productType === value)
}

function isProductSubtype(
  productType: ProductType,
  value: string,
): value is ProductSubtype | '' {
  const subtypes = productSubtypeOptions[productType] as readonly string[]

  return subtypes.length === 0 ? value === '' : subtypes.includes(value)
}

function requireJsonObject(value: Json | undefined) {
  if (!isJsonObject(value)) throw new Error('상품 설정 형식을 확인해주세요.')

  return value
}

function toDraftNumber(value: Json | undefined) {
  if (value === null || value === undefined) return ''

  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('상품 설정 형식을 확인해주세요.')
  }

  return formatNumericValue(String(value))
}

function toStoredNumber(value: string) {
  const normalized = value.replaceAll(',', '').trim()

  if (!normalized) return null
  if (!/^\d+$/.test(normalized)) {
    throw new Error('숫자 입력값을 확인해주세요.')
  }

  const number = Number(normalized)

  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error('숫자 입력값을 확인해주세요.')
  }

  return number
}

function readOptionValues(value: Json | undefined) {
  const object = requireJsonObject(value)
  const optionValues: ProductUiDraft['optionValues'] = {}

  for (const [key, values] of Object.entries(object)) {
    if (
      !Array.isArray(values) ||
      !values.every((item) => typeof item === 'string')
    ) {
      throw new Error('상품 설정 형식을 확인해주세요.')
    }

    optionValues[key as ProductOptionSectionKey] = [...values]
  }

  return optionValues
}

function readPriceRows(value: Json | undefined) {
  const object = requireJsonObject(value)
  const rowsBySelection: ProductUiDraft['priceRowsBySelection'] = {}

  for (const [key, rows] of Object.entries(object)) {
    if (!Array.isArray(rows)) throw new Error('상품 설정 형식을 확인해주세요.')

    rowsBySelection[key] = rows.map((row): QuantityPriceDraft => {
      const objectRow = requireJsonObject(row)

      return {
        quantity: toDraftNumber(objectRow.quantity),
        unitPrice: toDraftNumber(objectRow.unitPrice),
      }
    })
  }

  return rowsBySelection
}

function readServiceEstimates(value: Json | undefined) {
  const object = requireJsonObject(value)
  const estimatesBySelection: ProductUiDraft['serviceEstimatesBySelection'] = {}

  for (const [key, estimate] of Object.entries(object)) {
    const objectEstimate = requireJsonObject(estimate)

    estimatesBySelection[key] = {
      designPrintEstimate: toDraftNumber(objectEstimate.designPrintEstimate),
      planningEstimate: toDraftNumber(objectEstimate.planningEstimate),
    }
  }

  return estimatesBySelection
}

function toVariantUiDraft(
  productType: ProductType,
  productSubtype: ProductSubtype | '',
  configurationValue: Json | undefined,
): ProductUiDraft {
  const configuration = requireJsonObject(configurationValue)
  const baseDraft = createProductUiDraft(productType, productSubtype)
  const optionValues = readOptionValues(configuration.optionValues)
  const selectedOptionIndexes: ProductUiDraft['selectedOptionIndexes'] = {}

  for (const key of Object.keys(optionValues) as ProductOptionSectionKey[]) {
    selectedOptionIndexes[key] = 0
  }

  return {
    ...baseDraft,
    optionValues,
    priceRowsBySelection: readPriceRows(configuration.priceRowsBySelection),
    selectedOptionIndexes,
    serviceEstimatesBySelection: readServiceEstimates(
      configuration.serviceEstimatesBySelection,
    ),
  }
}

export function toProductFormDraft(product: ProductRecord): ProductFormDraft {
  if (!isProductType(product.product_type)) {
    throw new Error('지원하지 않는 상품 유형입니다.')
  }

  const configuration = requireJsonObject(product.configuration)
  const storedVariants = configuration.variants
  const variantNames = getProductVariants(product.product_type)

  if (
    !isJsonObject(storedVariants) ||
    Object.keys(storedVariants).length !== variantNames.length ||
    variantNames.some((variant) => storedVariants[variant] === undefined)
  ) {
    throw new Error('상품 설정의 세부 유형을 확인해주세요.')
  }

  const draft = createProductFormDraft(product.product_type)

  for (const variant of variantNames) {
    const subtype =
      variant === product.product_type ? '' : (variant as ProductSubtype)

    draft.variants[variant] = toVariantUiDraft(
      product.product_type,
      subtype,
      storedVariants[variant],
    )
  }

  return draft
}

function serializeOptionValues(optionValues: ProductUiDraft['optionValues']) {
  return Object.fromEntries(
    Object.entries(optionValues).map(([key, values]) => [key, values ?? []]),
  ) as JsonObject
}

function serializePriceRows(
  rowsBySelection: ProductUiDraft['priceRowsBySelection'],
) {
  return Object.fromEntries(
    Object.entries(rowsBySelection).map(([key, rows]) => [
      key,
      rows.map((row) => ({
        quantity: toStoredNumber(row.quantity),
        unitPrice: toStoredNumber(row.unitPrice),
      })),
    ]),
  ) as JsonObject
}

function serializeServiceEstimates(
  estimatesBySelection: ProductUiDraft['serviceEstimatesBySelection'],
) {
  return Object.fromEntries(
    Object.entries(estimatesBySelection).map(([key, estimate]) => [
      key,
      {
        designPrintEstimate: toStoredNumber(estimate.designPrintEstimate),
        planningEstimate: toStoredNumber(estimate.planningEstimate),
      },
    ]),
  ) as JsonObject
}

function serializeVariantDraft(
  draft: ProductUiDraft,
  originalVariant?: Json,
): JsonObject {
  const original = isJsonObject(originalVariant) ? originalVariant : {}

  return {
    ...original,
    optionValues: serializeOptionValues(draft.optionValues),
    priceRowsBySelection: serializePriceRows(draft.priceRowsBySelection),
    serviceEstimatesBySelection: serializeServiceEstimates(
      draft.serviceEstimatesBySelection,
    ),
  }
}

function hasCompleteOptions(draft: ProductUiDraft) {
  if (!draft.productType) return false

  const profile = getProductUiProfile(draft.productType, draft.productSubtype)

  return profile.sections.every((section) => {
    if (section.kind !== 'options') return true

    const values = draft.optionValues[section.key]

    if (
      !values ||
      values.length === 0 ||
      values.some((value) => !value.trim())
    ) {
      return false
    }

    const normalizedValues = values.map((value) =>
      value.trim().toLocaleLowerCase('ko-KR'),
    )

    return new Set(normalizedValues).size === normalizedValues.length
  })
}

function hasValidPriceRows(draft: ProductUiDraft) {
  if (!draft.productType) return false

  const profile = getProductUiProfile(draft.productType, draft.productSubtype)
  const selections = Object.values(draft.priceRowsBySelection)

  if (
    profile.sections.some((section) => section.kind === 'quantity-prices') &&
    selections.length === 0
  ) {
    return false
  }

  return selections.every(
    (rows) =>
      rows.length > 0 &&
      rows.every((row) => {
        const quantity = toStoredNumber(row.quantity)

        toStoredNumber(row.unitPrice)
        return quantity !== null && quantity > 0
      }),
  )
}

function hasValidServiceEstimates(draft: ProductUiDraft) {
  if (!draft.productType) return false

  const profile = getProductUiProfile(draft.productType, draft.productSubtype)
  const estimates = Object.values(draft.serviceEstimatesBySelection)

  if (estimates.length === 0) return false

  return estimates.every((estimate: ServiceEstimateDraft) => {
    const designPrintEstimate = toStoredNumber(estimate.designPrintEstimate)
    const planningEstimate = toStoredNumber(estimate.planningEstimate)

    return (
      designPrintEstimate !== null &&
      (!profile.showPlanningEstimate || planningEstimate !== null)
    )
  })
}

function getVariantValidationMessage(
  draft: ProductUiDraft,
  status: ProductStatus,
) {
  if (!draft.productType || !isProductType(draft.productType)) {
    return '상품 유형을 선택해주세요.'
  }
  if (!isProductSubtype(draft.productType, draft.productSubtype)) {
    return '상품 세부 유형을 선택해주세요.'
  }

  try {
    serializePriceRows(draft.priceRowsBySelection)
    serializeServiceEstimates(draft.serviceEstimatesBySelection)
  } catch {
    return '숫자 입력값을 확인해주세요.'
  }

  if (status === 'draft') return null
  if (!hasCompleteOptions(draft)) return '모든 상품 옵션을 입력해주세요.'

  try {
    if (!hasValidPriceRows(draft)) return '모든 수량을 입력해주세요.'
    if (!hasValidServiceEstimates(draft)) {
      return '모든 서비스 견적을 입력해주세요.'
    }
  } catch {
    return '숫자 입력값을 확인해주세요.'
  }

  return null
}

export function getProductValidationMessage(
  draft: ProductFormDraft,
  status: ProductStatus,
) {
  if (!draft.productType || !isProductType(draft.productType)) {
    return '상품 유형을 선택해주세요.'
  }

  const variantNames = getProductVariants(draft.productType)

  if (
    Object.keys(draft.variants).length !== variantNames.length ||
    variantNames.some((variant) => !draft.variants[variant])
  ) {
    return '상품 설정의 세부 유형을 확인해주세요.'
  }

  for (const variant of variantNames) {
    const message = getVariantValidationMessage(
      draft.variants[variant]!,
      status,
    )

    if (message) return `${variant}: ${message}`
  }

  return null
}

export function toProductWriteInput(
  draft: ProductFormDraft,
  status: ProductStatus,
  originalConfiguration?: Json,
): ProductWriteInput {
  const validationMessage = getProductValidationMessage(draft, status)

  if (validationMessage) throw new Error(validationMessage)
  if (!draft.productType) throw new Error('상품 유형을 선택해주세요.')

  const original = isJsonObject(originalConfiguration)
    ? originalConfiguration
    : {}
  const originalVariants = isJsonObject(original.variants)
    ? original.variants
    : {}
  const variants = Object.fromEntries(
    getProductVariants(draft.productType).map((variant) => [
      variant,
      serializeVariantDraft(
        draft.variants[variant]!,
        originalVariants[variant],
      ),
    ]),
  ) as JsonObject

  return {
    configuration: {
      ...original,
      variants,
    },
    product_type: draft.productType,
    status,
  }
}
