import { toast } from 'sonner'
import { supabase } from './supabase'

const userAppUrl = import.meta.env.VITE_USER_APP_URL || 'http://localhost:3000'

// Called after the DB write commits. Refresh failures must not enter image rollback handling.
export async function refreshPublicContent(
  entity: 'blog' | 'portfolio',
  slugs: readonly string[] = [],
): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await fetch(
          new URL('/api/admin/content/revalidate', userAppUrl),
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              entity,
              slugs: [...new Set(slugs.filter(Boolean))],
            }),
            signal: AbortSignal.timeout(5_000),
          },
        ).catch(() => null)
        const result: unknown = await response?.json().catch(() => null)
        if (
          response?.ok &&
          result &&
          typeof result === 'object' &&
          'revalidated' in result &&
          result.revalidated === true
        )
          return true
        if (response && response.status >= 400 && response.status < 500) break
      }
    }
  } catch {
    // The save has already succeeded; report cache refresh separately.
  }
  toast.error('변경 내용은 저장됐지만 사이트 캐시 갱신에 실패했습니다.')
  return false
}
