"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "../../../components/Icon";
import { ServiceCards } from "../../_components/ServiceCards";
import {
  type OrderSelectionSummary,
  type OrderStepId,
  orderSteps,
} from "../../_content/order";
import type { ServiceItem } from "../../_content/services";
import { OrderConsultDialog } from "./OrderConsultDialog";
import { OrderCustomerInfoStep } from "./OrderCustomerInfoStep";
import { OrderMethodSelector } from "./OrderMethodSelector";
import { OrderOptionSelection } from "./OrderOptionSelection";
import styles from "./page.module.css";

type OrderFlowSectionProps = {
  onCategoryReset: () => void;
  onCustomerInfoStart: (summary: OrderSelectionSummary) => void;
  onDirectServiceSelect: (service: ServiceItem) => void;
  onOptionBack: () => void;
  orderStep: OrderStepId;
  selectedDirectService: ServiceItem | null;
  selectedOrderSummary: OrderSelectionSummary | null;
};

export function OrderFlowSection({
  onCategoryReset,
  onCustomerInfoStart,
  onDirectServiceSelect,
  onOptionBack,
  orderStep,
  selectedDirectService,
  selectedOrderSummary,
}: OrderFlowSectionProps) {
  const [isConsultDialogOpen, setIsConsultDialogOpen] = useState(false);
  const orderFlowRef = useRef<HTMLElement>(null);
  const optionHeaderRef = useRef<HTMLDivElement>(null);
  const openConsultDialog = () => setIsConsultDialogOpen(true);
  const isCustomerStep =
    orderStep === "customer" && selectedOrderSummary !== null;
  const activeStepIndex = isCustomerStep ? 2 : selectedDirectService ? 1 : 0;
  const optionHeaderBackLabel = isCustomerStep
    ? "옵션 선택으로"
    : "카테고리 선택으로";
  const optionHeaderTitle = isCustomerStep ? "III. 정보 입력" : "II. 옵션 선택";
  const handleOptionHeaderBack = isCustomerStep
    ? onOptionBack
    : onCategoryReset;

  useEffect(() => {
    if (!selectedDirectService) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 639px)").matches) {
        const flowTop =
          window.scrollY +
          (orderFlowRef.current?.getBoundingClientRect().top ?? 0);

        window.scrollTo({
          behavior: "smooth",
          top: Math.max(flowTop, 0),
        });
        return;
      }

      optionHeaderRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [orderStep, selectedDirectService]);

  return (
    <section
      className={styles.orderFlow}
      aria-labelledby="order-flow-title"
      ref={orderFlowRef}
    >
      <div className={styles.orderInner}>
        <h2 className={styles.visuallyHidden} id="order-flow-title">
          상품유형 주문 단계
        </h2>

        {selectedDirectService ? (
          <div className={styles.optionHeader} ref={optionHeaderRef}>
            <button
              className={styles.optionBackButton}
              onClick={handleOptionHeaderBack}
              type="button"
            >
              <Icon name="order-option-back" size={18} />
              <span className={styles.optionBackButtonText}>
                {optionHeaderBackLabel}
              </span>
            </button>
            <p className={styles.optionHeaderTitle}>{optionHeaderTitle}</p>
            <span className={styles.optionHeaderSpacer} aria-hidden="true" />
          </div>
        ) : null}

        <ol className={styles.stepList} aria-label="주문 진행 단계">
          {orderSteps.map((step, index) => (
            <li
              className={`${styles.stepItem} ${index < activeStepIndex ? styles.stepItemComplete : ""} ${
                index === activeStepIndex ? styles.stepItemActive : ""
              }`}
              key={step.label}
            >
              {step.label}
            </li>
          ))}
        </ol>

        {selectedDirectService ? (
          isCustomerStep ? (
            <OrderCustomerInfoStep summary={selectedOrderSummary} />
          ) : (
            <OrderOptionSelection
              key={selectedDirectService.id}
              onConsult={openConsultDialog}
              onPaymentStart={onCustomerInfoStart}
              service={selectedDirectService}
            />
          )
        ) : (
          <>
            <OrderMethodSelector onQuoteSelect={openConsultDialog} />

            <div className={styles.productSectionHeader}>
              <p>Ⅰ. 카테고리 선택</p>
            </div>

            <ServiceCards
              onDirectServiceSelect={onDirectServiceSelect}
              onQuoteServiceSelect={openConsultDialog}
            />
          </>
        )}
      </div>

      <OrderConsultDialog
        isOpen={isConsultDialogOpen}
        onClose={() => setIsConsultDialogOpen(false)}
      />
    </section>
  );
}
