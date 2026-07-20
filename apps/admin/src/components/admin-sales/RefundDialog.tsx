import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { AdminIcon } from '../AdminIcon'
import { formatSalesNumber, getRefundAmountError } from '../../pages/salesData'
import type { SalesTransaction } from '../../pages/salesData'

type RefundDialogProps = {
  readonly onClose: () => void
  readonly onConfirm: () => void
  readonly onRefund: (amount: number) => void
  readonly step: 'complete' | 'confirm'
  readonly transaction: SalesTransaction
}

export function RefundDialog({
  onClose,
  onConfirm,
  onRefund,
  step,
  transaction,
}: RefundDialogProps) {
  const [amount, setAmount] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    dialog.showModal()

    if (step === 'confirm') {
      inputRef.current?.focus({ preventScroll: true })
    } else {
      dialog.focus({ preventScroll: true })
    }

    return () => {
      if (dialog.open) dialog.close()
    }
  }, [step])

  function updateAmount(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity('')
    setAmount(event.currentTarget.value)
  }

  function submitRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const input = inputRef.current
    const error = getRefundAmountError(amount, transaction.transactionAmount)

    if (!input) return

    input.setCustomValidity(error ?? '')

    if (error) {
      input.reportValidity()
      return
    }

    onRefund(Number(amount.replaceAll(',', '').trim()))
  }

  const dialogClassName = [
    'admin-refund-dialog',
    step === 'complete' ? 'admin-refund-dialog--complete' : '',
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
        onClose()
      }}
      ref={dialogRef}
      tabIndex={-1}
    >
      {step === 'confirm' ? (
        <form className="admin-refund-dialog__layout" onSubmit={submitRefund}>
          <div className="admin-refund-dialog__intro">
            <DialogHeader id={titleId} onClose={onClose}>
              환불을 진행하시겠습니까?
            </DialogHeader>
            <div
              className="admin-refund-dialog__description pretendard-medium-14"
              id={descriptionId}
            >
              <p>
                {transaction.customerName}님이 {transaction.productName} 환불을
                진행하시겠습니까?
              </p>
              <p>
                거래금액 : {formatSalesNumber(transaction.transactionAmount)}원
              </p>
            </div>
          </div>

          <label className="admin-refund-dialog__field">
            <span className="pretendard-medium-14">환불 금액</span>
            <input
              className="admin-refund-dialog__input pretendard-medium-14"
              inputMode="numeric"
              onChange={updateAmount}
              placeholder="환불하실 금액을 입력해주세요."
              ref={inputRef}
              required
              type="text"
              value={amount}
            />
          </label>

          <button
            className="admin-refund-dialog__primary admin-refund-dialog__primary--refund pretendard-bold-14"
            type="submit"
          >
            환불하기
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
            onClick={onConfirm}
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
  readonly id: string
  readonly onClose: () => void
}

function DialogHeader({ children, id, onClose }: DialogHeaderProps) {
  return (
    <div className="admin-refund-dialog__header">
      <h2 className="pretendard-bold-20" id={id}>
        {children}
      </h2>
      <button
        aria-label="환불 팝업 닫기"
        className="admin-refund-dialog__close"
        onClick={onClose}
        type="button"
      >
        <AdminIcon name="x-close" />
      </button>
    </div>
  )
}
