import {
  createProductUiDraft,
  getProductVariants,
  productSubtypeOptions,
} from './productFormUi.ts'
import type {
  ProductSubtype,
  ProductType,
  ProductUiDraft,
  ProductVariant,
} from './productFormUi.ts'

export type ProductFormDraft = {
  activeVariant: ProductVariant | ''
  productType: ProductType | ''
  variants: Partial<Record<ProductVariant, ProductUiDraft>>
}

export function createProductFormDraft(
  productType: ProductType | '' = '',
): ProductFormDraft {
  if (!productType) {
    return { activeVariant: '', productType: '', variants: {} }
  }

  const subtypeOptions = productSubtypeOptions[
    productType
  ] as readonly ProductSubtype[]
  const variantNames = getProductVariants(productType)
  const variants = Object.fromEntries(
    variantNames.map((variant) => {
      const subtype = subtypeOptions.includes(variant as ProductSubtype)
        ? (variant as ProductSubtype)
        : ''

      return [variant, createProductUiDraft(productType, subtype)]
    }),
  ) as Partial<Record<ProductVariant, ProductUiDraft>>

  return {
    activeVariant: variantNames[0] ?? '',
    productType,
    variants,
  }
}

export function changeProductFormType(
  _draft: ProductFormDraft,
  productType: ProductType,
) {
  return createProductFormDraft(productType)
}

export function selectProductFormVariant(
  draft: ProductFormDraft,
  variant: ProductVariant,
) {
  if (!draft.variants[variant]) {
    throw new Error('지원하지 않는 상품 세부 유형입니다.')
  }

  return { ...draft, activeVariant: variant }
}

export function getActiveProductUiDraft(draft: ProductFormDraft) {
  const active = draft.activeVariant
    ? draft.variants[draft.activeVariant]
    : undefined

  if (!active) throw new Error('상품 유형을 선택해주세요.')

  return active
}

export function replaceActiveProductUiDraft(
  draft: ProductFormDraft,
  nextVariantDraft: ProductUiDraft,
) {
  if (!draft.activeVariant) throw new Error('상품 유형을 선택해주세요.')

  return {
    ...draft,
    variants: {
      ...draft.variants,
      [draft.activeVariant]: nextVariantDraft,
    },
  }
}
