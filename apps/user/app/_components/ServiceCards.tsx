"use client";

import { ButtonLink } from "@repo/ui/button";
import { type CSSProperties } from "react";

import { Icon } from "../../components/Icon";
import { KAKAO_CHANNEL_URL } from "../_content/contact";
import {
  fixedQuoteServices,
  type FixedQuoteService,
} from "../_content/quoteServices";
import type { ServiceItem } from "../_content/services";
import styles from "../page.module.css";

const textButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  color: "#30bac3",
  fontSize: 14,
  lineHeight: "20px",
};

const serviceButtonStyle: CSSProperties = {
  ...textButtonStyle,
  fontFamily: "var(--font-sans)",
  letterSpacing: "-0.21px",
};

const quoteButtonStyle: CSSProperties = {
  ...serviceButtonStyle,
  color: "#43a0f5",
};

const consultButtonStyle: CSSProperties = {
  ...textButtonStyle,
  fontFamily: "var(--font-sans)",
  fontWeight: 500,
  lineHeight: "20px",
  letterSpacing: "-0.21px",
};

type ServiceCardsProps = {
  onDirectServiceSelect?: (service: ServiceItem) => void;
  onQuoteServiceSelect?: (service: FixedQuoteService) => void;
  showConsultAction?: boolean;
  services: readonly ServiceItem[];
};

export function ServiceCards({
  onDirectServiceSelect,
  onQuoteServiceSelect,
  services,
  showConsultAction = false,
}: ServiceCardsProps) {
  const serviceCards: readonly (ServiceItem | FixedQuoteService)[] = [
    ...services,
    ...fixedQuoteServices,
  ];

  return (
    <>
      <div className={styles.serviceGrid}>
        {serviceCards.map((service) => {
          const cardClickHandler = service.isQuote
            ? onQuoteServiceSelect
              ? () => onQuoteServiceSelect(service)
              : undefined
            : onDirectServiceSelect
              ? () => onDirectServiceSelect(service)
              : undefined;

          return (
            <button
              className={`${styles.serviceCard} ${
                cardClickHandler ? styles.serviceCardClickable : ""
              }`}
              disabled={!cardClickHandler}
              key={service.id}
              onClick={cardClickHandler}
              type="button"
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
                <span
                  style={
                    service.isQuote ? quoteButtonStyle : serviceButtonStyle
                  }
                >
                  {service.isQuote
                    ? "견적 후 주문(카카오톡)"
                    : "정찰제 즉시결제"}
                  <Icon name="arrow-right" size={16} />
                </span>
              </div>
            </button>
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
            <ButtonLink
              href={KAKAO_CHANNEL_URL}
              rel="noreferrer"
              rightIcon={<Icon name="arrow-right" size={16} />}
              style={consultButtonStyle}
              target="_blank"
            >
              실시간 카톡상담
            </ButtonLink>
          </article>
        ) : null}
      </div>

      {showConsultAction ? (
        <div className={styles.consultBox}>
          <p className={styles.consultPrompt}>주문 전 상담이 필요하신가요?</p>
          <ButtonLink
            href={KAKAO_CHANNEL_URL}
            rel="noreferrer"
            rightIcon={<Icon name="arrow-right" size={16} />}
            style={consultButtonStyle}
            target="_blank"
          >
            실시간 카톡상담
          </ButtonLink>
        </div>
      ) : null}
    </>
  );
}
