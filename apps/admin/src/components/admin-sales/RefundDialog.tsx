import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { SalesEvent } from '@repo/supabase'
import { AdminIcon } from '../AdminIcon'
import {
  formatSalesNumber,
  getRefundAmountError,
  getRefundReasonError,
} from '../../pages/salesData'

type RefundDialogProps = {
  readonly onClose: () => void
  readonly onRefund: (input: {
    amount: number
    reason: string
  }) => Promise<void>
  readonly state: 'complete' | 'confirm'
  readonly transaction: SalesEvent
}

export function RefundDialog({
  onClose,
  onRefund,
  state,
  transaction,
}: RefundDialogProps) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const reasonInputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    dialog.showModal()

    if (state === 'confirm') {
      amountInputRef.current?.focus({ preventScroll: true })
    } else {
      dialog.focus({ preventScroll: true })
    }

    return () => {
      if (dialog.open) dialog.close()
    }
  }, [state])

  function updateAmount(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity('')
    setSubmitError('')
    setAmount(event.currentTarget.value)
  }

  function updateReason(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity('')
    setSubmitError('')
    setReason(event.currentTarget.value)
  }

  async function submitRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amountInput = amountInputRef.current
    const reasonInput = reasonInputRef.current
    const amountError = getRefundAmountError(
      amount,
      transaction.refundableAmount ?? 0,
    )
    const reasonError = getRefundReasonError(reason)

    if (!amountInput || !reasonInput) return

    amountInput.setCustomValidity(amountError ?? '')
    reasonInput.setCustomValidity(reasonError ?? '')

    if (amountError) {
      amountInput.reportValidity()
      return
    }

    if (reasonError) {
      reasonInput.reportValidity()
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await onRefund({
        amount: Number(amount.replaceAll(',', '').trim()),
        reason: reason.trim(),
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : '환불을 진행하지 못했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const dialogClassName = [
    'admin-refund-dialog',
    state !== 'confirm' ? 'admin-refund-dialog--complete' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className={dialogClassName}
      onCancel={(event) => {
        event.preventDefault()
        if (!isSubmitting) onClose()
      }}
      ref={dialogRef}
      tabIndex={-1}
    >
      {state === 'confirm' ? (
        <form className="admin-refund-dialog__layout" onSubmit={submitRefund}>
          <div className="admin-refund-dialog__intro">
            <DialogHeader
              disabled={isSubmitting}
              id={titleId}
              onClose={onClose}
            >
              환불을 진행하시겠습니까?
            </DialogHeader>
            <div
              className="admin-refund-dialog__description pretendard-medium-14"
              id={descriptionId}
            >
              <p>
                {transaction.customerLabel} 고객의 {transaction.orderName}{' '}
                결제를 환불합니다.
              </p>
              <p>
                환불 가능 금액 :{' '}
                {formatSalesNumber(transaction.refundableAmount ?? 0)}원
              </p>
            </div>
          </div>

          <label className="admin-refund-dialog__field">
            <span className="pretendard-medium-14">환불 금액</span>
            <input
              className="admin-refund-dialog__input pretendard-medium-14"
              disabled={isSubmitting}
              inputMode="numeric"
              onChange={updateAmount}
              placeholder="환불하실 금액을 입력해주세요."
              ref={amountInputRef}
              required
              type="text"
              value={amount}
            />
          </label>

          <label className="admin-refund-dialog__field">
            <span className="pretendard-medium-14">환불 사유</span>
            <input
              className="admin-refund-dialog__input pretendard-medium-14"
              disabled={isSubmitting}
              maxLength={100}
              onChange={updateReason}
              placeholder="환불 사유를 입력해주세요."
              ref={reasonInputRef}
              required
              type="text"
              value={reason}
            />
          </label>

          {submitError ? (
            <p
              className="admin-refund-dialog__error pretendard-medium-14"
              role="alert"
            >
              {submitError}
            </p>
          ) : null}

          <button
            className="admin-refund-dialog__primary admin-refund-dialog__primary--refund pretendard-bold-14"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? '진행 중' : '환불하기'}
          </button>
        </form>
      ) : (
        <div className="admin-refund-dialog__layout">
          <div className="admin-refund-dialog__intro">
            <DialogHeader id={titleId} onClose={onClose}>
              환불이 완료되었습니다
            </DialogHeader>
            <p
              className="admin-refund-dialog__description pretendard-medium-14"
              id={descriptionId}
            >
              환불 금액은 이후 결제사 정산 금액에서 차감됩니다.
            </p>
          </div>

          <button
            className="admin-refund-dialog__primary pretendard-bold-14"
            onClick={onClose}
            type="button"
          >
            확인
          </button>
        </div>
      )}
    </dialog>
  )
}

type DialogHeaderProps = {
  readonly children: string
  readonly disabled?: boolean
  readonly id: string
  readonly onClose: () => void
}

function DialogHeader({
  children,
  disabled = false,
  id,
  onClose,
}: DialogHeaderProps) {
  return (
    <div className="admin-refund-dialog__header">
      <h2 className="pretendard-bold-20" id={id}>
        {children}
      </h2>
      <button
        aria-label="환불 팝업 닫기"
        className="admin-refund-dialog__close"
        disabled={disabled}
        onClick={onClose}
        type="button"
      >
        <AdminIcon name="x-close" />
      </button>
    </div>
  )
}
