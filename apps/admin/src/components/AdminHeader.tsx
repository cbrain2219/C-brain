import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './AdminHeader.css'

const menuItems = [
  { label: '매출', to: '/sales' },
  { label: '상품', to: '/products' },
  { label: '포트폴리오', to: '/portfolio' },
  { label: '블로그', to: '/blog' },
  { label: '고객 인터뷰 · 후기', to: '/reviews' },
  { label: '공지사항', to: '/notices' },
  { label: '불편접수', to: '/complaints' },
  { label: 'LinkPay', to: '/linkpay' },
] as const

const userAppUrl = import.meta.env.VITE_USER_APP_URL || 'http://localhost:3000'

export function AdminHeader() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <NavLink
          className="admin-header__logo"
          to="/products"
          aria-label="C-Brain 관리자 홈"
        >
          <img
            className="admin-header__logo-wordmark"
            src="/figma-assets/cbrain-logo-wordmark.svg"
            width="77"
            height="20"
            alt=""
          />
          <img
            className="admin-header__logo-subtitle"
            src="/figma-assets/cbrain-logo-subtitle.svg"
            width="76"
            height="4"
            alt=""
          />
        </NavLink>

        <nav className="admin-header__nav" aria-label="관리자 메뉴">
          {menuItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                [
                  'admin-header__menu-link',
                  isActive
                    ? 'admin-header__menu-link--active pretendard-bold-16'
                    : 'pretendard-medium-16',
                ].join(' ')
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="admin-header__actions">
        <a className="admin-header__action pretendard-bold-14" href={userAppUrl}>
          씨브레인 홈페이지
        </a>
        <button
          className="admin-header__logout pretendard-bold-14"
          onClick={handleSignOut}
          type="button"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
