import { AlertDialog } from '@base-ui/react/alert-dialog'
import './AdminDeleteDialog.css'

type AdminDeleteDialogProps = {
  readonly disabled?: boolean
  readonly isDeleting?: boolean
  readonly itemLabel: string
  readonly onConfirm: () => void | Promise<void>
  readonly open?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly title?: string
  readonly description?: string
  readonly notice?: boolean
  readonly finalFocusId?: string
}

export function AdminDeleteDialog({
  disabled = false,
  isDeleting = false,
  itemLabel,
  onConfirm,
  open,
  onOpenChange,
  title = `${itemLabel} 삭제`,
  description = '이 항목을 삭제하면 복구할 수 없습니다.',
  notice = false,
  finalFocusId,
}: AdminDeleteDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}>
      {open === undefined ? (
        <AlertDialog.Trigger
          className="admin-form__button admin-form__button--danger"
          disabled={disabled || isDeleting}
          type="button"
        >
          삭제
        </AlertDialog.Trigger>
      ) : null}
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="admin-delete-dialog__backdrop" />
        <AlertDialog.Viewport className="admin-delete-dialog__viewport">
          <AlertDialog.Popup
            className="admin-delete-dialog"
            finalFocus={finalFocusId ? () => document.getElementById(finalFocusId) : undefined}
          >
            <AlertDialog.Title className="admin-delete-dialog__title">{title}</AlertDialog.Title>
            <AlertDialog.Description className="admin-delete-dialog__description">
              {description}
            </AlertDialog.Description>
            <div className="admin-delete-dialog__actions">
              {notice ? (
                <AlertDialog.Close className="admin-delete-dialog__button" type="button">
                  확인
                </AlertDialog.Close>
              ) : (
                <>
                  <AlertDialog.Close className="admin-delete-dialog__button" type="button">
                    취소
                  </AlertDialog.Close>
                  {open === undefined ? (
                    <AlertDialog.Close
                      className="admin-delete-dialog__button admin-delete-dialog__button--danger"
                      disabled={isDeleting}
                      onClick={() => void onConfirm()}
                      type="button"
                    >
                      {isDeleting ? '삭제 중' : '삭제'}
                    </AlertDialog.Close>
                  ) : (
                    <button
                      className="admin-delete-dialog__button admin-delete-dialog__button--danger"
                      disabled={isDeleting}
                      onClick={() => void onConfirm()}
                      type="button"
                    >
                      {isDeleting ? '삭제 중' : '삭제'}
                    </button>
                  )}
                </>
              )}
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
