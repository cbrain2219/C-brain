"use client";

import type { OrderProductCatalogItem } from "@repo/supabase/product-catalog";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { CtaSection } from "../../_components/CtaSection";
import {
  type OrderSelectionSummary,
  type OrderStepId,
  orderServiceSearchParam,
} from "../../_content/order";
import {
  getDirectServiceItemById,
  type ServiceItem,
} from "../../_content/services";
import type { OrderPaymentSubmitPayload } from "./OrderCustomerInfoStep";
import { OrderFlowSection } from "./OrderFlowSection";
import { getOrderCheckoutPayloadKey, submitOrderPayment } from "./payment";
import styles from "./page.module.css";

type OrderPageClientProps = {
  products: readonly OrderProductCatalogItem[];
  services: readonly ServiceItem[];
};

const ORDER_HISTORY_STATE_KEY = "__cbrainOrderStep";

type OrderHistoryEntry =
  | { step: "category" }
  | { serviceId: string; step: "option" }
  | {
      serviceId: string;
      step: "customer";
      summary: OrderSelectionSummary;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOrderSelectionSummary = (
  value: unknown,
): value is OrderSelectionSummary =>
  isRecord(value) &&
  typeof value.categoryLabel === "string" &&
  isRecord(value.ids) &&
  Array.isArray(value.optionRows) &&
  Array.isArray(value.priceRows) &&
  typeof value.serviceLabel === "string" &&
  typeof value.totalPrice === "number";

const getOrderHistoryEntry = (state: unknown): OrderHistoryEntry | null => {
  if (!isRecord(state)) return null;

  const entry = state[ORDER_HISTORY_STATE_KEY];

  if (!isRecord(entry) || typeof entry.step !== "string") return null;
  if (entry.step === "category") return { step: "category" };
  if (typeof entry.serviceId !== "string") return null;

  if (entry.step === "option") {
    return { serviceId: entry.serviceId, step: "option" };
  }

  if (entry.step === "customer" && isOrderSelectionSummary(entry.summary)) {
    return {
      serviceId: entry.serviceId,
      step: "customer",
      summary: entry.summary,
    };
  }

  return null;
};

const createOrderHistoryState = (entry: OrderHistoryEntry) => ({
  ...(isRecord(window.history.state) ? window.history.state : {}),
  [ORDER_HISTORY_STATE_KEY]: entry,
});

const getOrderHistoryUrl = (serviceId?: string) => {
  const url = new URL(window.location.href);

  if (serviceId) {
    url.searchParams.set(orderServiceSearchParam, serviceId);
  } else {
    url.searchParams.delete(orderServiceSearchParam);
  }

  return `${url.pathname}${url.search}${url.hash}`;
};

const pushOrderHistoryEntry = (entry: OrderHistoryEntry, serviceId?: string) => {
  window.history.pushState(
    createOrderHistoryState(entry),
    "",
    getOrderHistoryUrl(serviceId),
  );
};

const replaceOrderHistoryEntry = (
  entry: OrderHistoryEntry,
  serviceId?: string,
) => {
  window.history.replaceState(
    createOrderHistoryState(entry),
    "",
    getOrderHistoryUrl(serviceId),
  );
};

export function OrderPageClient({
  products,
  services,
}: OrderPageClientProps) {
  const checkoutRequestRef = useRef<{
    payloadKey: string;
    requestId: string;
  } | null>(null);
  const paymentSubmissionInFlightRef = useRef(false);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [orderStep, setOrderStep] = useState<OrderStepId>("category");
  const [selectedDirectService, setSelectedDirectService] =
    useState<ServiceItem | null>(null);
  const [selectedOrderSummary, setSelectedOrderSummary] =
    useState<OrderSelectionSummary | null>(null);
  const selectedDirectProduct = selectedDirectService
    ? (products.find(
        (product) => product.id === selectedDirectService.productId,
      ) ?? null)
    : null;

  const restoreOrderHistoryEntry = useCallback(
    (entry: OrderHistoryEntry) => {
      if (entry.step === "category") {
        setOrderStep("category");
        setSelectedDirectService(null);
        setSelectedOrderSummary(null);
        return;
      }

      const service = getDirectServiceItemById(services, entry.serviceId);

      if (!service) {
        setOrderStep("category");
        setSelectedDirectService(null);
        setSelectedOrderSummary(null);
        return;
      }

      setSelectedDirectService(service);

      if (entry.step === "customer") {
        setSelectedOrderSummary(entry.summary);
        setOrderStep("customer");
        return;
      }

      setSelectedOrderSummary(null);
      setOrderStep("option");
    },
    [services],
  );

  const handleCategoryReset = () => {
    const currentEntry = getOrderHistoryEntry(window.history.state);

    if (currentEntry?.step === "option") {
      window.history.back();
      return;
    }

    const categoryEntry = { step: "category" } as const;

    replaceOrderHistoryEntry(categoryEntry);
    restoreOrderHistoryEntry(categoryEntry);
  };

  const handleDirectServiceSelect = (service: ServiceItem) => {
    const optionEntry = {
      serviceId: service.id,
      step: "option",
    } as const;

    pushOrderHistoryEntry(optionEntry, service.id);
    restoreOrderHistoryEntry(optionEntry);
  };

  const handleCustomerInfoStart = (summary: OrderSelectionSummary) => {
    if (!selectedDirectService) return;

    const customerEntry = {
      serviceId: selectedDirectService.id,
      step: "customer",
      summary,
    } as const;

    pushOrderHistoryEntry(customerEntry, selectedDirectService.id);
    restoreOrderHistoryEntry(customerEntry);
  };

  const handleOptionBack = () => {
    const currentEntry = getOrderHistoryEntry(window.history.state);

    if (currentEntry?.step === "customer") {
      window.history.back();
      return;
    }

    if (!selectedDirectService) return;

    const optionEntry = {
      serviceId: selectedDirectService.id,
      step: "option",
    } as const;

    replaceOrderHistoryEntry(optionEntry, selectedDirectService.id);
    restoreOrderHistoryEntry(optionEntry);
  };

  const handlePaymentSubmit = async (payload: OrderPaymentSubmitPayload) => {
    if (paymentSubmissionInFlightRef.current) return;

    paymentSubmissionInFlightRef.current = true;
    setIsPaymentSubmitting(true);

    const releasePaymentSubmission = () => {
      paymentSubmissionInFlightRef.current = false;
      setIsPaymentSubmitting(false);
    };
    const payloadKey = getOrderCheckoutPayloadKey(payload);
    const checkoutRequest = checkoutRequestRef.current;
    const checkoutRequestId =
      checkoutRequest?.payloadKey === payloadKey
        ? checkoutRequest.requestId
        : crypto.randomUUID();

    checkoutRequestRef.current = {
      payloadKey,
      requestId: checkoutRequestId,
    };
    const result = await submitOrderPayment(payload, checkoutRequestId);

    if (result.status === "failure") {
      releasePaymentSubmission();
      window.alert(result.failureReason);
      return;
    }

    try {
      const { requestNicepayPayment } =
        await import("../../../lib/paymentCheckout");

      await requestNicepayPayment(result.checkout, (message) => {
        releasePaymentSubmission();
        window.alert(message);
      });
    } catch {
      releasePaymentSubmission();
      window.alert("결제를 진행하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const entry = getOrderHistoryEntry(event.state);

      if (entry) restoreOrderHistoryEntry(entry);
    };

    window.addEventListener("popstate", handlePopState);

    const existingEntry = getOrderHistoryEntry(window.history.state);

    if (existingEntry) {
      restoreOrderHistoryEntry(existingEntry);
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const initialService = getDirectServiceItemById(
        services,
        searchParams.get(orderServiceSearchParam),
      );
      const categoryEntry = { step: "category" } as const;

      replaceOrderHistoryEntry(categoryEntry);

      if (initialService) {
        const optionEntry = {
          serviceId: initialService.id,
          step: "option",
        } as const;

        pushOrderHistoryEntry(optionEntry, initialService.id);
        restoreOrderHistoryEntry(optionEntry);
      } else {
        restoreOrderHistoryEntry(categoryEntry);
      }
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [restoreOrderHistoryEntry, services]);

  useEffect(() => {
    if (!selectedDirectService) return;

    document.body.dataset.orderOptionActive = "true";

    return () => {
      delete document.body.dataset.orderOptionActive;
    };
  }, [selectedDirectService]);

  return (
    <div
      className={styles.orderPage}
      data-order-option-active={selectedDirectService ? "true" : undefined}
    >
      {selectedDirectService ? null : (
        <section className={styles.hero}>
          <Image
            alt="씨브레인 팀원들이 화이트보드 앞에서 디자인 컨셉과 레이아웃을 논의하는 기획 회의 장면"
            className={styles.heroBackground}
            fill
            priority
            sizes="100vw"
            src="/figma-assets/order-hero-background.jpg"
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.heroBadge}>주문·결제</p>
              <div className={styles.heroHeading}>
                <h1>
                  씨브레인 홍보물 제작
                  <br className={styles.heroTitleMobileBreak} />
                  <span className={styles.heroTitleDesktopSpace}> </span>
                  가격·주문 안내
                </h1>
                <div className={styles.heroDescription}>
                  <p>
                    브로슈어·카탈로그·리플렛·팜플렛·포스터·명함 등 모든 홍보물을
                    정찰제 투명한 가격으로 바로 주문하거나,
                  </p>
                  <p>
                    맞춤 견적 후 제작하실 수 있습니다. 기획 및 디자인부터
                    인쇄까지, 1:1 담당자 배정으로 처음부터 끝까지 함께합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <OrderFlowSection
        isPaymentSubmitting={isPaymentSubmitting}
        onCategoryReset={handleCategoryReset}
        onCustomerInfoStart={handleCustomerInfoStart}
        onDirectServiceSelect={handleDirectServiceSelect}
        onOptionBack={handleOptionBack}
        onPaymentSubmit={handlePaymentSubmit}
        orderStep={orderStep}
        selectedDirectProduct={selectedDirectProduct}
        selectedDirectService={selectedDirectService}
        selectedOrderSummary={selectedOrderSummary}
        services={services}
      />

      {orderStep === "category" ? (
        <CtaSection
          description="규격·수량·사양이 정해지지 않아도 괜찮습니다. 카카오톡으로 편하게 문의해 주세요."
          id="contact"
          secondaryAction={{ label: "FAQ 보기", href: "/faq" }}
          titleLines={["원하는 홍보물이 따로 있으신가요?"]}
        />
      ) : null}
    </div>
  );
}
