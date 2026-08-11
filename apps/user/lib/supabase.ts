import { createServerSupabaseClient } from '@repo/supabase'
import { cookies } from 'next/headers'

export function hasPublicSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}

export function createPublicUserSupabaseClient() {
  if (!hasPublicSupabaseEnv()) return null

  return createServerSupabaseClient({
    getAll: () => [],
  })
}

export async function createUserSupabaseClient() {
  if (!hasPublicSupabaseEnv()) return null

  const cookieStore = await cookies()

  return createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
  })
}
