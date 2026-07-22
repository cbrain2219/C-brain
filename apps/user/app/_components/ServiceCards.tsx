"use client";

import { Button } from "@repo/ui/button";
import { type CSSProperties, type KeyboardEvent } from "react";

import { Icon } from "../../components/Icon";
import { type ServiceItem, services } from "../_content/services";
import styles from "../page.module.css";

const textButtonStyle: CSSProperties = {
  height: 20,
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#30bac3",
  fontSize: 14,
};

const serviceButtonStyle: CSSProperties = {
  ...textButtonStyle,
  fontFamily: '"Pretendard GOV Variable", var(--font-sans)',
  letterSpacing: "-0.21px",
};

const quoteButtonStyle: CSSProperties = {
  ...serviceButtonStyle,
  color: "#43a0f5",
};

const consultButtonStyle: CSSProperties = {
  ...textButtonStyle,
  fontFamily: '"Pretendard GOV Variable", var(--font-sans)',
  fontWeight: 500,
  lineHeight: "20px",
  letterSpacing: "-0.21px",
};

type ServiceCardsProps = {
  onDirectServiceSelect?: (service: ServiceItem) => void;
  onQuoteServiceSelect?: (service: ServiceItem) => void;
  showConsultAction?: boolean;
};

export function ServiceCards({
  onDirectServiceSelect,
  onQuoteServiceSelect,
  showConsultAction = false,
}: ServiceCardsProps) {
  return (
    <>
      <div className={styles.serviceGrid}>
        {services.map((service) => {
          const cardClickHandler = service.isQuote
            ? onQuoteServiceSelect
              ? () => onQuoteServiceSelect(service)
              : undefined
            : onDirectServiceSelect
              ? () => onDirectServiceSelect(service)
              : undefined;
          const handleCardKeyDown = cardClickHandler
            ? (event: KeyboardEvent<HTMLElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  cardClickHandler();
                }
              }
            : undefined;

          return (
            <article
              className={`${styles.serviceCard} ${
                cardClickHandler ? styles.serviceCardClickable : ""
              }`}
              key={service.id}
              onClick={cardClickHandler}
              onKeyDown={handleCardKeyDown}
              role={cardClickHandler ? "button" : undefined}
              tabIndex={cardClickHandler ? 0 : undefined}
            >
              <div className={styles.serviceContent}>
                <span
                  className={`${styles.serviceIcon} ${
                    service.isQuote ? styles.serviceQuoteIcon : ""
                  }`}
                >
                  <Icon name={service.icon} size={24} />
                </span>
                <div className={styles.serviceCopy}>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </div>
              <div
                className={`${styles.serviceMeta} ${
                  service.isQuote ? styles.serviceMetaQuote : ""
                }`}
              >
                {service.isQuote ? null : <strong>{service.price}</strong>}
                <Button
                  onClick={
                    cardClickHandler
                      ? (event) => {
                          event.stopPropagation();
                          cardClickHandler();
                        }
                      : undefined
                  }
                  rightIcon={<Icon name="arrow-right" size={16} />}
                  style={
                    service.isQuote ? quoteButtonStyle : serviceButtonStyle
                  }
                >
                  {service.isQuote
                    ? "견적 후 주문(카카오톡)"
                    : "정찰제 즉시결제"}
                </Button>
              </div>
            </article>
          );
        })}

        {showConsultAction ? (
          <article className={styles.serviceConsultCard}>
            <div className={styles.serviceContent}>
              <span className={styles.serviceIcon}>
                <Icon name="message-typing" size={20} />
              </span>
              <div className={styles.serviceCopy}>
                <h3>주문 전 상담이 필요하신가요?</h3>
                <p>카카오톡으로 1:1 상담이 가능합니다.</p>
              </div>
            </div>
            <Button
              rightIcon={<Icon name="arrow-right" size={16} />}
              style={consultButtonStyle}
            >
              실시간 카톡상담
            </Button>
          </article>
        ) : null}
      </div>

      {showConsultAction ? (
        <div className={styles.consultBox}>
          <p className={styles.consultPrompt}>주문 전 상담이 필요하신가요?</p>
          <Button
            rightIcon={<Icon name="arrow-right" size={16} />}
            style={consultButtonStyle}
          >
            실시간 카톡상담
          </Button>
        </div>
      ) : null}
    </>
  );
}
