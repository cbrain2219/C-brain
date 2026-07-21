import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './AdminLoginPage.css'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsPending(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error || !data.user) {
        setErrorMessage(error?.message ?? '로그인에 실패했습니다.')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut()
        setErrorMessage('관리자 계정만 접근할 수 있습니다.')
        return
      }

      navigate('/products', { replace: true })
    } catch {
      setErrorMessage('로그인에 실패했습니다.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <div className="admin-login-form__heading">
          <h1 className="admin-login-form__title pretendard-bold-24">관리자 로그인</h1>
          <p className="admin-login-form__description pretendard-medium-14">
            관리자 계정으로 로그인해주세요.
          </p>
        </div>

        <div className="admin-login-form__fields">
          <label className="admin-login-form__field">
            <span className="admin-login-form__label pretendard-bold-14">이메일</span>
            <input
              autoComplete="email"
              className="admin-login-form__input pretendard-medium-16"
              disabled={isPending}
              name="email"
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="admin-login-form__field">
            <span className="admin-login-form__label pretendard-bold-14">비밀번호</span>
            <input
              autoComplete="current-password"
              className="admin-login-form__input pretendard-medium-16"
              disabled={isPending}
              name="password"
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              type="password"
              value={password}
            />
          </label>
        </div>

        {errorMessage ? (
          <p className="admin-login-form__error pretendard-medium-14" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button
          className="admin-login-form__submit pretendard-bold-16"
          disabled={isPending}
          type="submit"
        >
          {isPending ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </main>
  )
}
