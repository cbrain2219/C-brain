import { useId } from 'react'
import type { FormEventHandler, ReactNode } from 'react'
import './AdminFormLayout.css'

type AdminFormLayoutProps = {
  readonly actions: ReactNode
  readonly children: ReactNode
  readonly onSubmit: FormEventHandler<HTMLFormElement>
  readonly title: string
}

export function AdminFormLayout({
  actions,
  children,
  onSubmit,
  title,
}: AdminFormLayoutProps) {
  const titleId = useId()

  return (
    <main className="admin-form-page" aria-labelledby={titleId}>
      <form className="admin-form" onSubmit={onSubmit}>
        <div className="admin-form__body">
          <h1 className="admin-form__title pretendard-bold-18" id={titleId}>
            {title}
          </h1>
          {children}
        </div>
        <div className="admin-form__actions">{actions}</div>
      </form>
    </main>
  )
}
