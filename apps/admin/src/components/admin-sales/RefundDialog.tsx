import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { SalesTransaction } from '@repo/supabase'
import { AdminIcon } from '../AdminIcon'
import {
  formatRefundAmountInput,
  formatSalesNumber,
  getRefundAmountError,
  getRefundCapabilityError,
} from '../../pages/salesData'

const ADMIN_REFUND_REASON = '관리자 환불 요청'

type RefundDialogProps = {
  readonly onClose: () => void
  readonly onRefund: (input: {
    amount: number
    reason: string
  }) => Promise<void>
  readonly state: 'complete' | 'confirm'
  readonly transaction: SalesTransaction
}

export function RefundDialog({
  onClose,
  onRefund,
  state,
  transaction,
}: RefundDialogProps) {
  const [amount, setAmount] = useState('')
  const [amountInputError, setAmountInputError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
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
    const nextAmount = formatRefundAmountInput(
      event.currentTarget.value,
      transaction.refundableAmount,
    )

    if (nextAmount === null) {
      setAmountInputError(
        /[^\d,]/.test(event.currentTarget.value)
          ? '환불 금액은 숫자만 입력할 수 있습니다.'
          : `환불 가능 금액 ${formatSalesNumber(transaction.refundableAmount)}원을 초과할 수 없습니다.`,
      )
      return
    }

    setAmountInputError('')
    setAmount(nextAmount)
  }

  async function submitRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amountInput = amountInputRef.current
    const amountError = getRefundAmountError(
      amount,
      transaction.refundableAmount,
    )
    const partialRefundCapabilityError =
      amountError === null
        ? getRefundCapabilityError(
            amount,
            transaction.refundableAmount,
            transaction.canPartCancel,
          )
        : null

    if (!amountInput) return

    const validationError =
      amountInputError || amountError || partialRefundCapabilityError || ''

    amountInput.setCustomValidity(validationError)

    if (amountInputError) {
      amountInput.reportValidity()
      return
    }

    if (amountError) {
      amountInput.reportValidity()
      return
    }

    if (partialRefundCapabilityError) {
      amountInput.reportValidity()
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await onRefund({
        amount: Number(amount.replaceAll(',', '').trim()),
        reason: ADMIN_REFUND_REASON,
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
  const amountDescription = [
    `거래금액 : ${formatSalesNumber(transaction.transactionAmount)}원`,
    transaction.refundableAmount < transaction.transactionAmount
      ? `환불 가능 : ${formatSalesNumber(transaction.refundableAmount)}원`
      : '',
    transaction.canPartCancel === false ? '전액만 환불 가능' : '',
  ]
    .filter(Boolean)
    .join(' · ')

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
              <p title={`${transaction.customerLabel}의 ${transaction.orderName}`}>
                {transaction.customerLabel}의 {transaction.orderName} 환불을
                진행하시겠습니까?
              </p>
              <p title={amountDescription}>
                {amountDescription}
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
              pattern="[0-9,]*"
              placeholder="환불하실 금액을 입력해주세요."
              ref={amountInputRef}
              required
              type="text"
              value={amount}
            />
          </label>

          {amountInputError || submitError ? (
            <p
              className="admin-refund-dialog__error pretendard-medium-14"
              role="alert"
            >
              {amountInputError || submitError}
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
              환불 금액은 이후 나이스페이먼츠(PG사)에서 정산 될 금액에서
              차감됩니다.
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
