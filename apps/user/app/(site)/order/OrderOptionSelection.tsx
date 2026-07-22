"use client";

import { useState } from "react";

import { Icon } from "../../../components/Icon";
import {
  type OrderOptionChoice,
  type OrderQuantityOption,
  type OrderSelectionSummary,
  formatOrderCurrency,
  getOrderOptionConfig,
} from "../../_content/order";
import type { ServiceItem } from "../../_content/services";
import styles from "./page.module.css";

type OrderOptionSelectionProps = {
  onConsult: () => void;
  onPaymentStart: (summary: OrderSelectionSummary) => void;
  service: ServiceItem;
};

const findSelectedChoice = (
  choices: ReadonlyArray<OrderOptionChoice>,
  selectedId: string,
) => {
  const fallbackChoice = choices[0];

  if (!fallbackChoice) {
    throw new Error("Order option choices need at least one item.");
  }

  return choices.find((choice) => choice.id === selectedId) ?? fallbackChoice;
};

const findSelectedQuantity = (
  quantities: ReadonlyArray<OrderQuantityOption>,
  selectedId: string,
) => {
  const fallbackQuantity = quantities[0];

  if (!fallbackQuantity) {
    throw new Error("Order quantity options need at least one item.");
  }

  return (
    quantities.find((quantity) => quantity.id === selectedId) ??
    fallbackQuantity
  );
};

export function OrderOptionSelection({
  onConsult,
  onPaymentStart,
  service,
}: OrderOptionSelectionProps) {
  const optionConfig = getOrderOptionConfig(service.id);
  const [selectedPageId, setSelectedPageId] = useState(
    optionConfig.defaultPageId,
  );
  const [selectedPaperId, setSelectedPaperId] = useState(
    optionConfig.defaultPaperId,
  );
  const [selectedQuantityId, setSelectedQuantityId] = useState(
    optionConfig.defaultQuantityId,
  );
  const [hasPlanning, setHasPlanning] = useState(false);

  const selectedPage = findSelectedChoice(
    optionConfig.pageOptions,
    selectedPageId,
  );
  const selectedPaper = findSelectedChoice(
    optionConfig.paperOptions,
    selectedPaperId,
  );
  const selectedQuantity = findSelectedQuantity(
    optionConfig.quantityOptions,
    selectedQuantityId,
  );
  const planningFee = hasPlanning ? optionConfig.planningService.fee : 0;
  const totalPrice = selectedQuantity.total + planningFee;
  const selectedServiceLabel = hasPlanning
    ? `${optionConfig.selectedService.title} + ${optionConfig.planningService.title}`
    : optionConfig.selectedService.title;
  const priceRows = [
    { label: "디자인비", value: optionConfig.selectedService.fee },
    ...(hasPlanning
      ? [{ label: "기획비", value: optionConfig.planningService.fee }]
      : []),
    ...(selectedQuantity.printFee > 0
      ? [
          {
            label: `인쇄비 (${selectedQuantity.quantity})`,
            value: selectedQuantity.printFee,
          },
        ]
      : []),
  ];
  const selectedSummary: OrderSelectionSummary = {
    pageLabel: selectedPage.label,
    paperLabel: selectedPaper.label,
    priceRows,
    quantityLabel: selectedQuantity.quantity,
    serviceLabel: selectedServiceLabel,
    totalPrice,
  };
  const handlePaymentStart = () => {
    onPaymentStart(selectedSummary);
  };

  return (
    <>
      <div className={styles.optionLayout}>
        <div className={styles.optionMain}>
          <section
            className={styles.optionSection}
            aria-labelledby="service-option-title"
          >
            <div className={styles.optionSectionHeader}>
              <h3 id="service-option-title">II. 서비스 선택</h3>
              <p>
                디자인+인쇄가 기본 포함됩니다. 기획이 필요하신 경우 추가
                선택하세요.
              </p>
            </div>

            <div className={styles.optionServiceGrid}>
              <article
                className={`${styles.optionServiceCard} ${styles.optionServiceCardActive}`}
              >
                <span
                  className={`${styles.optionServiceBadge} ${styles.optionServiceBadgeBrand}`}
                >
                  {optionConfig.selectedService.badge}
                </span>
                <div className={styles.optionServiceCopy}>
                  <h4>{optionConfig.selectedService.title}</h4>
                  <p>{optionConfig.selectedService.description}</p>
                </div>
                <div className={styles.optionServiceMeta}>
                  <strong>{optionConfig.selectedService.priceLabel}</strong>
                  <span>{optionConfig.selectedService.note}</span>
                </div>
              </article>

              <button
                aria-pressed={hasPlanning}
                className={`${styles.optionServiceCard} ${styles.optionServiceCardButton} ${
                  hasPlanning ? styles.optionServiceCardSelectedExtra : ""
                }`}
                onClick={() => setHasPlanning((current) => !current)}
                type="button"
              >
                <span
                  className={`${styles.optionServiceBadge} ${styles.optionServiceBadgeInfo}`}
                >
                  {optionConfig.planningService.badge}
                </span>
                <span className={styles.optionServiceCopy}>
                  <span className={styles.optionServiceTitle}>
                    {optionConfig.planningService.title}
                  </span>
                  <span className={styles.optionServiceDescription}>
                    {optionConfig.planningService.description}
                  </span>
                </span>
                <span className={styles.optionServiceMeta}>
                  <strong>{optionConfig.planningService.priceLabel}</strong>
                  <span>{optionConfig.planningService.note}</span>
                </span>
              </button>
            </div>
          </section>

          <section
            className={styles.optionSection}
            aria-labelledby="page-option-title"
          >
            <h3 id="page-option-title">{optionConfig.pageSectionTitle}</h3>
            <div className={styles.optionChoiceGroup}>
              {optionConfig.pageOptions.map((pageOption) => (
                <button
                  className={`${styles.optionChoiceButton} ${
                    selectedPageId === pageOption.id
                      ? styles.optionChoiceButtonActive
                      : ""
                  }`}
                  key={pageOption.id}
                  onClick={() => setSelectedPageId(pageOption.id)}
                  type="button"
                >
                  {pageOption.label}
                </button>
              ))}
            </div>
          </section>

          <section
            className={styles.optionSection}
            aria-labelledby="paper-option-title"
          >
            <h3 id="paper-option-title">{optionConfig.paperSectionTitle}</h3>
            <div className={styles.optionChoiceGroup}>
              {optionConfig.paperOptions.map((paperOption) => (
                <button
                  className={`${styles.optionChoiceButton} ${styles.optionChoiceButtonWide} ${
                    selectedPaperId === paperOption.id
                      ? styles.optionChoiceButtonActive
                      : ""
                  }`}
                  key={paperOption.id}
                  onClick={() => setSelectedPaperId(paperOption.id)}
                  type="button"
                >
                  {paperOption.label}
                </button>
              ))}
            </div>
          </section>

          <section
            className={styles.optionSection}
            aria-labelledby="quantity-option-title"
          >
            <h3 id="quantity-option-title">V. 수량 선택</h3>
            <div className={styles.quantityTable} role="table">
              <div className={styles.quantityTableHeader} role="row">
                <span role="columnheader">선택</span>
                <span role="columnheader">수량</span>
                <span role="columnheader">인쇄 단가</span>
                <span role="columnheader">합계</span>
              </div>
              <div className={styles.quantityTableBody}>
                {optionConfig.quantityOptions.map((quantityOption) => {
                  const isSelected = selectedQuantityId === quantityOption.id;

                  return (
                    <button
                      className={styles.quantityRow}
                      key={quantityOption.id}
                      onClick={() => setSelectedQuantityId(quantityOption.id)}
                      role="row"
                      type="button"
                    >
                      <span
                        className={`${styles.quantitySelectBadge} ${
                          isSelected ? styles.quantitySelectBadgeActive : ""
                        }`}
                        role="cell"
                      >
                        {isSelected ? "선택됨" : "선택"}
                      </span>
                      <span role="cell">{quantityOption.quantity}</span>
                      <span className={styles.quantityUnitPrice} role="cell">
                        {quantityOption.unitPrice}
                      </span>
                      <strong role="cell">
                        {formatOrderCurrency(
                          quantityOption.total + planningFee,
                        )}
                      </strong>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        <aside
          className={styles.orderSummary}
          aria-labelledby="order-summary-title"
        >
          <h3 id="order-summary-title">주문 요약</h3>
          <dl className={styles.summaryList}>
            <div>
              <dt>서비스</dt>
              <dd>{selectedServiceLabel}</dd>
            </div>
            <div>
              <dt>용지</dt>
              <dd>{selectedPaper.label}</dd>
            </div>
            <div>
              <dt>페이지 수</dt>
              <dd>{selectedPage.label}</dd>
            </div>
            <div>
              <dt>수량</dt>
              <dd>{selectedQuantity.quantity}</dd>
            </div>
          </dl>
          <dl className={styles.summaryList}>
            {priceRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{formatOrderCurrency(row.value)}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.summaryTotal}>
            <span>합계</span>
            <strong>{formatOrderCurrency(totalPrice)}</strong>
          </div>
          <div className={styles.summaryActions}>
            <button
              className={styles.paymentButton}
              onClick={handlePaymentStart}
              type="button"
            >
              <span>결제하기</span>
              <Icon name="arrow-right" size={16} />
            </button>
            <p>
              결제 전 상담이 필요하신가요?
              <button onClick={onConsult} type="button">
                카카오톡 1:1 상담
                <Icon name="arrow-right" size={16} />
              </button>
            </p>
          </div>
        </aside>
      </div>

      <div className={styles.mobilePaymentBar}>
        <button
          className={styles.paymentButton}
          onClick={handlePaymentStart}
          type="button"
        >
          <span>{formatOrderCurrency(totalPrice)} 결제하기</span>
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </>
  );
}
