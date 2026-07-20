import type { FormEvent } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AdminHeader } from './components/AdminHeader'
import { BlogFormPage } from './pages/BlogFormPage'
import { BlogPage } from './pages/BlogPage'
import { ComplaintDetailPage } from './pages/ComplaintDetailPage'
import { ComplaintPage } from './pages/ComplaintPage'
import { LinkPayPage } from './pages/LinkPayPage'
import { NoticeFormPage } from './pages/NoticeFormPage'
import { NoticePage } from './pages/NoticePage'
import { PortfolioFormPage } from './pages/PortfolioFormPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { ProductFormPage } from './pages/ProductFormPage'
import { ProductPage } from './pages/ProductPage'
import { ReviewFormPage } from './pages/ReviewFormPage'
import { ReviewPage } from './pages/ReviewPage'
import { SalesPage } from './pages/SalesPage'
import './App.css'

const adminPages = [
  {
    description: '매출 현황과 결제 흐름을 확인하는 관리자 화면입니다.',
    eyebrow: 'Sales',
    path: '/sales',
    title: '매출',
  },
  {
    description: '상품 정보를 관리하고 노출 상태를 점검하는 관리자 화면입니다.',
    eyebrow: 'Products',
    path: '/products',
    title: '상품',
  },
  {
    description: '포트폴리오 콘텐츠를 관리하는 관리자 화면입니다.',
    eyebrow: 'Portfolio',
    path: '/portfolio',
    title: '포트폴리오',
  },
  {
    description: '블로그 게시글과 발행 상태를 관리하는 화면입니다.',
    eyebrow: 'Blog',
    path: '/blog',
    title: '블로그',
  },
  {
    description: '고객 인터뷰와 후기를 관리하는 화면입니다.',
    eyebrow: 'Reviews',
    path: '/reviews',
    title: '고객 인터뷰 · 후기',
  },
  {
    description: '공지사항을 작성하고 공개 상태를 관리하는 화면입니다.',
    eyebrow: 'Notices',
    path: '/notices',
    title: '공지사항',
  },
  {
    description: '접수된 불편 사항을 확인하고 처리하는 화면입니다.',
    eyebrow: 'Complaints',
    path: '/complaints',
    title: '불편접수',
  },
  {
    description: '링크페이 결제 링크를 생성하는 화면입니다.',
    eyebrow: 'Link Pay',
    path: '/linkpay/new',
    title: '링크페이 생성하기',
  },
] as const

type AdminPageProps = {
  readonly eyebrow: string
  readonly title: string
  readonly description: string
}

function AdminPage({ eyebrow, title, description }: AdminPageProps) {
  return (
    <main className="admin-main">
      <section className="admin-page-heading" aria-labelledby="page-title">
        <p className="admin-page-heading__eyebrow pretendard-bold-12">
          {eyebrow}
        </p>
        <h1
          className="admin-page-heading__title pretendard-bold-32"
          id="page-title"
        >
          {title}
        </h1>
        <p className="admin-page-heading__description pretendard-medium-16">
          {description}
        </p>
      </section>
    </main>
  )
}

function scrollToFirstInvalidControl(event: FormEvent<HTMLElement>) {
  const control = event.target

  if (
    !(
      control instanceof HTMLInputElement ||
      control instanceof HTMLSelectElement ||
      control instanceof HTMLTextAreaElement
    )
  )
    return

  const firstInvalidControl = control.form?.querySelector(
    'input:invalid, select:invalid, textarea:invalid',
  )

  if (firstInvalidControl !== control) return

  const scrollTarget =
    control.type === 'checkbox' || control.type === 'radio'
      ? (control.closest('label') ?? control)
      : control

  window.requestAnimationFrame(() => {
    scrollTarget.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    })
  })
}

export function App() {
  const placeholderPages = adminPages.filter(
    (page) =>
      page.path !== '/products' &&
      page.path !== '/portfolio' &&
      page.path !== '/blog' &&
      page.path !== '/reviews' &&
      page.path !== '/notices' &&
      page.path !== '/sales' &&
      page.path !== '/complaints',
  )

  return (
    <div className="admin-shell" onInvalidCapture={scrollToFirstInvalidControl}>
      <AdminHeader />
      <Routes>
        <Route element={<Navigate replace to="/products" />} path="/" />
        <Route element={<ProductPage />} path="/products" />
        <Route element={<ProductFormPage />} path="/products/new" />
        <Route element={<ProductFormPage />} path="/products/:productId" />
        <Route element={<PortfolioPage />} path="/portfolio" />
        <Route element={<PortfolioFormPage />} path="/portfolio/new" />
        <Route element={<PortfolioFormPage />} path="/portfolio/:portfolioId" />
        <Route element={<BlogPage />} path="/blog" />
        <Route element={<BlogFormPage />} path="/blog/new" />
        <Route element={<BlogFormPage />} path="/blog/:blogId" />
        <Route element={<ReviewPage />} path="/reviews" />
        <Route element={<ReviewFormPage />} path="/reviews/new" />
        <Route element={<ReviewFormPage />} path="/reviews/:reviewId" />
        <Route element={<NoticePage />} path="/notices" />
        <Route element={<NoticeFormPage />} path="/notices/new" />
        <Route element={<NoticeFormPage />} path="/notices/:noticeId" />
        <Route element={<ComplaintPage />} path="/complaints" />
        <Route element={<ComplaintDetailPage />} path="/complaints/:complaintId" />
        <Route element={<LinkPayPage />} path="/linkpay" />
        <Route element={<SalesPage />} path="/sales" />
        {placeholderPages.map((page) => (
          <Route
            element={
              <AdminPage
                description={page.description}
                eyebrow={page.eyebrow}
                title={page.title}
              />
            }
            key={page.path}
            path={page.path}
          />
        ))}
      </Routes>
      <Toaster />
    </div>
  )
}
