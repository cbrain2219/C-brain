import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const { getSession, showError } = vi.hoisted(() => ({
  getSession: vi.fn(),
  showError: vi.fn(),
}))
vi.mock('./supabase', () => ({ supabase: { auth: { getSession } } }))
vi.mock('sonner', () => ({ toast: { error: showError } }))
import { refreshPublicContent } from './publicContentCache'

beforeEach(() => {
  getSession.mockResolvedValue({
    data: { session: { access_token: 'test-session' } },
  })
  showError.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

it('refreshes the previous and current slug using the existing admin session', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ revalidated: true }))
  vi.stubGlobal('fetch', fetch)
  expect(await refreshPublicContent('blog', ['old', 'new', 'new', ''])).toBe(
    true,
  )
  const [url, options] = fetch.mock.calls[0]
  expect(new URL(url).pathname).toBe('/api/admin/content/revalidate')
  expect(options.headers.Authorization).toBe('Bearer test-session')
  expect(JSON.parse(options.body)).toEqual({
    entity: 'blog',
    slugs: ['old', 'new'],
  })
  expect(showError).not.toHaveBeenCalled()
})

it('retries a transient refresh failure without repeating the database mutation', async () => {
  const fetch = vi
    .fn()
    .mockRejectedValueOnce(Error('network'))
    .mockResolvedValueOnce(Response.json({ revalidated: true }))
  vi.stubGlobal('fetch', fetch)
  expect(await refreshPublicContent('portfolio', ['a'])).toBe(true)
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(showError).not.toHaveBeenCalled()
})

it('reports a persistent refresh failure without throwing into save rollback handling', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(Response.json({ error: 'unavailable' }, { status: 503 }))
  vi.stubGlobal('fetch', fetch)
  expect(await refreshPublicContent('blog', ['a'])).toBe(false)
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(showError).toHaveBeenCalledWith(expect.stringContaining('저장됐지만'))
})

it('does not retry a denied request or send a request without a session', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({}, { status: 403 }))
  vi.stubGlobal('fetch', fetch)
  expect(await refreshPublicContent('blog')).toBe(false)
  expect(fetch).toHaveBeenCalledTimes(1)
  getSession.mockResolvedValue({ data: { session: null } })
  expect(await refreshPublicContent('blog')).toBe(false)
  expect(fetch).toHaveBeenCalledTimes(1)
})
