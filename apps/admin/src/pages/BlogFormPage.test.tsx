import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BlogFormPage } from './BlogFormPage'

const api = vi.hoisted(() => ({
  listAdminPosts: vi.fn(),
  listDeletedBlogTypes: vi.fn(),
  deleteBlogType: vi.fn(),
  restoreBlogType: vi.fn(),
  refreshPublicContent: vi.fn(),
}))

vi.mock('@repo/supabase', () => ({
  ...api,
  createPost: vi.fn(),
  deletePost: vi.fn(),
  getAdminPost: vi.fn(),
  updatePost: vi.fn(),
}))
vi.mock('../lib/supabase', () => ({ supabase: {} }))
vi.mock('../lib/publicContentCache', () => ({
  refreshPublicContent: api.refreshPublicContent,
}))
vi.mock('../components/admin-editor/AdminContentEditor', () => ({
  AdminContentEditor: () => <div />,
}))
vi.mock('../hooks/useManagedContentEditorState', () => ({
  useManagedContentEditorState: () => ({ busy: false, pendingAssetCount: 0 }),
}))
vi.mock('../hooks/useUnpersistedContentUploads', () => ({
  useUnpersistedContentUploads: () => ({}),
}))

async function setup(posts: { type: string; status: string }[] = []) {
  api.listAdminPosts.mockResolvedValue(posts)
  await act(async () => {
    render(
      <MemoryRouter>
        <BlogFormPage />
      </MemoryRouter>,
    )
  })
  return screen.getByRole('combobox', {
    name: '블로그 유형',
  }) as HTMLInputElement
}

async function requestLogoDeletion(input: HTMLInputElement) {
  fireEvent.focus(input)
  fireEvent.click(screen.getByRole('button', { name: '로고 유형 삭제' }))
  return screen.findByRole('alertdialog')
}

beforeEach(() => {
  vi.clearAllMocks()
  api.listDeletedBlogTypes.mockResolvedValue([])
  api.deleteBlogType.mockResolvedValue('deleted')
  api.restoreBlogType.mockResolvedValue(undefined)
  api.refreshPublicContent.mockResolvedValue(true)
})

describe('blog type deletion flow', () => {
  it('does not let a delayed restoration replace the latest selected type', async () => {
    api.listDeletedBlogTypes.mockResolvedValue(['로고'])
    let finish!: () => void
    api.restoreBlogType.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const input = await setup()
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '로고' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('gridcell', { name: '명함 · 봉투' }))
    await waitFor(() => expect(input.value).toBe('명함 · 봉투'))
    await act(async () => {
      finish()
    })
    expect(input.value).toBe('명함 · 봉투')
  })
  it.each([
    ['published', '이미 발행된 블로그 글이 있어 삭제할 수 없는 유형입니다.'],
    ['draft', '임시저장된 블로그 글이 있어 삭제할 수 없는 유형입니다.'],
  ])('blocks %s references with the specified notice', async (status, message) => {
    const input = await setup([{ type: '로고', status }])
    const dialog = await requestLogoDeletion(input)
    expect(dialog.textContent).toContain('삭제 불가')
    expect(dialog.textContent).toContain(message)
    expect(screen.queryByRole('button', { name: '취소' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(api.deleteBlogType).not.toHaveBeenCalled()
  })

  it('clears the deleted selection, refreshes the user site, and permits explicit re-adding', async () => {
    const input = await setup()
    fireEvent.focus(input)
    fireEvent.click(screen.getByRole('gridcell', { name: '로고' }))
    await waitFor(() => expect(input.value).toBe('로고'))
    await requestLogoDeletion(input)
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    await waitFor(() => expect(input.value).toBe(''))
    expect(api.deleteBlogType).toHaveBeenCalledWith({}, '로고')
    expect(api.refreshPublicContent).toHaveBeenCalledWith('blog', [], { notifyFailure: false })
    await waitFor(() => expect(document.activeElement).toBe(input))
    fireEvent.change(input, { target: { value: '로고' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(input.value).toBe('로고'))
    expect(api.restoreBlogType).toHaveBeenCalledWith({}, '로고')
    expect(api.refreshPublicContent).toHaveBeenCalledTimes(2)
  })

  it('keeps types unchanged when deletion is cancelled', async () => {
    const input = await setup()
    await requestLogoDeletion(input)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(api.deleteBlogType).not.toHaveBeenCalled()
    fireEvent.focus(input)
    expect(screen.getByRole('button', { name: '로고 유형 삭제' })).toBeTruthy()
  })

  it('uses the final server decision when a draft appears after confirmation opened', async () => {
    const input = await setup()
    api.deleteBlogType.mockResolvedValue('blocked_draft')
    await requestLogoDeletion(input)
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    await screen.findByText('임시저장된 블로그 글이 있어 삭제할 수 없는 유형입니다.')
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull()
    expect(api.refreshPublicContent).not.toHaveBeenCalled()
  })

  it('does not clear or close confirmation when the database rejects the mutation', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const input = await setup()
      api.deleteBlogType.mockRejectedValue(Error('database unavailable'))
      await requestLogoDeletion(input)
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '삭제' }))
      })
      expect(screen.getByRole('alertdialog').textContent).toContain('유형 삭제')
      expect(api.refreshPublicContent).not.toHaveBeenCalled()
    } finally {
      errorLog.mockRestore()
    }
  })
})
