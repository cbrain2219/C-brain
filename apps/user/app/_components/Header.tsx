import { Button } from "@repo/ui/button";
import Image from "next/image";
import type { CSSProperties } from "react";

import styles from "../page.module.css";

const navItems = [
  { label: "회사소개", href: "#about" },
  { label: "포트폴리오", href: "#portfolio" },
  { label: "고객 후기", href: "#reviews" },
  { label: "주문 · 결제", href: "#services" },
  { label: "FAQ & 가이드", href: "#faq" },
  { label: "블로그", href: "#blog" },
  { label: "불편 접수", href: "#contact" },
  { label: "공지사항", href: "#notice" },
];

const priceButtonStyle: CSSProperties = {
  width: 148,
  borderRadius: 32,
  borderColor: "#ffffff",
  background: "linear-gradient(90deg, #30bac3 0%, #269aa3 100%)",
  color: "#fefefe",
  padding: "8px 20px",
};

const kakaoButtonStyle: CSSProperties = {
  width: 148,
  borderRadius: 32,
  borderColor: "#ffffff",
  background: "linear-gradient(105deg, #fae100 0%, #fac800 100%)",
  color: "#3b1d1d",
  padding: "8px 20px",
};

export function Header() {
  return (
    <header className={styles.header}>
      <a aria-label="씨브레인 홈" className={styles.logoLink} href="#">
        <span className={styles.logoMark}>
          <Image
            alt=""
            className={styles.logoMain}
            height={21}
            src="/figma-assets/cbrain-logo-main.svg"
            width={77}
          />
          <Image
            alt=""
            className={styles.logoTagline}
            height={4}
            src="/figma-assets/cbrain-logo-tagline.svg"
            width={76}
          />
        </span>
      </a>

      <nav aria-label="주요 메뉴" className={styles.desktopNav}>
        {navItems.map((item) => (
          <a className={styles.navLink} href={item.href} key={item.label}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className={styles.headerActions}>
        <Button style={priceButtonStyle}>정찰제 가격 보기</Button>
        <Button style={kakaoButtonStyle}>실시간 카톡상담</Button>
      </div>

      <button
        aria-label="메뉴 열기"
        className={styles.mobileMenuButton}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
