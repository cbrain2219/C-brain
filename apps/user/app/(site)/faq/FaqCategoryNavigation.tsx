"use client";

import { type MouseEvent, useEffect, useMemo, useState } from "react";

import { HorizontalDragScroll } from "../../../components/HorizontalDragScroll";
import { Icon } from "../../../components/Icon";
import { KAKAO_CHANNEL_URL } from "../../_content/contact";
import styles from "./page.module.css";

type FaqCategoryNavItem = {
  icon: string;
  id: string;
  title: string;
};

type FaqCategoryNavigationProps = {
  categories: readonly FaqCategoryNavItem[];
  variant: "mobile" | "sidebar";
};

const getActivationOffset = () => {
  const root = document.querySelector<HTMLElement>("[data-faq-page]");
  if (!root) return 156;

  const styles = getComputedStyle(root);
  const headerOffset = Number.parseFloat(
    styles.getPropertyValue("--faq-header-offset"),
  );
  const mobileCategoryHeight = Number.parseFloat(
    styles.getPropertyValue("--faq-mobile-category-height"),
  );
  const hasMobileCategory = window.matchMedia("(max-width: 1199px)").matches;

  return (
    (Number.isFinite(headerOffset) ? headerOffset : 80) +
    (hasMobileCategory && Number.isFinite(mobileCategoryHeight)
      ? mobileCategoryHeight
      : 0) +
    48
  );
};

function CategoryLabel({ icon, title }: FaqCategoryNavItem) {
  return (
    <>
      <span aria-hidden="true">{icon}</span>
      <span>{title}</span>
    </>
  );
}

export function FaqCategoryNavigation({
  categories,
  variant,
}: FaqCategoryNavigationProps) {
  const categoryIds = useMemo(
    () => categories.map((category) => category.id),
    [categories],
  );
  const [activeCategoryId, setActiveCategoryId] = useState(
    categoryIds[0] ?? "",
  );

  useEffect(() => {
    if (!categoryIds.length) return;

    let frameId = 0;

    const updateActiveCategory = () => {
      frameId = 0;
      const activationOffset = getActivationOffset();
      const sections = categoryIds
        .map((id) => document.getElementById(id))
        .filter((section): section is HTMLElement => section !== null);

      const currentSection = sections.reduce<HTMLElement | null>(
        (current, section) => {
          if (section.getBoundingClientRect().top <= activationOffset) {
            return section;
          }

          return current;
        },
        sections[0] ?? null,
      );

      if (currentSection) {
        setActiveCategoryId(currentSection.id);
      }
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateActiveCategory);
    };

    updateActiveCategory();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [categoryIds]);

  const handleCategoryLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const categoryId = event.currentTarget.hash.slice(1);
    if (categoryIds.includes(categoryId)) {
      setActiveCategoryId(categoryId);
    }
  };

  const renderCategoryLink = (
    category: FaqCategoryNavItem,
    variant: "sidebar" | "mobile",
  ) => {
    const isActive = activeCategoryId === category.id;
    const className =
      variant === "sidebar"
        ? `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`
        : `${styles.mobileCategoryLink} ${
            isActive ? styles.mobileCategoryLinkActive : ""
          }`;

    return (
      <a
        aria-current={isActive ? "location" : undefined}
        className={className}
        href={`#${category.id}`}
        key={category.id}
        onClick={handleCategoryLinkClick}
      >
        <CategoryLabel {...category} />
      </a>
    );
  };

  if (variant === "sidebar") {
    return (
      <aside aria-label="FAQ 카테고리" className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <p className={styles.sidebarTitle}>FAQ(자주 묻는 질문)</p>
          <nav className={styles.sidebarNav}>
            {categories.map((category) =>
              renderCategoryLink(category, "sidebar"),
            )}
          </nav>
          <div className={styles.sidebarContact}>
            <div className={styles.sidebarContactText}>
              <p>찾으시는 내용이 없다면?</p>
              <strong>실시간 카톡상담</strong>
            </div>
            <a
              className={styles.sidebarContactButton}
              href={KAKAO_CHANNEL_URL}
              rel="noreferrer"
              target="_blank"
            >
              지금 상담 시작하기
              <Icon name="arrow-right" size={24} />
            </a>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <HorizontalDragScroll
      ariaLabel="FAQ 카테고리"
      className={styles.mobileCategoryNav}
    >
      {categories.map((category) => renderCategoryLink(category, "mobile"))}
    </HorizontalDragScroll>
  );
}
