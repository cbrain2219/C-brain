import { supabase } from './supabase'

const userAppUrl = import.meta.env.VITE_USER_APP_URL || 'http://localhost:3000'

export async function getVisitorCount(from: string, to: string): Promise<number> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('관리자 로그인 정보를 확인할 수 없습니다.')

  const response = await fetch(new URL('/api/admin/analytics', userAppUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to }),
    signal: AbortSignal.timeout(25_000),
  })
  const body: unknown = await response.json().catch(() => null)
  if (
    !response.ok ||
    !body ||
    typeof body !== 'object' ||
    !('visitorCount' in body) ||
    typeof body.visitorCount !== 'number' ||
    !Number.isSafeInteger(body.visitorCount) ||
    body.visitorCount < 0
  ) {
    throw new Error('방문자 수를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
  }
  return body.visitorCount
}
