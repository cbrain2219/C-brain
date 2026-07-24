"use client";

import type { MouseEvent } from "react";
import { useEffect } from "react";

import { Icon } from "../../../components/Icon";
import { KAKAO_CHANNEL_URL } from "../../_content/contact";
import styles from "./page.module.css";

type OrderConsultDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function OrderConsultDialog({
  isOpen,
  onClose,
}: OrderConsultDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      aria-labelledby="order-consult-dialog-title"
      aria-modal="true"
      className={styles.consultDialogOverlay}
      onMouseDown={handleOverlayMouseDown}
      role="dialog"
    >
      <div className={styles.consultDialogPanel}>
        <button
          aria-label="다이얼로그 닫기"
          className={styles.consultDialogCloseButton}
          onClick={onClose}
          type="button"
        >
          <Icon name="x-close" size={24} />
        </button>
        <div className={styles.consultDialogCard}>
          <div className={styles.consultDialogCopy}>
            <h2 id="order-consult-dialog-title">맞춤·대량·촬영</h2>
            <p>
              규격 협의 필요하거나 대량 주문 문의를 위해
              <br />
              카카오톡 1:1 상담으로 이동합니다.
            </p>
          </div>
          <a
            className={styles.consultDialogAction}
            href={KAKAO_CHANNEL_URL}
            rel="noreferrer"
            target="_blank"
          >
            카카오톡 1:1 문의
          </a>
        </div>
      </div>
    </div>
  );
}
