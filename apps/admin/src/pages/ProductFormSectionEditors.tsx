import { useEffect, useRef } from 'react'
import type { RefCallback } from 'react'
import { AdminIcon } from '../components/AdminIcon'
import {
  formatDecimalNumericValue,
  formatNumericValue,
} from './productData'
import type {
  ProductOptionSectionKey,
  QuantityPriceDraft,
} from './productFormUi'
import './ProductFormFields.css'

type PriceInputProps = {
  label: string
  onChange: (value: string) => void
  value: string
}

function PriceInput({ label, onChange, value }: PriceInputProps) {
  return (
    <label className="product-ui-field">
      <span className="product-ui-field__label">{label}</span>
      <span className="product-ui-control">
        <input
          aria-label={label}
          autoComplete="off"
          className="product-ui-control__input"
          data-product-service-input
          inputMode="numeric"
          onChange={(event) =>
            onChange(formatNumericValue(event.currentTarget.value))
          }
          placeholder="0"
          required
          type="text"
          value={value}
        />
        <span className="product-ui-control__suffix">원</span>
      </span>
    </label>
  )
}

type ServiceSelectionEditorProps = {
  designPrintEstimate: string
  estimateUnit: '페이지' | '시안'
  onDesignPrintEstimateChange: (value: string) => void
  onPlanningEstimateChange: (value: string) => void
  planningEstimate: string
  showPlanningEstimate: boolean
}

export function ServiceSelectionEditor({
  designPrintEstimate,
  estimateUnit,
  onDesignPrintEstimateChange,
  onPlanningEstimateChange,
  planningEstimate,
  showPlanningEstimate,
}: ServiceSelectionEditorProps) {
  return (
    <fieldset className="product-ui-section">
      <legend className="product-ui-section__legend">II. 서비스 선택</legend>
      <PriceInput
        label={`디자인 + 인쇄 견적 (${estimateUnit} 당 단가)`}
        onChange={onDesignPrintEstimateChange}
        value={designPrintEstimate}
      />
      {showPlanningEstimate ? (
        <PriceInput
          label="기획 견적 (페이지 당 단가)"
          onChange={onPlanningEstimateChange}
          value={planningEstimate}
        />
      ) : null}
    </fieldset>
  )
}

function useFocusLastAddedRow(length: number): RefCallback<HTMLInputElement> {
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const previousLength = useRef(length)

  useEffect(() => {
    if (length > previousLength.current) {
      const frame = window.requestAnimationFrame(() => {
        inputs.current[length - 1]?.focus()
      })

      previousLength.current = length
      return () => window.cancelAnimationFrame(frame)
    }

    previousLength.current = length
  }, [length])

  return (input) => {
    if (!input) return

    const index = Number(input.dataset.rowIndex)

    if (Number.isInteger(index)) inputs.current[index] = input
  }
}

type OptionValuesEditorProps = {
  heading: string
  inputMode: 'numeric' | 'text'
  onAdd: () => void
  onRemove: (index: number) => void
  onSelect: (index: number) => void
  onValueChange: (index: number, value: string) => void
  optionKey: ProductOptionSectionKey
  selectedIndex: number
  valueUnit?: 'p' | '부' | '명' | '개' | '장' | '종'
  values: readonly string[]
}

export function OptionValuesEditor({
  heading,
  inputMode,
  onAdd,
  onRemove,
  onSelect,
  onValueChange,
  optionKey,
  selectedIndex,
  valueUnit,
  values,
}: OptionValuesEditorProps) {
  const registerInput = useFocusLastAddedRow(values.length)

  return (
    <fieldset className="product-ui-section">
      <legend className="product-ui-section__legend">{heading}</legend>
      <div className="product-ui-option-editor">
        <div className="product-ui-option-list">
          {values.map((value, index) => {
            const isSelected = index === selectedIndex

            return (
              <div
                className="product-ui-option-row"
                key={`${heading}-${index}`}
              >
                {isSelected ? (
                  <span className="product-ui-control product-ui-control--option product-ui-control--selected">
                    <input
                      aria-label={`${heading} ${index + 1}`}
                      autoComplete="off"
                      className="product-ui-control__input product-ui-control__input--option"
                      data-product-option-key={optionKey}
                      data-row-index={index}
                      inputMode={
                        inputMode === 'numeric' ? 'numeric' : undefined
                      }
                      onChange={(event) =>
                        onValueChange(
                          index,
                          inputMode === 'numeric'
                            ? formatNumericValue(event.currentTarget.value)
                            : event.currentTarget.value,
                        )
                      }
                      placeholder="입력해주세요."
                      ref={registerInput}
                      required
                      type="text"
                      value={value}
                    />
                    {valueUnit ? (
                      <span className="product-ui-control__suffix">
                        {valueUnit}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <button
                    aria-label={`${heading} ${index + 1} 선택`}
                    className="product-ui-control product-ui-control--option product-ui-control--selectable"
                    onClick={() => onSelect(index)}
                    type="button"
                  >
                    <span
                      className={
                        value
                          ? 'product-ui-control__value'
                          : 'product-ui-control__value product-ui-control__value--placeholder'
                      }
                    >
                      {value || '입력해주세요.'}
                    </span>
                    {valueUnit ? (
                      <span className="product-ui-control__suffix">
                        {valueUnit}
                      </span>
                    ) : null}
                  </button>
                )}
                <button
                  aria-label={`${heading} ${index + 1} 삭제`}
                  className="product-ui-remove-button"
                  onClick={() => onRemove(index)}
                  type="button"
                >
                  <AdminIcon name="x-close" size={16} />
                </button>
              </div>
            )
          })}
        </div>
        <button
          aria-label={`${heading} 항목 추가`}
          className="product-ui-add-button"
          data-product-option-add={optionKey}
          onClick={onAdd}
          type="button"
        >
          <span>추가</span>
          <AdminIcon name="plus" size={16} />
        </button>
      </div>
    </fieldset>
  )
}

type NumericControlProps = {
  ariaLabel: string
  dataRowIndex?: number
  field: keyof QuantityPriceDraft
  inputRef?: RefCallback<HTMLInputElement>
  onChange: (value: string) => void
  placeholder: string
  suffix: '부' | '개' | '장' | '원'
  value: string
}

function NumericControl({
  ariaLabel,
  dataRowIndex,
  field,
  inputRef,
  onChange,
  placeholder,
  suffix,
  value,
}: NumericControlProps) {
  return (
    <span className="product-ui-control product-ui-control--table-cell">
      <input
        aria-label={ariaLabel}
        autoComplete="off"
        className="product-ui-control__input product-ui-control__input--center"
        data-product-price-field={field}
        data-row-index={dataRowIndex}
        inputMode={field === 'unitPrice' ? 'decimal' : 'numeric'}
        onChange={(event) =>
          onChange(
            field === 'unitPrice'
              ? formatDecimalNumericValue(event.currentTarget.value)
              : formatNumericValue(event.currentTarget.value),
          )
        }
        placeholder={placeholder}
        ref={inputRef}
        required
        type="text"
        value={value}
      />
      <span className="product-ui-control__suffix">{suffix}</span>
    </span>
  )
}

type QuantityPriceEditorProps = {
  heading: string
  onAdd: () => void
  onRemove: (index: number) => void
  onRowChange: (index: number, row: QuantityPriceDraft) => void
  quantityUnit: '부' | '개' | '장'
  rows: readonly QuantityPriceDraft[]
}

export function QuantityPriceEditor({
  heading,
  onAdd,
  onRemove,
  onRowChange,
  quantityUnit,
  rows,
}: QuantityPriceEditorProps) {
  const registerQuantityInput = useFocusLastAddedRow(rows.length)

  return (
    <fieldset className="product-ui-section">
      <legend className="product-ui-section__legend">{heading}</legend>
      <div className="product-ui-price-table">
        <div className="product-ui-price-header" aria-hidden="true">
          <span>수량</span>
          <span>인쇄 단가(원/단위)</span>
          <span>합계(원)</span>
        </div>
        <div className="product-ui-price-list">
          {rows.map((row, index) => (
            <div className="product-ui-price-row" key={`${heading}-${index}`}>
              <div className="product-ui-price-columns">
                <NumericControl
                  ariaLabel={`${heading} ${index + 1} 수량`}
                  dataRowIndex={index}
                  field="quantity"
                  inputRef={registerQuantityInput}
                  onChange={(quantity) =>
                    onRowChange(index, { ...row, quantity })
                  }
                  placeholder="수량 및 단위를 입력해주세요."
                  suffix={quantityUnit}
                  value={row.quantity}
                />
                <NumericControl
                  ariaLabel={`${heading} ${index + 1} 인쇄 단가`}
                  dataRowIndex={index}
                  field="unitPrice"
                  onChange={(unitPrice) =>
                    onRowChange(index, { ...row, unitPrice })
                  }
                  placeholder="인쇄 단가를 입력해주세요."
                  suffix="원"
                  value={row.unitPrice}
                />
                <NumericControl
                  ariaLabel={`${heading} ${index + 1} 인쇄비 합계`}
                  dataRowIndex={index}
                  field="printAmount"
                  onChange={(printAmount) =>
                    onRowChange(index, { ...row, printAmount })
                  }
                  placeholder="인쇄비 합계를 입력해주세요."
                  suffix="원"
                  value={row.printAmount}
                />
              </div>
              <button
                aria-label={`${heading} ${index + 1} 삭제`}
                className="product-ui-remove-button product-ui-remove-button--price"
                onClick={() => onRemove(index)}
                type="button"
              >
                <AdminIcon name="x-close" size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          aria-label={`${heading} 항목 추가`}
          className="product-ui-add-button product-ui-add-button--center"
          data-product-price-add
          onClick={onAdd}
          type="button"
        >
          <span>추가</span>
          <AdminIcon name="plus" size={16} />
        </button>
      </div>
    </fieldset>
  )
}
