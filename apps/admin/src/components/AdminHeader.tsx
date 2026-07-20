import { Link, NavLink } from 'react-router-dom'
import './AdminHeader.css'

const menuItems = [
  { label: '매출', to: '/sales' },
  { label: '상품', to: '/products' },
  { label: '포트폴리오', to: '/portfolio' },
  { label: '블로그', to: '/blog' },
  { label: '고객 인터뷰 · 후기', to: '/reviews' },
  { label: '공지사항', to: '/notices' },
  { label: '불편접수', to: '/complaints' },
] as const

export function AdminHeader() {
  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <NavLink
          className="admin-header__logo"
          to="/sales"
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
        <a className="admin-header__action pretendard-bold-14" href="/">
          씨브레인 홈페이지
        </a>
        <Link className="admin-header__action pretendard-bold-14" to="/linkpay">
          링크페이 생성하기
        </Link>
      </div>
    </header>
  )
}
