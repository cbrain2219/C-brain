import {
  createPaymentLink,
  deletePaymentLink,
  getAdminPaymentLink,
  updatePaymentLink,
} from '@repo/supabase'
import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminIcon } from '../components/AdminIcon'
import { AdminDeleteDialog } from '../components/admin-form/AdminDeleteDialog'
import { AdminFormLayout } from '../components/admin-form/AdminFormLayout'
import { supabase } from '../lib/supabase'
import { createInitialLinkPayForm, toLinkPayFormState, toPaymentLinkInput } from './linkPayData'
import type { LinkPayFormState } from './linkPayData'
import { formatNumericValue } from './productData'
import './BlogFormPage.css'
import './LinkPayFormPage.css'

export function LinkPayFormPage() {
  const { linkPayId } = useParams<{ linkPayId: string }>()

  return <LinkPayForm key={linkPayId ?? 'new'} linkPayId={linkPayId} />
}

type LinkPayFormProps = {
  readonly linkPayId: string | undefined
}

function LinkPayForm({ linkPayId }: LinkPayFormProps) {
  const formId = useId().replaceAll(':', '')
  const navigate = useNavigate()
  const isEditing = linkPayId !== undefined
  const isMounted = useRef(true)
  const [form, setForm] = useState(createInitialLinkPayForm)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [hasOrders, setHasOrders] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    let isCurrent = true
    const id = linkPayId

    if (!id) return

    void getAdminPaymentLink(supabase, id)
      .then((paymentLink) => {
        if (!isCurrent) return
        setForm(toLinkPayFormState(paymentLink))
        setIsDisabled(paymentLink.disabled_at !== null)
        setHasOrders(paymentLink.hasOrders)
      })
      .catch(() => {
        if (!isCurrent) return
        setLoadError('링크페이 정보를 불러오지 못했습니다.')
        toast.error('링크페이 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [linkPayId])

  function updateForm<Key extends keyof LinkPayFormState>(key: Key, value: LinkPayFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving || isDeleting || isTogglingStatus) return

    setIsSaving(true)
    setSaveError('')

    try {
      const input = toPaymentLinkInput(form)

      if (linkPayId) {
        await updatePaymentLink(supabase, linkPayId, input)
      } else {
        await createPaymentLink(supabase, input)
      }

      if (!isMounted.current) return

      toast.success(isEditing ? '링크페이를 수정했습니다.' : '링크페이를 생성했습니다.')
      navigate('/linkpay')
    } catch {
      if (!isMounted.current) return

      setSaveError('링크페이를 저장하지 못했습니다. 입력값과 권한을 확인해주세요.')
      toast.error('링크페이를 저장하지 못했습니다.')
      window.alert('링크페이를 저장하지 못했습니다. 다시 시도해주세요.')
    } finally {
      if (isMounted.current) setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!linkPayId || isSaving || isDeleting || isTogglingStatus) return

    setIsDeleting(true)
    setSaveError('')

    try {
      await deletePaymentLink(supabase, linkPayId)
      toast.success('링크페이를 삭제했습니다.')
      navigate('/linkpay', { replace: true })
    } catch {
      setSaveError('링크페이를 삭제하지 못했습니다. 결제가 시작된 링크는 삭제할 수 없습니다.')
      toast.error('링크페이를 삭제하지 못했습니다.')
      window.alert('링크페이를 삭제하지 못했습니다. 결제가 시작된 링크인지 확인해주세요.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleToggleStatus() {
    if (!linkPayId || isSaving || isDeleting || isTogglingStatus) return

    setIsTogglingStatus(true)
    setSaveError('')

    try {
      await updatePaymentLink(supabase, linkPayId, {
        disabled_at: isDisabled ? null : new Date().toISOString(),
      })
      if (!isMounted.current) return

      setIsDisabled((current) => !current)
      toast.success(isDisabled ? '링크페이를 다시 활성화했습니다.' : '링크페이를 중단했습니다.')
    } catch {
      if (!isMounted.current) return

      setSaveError('링크페이 상태를 변경하지 못했습니다.')
      toast.error('링크페이 상태를 변경하지 못했습니다.')
    } finally {
      if (isMounted.current) setIsTogglingStatus(false)
    }
  }

  if (isLoading || loadError) {
    return (
      <AdminFormLayout
        actions={
          <Link className="admin-form__button admin-form__button--outline" to="/linkpay">
            목록으로
          </Link>
        }
        onSubmit={(event) => event.preventDefault()}
        title={isEditing ? '링크페이 수정' : '신규 링크페이 등록'}
      >
        <p className="blog-form__error" role={loadError ? 'alert' : 'status'}>
          {loadError || '링크페이 정보를 불러오는 중입니다.'}
        </p>
      </AdminFormLayout>
    )
  }

  return (
    <AdminFormLayout
      actions={
        <>
          <Link className="admin-form__button admin-form__button--outline" to="/linkpay">
            목록으로
          </Link>
          <div className="admin-form__actions-group">
            {isEditing ? (
              hasOrders || isDisabled ? (
                <button
                  className="admin-form__button admin-form__button--outline"
                  disabled={isSaving || isDeleting || isTogglingStatus}
                  onClick={() => void handleToggleStatus()}
                  type="button"
                >
                  {isTogglingStatus ? '처리 중...' : isDisabled ? '다시 활성화' : '중단하기'}
                </button>
              ) : (
                <AdminDeleteDialog
                  disabled={isSaving || isTogglingStatus}
                  isDeleting={isDeleting}
                  itemLabel="링크페이"
                  onConfirm={handleDelete}
                />
              )
            ) : null}
            <button
              className="admin-form__button admin-form__button--solid"
              disabled={isSaving || isDeleting || isTogglingStatus}
              type="submit"
            >
              <span>{isSaving ? '저장 중...' : isEditing ? '수정하기' : '등록하기'}</span>
              <AdminIcon name="arrow-right" />
            </button>
          </div>
        </>
      }
      onSubmit={handleSubmit}
      title={isEditing ? '링크페이 수정' : '신규 링크페이 등록'}
    >
      {saveError ? (
        <p className="blog-form__error" role="alert">
          {saveError}
        </p>
      ) : null}

      <label className="blog-form__field" htmlFor={`${formId}-category`}>
        <span className="blog-form__label">카테고리</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={`${formId}-category`}
          name="category"
          onChange={(event) => updateForm('category', event.currentTarget.value)}
          placeholder="카테고리를 입력해주세요. (ex. 브로슈어)"
          required
          type="text"
          value={form.category}
        />
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-service`}>
        <span className="blog-form__label">서비스</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={`${formId}-service`}
          name="service"
          onChange={(event) => updateForm('service', event.currentTarget.value)}
          placeholder="서비스를 입력해주세요 (ex. 디자인)"
          required
          type="text"
          value={form.service}
        />
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-paper`}>
        <span className="blog-form__label">용지</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={`${formId}-paper`}
          name="paper"
          onChange={(event) => updateForm('paper', event.currentTarget.value)}
          placeholder="용지를 입력해주세요. (ex. 일반지)"
          required
          type="text"
          value={form.paper}
        />
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-page-quantity`}>
        <span className="blog-form__label">페이지 수 / 수량</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={`${formId}-page-quantity`}
          name="pageQuantity"
          onChange={(event) => updateForm('pageQuantity', event.currentTarget.value)}
          placeholder="페이지 수 및 수량을 입력해주세요. (ex. 12p / 500부)"
          required
          type="text"
          value={form.pageQuantity}
        />
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-client`}>
        <span className="blog-form__label">고객사명</span>
        <input
          autoComplete="organization"
          className="blog-form__control"
          id={`${formId}-client`}
          name="client"
          onChange={(event) => updateForm('client', event.currentTarget.value)}
          placeholder="고객사명을 입력해주세요."
          required
          type="text"
          value={form.client}
        />
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-payment-name`}>
        <span className="blog-form__label">결제명</span>
        <input
          autoComplete="off"
          className="blog-form__control"
          id={`${formId}-payment-name`}
          name="paymentName"
          onChange={(event) => updateForm('paymentName', event.currentTarget.value)}
          placeholder="결제명을 입력해주세요."
          required
          type="text"
          value={form.paymentName}
        />
      </label>

      <label className="blog-form__field" htmlFor={`${formId}-amount`}>
        <span className="blog-form__label">결제 금액</span>
        <span className="linkpay-form__amount">
          <input
            autoComplete="off"
            className="blog-form__control linkpay-form__amount-input"
            id={`${formId}-amount`}
            inputMode="numeric"
            name="amount"
            onChange={(event) =>
              updateForm('amount', formatNumericValue(event.currentTarget.value))
            }
            pattern="[0-9,]+"
            placeholder="결제 금액을 입력해주세요.(숫자만 입력)"
            required
            type="text"
            value={form.amount}
          />
          <span className="linkpay-form__amount-unit">원</span>
        </span>
      </label>
    </AdminFormLayout>
  )
}
