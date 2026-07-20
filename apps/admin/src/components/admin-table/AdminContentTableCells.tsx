export type AdminContentStatus = 'draft' | 'published'
export type AdminPublicationState = 'none' | 'published'
export type AdminPinnedState = 'none' | 'pinned'

export function renderAdminContentStatus(status: AdminContentStatus) {
  const className =
    status === 'draft' ? 'admin-data-table__status admin-data-table__status--draft' : 'admin-data-table__status'
  const label = status === 'draft' ? '임시저장' : '게시됨'

  return (
    <span className={className}>
      <span className="admin-data-table__status-dot" />
      <span>{label}</span>
    </span>
  )
}

export function renderAdminPublicationState(state: AdminPublicationState) {
  if (state === 'published') {
    return <span className="admin-data-table__brand-text">게시됨</span>
  }

  return <span>-</span>
}

export function renderAdminPinnedState(state: AdminPinnedState) {
  if (state === 'pinned') {
    return <span className="admin-data-table__brand-text">고정됨</span>
  }

  return <span>-</span>
}
