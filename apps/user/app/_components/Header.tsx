"use client";

import { Button } from "@repo/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import styles from "../page.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const navItems = [
  { label: "회사소개", href: "#about" },
  { label: "포트폴리오", href: "#portfolio" },
  { label: "고객 후기", href: "#reviews" },
  { label: "주문 · 결제", href: "#services" },
  { label: "FAQ & 가이드", href: "#faq" },
  { label: "블로그", href: "#blog" },
  { label: "불편 접수", href: "#contact" },
  { label: "공지사항", href: "/notice" },
];

const priceButtonStyle = createGradientBorderButtonStyle({ width: 148 });

const kakaoButtonStyle = createGradientBorderButtonStyle({
  tone: "kakao",
  width: 148,
});

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeNavHref, setActiveNavHref] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const updateHeaderBackground = () => {
      setIsScrolled(window.scrollY > 0);
    };

    updateHeaderBackground();
    window.addEventListener("scroll", updateHeaderBackground, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", updateHeaderBackground);
    };
  }, []);

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 1100px)");
    const closeMenuOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false);
      }
    };

    desktopMediaQuery.addEventListener("change", closeMenuOnDesktop);

    return () => {
      desktopMediaQuery.removeEventListener("change", closeMenuOnDesktop);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const dialog = mobileNavDialogRef.current;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const closeMenuAndRestoreFocus = () => {
    setIsMenuOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const isNoticePage = pathname.startsWith("/notice");
  const hasDarkHero = pathname === "/notice" && !isScrolled;

  return (
    <header
      className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""} ${
        hasDarkHero ? styles.headerDarkHero : ""
      } ${isNoticePage ? styles.headerNoticePage : ""}`}
    >
      <div className={styles.headerPrimary}>
        <Link aria-label="씨브레인 홈" className={styles.logoLink} href="/">
          <span className={styles.logoMark}>
            <Image
              alt=""
              className={styles.logoMain}
              height={20.0974}
              src="/figma-assets/cbrain-logo-main.svg"
              width={77.0012}
            />
            <Image
              alt=""
              className={styles.logoTagline}
              height={3.84334}
              src="/figma-assets/cbrain-logo-tagline.svg"
              width={76.2359}
            />
          </span>
        </Link>

        <nav aria-label="주요 메뉴" className={styles.desktopNav}>
          {navItems.map((item) => (
            <Link
              aria-current={
                item.href === "/notice" && isNoticePage ? "page" : undefined
              }
              className={`${styles.navLink} ${
                item.href === "/notice" && isNoticePage
                  ? styles.navLinkActive
                  : ""
              }`}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.headerActions}>
        <Button style={priceButtonStyle}>정찰제 가격 보기</Button>
        <Button style={kakaoButtonStyle}>실시간 카톡상담</Button>
      </div>

      <button
        aria-controls="mobile-navigation"
        aria-expanded={isMenuOpen}
        aria-label="메뉴 열기"
        className={styles.mobileMenuButton}
        onClick={() => setIsMenuOpen(true)}
        ref={menuButtonRef}
        type="button"
      >
        <svg
          aria-hidden="true"
          className={styles.mobileMenuIcon}
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M13.5 18H4M20 12H4M20 6H4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      {isMenuOpen ? (
        <dialog
          aria-label="모바일 메뉴"
          className={styles.mobileNavOverlay}
          id="mobile-navigation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeMenuAndRestoreFocus();
            }
          }}
          onCancel={(event) => {
            event.preventDefault();
            closeMenuAndRestoreFocus();
          }}
          ref={mobileNavDialogRef}
        >
          <div className={styles.mobileNavPanel}>
            <div className={styles.mobileNavCloseRow}>
              <button
                aria-label="메뉴 닫기"
                className={styles.mobileNavCloseButton}
                onClick={closeMenuAndRestoreFocus}
                ref={closeButtonRef}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className={styles.mobileNavCloseIcon}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16 8L8 16M16 16L8 8"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>

            <nav
              aria-label="모바일 주요 메뉴"
              className={styles.mobileNavLinks}
            >
              {navItems.map((item) => (
                <Link
                  aria-current={
                    item.href === "/notice" && isNoticePage
                      ? "page"
                      : activeNavHref === item.href
                        ? "location"
                        : undefined
                  }
                  className={`${styles.mobileNavLink} ${
                    (item.href === "/notice" && isNoticePage) ||
                    activeNavHref === item.href
                      ? styles.mobileNavLinkActive
                      : ""
                  }`}
                  href={item.href}
                  key={item.label}
                  onClick={() => {
                    setActiveNavHref(item.href);
                    setIsMenuOpen(false);
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </dialog>
      ) : null}
    </header>
  );
}
