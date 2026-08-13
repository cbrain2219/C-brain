import type { OrderProductCatalogItem } from "@repo/supabase/product-catalog";
import type { ProductCategoryId } from "@repo/supabase/categories";

import type { IconName } from "../../components/Icon";
import { formatOrderCurrency } from "./order";

export type ServiceItem = {
  description: string;
  icon: IconName;
  id: ProductCategoryId;
  isQuote: boolean;
  price: string;
  productId: string;
  title: string;
};

const servicePresentation = {
  "banner-display": {
    description:
      "박람회, 매장, 행사장용 대형 출력물. 설치·운송 상담 가능.",
    icon: "flag",
  },
  "brochure-catalog": {
    description:
      "기업소개, 제품 카탈로그 등 핵심 홍보물. 기획부터 인쇄까지 원스톱",
    icon: "book-open",
  },
  "business-card-envelope": {
    description:
      "소량 명함부터 기업용 봉투 · 레터헤드까지 정찰제 가격 제공.",
    icon: "credit-card",
  },
  "leaflet-pamphlet": {
    description: "단면, 양면, 접지 등 다양한 형태의 소책자 및 안내물 제작",
    icon: "file-text",
  },
  logo: {
    description:
      "브랜드의 첫인상을 결정하는 로고. 전략적 기획 + 감각적 디자인.",
    icon: "pen-tool",
  },
  "poster-flyer": {
    description:
      "행사·이벤트·홍보용 포스터와 전단지. 빠른 납기 대응 가능.",
    icon: "megaphone",
  },
} as const satisfies Record<
  ProductCategoryId,
  { description: string; icon: IconName }
>;

export function createServiceItems(
  products: readonly OrderProductCatalogItem[],
): readonly ServiceItem[] {
  return products.map((product) => {
    const presentation = servicePresentation[product.categoryId];

    return {
      description: presentation.description,
      icon: presentation.icon,
      id: product.categoryId,
      isQuote: false,
      price: `${formatOrderCurrency(product.startingPrice)} ~`,
      productId: product.id,
      title: product.productType,
    };
  });
}

export function getDirectServiceItemById(
  services: readonly ServiceItem[],
  serviceId: string | null | undefined,
): ServiceItem | undefined {
  if (!serviceId) return undefined;

  return services.find(
    (service) => service.id === serviceId && !service.isQuote,
  );
}
