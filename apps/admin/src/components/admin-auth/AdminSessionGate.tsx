import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type GateState = 'loading' | 'allowed' | 'login'

async function getGateState(): Promise<GateState> {
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) return 'login'

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (error || profile?.role !== 'admin') {
    await supabase.auth.signOut()
    return 'login'
  }

  return 'allowed'
}

export function AdminSessionGate() {
  const [state, setState] = useState<GateState>('loading')

  useEffect(() => {
    let isCurrent = true

    async function resolveGateState() {
      try {
        const nextState = await getGateState()

        if (isCurrent) setState(nextState)
      } catch {
        if (isCurrent) setState('login')
      }
    }

    void resolveGateState()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void resolveGateState()
    })

    return () => {
      isCurrent = false
      subscription.unsubscribe()
    }
  }, [])

  if (state === 'loading') {
    return <main className="admin-session-state">권한을 확인하는 중입니다.</main>
  }

  if (state === 'login') return <Navigate replace to="/login" />

  return <Outlet />
}
