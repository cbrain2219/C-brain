import type { ContentEntity } from '@repo/content/types'
import { portfolioTypes } from '@repo/supabase/categories'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AdminContentEditor } from '../components/admin-editor/AdminContentEditor'
import {
  createInitialManagedContentValue,
  type ManagedContentFormValue,
} from '../lib/managedContent'
import { ReviewFormPage } from './ReviewFormPage'

const mocks = vi.hoisted(() => ({
  createReview: vi.fn(),
  supabase: {},
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock('@repo/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/supabase')>()

  return { ...actual, createReview: mocks.createReview }
})

vi.mock('../lib/supabase', () => ({ supabase: mocks.supabase }))

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))

beforeEach(() => {
  mocks.createReview.mockReset().mockResolvedValue(undefined)
  mocks.toastError.mockReset()
  mocks.toastSuccess.mockReset()
  vi.spyOn(window, 'alert').mockImplementation(() => undefined)
  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})

afterEach(() => vi.restoreAllMocks())

function WarmEditor({ entity }: { readonly entity: ContentEntity }) {
  const [value, setValue] = useState<ManagedContentFormValue>(
    createInitialManagedContentValue,
  )

  return (
    <AdminContentEditor
      documentKey="review-page-warmup"
      entity={entity}
      onBusyChange={vi.fn()}
      onChange={setValue}
      onPendingAssetCountChange={vi.fn()}
      value={value}
    />
  )
}

async function renderNewReviewPage() {
  const warmup = render(<WarmEditor entity="notice" />)

  await warmup.findByRole('textbox', { name: '본문 WYSIWYG 편집기' })
  warmup.unmount()

  return render(
    <StrictMode>
      <MemoryRouter initialEntries={['/reviews/new']}>
        <Routes>
          <Route element={<ReviewFormPage />} path="/reviews/new" />
          <Route element={<p>리뷰 목록</p>} path="/reviews" />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  )
}

type User = ReturnType<typeof userEvent.setup>

async function selectReviewType(user: User, type: '인터뷰' | '후기') {
  await user.click(
    screen.getByRole('combobox', { name: '인터뷰 · 후기 유형' }),
  )
  await user.click(screen.getByRole('option', { name: type }))
}

async function selectRequestedProduct(
  user: User,
  product = '브로슈어 · 카탈로그',
) {
  await user.click(screen.getByRole('combobox', { name: '의뢰하신 제품' }))
  await user.click(screen.getByRole('option', { name: product }))
}

async function openTextEditor(user: User) {
  await user.click(screen.getByRole('button', { name: 'TEXT Editor 작성' }))

  return screen.findByRole('textbox', {
    name: '본문 WYSIWYG 편집기',
  })
}

async function fillPublishedInterview(user: User, body?: string) {
  await selectReviewType(user, '인터뷰')
  await user.type(screen.getByLabelText('인터뷰 제목'), '윙즈윗 고객 인터뷰')
  await user.type(screen.getByLabelText('인터뷰 고객사(의뢰처)'), '윙즈윗 고객사')
  await selectRequestedProduct(user)
  await user.type(screen.getByLabelText('진행 프로젝트(제작물)'), '브랜드 영상')
  await user.type(screen.getByLabelText('프로젝트 결과(활용)'), '온라인 캠페인')
  await user.type(screen.getByLabelText('인터뷰 Slug'), 'wingsweet-interview')
  fireEvent.change(screen.getByLabelText('인터뷰 작성일'), {
    target: { value: '2026-08-18' },
  })
  await user.click(screen.getByRole('button', { name: 'YouTube 링크' }))
  await user.type(
    screen.getByLabelText('YouTube 영상 링크'),
    'https://youtu.be/dQw4w9WgXcQ',
  )
  const editor = await openTextEditor(user)

  if (body) await user.type(editor, body)
}

async function fillPublishedTestimonial(user: User, body?: string) {
  await selectReviewType(user, '후기')
  await user.type(screen.getByLabelText('후기 고객사'), '윙즈윗 고객사')
  await selectRequestedProduct(user)
  await user.type(screen.getByLabelText('후기 담당자'), '김담당')
  fireEvent.change(screen.getByLabelText('후기 작성일'), {
    target: { value: '2026-08-18' },
  })
  const editor = await openTextEditor(user)

  if (body) await user.type(editor, body)
}

async function publish(user: User) {
  const button = screen.getByRole('button', { name: '등록하기' }) as HTMLButtonElement

  await waitFor(() => expect(button.disabled).toBe(false))
  await user.click(button)
}

it('starts a new review in HTML authoring mode', async () => {
  await renderNewReviewPage()
  const user = userEvent.setup()

  await selectReviewType(user, '인터뷰')

  expect(
    screen.getByRole('button', { name: 'HTML 작성' }).getAttribute('aria-pressed'),
  ).toBe('true')
  expect(
    screen.getByRole('button', { name: 'TEXT Editor 작성' }).getAttribute('aria-pressed'),
  ).toBe('false')
  expect(screen.getByRole('textbox', { name: '본문 HTML' })).toBeTruthy()
})

it.each([
  ['인터뷰', '인터뷰 고객사(의뢰처)'],
  ['후기', '후기 고객사'],
] as const)(
  'shows the requested product dropdown below the %s client field',
  async (reviewType, companyLabel) => {
    await renderNewReviewPage()
    const user = userEvent.setup()

    await selectReviewType(user, reviewType)

    const company = screen.getByLabelText(companyLabel)
    const product = screen.getByRole('combobox', {
      name: '의뢰하신 제품',
    }) as HTMLInputElement

    expect(company.closest('label')?.nextElementSibling).toBe(
      product.closest('label'),
    )
    expect(product.required).toBe(true)

    await user.click(product)
    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual([...portfolioTypes])

    await user.click(screen.getByRole('option', { name: '촬영' }))
    expect(product.value).toBe('촬영')
  },
)

it('publishes canonical WYSIWYG content for a new Interview', async () => {
  await renderNewReviewPage()
  const user = userEvent.setup()

  await fillPublishedInterview(user, '저장되는 인터뷰 본문')
  await publish(user)

  await waitFor(() => expect(mocks.createReview).toHaveBeenCalledTimes(1))
  expect(mocks.createReview).toHaveBeenCalledWith(
    mocks.supabase,
    expect.objectContaining({
      company_name: '윙즈윗 고객사',
      content: '<p>저장되는 인터뷰 본문</p>',
      content_asset_scope: expect.any(String),
      content_authoring_mode: 'wysiwyg',
      content_json: {
        content: [
          {
            attrs: { textAlign: null },
            content: [{ text: '저장되는 인터뷰 본문', type: 'text' }],
            type: 'paragraph',
          },
        ],
        type: 'doc',
      },
      content_mode: 'html',
      content_schema_version: 1,
      kind: 'interview',
      project_deliverable: '브랜드 영상',
      project_usage: '온라인 캠페인',
      requested_product: '브로슈어 · 카탈로그',
      slug: 'wingsweet-interview',
      status: 'published',
      title: '윙즈윗 고객 인터뷰',
      video_path: null,
      youtube_video_id: 'dQw4w9WgXcQ',
    }),
  )
  await screen.findByText('리뷰 목록')
})

it('publishes canonical WYSIWYG content for a new Testimonial', async () => {
  await renderNewReviewPage()
  const user = userEvent.setup()

  await fillPublishedTestimonial(user, '저장되는 고객 후기 본문')
  await publish(user)

  await waitFor(() => expect(mocks.createReview).toHaveBeenCalledTimes(1))
  expect(mocks.createReview).toHaveBeenCalledWith(
    mocks.supabase,
    expect.objectContaining({
      company_name: '윙즈윗 고객사',
      content: '<p>저장되는 고객 후기 본문</p>',
      content_authoring_mode: 'wysiwyg',
      content_json: expect.objectContaining({ type: 'doc' }),
      content_mode: 'html',
      content_schema_version: 1,
      kind: 'testimonial',
      manager_name: '김담당',
      project_deliverable: null,
      project_usage: null,
      requested_product: '브로슈어 · 카탈로그',
      show_on_landing: true,
      status: 'published',
      title: null,
      video_path: null,
      youtube_video_id: null,
    }),
  )
  await screen.findByText('리뷰 목록')
})

it.each([
  ['인터뷰', fillPublishedInterview],
  ['후기', fillPublishedTestimonial],
] as const)('rejects a semantically empty %s body', async (_type, fillForm) => {
  await renderNewReviewPage()
  const user = userEvent.setup()

  await fillForm(user)
  await publish(user)

  await waitFor(() => {
    expect(screen.getByRole('alert').textContent).toBe('내용을 입력해주세요.')
  })
  expect(mocks.createReview).not.toHaveBeenCalled()
})

it('clears the empty-body message after canonical content becomes nonempty', async () => {
  await renderNewReviewPage()
  const user = userEvent.setup()

  await fillPublishedTestimonial(user)
  await publish(user)
  await waitFor(() => {
    expect(screen.getByRole('alert').textContent).toBe('내용을 입력해주세요.')
  })

  await user.type(
    screen.getByRole('textbox', { name: '본문 WYSIWYG 편집기' }),
    '   ',
  )
  expect(screen.getByRole('alert').textContent).toBe('내용을 입력해주세요.')

  await user.type(
    screen.getByRole('textbox', { name: '본문 WYSIWYG 편집기' }),
    '수정한 후기 본문',
  )

  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  expect(mocks.createReview).not.toHaveBeenCalled()
})
