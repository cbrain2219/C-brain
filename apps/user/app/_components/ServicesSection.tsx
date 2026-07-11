import { Button } from "@repo/ui/button";
import type { CSSProperties } from "react";

import { Icon } from "../../components/Icon";
import styles from "../page.module.css";

const services = [
  {
    icon: "book-open",
    title: "브로슈어 · 카탈로그",
    description: "기업소개, 제품 카탈로그 등 핵심 홍보물. 기획부터 인쇄까지 원스톱",
    price: "160,000원 ~",
  },
  {
    icon: "file-text",
    title: "리플렛 · 팜플렛",
    description: "단면, 양면, 접지 등 다양한 형태의 소책자 및 안내물 제작",
    price: "160,000원 ~",
  },
  {
    icon: "megaphone",
    title: "포스터 · 전단지",
    description: "행사·이벤트·홍보용 포스터와 전단지. 빠른 납기 대응 가능.",
    price: "160,000원 ~",
  },
  {
    icon: "flag",
    title: "배너 · 족자 · 현수막",
    description: "박람회, 매장, 행사장용 대형 출력물. 설치·운송 상담 가능.",
    price: "160,000원 ~",
  },
  {
    icon: "credit-card",
    title: "명함 · 봉투",
    description: "소량 명함부터 기업용 봉투 · 레터헤드까지 정찰제 가격 제공.",
    price: "160,000원 ~",
  },
  {
    icon: "pen-tool",
    title: "로고",
    description: "브랜드의 첫인상을 결정하는 로고. 전략적 기획 + 감각적 디자인.",
    price: "160,000원 ~",
  },
  {
    icon: "package",
    title: "패키지 · 쇼핑백",
    description: "브랜드 아이덴티티를 담은 패키지 디자인 및 쇼핑백 제작.",
    price: "160,000원 ~",
  },
  {
    icon: "camera",
    title: "촬영",
    description: "제품·공간·인물 등 홍보물에 필요한 사진 촬영. 견적 후 진행.",
    price: "상담 후 견적",
  },
  {
    icon: "dots-horizontal",
    title: "기타",
    description:
      "다이어리·캘린더, 스티커, 초청장 등 기타 맞춤 홍보물 제작. 외 품목은 카카오톡 1:1 문의.",
    price: "상담 후 견적",
  },
] as const;

const textButtonStyle: CSSProperties = {
  height: 20,
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#30bac3",
  fontSize: 14,
};

export function ServicesSection() {
  return (
    <section className={styles.section} id="services">
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>서비스</p>
          <h2 className={styles.sectionTitle}>
            어떤 홍보물 제작이 필요하신가요?
          </h2>
          <p className={styles.sectionDescription}>
            투명한 정찰 견적으로 바로 주문하거나, 맞춤 견적 상담 후 제작할 수
            있습니다.
          </p>
        </div>

        <div className={styles.serviceGrid}>
          {services.map((service) => (
            <article className={styles.serviceCard} key={service.title}>
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
                <Button
                  rightIcon={<Icon name="arrow-right" size={14} />}
                  style={textButtonStyle}
                >
                  자세히 보기
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.consultBox}>
          <div>
            <h3>주문 전 상담이 필요하신가요?</h3>
            <p>카카오톡으로 1:1 상담이 가능합니다.</p>
          </div>
          <Button
            rightIcon={<Icon name="message-typing" size={16} />}
            style={textButtonStyle}
          >
            상담 문의
          </Button>
        </div>
      </div>
    </section>
  );
}
