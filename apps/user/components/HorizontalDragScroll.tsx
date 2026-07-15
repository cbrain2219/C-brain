"use client";

import type {
  DragEvent,
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
};

type DragState = {
  pointerId: number | null;
  scrollLeft: number;
  startX: number;
};

const DRAG_START_DISTANCE = 10;

export function HorizontalDragScroll({
  ariaLabel,
  children,
  className,
}: HorizontalDragScrollProps) {
  const dragState = useRef<DragState>({
    pointerId: null,
    scrollLeft: 0,
    startX: 0,
  });
  const didDrag = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

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
    if (!didDrag.current) {
      if (Math.abs(distance) < DRAG_START_DISTANCE) return;

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

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
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
      onDragStartCapture={handleDragStart}
      onKeyDown={handleKeyDown}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      role="region"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
