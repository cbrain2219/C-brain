"use client";

import { ButtonLink } from "@repo/ui/button";
import Link from "next/link";
import { type CSSProperties, useState } from "react";

import { Icon } from "../../components/Icon";
import { SectionLayout } from "../../components/SectionLayout";
import { OrderConsultDialog } from "../(site)/order/OrderConsultDialog";
import { KAKAO_CHANNEL_URL } from "../_content/contact";
import { getOrderDirectServiceHref } from "../_content/order";
import { fixedQuoteServices } from "../_content/quoteServices";
import type { ServiceItem } from "../_content/services";
import styles from "../page.module.css";

const textButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  height: 20,
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#30bac3",
  fontSize: 14,
  lineHeight: "20px",
};

const serviceButtonStyle: CSSProperties = {
  ...textButtonStyle,
  fontFamily: "var(--font-sans)",
  fontWeight: 500,
  letterSpacing: "-0.21px",
};

const quoteButtonStyle: CSSProperties = {
  ...serviceButtonStyle,
  color: "var(--landing-info-500)",
};

const consultButtonStyle: CSSProperties = {
  ...textButtonStyle,
  fontFamily: "var(--font-sans)",
  fontWeight: 500,
  lineHeight: "20px",
  letterSpacing: "-0.21px",
};

type ServicesSectionProps = {
  services: readonly ServiceItem[];
};

export function ServicesSection({ services }: ServicesSectionProps) {
  const [isConsultDialogOpen, setIsConsultDialogOpen] = useState(false);

  return (
    <>
      <SectionLayout
        badge="서비스"
        badgeClassName={styles.serviceKicker}
        description="투명한 정찰 견적으로 바로 주문하거나, 맞춤 견적 상담 후, 제작할 수 있습니다."
        descriptionClassName={styles.serviceDescription}
        id="services"
        innerClassName={styles.serviceInner}
        title="어떤 홍보물 제작이 필요하신가요?"
        titleClassName={styles.serviceTitle}
      >
        <div className={styles.serviceBody}>
          <div className={styles.serviceGrid}>
            {services.map((service) => (
              <Link
                aria-label={`${service.title} 정찰제 즉시결제 옵션 선택으로 이동`}
                className={styles.serviceCard}
                href={getOrderDirectServiceHref(service.id)}
                key={service.id}
              >
                <div className={styles.serviceContent}>
                  <span className={styles.serviceIcon}>
                    <Icon name={service.icon} size={24} />
                  </span>
                  <div className={styles.serviceCopy}>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                </div>
                <div className={styles.serviceMeta}>
                  <strong>{service.price}</strong>
                  <span style={serviceButtonStyle}>
                    정찰제 즉시결제
                    <Icon name="arrow-right" size={16} />
                  </span>
                </div>
              </Link>
            ))}

            {fixedQuoteServices.map((service) => (
              <button
                aria-label={`${service.title} 견적 후 주문 상담 팝업 열기`}
                className={`${styles.serviceCard} ${styles.serviceCardClickable}`}
                key={service.id}
                onClick={() => setIsConsultDialogOpen(true)}
                type="button"
              >
                <div className={styles.serviceContent}>
                  <span
                    className={`${styles.serviceIcon} ${styles.serviceQuoteIcon}`}
                  >
                    <Icon name={service.icon} size={24} />
                  </span>
                  <div className={styles.serviceCopy}>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                </div>
                <div
                  className={`${styles.serviceMeta} ${styles.serviceMetaQuote}`}
                >
                  <span style={quoteButtonStyle}>
                    견적 후 주문(카카오톡)
                    <Icon name="arrow-right" size={16} />
                  </span>
                </div>
              </button>
            ))}

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
          </div>

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
        </div>
      </SectionLayout>
      <OrderConsultDialog
        isOpen={isConsultDialogOpen}
        onClose={() => setIsConsultDialogOpen(false)}
      />
    </>
  );
}
