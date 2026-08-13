"use client";

import type { OrderProductCatalogItem } from "@repo/supabase/product-catalog";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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

  const handleCategoryReset = () => {
    setOrderStep("category");
    setSelectedDirectService(null);
    setSelectedOrderSummary(null);
  };

  const handleDirectServiceSelect = (service: ServiceItem) => {
    setSelectedDirectService(service);
    setSelectedOrderSummary(null);
    setOrderStep("option");
  };

  const handleCustomerInfoStart = (summary: OrderSelectionSummary) => {
    setSelectedOrderSummary(summary);
    setOrderStep("customer");
  };

  const handleOptionBack = () => {
    setOrderStep("option");
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
    const searchParams = new URLSearchParams(window.location.search);
    const initialService = getDirectServiceItemById(
      services,
      searchParams.get(orderServiceSearchParam),
    );

    if (!initialService) return;

    setSelectedDirectService(initialService);
    setSelectedOrderSummary(null);
    setOrderStep("option");
  }, [services]);

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
