"use client";

import { useState } from "react";

import { orderMethods } from "../../_content/order";
import styles from "./page.module.css";

type OrderMethodId = (typeof orderMethods)[number]["id"];
type OrderMethodSelectorProps = {
  onQuoteSelect?: () => void;
};

const defaultSelectedMethodId =
  orderMethods.find((method) => method.state === "active")?.id ??
  orderMethods[0].id;

export function OrderMethodSelector({
  onQuoteSelect,
}: OrderMethodSelectorProps) {
  const [selectedMethodId, setSelectedMethodId] = useState<OrderMethodId>(
    defaultSelectedMethodId,
  );

  return (
    <div className={styles.methodGrid}>
      {orderMethods.map((method) => {
        const isSelected = selectedMethodId === method.id;
        const activeClassName =
          method.tone === "quote"
            ? styles.methodCardActiveQuote
            : styles.methodCardActiveBrand;
        const handleMethodClick = () => {
          if (method.tone === "quote") {
            onQuoteSelect?.();
            return;
          }

          setSelectedMethodId(method.id);
        };

        return (
          <button
            aria-pressed={isSelected}
            className={`${styles.methodCard} ${
              isSelected ? activeClassName : ""
            }`}
            key={method.id}
            onClick={handleMethodClick}
            type="button"
          >
            <span
              className={`${styles.methodLabel} ${
                method.tone === "quote"
                  ? styles.methodLabelQuote
                  : styles.methodLabelBrand
              }`}
            >
              {method.label}
            </span>
            <span className={styles.methodCopy}>
              <span className={styles.methodTitle}>{method.title}</span>
              <span className={styles.methodDescription}>
                {method.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
