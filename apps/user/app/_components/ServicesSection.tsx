import { Button } from "@repo/ui/button";
import {
  getLowestProductUnitPrice,
  listPublishedProducts,
} from "@repo/supabase";
import type { PublicProduct } from "@repo/supabase";
import { type CSSProperties } from "react";

import { Icon } from "../../components/Icon";
import type { IconName } from "../../components/Icon";
import { SectionLayout } from "../../components/SectionLayout";
import { createUserSupabaseClient } from "../../lib/supabase";
import styles from "../page.module.css";

type ServiceCard = {
  description: string;
  icon: IconName;
  id?: string;
  isQuote: boolean;
  price: string;
  title: string;
};

const fallbackServices: readonly ServiceCard[] = [
  {
    icon: "book-open",
    title: "브로슈어 · 카탈로그",
    description:
      "기업소개, 제품 카탈로그 등 핵심 홍보물.\n기획부터 인쇄까지 원스톱",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    icon: "file-text",
    title: "리플렛 · 팜플렛",
    description: "단면, 양면, 접지 등 다양한 형태의 소책자 및 안내물 제작",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    icon: "megaphone",
    title: "포스터 · 전단지",
    description: "행사·이벤트·홍보용 포스터와 전단지. 빠른 납기 대응 가능.",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    icon: "flag",
    title: "배너 · 족자 · 현수막",
    description: "박람회, 매장, 행사장용 대형 출력물. 설치·운송 상담 가능.",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    icon: "credit-card",
    title: "명함 · 봉투",
    description: "소량 명함부터 기업용 봉투 · 레터헤드까지 정찰제 가격 제공.",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    icon: "pen-tool",
    title: "로고",
    description:
      "브랜드의 첫인상을 결정하는 로고. 전략적 기획 + 감각적 디자인.",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    icon: "package",
    title: "패키지 · 쇼핑백",
    description: "브랜드 아이덴티티를 담은 패키지 디자인 및 쇼핑백 제작.",
    isQuote: false,
    price: "160,000원 ~",
  },
  {
    icon: "camera",
    title: "촬영",
    description: "제품·공간·인물 등 홍보물에 필요한 사진 촬영.\n견적 후 진행.",
    isQuote: true,
    price: "상담 후 견적",
  },
  {
    icon: "dots-horizontal",
    title: "기타",
    description:
      "다이어리·캘린더, 스티커, 초청장 등 기타 맞춤 홍보물 제작. 외 품목은 카카오톡 1:1 문의.",
    isQuote: true,
    price: "상담 후 견적",
  },
];

const priceFormatter = new Intl.NumberFormat("ko-KR");

function toServiceCard(product: PublicProduct): ServiceCard {
  const lowestPrice = getLowestProductUnitPrice(product.unit_prices);

  return {
    description: product.type,
    icon: "package",
    id: product.id,
    isQuote: lowestPrice === null,
    price:
      lowestPrice === null
        ? "상담 후 견적"
        : `${priceFormatter.format(lowestPrice)}원 ~`,
    title: product.name,
  };
}

async function loadLandingServices() {
  const client = await createUserSupabaseClient();

  if (!client) return undefined;

  try {
    return await listPublishedProducts(client);
  } catch (error) {
    console.error("Failed to load published products.", error);
    return [];
  }
}

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

export async function ServicesSection() {
  const products = await loadLandingServices();
  const services =
    products === undefined ? fallbackServices : products.map(toServiceCard);

  return (
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
            <article
              className={styles.serviceCard}
              key={service.id ?? service.title}
            >
              <div className={styles.serviceContent}>
                <span
                  className={`${styles.serviceIcon} ${service.isQuote ? styles.serviceQuoteIcon : ""}`}
                >
                  <Icon name={service.icon} size={24} />
                </span>
                <div className={styles.serviceCopy}>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </div>
              <div
                className={`${styles.serviceMeta} ${service.isQuote ? styles.serviceMetaQuote : ""}`}
              >
                {service.isQuote ? null : <strong>{service.price}</strong>}
                <Button
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
            <Button
              rightIcon={<Icon name="arrow-right" size={16} />}
              style={consultButtonStyle}
            >
              실시간 카톡상담
            </Button>
          </article>
        </div>

        <div className={styles.consultBox}>
          <p className={styles.consultPrompt}>주문 전 상담이 필요하신가요?</p>
          <Button
            rightIcon={<Icon name="arrow-right" size={16} />}
            style={consultButtonStyle}
          >
            실시간 카톡상담
          </Button>
        </div>
      </div>
    </SectionLayout>
  );
}
