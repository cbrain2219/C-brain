import { Link } from 'react-router-dom'
import './NotFoundPage.css'

export function NotFoundPage() {
  return (
    <main className="admin-not-found" aria-labelledby="not-found-title">
      <div className="admin-not-found__content">
        <div aria-hidden="true" className="admin-not-found__visual">
          <span className="admin-not-found__code">404</span>
        </div>
        <div className="admin-not-found__message">
          <h1
            className="admin-not-found__title pretendard-bold-24"
            id="not-found-title"
          >
            페이지를 찾을 수 없습니다.
          </h1>
          <p className="admin-not-found__description pretendard-medium-16">
            주소가 잘못 입력되었거나 페이지가 이동 또는 삭제되었습니다.
          </p>
        </div>
        <Link
          className="admin-not-found__action pretendard-bold-14"
          to="/products"
        >
          상품 관리로 돌아가기
        </Link>
      </div>
    </main>
  )
}
