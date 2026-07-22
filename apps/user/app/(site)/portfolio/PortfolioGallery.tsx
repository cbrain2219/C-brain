"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useMemo, useState } from "react";

import { HorizontalDragScroll } from "../../../components/HorizontalDragScroll";
import {
  getPortfolioDetailHref,
  getPortfolioListHref,
  type PortfolioCategory,
  type PortfolioCategoryId,
  type PortfolioItem,
} from "../../_content/portfolio";
import styles from "./page.module.css";

const PORTFOLIO_SCROLL_RESTORE_KEY = "portfolio-scroll-restore";

type PortfolioGalleryProps = {
  categories: readonly PortfolioCategory[];
  initialCategoryId?: PortfolioCategoryId;
  items: readonly PortfolioItem[];
};

type PortfolioScrollSnapshot = {
  categoryId: PortfolioCategoryId;
  scrollY: number;
};

function removePortfolioScrollSnapshot() {
  try {
    window.sessionStorage.removeItem(PORTFOLIO_SCROLL_RESTORE_KEY);
  } catch {
    // Ignore storage access failures so navigation still works.
  }
}

function readPortfolioScrollSnapshot(): PortfolioScrollSnapshot | undefined {
  let snapshotValue: string | null;

  try {
    snapshotValue = window.sessionStorage.getItem(
      PORTFOLIO_SCROLL_RESTORE_KEY,
    );
  } catch {
    return undefined;
  }

  if (!snapshotValue) {
    return undefined;
  }

  try {
    return JSON.parse(snapshotValue) as PortfolioScrollSnapshot;
  } catch {
    removePortfolioScrollSnapshot();
    return undefined;
  }
}

function writePortfolioScrollSnapshot(snapshot: PortfolioScrollSnapshot) {
  try {
    window.sessionStorage.setItem(
      PORTFOLIO_SCROLL_RESTORE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    // Ignore storage access failures so the detail link still opens.
  }
}

export function PortfolioGallery({
  categories,
  initialCategoryId,
  items,
}: PortfolioGalleryProps) {
  const router = useRouter();
  const categoryIds = useMemo(
    () => categories.map((category) => category.id),
    [categories],
  );
  const [activeCategoryId, setActiveCategoryId] =
    useState<PortfolioCategoryId>(
      initialCategoryId ?? categoryIds[0] ?? "brochure-catalog",
    );

  useEffect(() => {
    setActiveCategoryId(
      initialCategoryId ?? categoryIds[0] ?? "brochure-catalog",
    );
  }, [categoryIds, initialCategoryId]);

  useEffect(() => {
    const snapshot = readPortfolioScrollSnapshot();

    if (
      !snapshot ||
      snapshot.categoryId !== activeCategoryId ||
      !Number.isFinite(snapshot.scrollY)
    ) {
      removePortfolioScrollSnapshot();
      return;
    }

    removePortfolioScrollSnapshot();
    window.requestAnimationFrame(() => {
      window.scrollTo({ left: 0, top: snapshot.scrollY });
    });
  }, [activeCategoryId]);

  const activeItems = items.filter(
    (item) => item.categoryId === activeCategoryId,
  );

  const handleCategoryClick = (event: MouseEvent<HTMLButtonElement>) => {
    const categoryId = event.currentTarget.dataset
      .categoryId as PortfolioCategoryId;

    if (categoryIds.includes(categoryId)) {
      setActiveCategoryId(categoryId);
      router.replace(getPortfolioListHref(categoryId), { scroll: false });
    }
  };

  const handlePortfolioCardClick = () => {
    const snapshot: PortfolioScrollSnapshot = {
      categoryId: activeCategoryId,
      scrollY: window.scrollY,
    };

    writePortfolioScrollSnapshot(snapshot);
  };

  return (
    <div className={styles.gallery}>
      <HorizontalDragScroll
        ariaLabel="포트폴리오 카테고리"
        className={styles.categoryNav}
      >
        {categories.map((category) => {
          const isActive = activeCategoryId === category.id;

          return (
            <button
              aria-pressed={isActive}
              className={`${styles.categoryButton} ${
                isActive ? styles.categoryButtonActive : ""
              }`}
              data-category-id={category.id}
              key={category.id}
              onClick={handleCategoryClick}
              type="button"
            >
              {category.label}
            </button>
          );
        })}
      </HorizontalDragScroll>

      {activeItems.length > 0 ? (
        <ul className={styles.portfolioGrid}>
          {activeItems.map((item) => (
            <li className={styles.portfolioItem} key={item.slug}>
              <article>
                <Link
                  aria-label={`${item.client} ${item.title} 상세 보기`}
                  className={styles.portfolioCard}
                  href={getPortfolioDetailHref(item, activeCategoryId)}
                  onClick={handlePortfolioCardClick}
                >
                  <figure className={styles.portfolioFigure}>
                    <div className={styles.portfolioImageFrame}>
                      <Image
                        alt={item.imageAlt}
                        className={styles.portfolioImage}
                        fill
                        sizes="(min-width: 1080px) 333px, (min-width: 640px) 290px, calc(100vw - 40px)"
                        src={item.image}
                      />
                    </div>
                    <figcaption className={styles.portfolioCardBody}>
                      <span className={styles.portfolioTag}>
                        {
                          categories.find(
                            (category) => category.id === item.categoryId,
                          )?.label
                        }
                      </span>
                      <div className={styles.portfolioCardText}>
                        <p>{item.client}</p>
                        <h3>{item.title}</h3>
                      </div>
                    </figcaption>
                  </figure>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.emptyState} role="status">
          등록된 포트폴리오가 없습니다.
        </p>
      )}
    </div>
  );
}
