import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FormEvent } from 'react'
import { AdminTypeCombobox } from './AdminTypeCombobox'

const props = {
  inputId: 'blog-type',
  name: 'type',
  onCommit: vi.fn(),
  options: ['로고', '인쇄 실무팁'],
  placeholder: '블로그유형을 선택해주세요.',
  value: '로고',
}

describe('AdminTypeCombobox type deletion', () => {
  it('selects the active option from a blank input with the keyboard', () => {
    const onCommit = vi.fn()
    render(<AdminTypeCombobox {...props} value="" onCommit={onCommit} onDelete={vi.fn()} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onCommit.mock.calls[0]?.[0]).toBe('로고')
  })

  it('keeps the query when clicking inside an already open input', () => {
    render(<AdminTypeCombobox {...props} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '새 유형' } })
    fireEvent.click(input)
    expect(input.value).toBe('새 유형')
  })
  it('puts an accessible SVG delete button beside each existing type without selecting or submitting', () => {
    const onDelete = vi.fn()
    const onCommit = vi.fn()
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    const { container } = render(
      <form onSubmit={onSubmit}>
        <AdminTypeCombobox {...props} onCommit={onCommit} onDelete={onDelete} />
      </form>,
    )
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getByRole('grid')).toBeTruthy()
    const deletion = screen.getByRole('button', { name: '로고 유형 삭제' })
    expect(deletion.querySelector('svg')?.getAttribute('width')).toBe('12')
    expect(deletion.querySelector('svg')?.getAttribute('height')).toBe('12')
    expect(container.querySelector('button button')).toBeNull()
    fireEvent.click(deletion)
    expect(onDelete).toHaveBeenCalledWith('로고')
    expect(onCommit).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('keeps ordinary shared consumers free of deletion controls', () => {
    render(<AdminTypeCombobox {...props} />)
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /유형 삭제/ })).toBeNull()
  })

  it('shows an externally cleared selection and preserves text being edited', () => {
    const { rerender } = render(<AdminTypeCombobox {...props} />)
    rerender(<AdminTypeCombobox {...props} value="" />)
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('')
    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '새 유형' },
    })
    rerender(<AdminTypeCombobox {...props} value="" />)
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('새 유형')
  })

  it('waits for restored types before closing or committing their visible value', async () => {
    let finish!: () => void
    const onCommit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    render(<AdminTypeCombobox {...props} allowCustomValue onCommit={onCommit} />)
    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '다시 추가' },
    })
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(screen.getByRole('listbox')).toBeTruthy()
    finish()
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    expect(onCommit.mock.calls[0]).toEqual(expect.arrayContaining(['다시 추가']))
  })
})
