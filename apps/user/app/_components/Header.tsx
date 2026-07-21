"use client";

import { Button } from "@repo/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type MouseEvent,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { Icon } from "../../components/Icon";
import styles from "../page.module.css";
import { createGradientBorderButtonStyle } from "./buttonStyles";

const navItems = [
  { label: "회사소개", href: "/#about" },
  { label: "포트폴리오", href: "/portfolio" },
  { label: "고객 후기", href: "/reviews" },
  { label: "주문 · 결제", href: "/#services" },
  { label: "FAQ & 가이드", href: "/faq" },
  { label: "블로그", href: "/#blog" },
  { label: "불편 접수", href: "/complaint" },
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
    mobileNavDialogRef.current?.close();
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  const handleOpenMenu = () => {
    setIsMenuOpen(true);
  };

  const handleOverlayClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      closeMenuAndRestoreFocus();
    }
  };

  const handleDialogCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    closeMenuAndRestoreFocus();
  };

  const handleMobileNavClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute("href");

    setActiveNavHref(href);
    setIsMenuOpen(false);
  };

  const isNoticePage = pathname.startsWith("/notice");
  const hasDarkHero = pathname === "/notice" && !isScrolled;
  const isNavItemCurrentPage = (href: string) => {
    if (href === "/notice") return isNoticePage;
    if (href === "/portfolio") return pathname.startsWith("/portfolio");
    if (href === "/reviews") return pathname.startsWith("/reviews");
    return pathname === href;
  };

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
              height={20}
              src="/figma-assets/cbrain-logo-main.svg"
              style={{ height: 20, width: 77 }}
              width={77}
            />
            <Image
              alt=""
              className={styles.logoTagline}
              height={4}
              src="/figma-assets/cbrain-logo-tagline.svg"
              style={{ height: 4, width: 76 }}
              width={76}
            />
          </span>
        </Link>

        <nav aria-label="주요 메뉴" className={styles.desktopNav}>
          {navItems.map((item) => {
            const isActive = isNavItemCurrentPage(item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`${styles.navLink} ${
                  isActive ? styles.navLinkActive : ""
                }`}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </Link>
            );
          })}
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
        onClick={handleOpenMenu}
        ref={menuButtonRef}
        type="button"
      >
        <Icon className={styles.mobileMenuIcon} name="menu-04" size={24} />
      </button>

      {isMenuOpen ? (
        <dialog
          aria-label="모바일 메뉴"
          className={styles.mobileNavOverlay}
          id="mobile-navigation"
          onClick={handleOverlayClick}
          onCancel={handleDialogCancel}
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
                <Icon
                  className={styles.mobileNavCloseIcon}
                  name="x-close"
                  size={24}
                />
              </button>
            </div>

            <nav
              aria-label="모바일 주요 메뉴"
              className={styles.mobileNavLinks}
            >
              {navItems.map((item) => {
                const isCurrentPage = isNavItemCurrentPage(item.href);
                const isActive = isCurrentPage || activeNavHref === item.href;

                return (
                  <Link
                    aria-current={
                      isCurrentPage ? "page" : isActive ? "location" : undefined
                    }
                    className={`${styles.mobileNavLink} ${
                      isActive ? styles.mobileNavLinkActive : ""
                    }`}
                    href={item.href}
                    key={item.label}
                    onClick={handleMobileNavClick}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </dialog>
      ) : null}
    </header>
  );
}
