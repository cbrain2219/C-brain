import './AdminFooter.css'

const socialLinks = [
  {
    href: 'https://instagram.com/cbrain_design_group',
    icon: '/figma-assets/footer-instagram.png',
    label: '인스타그램',
  },
  {
    href: 'https://blog.naver.com/cbrain_design_group',
    icon: '/figma-assets/footer-naver-blog.png',
    label: '네이버 블로그',
  },
  {
    href: 'https://www.youtube.com/@CreateDesigngroup',
    icon: '/figma-assets/footer-youtube.png',
    label: '유튜브',
  },
] as const

export function AdminFooter() {
  return (
    <footer className="admin-footer">
      <div className="admin-footer__top">
        <a className="admin-footer__logo" href="https://cbrain.kr">
          <img
            className="admin-footer__logo-wordmark"
            src="/figma-assets/cbrain-logo-wordmark.svg"
            width="77"
            height="20"
            alt="씨브레인"
          />
          <img
            className="admin-footer__logo-subtitle"
            src="/figma-assets/cbrain-logo-subtitle.svg"
            width="76"
            height="4"
            alt="크리에이티브 디자인 그룹"
          />
        </a>
        <div className="admin-footer__socials">
          {socialLinks.map((social) => (
            <a href={social.href} key={social.label} rel="noreferrer" target="_blank">
              <span className="admin-footer__social-icon" aria-hidden="true">
                <img alt="" src={social.icon} />
              </span>
              <span>{social.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="admin-footer__divider" />

      <div className="admin-footer__links-and-support">
        <nav className="admin-footer__policy-links" aria-label="정책 링크">
          <a href="#terms">이용약관</a>
          <a className="admin-footer__policy-link--strong" href="#privacy">
            개인정보처리방침
          </a>
          <a href="#refunds">취소 및 환불 규정</a>
        </nav>
        <div className="admin-footer__support">
          <p>고객센터</p>
          <p>전화번호 : 070-8830-2219</p>
          <p>월~목 : 8:00 - 17:00 / 금 : 8:00 - 16:00</p>
          <p>점심시간 : 11:00 - 12:30</p>
        </div>
      </div>

      <div className="admin-footer__divider" />

      <div className="admin-footer__company-info">
        <p>씨브레인 | 대표자명 : 정혜영 | 사업자 등록번호 : 120-07-84415</p>
        <p>통신판매 신고번호 : 2022-성남중원-0006</p>
        <p>
          본사 : 경기도 성남시 중원구 사기막골로 99 센트럴비즈타워2차 B타워 218호
        </p>
        <p>개인정보관리책임자 : 김훈(jhy@cbrain.kr)</p>
        <p className="admin-footer__copyright">
          Copyright ⓒ 2026 C-Brain. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
