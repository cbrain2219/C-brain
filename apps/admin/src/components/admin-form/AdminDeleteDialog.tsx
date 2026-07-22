import { AlertDialog } from '@base-ui/react/alert-dialog'
import './AdminDeleteDialog.css'

type AdminDeleteDialogProps = {
  readonly disabled?: boolean
  readonly isDeleting?: boolean
  readonly itemLabel: string
  readonly onConfirm: () => void | Promise<void>
}

export function AdminDeleteDialog({
  disabled = false,
  isDeleting = false,
  itemLabel,
  onConfirm,
}: AdminDeleteDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger
        className="admin-form__button admin-form__button--danger"
        disabled={disabled || isDeleting}
        type="button"
      >
        삭제
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="admin-delete-dialog__backdrop" />
        <AlertDialog.Viewport className="admin-delete-dialog__viewport">
          <AlertDialog.Popup className="admin-delete-dialog">
            <AlertDialog.Title className="admin-delete-dialog__title">
              {itemLabel}을(를) 삭제할까요?
            </AlertDialog.Title>
            <AlertDialog.Description className="admin-delete-dialog__description">
              삭제한 항목은 복구할 수 없습니다.
            </AlertDialog.Description>
            <div className="admin-delete-dialog__actions">
              <AlertDialog.Close className="admin-delete-dialog__button" type="button">
                취소
              </AlertDialog.Close>
              <AlertDialog.Close
                className="admin-delete-dialog__button admin-delete-dialog__button--danger"
                disabled={isDeleting}
                onClick={() => void onConfirm()}
                type="button"
              >
                {isDeleting ? '삭제 중' : '삭제'}
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
