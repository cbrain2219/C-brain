"use client";

import type { OrderProductCatalogItem } from "@repo/supabase/product-catalog";
import { useEffect, useRef } from "react";

import { Icon } from "../../../components/Icon";
import { ServiceCards } from "../../_components/ServiceCards";
import {
  type OrderSelectionSummary,
  type OrderStepId,
} from "../../_content/order";
import type { FixedQuoteService } from "../../_content/quoteServices";
import type { ServiceItem } from "../../_content/services";
import { OrderConsultDialog } from "./OrderConsultDialog";
import {
  OrderCustomerInfoStep,
  type OrderPaymentSubmitPayload,
} from "./OrderCustomerInfoStep";
import { OrderMethodSelector } from "./OrderMethodSelector";
import { OrderOptionSelection } from "./OrderOptionSelection";
import { OrderProgress } from "./OrderProgress";
import styles from "./page.module.css";

type OrderFlowSectionProps = {
  isConsultDialogOpen: boolean;
  isPaymentSubmitting: boolean;
  onCategoryReset: () => void;
  onConsult: () => void;
  onConsultDialogClose: () => void;
  onCustomerInfoStart: (summary: OrderSelectionSummary) => void;
  onDirectServiceSelect: (service: ServiceItem) => void;
  onOptionBack: () => void;
  onPaymentSubmit?: (
    payload: OrderPaymentSubmitPayload,
  ) => Promise<void> | void;
  onQuoteServiceSelect: (service: FixedQuoteService) => void;
  orderStep: OrderStepId;
  selectedDirectProduct: OrderProductCatalogItem | null;
  selectedDirectService: ServiceItem | null;
  selectedOrderSummary: OrderSelectionSummary | null;
  services: readonly ServiceItem[];
};

export function OrderFlowSection({
  isConsultDialogOpen,
  isPaymentSubmitting,
  onCategoryReset,
  onConsult,
  onConsultDialogClose,
  onCustomerInfoStart,
  onDirectServiceSelect,
  onOptionBack,
  onPaymentSubmit,
  onQuoteServiceSelect,
  orderStep,
  selectedDirectProduct,
  selectedDirectService,
  selectedOrderSummary,
  services,
}: OrderFlowSectionProps) {
  const orderFlowRef = useRef<HTMLElement>(null);
  const optionHeaderRef = useRef<HTMLDivElement>(null);
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
      <div
        className={styles.orderInner}
        data-order-category-active={!selectedDirectService}
      >
        <h2 className={styles.visuallyHidden} id="order-flow-title">
          상품유형 주문 단계
        </h2>

        {selectedDirectService && selectedDirectProduct ? (
          <div className={styles.optionHeader} ref={optionHeaderRef}>
            <button
              className={styles.optionBackButton}
              onClick={handleOptionHeaderBack}
              type="button"
            >
              <Icon name="order-option-back" size={20} />
              <span className={styles.optionBackButtonText}>
                {optionHeaderBackLabel}
              </span>
            </button>
            <p className={styles.optionHeaderTitle}>{optionHeaderTitle}</p>
            <span className={styles.optionHeaderSpacer} aria-hidden="true" />
          </div>
        ) : null}

        <OrderProgress activeStepIndex={activeStepIndex} />

        {selectedDirectService && selectedDirectProduct ? (
          isCustomerStep ? (
            <OrderCustomerInfoStep
              isPaymentSubmitting={isPaymentSubmitting}
              onPaymentSubmit={onPaymentSubmit}
              summary={selectedOrderSummary}
            />
          ) : (
            <OrderOptionSelection
              key={selectedDirectService.id}
              onConsult={onConsult}
              onPaymentStart={onCustomerInfoStart}
              product={selectedDirectProduct}
              service={selectedDirectService}
            />
          )
        ) : (
          <div className={styles.categoryStep}>
            <OrderMethodSelector onQuoteSelect={onConsult} />

            <div className={styles.productSection}>
              <div className={styles.productSectionHeader}>
                <p>카테고리 선택</p>
              </div>

              <ServiceCards
                onDirectServiceSelect={onDirectServiceSelect}
                onQuoteServiceSelect={onQuoteServiceSelect}
                services={services}
              />
            </div>
          </div>
        )}
      </div>

      <OrderConsultDialog
        isOpen={isConsultDialogOpen}
        onClose={onConsultDialogClose}
      />
    </section>
  );
}
