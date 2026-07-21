"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type TransitionEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { BlogPost } from "../_types/blog";

import styles from "../page.module.css";

type BlogFeaturedCardProps = {
  getDetailHref: (post: BlogPost) => string;
  posts: readonly BlogPost[];
};

const BLOG_FEATURED_SLIDE_INTERVAL_MS = 5000;
const BLOG_FEATURED_TRANSITION_MS = 420;
const BLOG_FEATURED_SWIPE_THRESHOLD_PX = 48;
const BLOG_FEATURED_CLICK_GUARD_MS = 250;

export function BlogFeaturedCard({
  getDetailHref,
  posts,
}: BlogFeaturedCardProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(() =>
    posts.length > 1 ? 1 : 0,
  );
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const didSwipeRef = useRef(false);
  const isSlideLockedRef = useRef(false);
  const slideUnlockTimerRef = useRef<number | null>(null);
  const swipeStartXRef = useRef<number | null>(null);
  const slideCount = posts.length;
  const hasMultipleSlides = slideCount > 1;
  const firstPost = posts[0];
  const lastPost = posts[slideCount - 1];
  const displayedPosts = hasMultipleSlides
    ? firstPost && lastPost
      ? [lastPost, ...posts, firstPost]
      : posts
    : posts;

  const clearSlideUnlockTimer = useCallback(() => {
    if (slideUnlockTimerRef.current === null) return;

    window.clearTimeout(slideUnlockTimerRef.current);
    slideUnlockTimerRef.current = null;
  }, []);

  const unlockSlide = useCallback(() => {
    clearSlideUnlockTimer();
    isSlideLockedRef.current = false;
  }, [clearSlideUnlockTimer]);

  const scheduleSlideUnlock = useCallback(() => {
    clearSlideUnlockTimer();
    slideUnlockTimerRef.current = window.setTimeout(
      unlockSlide,
      BLOG_FEATURED_TRANSITION_MS,
    );
  }, [clearSlideUnlockTimer, unlockSlide]);

  const moveSlide = useCallback(
    (direction: -1 | 1) => {
      if (!hasMultipleSlides || isSlideLockedRef.current) return;

      isSlideLockedRef.current = true;
      setIsTransitionEnabled(true);
      scheduleSlideUnlock();
      setTrackIndex((currentIndex) => currentIndex + direction);
      setActiveIndex((currentIndex) =>
        direction > 0
          ? (currentIndex + 1) % slideCount
          : currentIndex === 0
            ? slideCount - 1
            : currentIndex - 1,
      );
    },
    [hasMultipleSlides, scheduleSlideUnlock, slideCount],
  );

  const showPreviousSlide = useCallback(() => {
    moveSlide(-1);
  }, [moveSlide]);

  const showNextSlide = useCallback(() => {
    moveSlide(1);
  }, [moveSlide]);

  const restoreTrackTransition = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsTransitionEnabled(true);
      });
    });
  }, []);

  const getLoopedTrackIndex = useCallback(
    (currentIndex: number) => {
      if (!hasMultipleSlides) return currentIndex;

      return (
        (((currentIndex - 1) % slideCount) + slideCount) % slideCount
      ) + 1;
    },
    [hasMultipleSlides, slideCount],
  );

  const resetTrackToLoopedIndex = useCallback(() => {
    setIsTransitionEnabled(false);
    setTrackIndex((currentIndex) => getLoopedTrackIndex(currentIndex));
    restoreTrackTransition();
    unlockSlide();
  }, [getLoopedTrackIndex, restoreTrackTransition, unlockSlide]);

  useEffect(() => {
    setActiveIndex(0);
    setTrackIndex(hasMultipleSlides ? 1 : 0);
    setIsTransitionEnabled(true);
    unlockSlide();
  }, [hasMultipleSlides, posts, unlockSlide]);

  useEffect(() => {
    return () => {
      clearSlideUnlockTimer();
    };
  }, [clearSlideUnlockTimer]);

  useEffect(() => {
    if (!hasMultipleSlides) return;

    if (trackIndex < 0 || trackIndex > slideCount + 1) {
      resetTrackToLoopedIndex();
      return;
    }

    if (trackIndex !== 0 && trackIndex !== slideCount + 1) return;

    const resetTimer = window.setTimeout(
      resetTrackToLoopedIndex,
      BLOG_FEATURED_TRANSITION_MS,
    );

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [hasMultipleSlides, resetTrackToLoopedIndex, slideCount, trackIndex]);

  useEffect(() => {
    if (!hasMultipleSlides || isPaused) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const slideTimer = window.setInterval(
      showNextSlide,
      BLOG_FEATURED_SLIDE_INTERVAL_MS,
    );

    return () => {
      window.clearInterval(slideTimer);
    };
  }, [hasMultipleSlides, isPaused, showNextSlide]);

  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    if (!hasMultipleSlides) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    didSwipeRef.current = false;
    swipeStartXRef.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLAnchorElement>) => {
    if (!hasMultipleSlides || swipeStartXRef.current === null) return;

    const distance = event.clientX - swipeStartXRef.current;
    swipeStartXRef.current = null;

    if (Math.abs(distance) < BLOG_FEATURED_SWIPE_THRESHOLD_PX) return;

    didSwipeRef.current = true;
    window.setTimeout(() => {
      didSwipeRef.current = false;
    }, BLOG_FEATURED_CLICK_GUARD_MS);

    if (distance > 0) {
      showPreviousSlide();
      return;
    }

    showNextSlide();
  };

  const handlePointerCancel = () => {
    swipeStartXRef.current = null;
  };

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (didSwipeRef.current) {
      event.preventDefault();
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.currentTarget.target
    ) {
      return;
    }

    const href = event.currentTarget.getAttribute("href");
    if (!href) return;

    event.preventDefault();
    router.push(href);
  };

  const handleTrackTransitionEnd = (
    event: TransitionEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget || !hasMultipleSlides) return;

    if (trackIndex === 0 || trackIndex === slideCount + 1) {
      resetTrackToLoopedIndex();
      return;
    }

    unlockSlide();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!hasMultipleSlides) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    if (event.key === "ArrowLeft") {
      showPreviousSlide();
    } else {
      showNextSlide();
    }
    event.preventDefault();
  };

  if (slideCount === 0) return null;

  return (
    <section
      aria-label="대표 블로그 게시글"
      aria-roledescription="carousel"
      className={styles.blogFeaturedCard}
      onBlurCapture={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className={`${styles.blogFeaturedTrack} ${
          isTransitionEnabled ? "" : styles.blogFeaturedTrackInstant
        }`}
        onTransitionEnd={handleTrackTransitionEnd}
        style={{ transform: `translateX(-${trackIndex * 100}%)` }}
      >
        {displayedPosts.map((post, index) => (
          <article
            aria-hidden={trackIndex === index ? undefined : "true"}
            className={styles.blogFeaturedSlide}
            key={`${post.id}-${index}`}
          >
            <Link
              aria-label={`${post.title} 상세 보기`}
              className={styles.blogFeaturedLink}
              data-blog-detail-href={getDetailHref(post)}
              draggable={false}
              href={getDetailHref(post)}
              onPointerCancel={handlePointerCancel}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onClick={handleLinkClick}
              tabIndex={trackIndex === index ? undefined : -1}
            >
              <div className={styles.blogFeaturedImage}>
                <Image
                  alt={post.title}
                  className={styles.blogFeaturedImageAsset}
                  draggable={false}
                  fill
                  priority={hasMultipleSlides ? index === 1 : index === 0}
                  sizes="(min-width: 1440px) 720px, (min-width: 1080px) 66vw, (min-width: 640px) 100vw, 100vw"
                  src={post.image}
                />
                <div
                  aria-hidden="true"
                  className={styles.blogFeaturedOverlay}
                />
              </div>
              <header className={styles.blogFeaturedContent}>
                <p className={styles.blogFeaturedCategory}>{post.category}</p>
                <div className={styles.blogFeaturedCopy}>
                  <h3 className={styles.blogFeaturedTitle}>{post.title}</h3>
                  <p className={styles.blogFeaturedSummary}>{post.summary}</p>
                </div>
              </header>
            </Link>
          </article>
        ))}
      </div>
      <p
        aria-label={`대표 게시글 ${activeIndex + 1}/${slideCount}`}
        className={styles.blogFeaturedIndex}
      >
        {activeIndex + 1}/{slideCount}
      </p>
    </section>
  );
}
