import { createProduct, deleteProduct, getAdminProduct, updateProduct } from '@repo/supabase'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { useEffect, useId, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminIcon } from '../components/AdminIcon'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { AdminTypeCombobox } from '../components/admin-form/AdminTypeCombobox'
import { supabase } from '../lib/supabase'
import {
  createInitialProductForm,
  formatNumericValue,
  getMissingUnitPriceKey,
  getUnitPriceKey,
  toProductFormState,
  toProductMutationInput,
} from './productData'
import './ProductFormPage.css'

type Step = 1 | 2
type OptionGroup = 'paperTypes' | 'pageCounts' | 'orderQuantities'
type OptionValueMode = 'text' | 'digits' | 'formatted'

const defaultProductTypes = ['일반상품']

function sanitizeOptionValue(value: string, mode: OptionValueMode) {
  if (mode === 'digits') return value.replace(/\D/g, '')
  if (mode === 'formatted') return formatNumericValue(value)

  return value
}

function getSubmitIntent(event: FormEvent<HTMLFormElement>) {
  const submitter = (event.nativeEvent as SubmitEvent).submitter

  return submitter instanceof HTMLButtonElement ? submitter.value : ''
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
  const [form, setForm] = useState(createInitialProductForm)
  const [productTypes, setProductTypes] = useState<string[]>([...defaultProductTypes])
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0)
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)
  const [validationMessage, setValidationMessage] = useState('')
  const [productTypeError, setProductTypeError] = useState('')
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [productTypeInputKey, setProductTypeInputKey] = useState(0)

  const pageTitle = isEditing ? '상품 수정' : '신규 상품 등록'
  const submitLabel = isEditing ? '수정하기' : '등록하기'

  useEffect(() => {
    let isCurrent = true
    const id = productId

    if (!id) return

    async function loadProduct(id: string) {
      setIsLoadingProduct(true)
      setLoadError('')

      try {
        const product = await getAdminProduct(supabase, id)

        if (!isCurrent) return

        setForm(toProductFormState(product))
        setProductTypeInputKey((current) => current + 1)
        setProductTypes((current) => {
          const normalizedProductType = product.type.trim().replace(/\s+/g, ' ')
          const hasProductType = current.some(
            (productType) =>
              productType.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR') ===
              normalizedProductType.toLocaleLowerCase('ko-KR'),
          )

          return hasProductType ? current : [...current, product.type]
        })
        setStep(1)
        setSelectedPaperIndex(0)
        setSelectedPageIndex(0)
        setValidationMessage('')
        setProductTypeError('')
      } catch {
        if (!isCurrent) return
        setLoadError('상품 정보를 불러오지 못했습니다.')
        toast.error('상품 정보를 불러오지 못했습니다.')
      } finally {
        if (isCurrent) setIsLoadingProduct(false)
      }
    }

    void loadProduct(id)

    return () => {
      isCurrent = false
    }
  }, [productId])

  function updateOption(group: OptionGroup, index: number, value: string) {
    setForm((current) => ({
      ...current,
      [group]: current[group].map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
      unitPrices: {},
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

  async function persist(status: 'draft' | 'published') {
    if (isSaving || isDeleting) return

    setIsSaving(true)
    setSaveError('')

    try {
      const input = toProductMutationInput(form, status)
      const product = productId
        ? await updateProduct(supabase, productId, input)
        : await createProduct(supabase, input)

      toast.success(status === 'draft' ? '임시저장했습니다.' : '상품을 저장했습니다.')

      if (status === 'draft') {
        navigate('/products/' + product.id, { replace: true })
        return
      }

      navigate('/products')
    } catch {
      setSaveError('상품을 저장하지 못했습니다. 입력값과 권한을 확인해주세요.')
      toast.error('상품을 저장하지 못했습니다.')
      window.alert('상품을 저장하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!productId || isSaving || isDeleting) return

    setIsDeleteDialogOpen(false)
    setIsDeleting(true)
    setSaveError('')

    try {
      await deleteProduct(supabase, productId)
      toast.success('상품을 삭제했습니다.')
      navigate('/products', { replace: true })
    } catch {
      setSaveError('상품을 삭제하지 못했습니다. 권한을 확인해주세요.')
      toast.error('상품을 삭제하지 못했습니다.')
      window.alert('상품을 삭제하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsDeleting(false)
    }
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

    if (getSubmitIntent(event) === 'draft') {
      void persist('draft')
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

    if (getSubmitIntent(event) === 'draft') {
      void persist('draft')
      return
    }

    const missingUnitPriceKey = getMissingUnitPriceKey(form)

    if (missingUnitPriceKey) {
      const [paperIndex, pageIndex, quantityIndex] = missingUnitPriceKey.split(':').map(Number)

      setSelectedPaperIndex(paperIndex)
      setSelectedPageIndex(pageIndex)
      setValidationMessage('모든 단가 견적을 입력해주세요.')
      window.requestAnimationFrame(() => {
        document.getElementById(`${formId}-unit-price-${quantityIndex}`)?.focus()
      })
      return
    }

    setValidationMessage('')
    void persist('published')
  }

  if (isLoadingProduct || loadError) {
    return (
      <AdminFormLayout
        actions={
          <Link className="admin-form__button admin-form__button--outline" to="/products">
            목록으로
          </Link>
        }
        onSubmit={(event) => event.preventDefault()}
        title={pageTitle}
      >
        <p className="product-form-validation-message" role={loadError ? 'alert' : 'status'}>
          {loadError || '상품 정보를 불러오는 중입니다.'}
        </p>
      </AdminFormLayout>
    )
  }

  const saveErrorAlert = saveError ? (
    <p className="product-form-validation-message" role="alert">
      {saveError}
    </p>
  ) : null
  const deleteButton = isEditing ? (
    <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialog.Trigger
        className="admin-form__button admin-form__button--danger"
        disabled={isSaving || isDeleting}
        type="button"
      >
        삭제
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="product-delete-dialog__backdrop" />
        <AlertDialog.Viewport className="product-delete-dialog__viewport">
          <AlertDialog.Popup className="product-delete-dialog">
            <AlertDialog.Title className="product-delete-dialog__title">
              상품을 삭제할까요?
            </AlertDialog.Title>
            <AlertDialog.Description className="product-delete-dialog__description">
              삭제한 상품은 복구할 수 없습니다.
            </AlertDialog.Description>
            <div className="product-delete-dialog__actions">
              <AlertDialog.Close className="product-delete-dialog__button" type="button">
                취소
              </AlertDialog.Close>
              <button
                className="product-delete-dialog__button product-delete-dialog__button--danger"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                type="button"
              >
                삭제
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  ) : null

  return step === 1 ? (
    <AdminFormLayout
      actions={
        <>
          <Link className="admin-form__button admin-form__button--outline" to="/products">
            목록으로
          </Link>
          <div className="admin-form__actions-group">
            {deleteButton}
            <button
              className="admin-form__button admin-form__button--outline"
              disabled={isSaving || isDeleting}
              name="intent"
              type="submit"
              value="draft"
            >
              임시저장
            </button>
            <button
              className="admin-form__button admin-form__button--solid"
              disabled={isSaving || isDeleting}
              name="intent"
              type="submit"
              value="next"
            >
              <span>다음으로</span>
              <AdminIcon name="arrow-right" />
            </button>
          </div>
        </>
      }
      onSubmit={handleStepOneSubmit}
      title={pageTitle}
    >
      {saveErrorAlert}
      <label className="product-form-field">
        <span className="product-form-field__label">상품명</span>
        <span className="product-form-control">
          <input
            autoComplete="off"
            className="product-form-control__input"
            name="name"
            onChange={(event) => {
              const name = event.currentTarget.value

              setForm((current) => ({ ...current, name }))
            }}
            placeholder="상품명을 입력해주세요."
            required
            type="text"
            value={form.name}
          />
        </span>
      </label>
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
                key={productTypeInputKey}
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
            {deleteButton}
            <button
              className="admin-form__button admin-form__button--outline"
              disabled={isSaving || isDeleting}
              name="intent"
              type="submit"
              value="draft"
            >
              임시저장
            </button>
            <button
              className="admin-form__button admin-form__button--solid"
              disabled={isSaving || isDeleting}
              name="intent"
              type="submit"
              value="publish"
            >
              <span>{submitLabel}</span>
              <AdminIcon name="arrow-right" />
            </button>
          </div>
        </>
      }
      onSubmit={handleFinalSubmit}
      title={pageTitle}
    >
      {saveErrorAlert}
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
