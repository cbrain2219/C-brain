import { useId } from 'react'
import { AdminTypeCombobox } from '../components/admin-form/AdminTypeCombobox'
import {
  OptionValuesEditor,
  QuantityPriceEditor,
  ServiceSelectionEditor,
} from './ProductFormSectionEditors'
import {
  changeProductUiSubtype,
  changeProductUiType,
  formatProductSectionHeading,
  getProductPriceKey,
  getProductServiceKey,
  getProductUiProfile,
  productSubtypeOptions,
  productTypes,
  removeProductPriceOption,
  removeProductServiceOption,
} from './productFormUi'
import type {
  ProductType,
  ProductUiDraft,
  ProductUiSection,
  QuantityPriceDraft,
} from './productFormUi'
import './ProductFormFields.css'

type ProductFormFieldsProps = {
  draft: ProductUiDraft
  onChange: (nextDraft: ProductUiDraft) => void
}

type RenderSectionArgs = ProductFormFieldsProps & {
  index: number
  section: ProductUiSection
}

function isProductType(value: string): value is ProductType {
  return productTypes.some((productType) => productType === value)
}

function TypeSelection({ draft, onChange }: ProductFormFieldsProps) {
  const inputId = useId()
  const subtypeOptions = draft.productType
    ? productSubtypeOptions[draft.productType]
    : []

  return (
    <div className="product-ui-section product-ui-type-section">
      <div className="product-ui-type-input">
        <label className="product-ui-section__legend" htmlFor={inputId}>
          I. 유형 선택
        </label>
        <AdminTypeCombobox
          inputId={inputId}
          name="productType"
          onCommit={(value) => {
            if (isProductType(value))
              onChange(changeProductUiType(draft, value))
          }}
          options={productTypes}
          placeholder="상품 유형을 선택해주세요."
          readOnly
          value={draft.productType}
        />
      </div>
      {subtypeOptions.length > 0 ? (
        <fieldset className="product-ui-subtype-field">
          <legend className="admin-sr-only">세부 유형 선택</legend>
          <div className="product-ui-subtype-options">
            {subtypeOptions.map((subtype) => (
              <label
                className={
                  draft.productSubtype === subtype
                    ? 'product-ui-subtype-option product-ui-subtype-option--selected'
                    : 'product-ui-subtype-option'
                }
                key={subtype}
              >
                <input
                  checked={draft.productSubtype === subtype}
                  className="admin-sr-only"
                  name="productSubtype"
                  onChange={() =>
                    onChange(changeProductUiSubtype(draft, subtype))
                  }
                  required
                  type="radio"
                  value={subtype}
                />
                <span>{subtype}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  )
}

function renderProductUiSection({
  draft,
  index,
  onChange,
  section,
}: RenderSectionArgs) {
  const heading = formatProductSectionHeading(index, section.label)

  if (section.kind === 'options') {
    const values = draft.optionValues[section.key] ?? []
    const selectedIndex = Math.min(
      draft.selectedOptionIndexes[section.key] ?? 0,
      Math.max(values.length - 1, 0),
    )

    return (
      <OptionValuesEditor
        heading={heading}
        inputMode={section.inputMode}
        key={section.key}
        onAdd={() =>
          onChange({
            ...draft,
            optionValues: {
              ...draft.optionValues,
              [section.key]: [...values, ''],
            },
            selectedOptionIndexes: {
              ...draft.selectedOptionIndexes,
              [section.key]: values.length,
            },
          })
        }
        onRemove={(removeIndex) => {
          const nextValues = values.filter(
            (_, valueIndex) => valueIndex !== removeIndex,
          )
          const nextSelectedIndex =
            selectedIndex > removeIndex
              ? selectedIndex - 1
              : Math.min(selectedIndex, Math.max(nextValues.length - 1, 0))

          onChange({
            ...draft,
            optionValues: {
              ...draft.optionValues,
              [section.key]: nextValues,
            },
            priceRowsBySelection: removeProductPriceOption(
              draft,
              section.key,
              removeIndex,
            ),
            selectedOptionIndexes: {
              ...draft.selectedOptionIndexes,
              [section.key]: nextSelectedIndex,
            },
            serviceEstimatesBySelection: removeProductServiceOption(
              draft,
              section.key,
              removeIndex,
            ),
          })
        }}
        onSelect={(nextSelectedIndex) =>
          onChange({
            ...draft,
            selectedOptionIndexes: {
              ...draft.selectedOptionIndexes,
              [section.key]: nextSelectedIndex,
            },
          })
        }
        onValueChange={(changeIndex, value) =>
          onChange({
            ...draft,
            optionValues: {
              ...draft.optionValues,
              [section.key]: values.map((current, valueIndex) =>
                valueIndex === changeIndex ? value : current,
              ),
            },
          })
        }
        selectedIndex={selectedIndex}
        valueUnit={section.valueUnit}
        values={values}
      />
    )
  }

  const priceKey = getProductPriceKey(draft)
  const rows =
    draft.priceRowsBySelection[priceKey] ?? draft.priceRows[section.key] ?? []

  function updateRows(nextRows: QuantityPriceDraft[]) {
    onChange({
      ...draft,
      priceRowsBySelection: {
        ...draft.priceRowsBySelection,
        [priceKey]: nextRows,
      },
    })
  }

  return (
    <QuantityPriceEditor
      heading={heading}
      key={section.key}
      onAdd={() => updateRows([...rows, { quantity: '', unitPrice: '' }])}
      onRemove={(removeIndex) =>
        updateRows(rows.filter((_, rowIndex) => rowIndex !== removeIndex))
      }
      onRowChange={(changeIndex, row) =>
        updateRows(
          rows.map((current, rowIndex) =>
            rowIndex === changeIndex ? row : current,
          ),
        )
      }
      quantityUnit={section.quantityUnit}
      rows={rows}
    />
  )
}

export function ProductFormFields({ draft, onChange }: ProductFormFieldsProps) {
  const profile = draft.productType
    ? getProductUiProfile(draft.productType, draft.productSubtype)
    : null
  const serviceKey = getProductServiceKey(draft)
  const serviceEstimate = draft.serviceEstimatesBySelection[serviceKey] ?? {
    designPrintEstimate: '',
    planningEstimate: '',
  }

  function updateServiceEstimate(nextEstimate: typeof serviceEstimate) {
    onChange({
      ...draft,
      serviceEstimatesBySelection: {
        ...draft.serviceEstimatesBySelection,
        [serviceKey]: nextEstimate,
      },
    })
  }

  return (
    <div className="product-ui-sections">
      <TypeSelection draft={draft} onChange={onChange} />
      {profile ? (
        <ServiceSelectionEditor
          designPrintEstimate={serviceEstimate.designPrintEstimate}
          estimateUnit={profile.estimateUnit}
          onDesignPrintEstimateChange={(designPrintEstimate) =>
            updateServiceEstimate({ ...serviceEstimate, designPrintEstimate })
          }
          onPlanningEstimateChange={(planningEstimate) =>
            updateServiceEstimate({ ...serviceEstimate, planningEstimate })
          }
          planningEstimate={serviceEstimate.planningEstimate}
          showPlanningEstimate={profile.showPlanningEstimate}
        />
      ) : (
        <p className="product-ui-hint">
          유형을 선택하면 서비스와 상세 옵션이 표시됩니다.
        </p>
      )}
      {profile?.sections.map((section, index) =>
        renderProductUiSection({ draft, index, onChange, section }),
      )}
    </div>
  )
}
