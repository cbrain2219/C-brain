import type { IconName } from "../../components/Icon";
import {
  type DirectOrderServiceId,
  formatOrderCurrency,
  orderProductRegistrations,
} from "./order";

export type ServiceItem = {
  description: string;
  icon: IconName;
  id: string;
  isQuote: boolean;
  price: string;
  title: string;
};

const serviceIcons = {
  "banner-display": "flag",
  "brochure-catalog": "book-open",
  "business-card-envelope": "credit-card",
  "leaflet-pamphlet": "file-text",
  logo: "pen-tool",
  "package-shopping-bag": "package",
  "poster-flyer": "megaphone",
} as const satisfies Record<keyof typeof orderProductRegistrations, IconName>;

const directOrderServiceIds = Object.keys(
  orderProductRegistrations,
) as DirectOrderServiceId[];

const quoteServiceIds = new Set<DirectOrderServiceId>([
  "package-shopping-bag",
]);

const directServices = directOrderServiceIds.map((serviceId) => {
  const product = orderProductRegistrations[serviceId];

  return {
    description: product.type,
    icon: serviceIcons[serviceId],
    id: product.id,
    isQuote: quoteServiceIds.has(serviceId),
    price: `${formatOrderCurrency(product.design_print_estimate)} ~`,
    title: product.name,
  };
}) satisfies ReadonlyArray<ServiceItem>;

export const services = [
  ...directServices,
  {
    id: "photo-shoot",
    icon: "camera",
    title: "촬영",
    description: "제품·공간·인물 등 홍보물에 필요한 사진 촬영.\n견적 후 진행.",
    isQuote: true,
    price: "상담 후 견적",
  },
  {
    id: "etc",
    icon: "dots-horizontal",
    title: "기타",
    description:
      "다이어리·캘린더, 스티커, 초청장 등 기타 맞춤 홍보물 제작. 외 품목은 카카오톡 1:1 문의.",
    isQuote: true,
    price: "상담 후 견적",
  },
] as const satisfies ReadonlyArray<ServiceItem>;

export function getDirectServiceItemById(
  serviceId: string | null | undefined,
): ServiceItem | undefined {
  if (!serviceId) {
    return undefined;
  }

  return services.find(
    (service) => service.id === serviceId && !service.isQuote,
  );
}
