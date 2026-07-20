import { useId, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminIcon } from '../components/AdminIcon'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { AdminTypeCombobox } from '../components/admin-form/AdminTypeCombobox'
import './ProductFormPage.css'

type Step = 1 | 2
type OptionGroup = 'paperTypes' | 'pageCounts' | 'orderQuantities'
type OptionValueMode = 'text' | 'digits' | 'formatted'

type ProductFormState = {
  designPrintEstimate: string
  orderQuantities: string[]
  pageCounts: string[]
  paperTypes: string[]
  planningEstimate: string
  productType: string
  unitPrices: Record<string, string>
}

const defaultProductTypes = ['일반상품']

const initialFormState: ProductFormState = {
  designPrintEstimate: '',
  orderQuantities: [''],
  pageCounts: [''],
  paperTypes: [''],
  planningEstimate: '',
  productType: '',
  unitPrices: {},
}

function formatNumericValue(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function sanitizeOptionValue(value: string, mode: OptionValueMode) {
  if (mode === 'digits') return value.replace(/\D/g, '')
  if (mode === 'formatted') return formatNumericValue(value)

  return value
}

function getUnitPriceKey(paperIndex: number, pageIndex: number, quantityIndex: number) {
  return `${paperIndex}:${pageIndex}:${quantityIndex}`
}

type PriceFieldProps = {
  helperText: string
  label: string
  name: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}

function PriceField({ helperText, label, name, onChange, placeholder, value }: PriceFieldProps) {
  return (
    <label className="product-form-field">
      <span className="product-form-field__label-stack">
        <span className="product-form-field__label">{label}</span>
        <span className="product-form-field__helper">{helperText}</span>
      </span>
      <span className="product-form-control">
        <input
          aria-label={label}
          autoComplete="off"
          className="product-form-control__input"
          inputMode="numeric"
          name={name}
          onChange={(event) => onChange(formatNumericValue(event.currentTarget.value))}
          pattern="[0-9,]+"
          placeholder={placeholder}
          required
          type="text"
          value={value}
        />
        <span className="product-form-control__suffix">원</span>
      </span>
    </label>
  )
}

type DynamicOptionGroupProps = {
  group: OptionGroup
  label: string
  mode: OptionValueMode
  onAdd: () => void
  onRemove: (index: number) => void
  onValueChange: (index: number, value: string) => void
  placeholder: string
  unit?: string
  values: readonly string[]
}

function DynamicOptionGroup({
  group,
  label,
  mode,
  onAdd,
  onRemove,
  onValueChange,
  placeholder,
  unit,
  values,
}: DynamicOptionGroupProps) {
  const inputMode = mode === 'text' ? undefined : 'numeric'
  const pattern = mode === 'text' ? undefined : mode === 'digits' ? '[0-9]+' : '[0-9,]+'

  return (
    <fieldset className="product-form-field product-form-option-field">
      <legend className="product-form-field__label">{label}</legend>
      <div className="product-form-option-list">
        {values.map((value, index) => (
          <div className="product-form-option-row" key={`${group}-${index}`}>
            <label className="product-form-option-toggle product-form-option-toggle--active">
              <input
                aria-label={`${label} ${index + 1} 활성화됨`}
                checked
                className="product-form-visually-hidden"
                onChange={() => onRemove(index)}
                required
                type="checkbox"
              />
              <span className="product-form-option-toggle__box">
                <AdminIcon name="check" />
              </span>
              <span>버튼 추가</span>
            </label>
            <span className="product-form-control">
              <input
                aria-label={`${label} ${index + 1}`}
                autoComplete="off"
                className="product-form-control__input"
                inputMode={inputMode}
                name={`${group}-${index}`}
                onChange={(event) =>
                  onValueChange(index, sanitizeOptionValue(event.currentTarget.value, mode))
                }
                pattern={pattern}
                placeholder={placeholder}
                required
                type="text"
                value={value}
              />
              {unit ? <span className="product-form-control__suffix">{unit}</span> : null}
            </span>
          </div>
        ))}

        <div className="product-form-option-row" key={`${group}-add-${values.length}`}>
          <label className="product-form-option-toggle product-form-option-toggle--add">
            <input
              aria-label={`${label} 입력 추가`}
              checked={false}
              className="product-form-visually-hidden"
              onChange={onAdd}
              required={values.length === 0}
              type="checkbox"
            />
            <span className="product-form-option-toggle__box">
              <AdminIcon name="check" />
            </span>
            <span>버튼 추가</span>
          </label>
          <span className="product-form-control product-form-control--disabled">
            <input
              aria-label={`${label} 추가 입력`}
              className="product-form-control__input"
              disabled
              placeholder={placeholder}
              required
              type="text"
            />
            {unit ? <span className="product-form-control__suffix">{unit}</span> : null}
          </span>
        </div>
      </div>
    </fieldset>
  )
}

export function ProductFormPage() {
  const formId = useId().replaceAll(':', '')
  const navigate = useNavigate()
  const { productId } = useParams<{ productId: string }>()
  const isEditing = productId !== undefined
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<ProductFormState>(initialFormState)
  const [productTypes, setProductTypes] = useState<string[]>([...defaultProductTypes])
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0)
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)
  const [validationMessage, setValidationMessage] = useState('')
  const [productTypeError, setProductTypeError] = useState('')

  const pageTitle = isEditing ? '상품 수정' : '신규 상품 등록'
  const submitLabel = isEditing ? '수정하기' : '등록하기'

  function updateOption(group: OptionGroup, index: number, value: string) {
    setForm((current) => ({
      ...current,
      [group]: current[group].map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    }))
  }

  function addOption(group: OptionGroup) {
    setForm((current) => ({
      ...current,
      [group]: [...current[group], ''],
    }))
  }

  function removeOption(group: OptionGroup, index: number) {
    setForm((current) => ({
      ...current,
      [group]: current[group].filter((_, optionIndex) => optionIndex !== index),
      unitPrices: {},
    }))
  }

  function commitProductType(nextProductType: string) {
    const normalizedProductType = nextProductType.trim().replace(/\s+/g, ' ')

    if (!normalizedProductType) return

    const existingProductType = productTypes.find(
      (productType) =>
        productType.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR') ===
        normalizedProductType.toLocaleLowerCase('ko-KR'),
    )
    const productType = existingProductType ?? normalizedProductType

    if (!existingProductType) {
      setProductTypes((current) => [...current, productType])
    }

    setForm((current) => ({ ...current, productType }))
    setProductTypeError('')
  }

  function handleStepOneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.productType) {
      setProductTypeError('새 상품 유형은 입력한 뒤 Enter를 눌러 추가해주세요.')
      window.requestAnimationFrame(() => {
        document.getElementById(`${formId}-product-type`)?.focus()
      })
      return
    }

    setSelectedPaperIndex(0)
    setSelectedPageIndex(0)
    setValidationMessage('')
    setStep(2)
  }

  function handleUnitPriceChange(key: string, event: ChangeEvent<HTMLInputElement>) {
    const value = formatNumericValue(event.currentTarget.value)

    setForm((current) => ({
      ...current,
      unitPrices: {
        ...current.unitPrices,
        [key]: value,
      },
    }))
    setValidationMessage('')
  }

  function handleFinalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    for (let paperIndex = 0; paperIndex < form.paperTypes.length; paperIndex += 1) {
      for (let pageIndex = 0; pageIndex < form.pageCounts.length; pageIndex += 1) {
        for (
          let quantityIndex = 0;
          quantityIndex < form.orderQuantities.length;
          quantityIndex += 1
        ) {
          const key = getUnitPriceKey(paperIndex, pageIndex, quantityIndex)

          if (!form.unitPrices[key]) {
            setSelectedPaperIndex(paperIndex)
            setSelectedPageIndex(pageIndex)
            setValidationMessage('모든 단가 견적을 입력해주세요.')
            window.requestAnimationFrame(() => {
              const input = document.getElementById(`${formId}-unit-price-${quantityIndex}`)

              if (input instanceof HTMLInputElement) {
                input.focus()
                input.reportValidity()
              }
            })
            return
          }
        }
      }
    }

    setValidationMessage('')
    navigate('/products')
  }

  return step === 1 ? (
    <AdminFormLayout
      actions={
        <>
          <Link className="admin-form__button admin-form__button--outline" to="/products">
            목록으로
          </Link>
          <div className="admin-form__actions-group">
            <button className="admin-form__button admin-form__button--outline" type="button">
              임시저장
            </button>
            <button className="admin-form__button admin-form__button--solid" type="submit">
              <span>다음으로</span>
              <AdminIcon name="arrow-right" />
            </button>
          </div>
        </>
      }
      onSubmit={handleStepOneSubmit}
      title={pageTitle}
    >
      <div className="product-form-field">
              <label
                className="product-form-field__label"
                htmlFor={`${formId}-product-type`}
              >
                상품 유형
              </label>
              <AdminTypeCombobox
                allowCustomValue
                errorMessage={productTypeError}
                inputId={`${formId}-product-type`}
                name="productType"
                onClear={() => {
                  setForm((current) => ({ ...current, productType: '' }))
                  setProductTypeError('')
                }}
                onCommit={commitProductType}
                options={productTypes}
                placeholder="상품 유형을 선택하거나 입력해주세요."
                value={form.productType}
              />
              {productTypeError ? (
                <span
                  className="product-form-validation-message"
                  id={`${formId}-product-type-error`}
                  role="alert"
                >
                  {productTypeError}
                </span>
              ) : null}
            </div>

            <PriceField
              helperText="편집 디자인·후가공·인쇄 원스톱 진행"
              label="디자인 + 인쇄 견적"
              name="designPrintEstimate"
              onChange={(value) =>
                setForm((current) => ({ ...current, designPrintEstimate: value }))
              }
              placeholder="페이지당 디자인 + 인쇄 견적을 입력해주세요."
              value={form.designPrintEstimate}
            />

            <PriceField
              helperText="컨셉 방향·구성안·카피라이팅"
              label="기획 견적"
              name="planningEstimate"
              onChange={(value) =>
                setForm((current) => ({ ...current, planningEstimate: value }))
              }
              placeholder="페이지당 기획 견적을 입력해주세요."
              value={form.planningEstimate}
            />

            <DynamicOptionGroup
              group="paperTypes"
              label="용지 종류"
              mode="text"
              onAdd={() => addOption('paperTypes')}
              onRemove={(index) => removeOption('paperTypes', index)}
              onValueChange={(index, value) => updateOption('paperTypes', index, value)}
              placeholder="용지 이름을 입력해주세요."
              values={form.paperTypes}
            />

            <DynamicOptionGroup
              group="pageCounts"
              label="페이지 수"
              mode="formatted"
              onAdd={() => addOption('pageCounts')}
              onRemove={(index) => removeOption('pageCounts', index)}
              onValueChange={(index, value) => updateOption('pageCounts', index, value)}
              placeholder="페이지 수를 입력해주세요."
              unit="p"
              values={form.pageCounts}
            />

      <DynamicOptionGroup
        group="orderQuantities"
        label="주문 수량"
        mode="formatted"
        onAdd={() => addOption('orderQuantities')}
        onRemove={(index) => removeOption('orderQuantities', index)}
        onValueChange={(index, value) => updateOption('orderQuantities', index, value)}
        placeholder="주문 가능한 수량을 입력해주세요."
        unit="부"
        values={form.orderQuantities}
      />
    </AdminFormLayout>
  ) : (
    <AdminFormLayout
      actions={
        <>
          <button
            className="admin-form__button admin-form__button--outline"
            onClick={() => {
              setValidationMessage('')
              setStep(1)
            }}
            type="button"
          >
            뒤로가기
          </button>
          <div className="admin-form__actions-group">
            <button className="admin-form__button admin-form__button--outline" type="button">
              임시저장
            </button>
            <button className="admin-form__button admin-form__button--solid" type="submit">
              <span>{submitLabel}</span>
              <AdminIcon name="arrow-right" />
            </button>
          </div>
        </>
      }
      onSubmit={handleFinalSubmit}
      title={pageTitle}
    >
      <fieldset className="product-form-tab-field">
              <legend className="product-form-field__label">용지 선택</legend>
              <div className="product-form-tabs">
                {form.paperTypes.map((paperType, index) => (
                  <label
                    className={
                      index === selectedPaperIndex
                        ? 'product-form-tab product-form-tab--selected'
                        : 'product-form-tab'
                    }
                    key={`paper-${index}`}
                  >
                    <input
                      checked={index === selectedPaperIndex}
                      className="product-form-visually-hidden"
                      name="selectedPaper"
                      onChange={() => {
                        setSelectedPaperIndex(index)
                        setValidationMessage('')
                      }}
                      required
                      type="radio"
                      value={index}
                    />
                    <span>{paperType}</span>
                  </label>
                ))}
              </div>
      </fieldset>

      <fieldset className="product-form-tab-field">
              <legend className="product-form-field__label">페이지 수 선택</legend>
              <div className="product-form-tabs">
                {form.pageCounts.map((pageCount, index) => (
                  <label
                    className={
                      index === selectedPageIndex
                        ? 'product-form-tab product-form-tab--selected'
                        : 'product-form-tab'
                    }
                    key={`page-${index}`}
                  >
                    <input
                      checked={index === selectedPageIndex}
                      className="product-form-visually-hidden"
                      name="selectedPage"
                      onChange={() => {
                        setSelectedPageIndex(index)
                        setValidationMessage('')
                      }}
                      required
                      type="radio"
                      value={index}
                    />
                    <span>{pageCount}p</span>
                  </label>
                ))}
              </div>
      </fieldset>

      <fieldset className="product-form-unit-price-field">
              <legend className="product-form-field__label">단가 견적</legend>
              <div className="product-form-unit-price-list">
                {form.orderQuantities.map((quantity, quantityIndex) => {
                  const key = getUnitPriceKey(
                    selectedPaperIndex,
                    selectedPageIndex,
                    quantityIndex,
                  )

                  return (
                    <div className="product-form-unit-price-row" key={key}>
                      <span className="product-form-unit-price-row__label">
                        {form.pageCounts[selectedPageIndex]}p / {quantity}부
                      </span>
                      <span className="product-form-control">
                        <input
                          aria-label={`${form.pageCounts[selectedPageIndex]}p ${quantity}부 단가 견적`}
                          autoComplete="off"
                          className="product-form-control__input"
                          id={`${formId}-unit-price-${quantityIndex}`}
                          inputMode="numeric"
                          name={`unitPrice-${key}`}
                          onChange={(event) => handleUnitPriceChange(key, event)}
                          pattern="[0-9,]+"
                          required
                          type="text"
                          value={form.unitPrices[key] ?? ''}
                        />
                        <span className="product-form-control__suffix">원</span>
                      </span>
                    </div>
                  )
                })}
              </div>
              {validationMessage ? (
                <p className="product-form-validation-message" role="alert">
                  {validationMessage}
                </p>
              ) : null}
      </fieldset>
    </AdminFormLayout>
  )
}
