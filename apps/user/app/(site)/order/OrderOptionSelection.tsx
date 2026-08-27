"use client";

import {
  calculateProductSelection,
  createDefaultProductSelection,
  formatProductOptionValue,
  getProductPriceRows,
} from "@repo/supabase/product-catalog";
import type {
  OrderProductCatalogItem,
  OrderProductOptionSection,
  OrderProductSelection,
  OrderProductVariant,
} from "@repo/supabase/product-catalog";
import type { ProductOptionSectionKey } from "@repo/supabase/product-configuration";
import { useState } from "react";

import { Icon } from "../../../components/Icon";
import {
  type OrderSelectionSummary,
  formatOrderCurrency,
  formatOrderUnitPrice,
} from "../../_content/order";
import type { ServiceItem } from "../../_content/services";
import styles from "./page.module.css";

type OrderOptionSelectionProps = {
  onConsult: () => void;
  onPaymentStart: (summary: OrderSelectionSummary) => void;
  product: OrderProductCatalogItem;
  service: ServiceItem;
};

const sectionNumbers = ["II", "III", "IV", "V", "VI", "VII", "VIII"];

function requireFirstVariant(product: OrderProductCatalogItem) {
  const variant = product.variants[0];

  if (!variant) throw new Error(`Product ${product.id} has no order variant.`);

  return variant;
}

function requireDefaultSelection(variant: OrderProductVariant) {
  const selection = createDefaultProductSelection(variant);

  if (!selection) {
    throw new Error(`Product variant ${variant.id} has no valid selection.`);
  }

  return selection;
}

function formatSectionHeading(index: number, label: string) {
  const number = sectionNumbers[index];

  return number ? `${number}. ${label}` : label;
}

function createSelectionWithOptions(
  variant: OrderProductVariant,
  selection: OrderProductSelection,
  optionValues: OrderProductSelection["optionValues"],
) {
  const priceRows = getProductPriceRows(variant, optionValues);
  const quantity = variant.quantitySection
    ? (priceRows.some((row) => row.quantity === selection.quantity)
        ? selection.quantity
        : (priceRows[0]?.quantity ?? null))
    : null;
  const nextSelection = { ...selection, optionValues, quantity };

  return calculateProductSelection(variant, nextSelection)
    ? nextSelection
    : null;
}

function isOptionAvailable(
  variant: OrderProductVariant,
  selection: OrderProductSelection,
  optionKey: ProductOptionSectionKey,
  value: string,
) {
  return Boolean(
    createSelectionWithOptions(variant, selection, {
      ...selection.optionValues,
      [optionKey]: value,
    }),
  );
}

function OptionSection({
  index,
  onSelect,
  section,
  selectedValue,
  selection,
  variant,
}: {
  index: number;
  onSelect: (selection: OrderProductSelection) => void;
  section: OrderProductOptionSection;
  selectedValue: string;
  selection: OrderProductSelection;
  variant: OrderProductVariant;
}) {
  const titleId = `order-option-${section.key}`;

  return (
    <section className={styles.optionSection} aria-labelledby={titleId}>
      <h3 id={titleId}>{formatSectionHeading(index, section.label)}</h3>
      <div className={styles.optionChoiceGroup}>
        {section.values.map((value) => {
          const nextSelection = createSelectionWithOptions(variant, selection, {
            ...selection.optionValues,
            [section.key]: value,
          });
          const isAvailable = isOptionAvailable(
            variant,
            selection,
            section.key,
            value,
          );

          return (
            <button
              aria-pressed={selectedValue === value}
              className={`${styles.optionChoiceButton} ${
                selectedValue === value ? styles.optionChoiceButtonActive : ""
              }`}
              disabled={!isAvailable || !nextSelection}
              key={value}
              onClick={() => nextSelection && onSelect(nextSelection)}
              type="button"
            >
              {formatProductOptionValue(section, value)}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function OrderOptionSelection({
  onConsult,
  onPaymentStart,
  product,
  service,
}: OrderOptionSelectionProps) {
  const firstVariant = requireFirstVariant(product);
  const [selectedVariantId, setSelectedVariantId] = useState(firstVariant.id);
  const [selection, setSelection] = useState(() =>
    requireDefaultSelection(firstVariant),
  );
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    firstVariant;
  const hasProductTypeSelection = product.variants.length > 1;
  const sectionNumberOffset = Number(hasProductTypeSelection);
  const calculation = calculateProductSelection(selectedVariant, selection);

  if (!calculation) {
    throw new Error(`Product variant ${selectedVariant.id} selection is invalid.`);
  }

  const quantityRows = getProductPriceRows(
    selectedVariant,
    selection.optionValues,
  );
  const selectedServiceLabel = selection.hasPlanning
    ? "디자인 + 인쇄 + 기획"
    : "디자인 + 인쇄";
  const optionRows = [
    ...(hasProductTypeSelection
      ? [{ label: "상품 종류", value: selectedVariant.id }]
      : []),
    ...calculation.optionRows,
    ...(calculation.quantityLabel
      ? [{ label: "수량", value: calculation.quantityLabel }]
      : []),
  ];
  const selectedSummary: OrderSelectionSummary = {
    categoryLabel: service.title,
    ids: {
      hasPlanning: selection.hasPlanning,
      optionValues: selection.optionValues,
      productId: product.id,
      quantity: selection.quantity,
      quotedTotal: calculation.totalPrice,
      serviceId: service.id,
      variant: selectedVariant.id,
    },
    optionRows,
    priceRows: calculation.priceRows,
    serviceLabel: selectedServiceLabel,
    totalPrice: calculation.totalPrice,
  };

  const selectVariant = (variant: OrderProductVariant) => {
    setSelectedVariantId(variant.id);
    setSelection(requireDefaultSelection(variant));
  };

  const togglePlanning = () => {
    const nextSelection = {
      ...selection,
      hasPlanning: !selection.hasPlanning,
    };

    if (calculateProductSelection(selectedVariant, nextSelection)) {
      setSelection(nextSelection);
    }
  };

  return (
    <>
      <div className={styles.optionLayout}>
        <div className={styles.optionMain}>
          {hasProductTypeSelection ? (
            <section
              className={styles.optionSection}
              aria-labelledby="variant-option-title"
            >
              <h3 id="variant-option-title">I. 상품종류</h3>
              <div className={styles.optionChoiceGroup}>
                {product.variants.map((variant) => (
                  <button
                    aria-pressed={selectedVariant.id === variant.id}
                    className={`${styles.optionChoiceButton} ${
                      selectedVariant.id === variant.id
                        ? styles.optionChoiceButtonActive
                        : ""
                    }`}
                    key={variant.id}
                    onClick={() => selectVariant(variant)}
                    type="button"
                  >
                    {variant.id}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section
            className={styles.optionSection}
            aria-labelledby="service-option-title"
          >
            <div className={styles.optionSectionHeader}>
              <h3 id="service-option-title">
                {hasProductTypeSelection
                  ? "II. 서비스 선택"
                  : "I. 서비스 선택"}
              </h3>
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
                  기본 포함
                </span>
                <div className={styles.optionServiceCopy}>
                  <h4>디자인 + 인쇄</h4>
                  <p>편집 디자인·후가공·인쇄 원스톱 진행</p>
                </div>
                <div className={styles.optionServiceMeta}>
                  <strong>
                    {formatOrderCurrency(calculation.designPrintEstimate)} /{" "}
                    {selectedVariant.estimateUnit}
                  </strong>
                  <span>선택한 옵션 기준 · 합계에 포함</span>
                </div>
              </article>

              {selectedVariant.showPlanningEstimate &&
              calculation.planningEstimate !== null ? (
                <button
                  aria-pressed={selection.hasPlanning}
                  className={`${styles.optionServiceCard} ${styles.optionServiceCardButton} ${
                    selection.hasPlanning
                      ? styles.optionServiceCardSelectedExtra
                      : ""
                  }`}
                  onClick={togglePlanning}
                  type="button"
                >
                  <span
                    className={`${styles.optionServiceBadge} ${styles.optionServiceBadgeInfo}`}
                  >
                    + 선택 추가
                  </span>
                  <span className={styles.optionServiceCopy}>
                    <span className={styles.optionServiceTitle}>기획</span>
                    <span className={styles.optionServiceDescription}>
                      컨셉 방향·구성안·카피라이팅
                    </span>
                  </span>
                  <span className={styles.optionServiceMeta}>
                    <strong>
                      +{formatOrderCurrency(calculation.planningEstimate)} /{" "}
                      {selectedVariant.estimateUnit}
                    </strong>
                    <span>선택한 옵션 수에 따라 반영</span>
                  </span>
                </button>
              ) : null}
            </div>
          </section>

          {selectedVariant.optionSections.map((section, index) => (
            <OptionSection
              index={index + sectionNumberOffset}
              key={section.key}
              onSelect={setSelection}
              section={section}
              selectedValue={selection.optionValues[section.key] ?? ""}
              selection={selection}
              variant={selectedVariant}
            />
          ))}

          {selectedVariant.quantitySection ? (
            <section
              className={styles.optionSection}
              aria-labelledby="quantity-option-title"
            >
              <h3 id="quantity-option-title">
                {formatSectionHeading(
                  selectedVariant.optionSections.length + sectionNumberOffset,
                  selectedVariant.quantitySection.label,
                )}
              </h3>
              <div className={styles.quantityTableScroll}>
                <div className={styles.quantityTable} role="table">
                  <div className={styles.quantityTableHeader} role="row">
                    <span role="columnheader">선택</span>
                    <span role="columnheader">수량</span>
                    <span role="columnheader">인쇄단가</span>
                    <span role="columnheader">합계</span>
                  </div>
                  <div className={styles.quantityTableBody}>
                    {quantityRows.map((quantityRow) => {
                      const rowSelection = {
                        ...selection,
                        quantity: quantityRow.quantity,
                      };
                      const rowCalculation = calculateProductSelection(
                        selectedVariant,
                        rowSelection,
                      );
                      const isSelected =
                        selection.quantity === quantityRow.quantity;

                      if (!rowCalculation) return null;

                      return (
                        <button
                          aria-pressed={isSelected}
                          className={styles.quantityRow}
                          key={quantityRow.quantity}
                          onClick={() => setSelection(rowSelection)}
                          role="row"
                          type="button"
                        >
                          <span
                            className={`${styles.quantitySelectBadge} ${
                              isSelected
                                ? styles.quantitySelectBadgeActive
                                : ""
                            }`}
                            role="cell"
                          >
                            {isSelected ? "선택됨" : "선택"}
                          </span>
                          <span role="cell">
                            {rowCalculation.quantityLabel}
                          </span>
                          <span
                            className={styles.quantityUnitPrice}
                            role="cell"
                          >
                            {formatOrderUnitPrice(quantityRow.unitPrice)}
                          </span>
                          <strong role="cell">
                            {formatOrderCurrency(rowCalculation.printAmount)}
                          </strong>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <aside
          className={styles.orderSummary}
          aria-labelledby="order-summary-title"
        >
          <h3 id="order-summary-title">주문 요약</h3>
          <dl className={styles.summaryList}>
            <div>
              <dt>카테고리</dt>
              <dd>{service.title}</dd>
            </div>
            <div>
              <dt>서비스</dt>
              <dd>{selectedServiceLabel}</dd>
            </div>
            {optionRows.map((row) => (
              <div key={`${row.label}-${row.value}`}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <dl className={styles.summaryList}>
            {calculation.priceRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{formatOrderCurrency(row.value)}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.summaryTotal}>
            <span>합계</span>
            <strong>{formatOrderCurrency(calculation.totalPrice)}</strong>
          </div>
          <div className={styles.summaryActions}>
            <button
              className={styles.paymentButton}
              onClick={() => onPaymentStart(selectedSummary)}
              type="button"
            >
              <span>결제하기</span>
              <Icon name="arrow-right" size={16} />
            </button>
            <p>
              <span className={styles.summaryConsultLead}>
                결제 전 상담이 필요하신가요?
              </span>
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
          onClick={() => onPaymentStart(selectedSummary)}
          type="button"
        >
          <span>{formatOrderCurrency(calculation.totalPrice)} 결제하기</span>
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </>
  );
}
