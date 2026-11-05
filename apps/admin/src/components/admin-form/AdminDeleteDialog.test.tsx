import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminDeleteDialog } from './AdminDeleteDialog'

describe('AdminDeleteDialog type deletion', () => {
  it('shows the approved draft notice with only a confirmation button', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <AdminDeleteDialog
        itemLabel="블로그 유형"
        onConfirm={onConfirm}
        open
        onOpenChange={onOpenChange}
        title="삭제 불가"
        description="임시저장된 블로그 글이 있어 삭제할 수 없는 유형입니다."
        notice
      />,
    )
    expect(screen.getByRole('alertdialog').textContent).toContain('삭제 불가')
    expect(screen.getByText('임시저장된 블로그 글이 있어 삭제할 수 없는 유형입니다.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '취소' })).toBeNull()
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('leaves controlled confirmation open until the mutation has succeeded', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <AdminDeleteDialog
        itemLabel="블로그 유형"
        onConfirm={onConfirm}
        open
        onOpenChange={onOpenChange}
        title="유형 삭제"
        description="블로그 유형을 삭제하시겠습니까?."
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
