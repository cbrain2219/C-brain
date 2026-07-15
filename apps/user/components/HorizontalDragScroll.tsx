"use client";

import type {
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
} from "react";
import { useRef } from "react";

type HorizontalDragScrollProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  role?: "navigation" | "region";
};

type DragState = {
  pointerId: number | null;
  scrollLeft: number;
  startX: number;
};

const DRAG_ACTIVATION_DISTANCE = 8;

export function HorizontalDragScroll({
  ariaLabel,
  children,
  className,
  role = "region",
}: HorizontalDragScrollProps) {
  const dragState = useRef<DragState>({
    pointerId: null,
    scrollLeft: 0,
    startX: 0,
  });
  const didDrag = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    dragState.current = {
      pointerId: event.pointerId,
      scrollLeft: event.currentTarget.scrollLeft,
      startX: event.clientX,
    };
    didDrag.current = false;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragState.current.pointerId !== event.pointerId) return;

    const distance = event.clientX - dragState.current.startX;
    if (!didDrag.current && Math.abs(distance) < DRAG_ACTIVATION_DISTANCE) {
      return;
    }

    if (!didDrag.current) {
      didDrag.current = true;
      event.currentTarget.dataset.dragging = "true";
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.currentTarget.scrollLeft = dragState.current.scrollLeft - distance;
    event.preventDefault();
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragState.current.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    delete event.currentTarget.dataset.dragging;
    dragState.current.pointerId = null;

    window.setTimeout(() => {
      didDrag.current = false;
    }, 0);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    finishDrag(event);
    didDrag.current = false;
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!didDrag.current) return;

    event.preventDefault();
    event.stopPropagation();
    didDrag.current = false;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    const direction = event.key === "ArrowLeft" ? -1 : 1;
    event.currentTarget.scrollBy({
      behavior: "smooth",
      left: direction * event.currentTarget.clientWidth * 0.6,
    });
    event.preventDefault();
  };

  return (
    <div
      aria-label={ariaLabel}
      className={className}
      onClickCapture={handleClickCapture}
      onKeyDown={handleKeyDown}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      role={role}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
