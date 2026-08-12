import { productCategories } from "@repo/supabase/categories";
import type { ProductCategoryId } from "@repo/supabase/categories";

import type { IconName } from "../../components/Icon";
import { formatOrderCurrency, orderProductRegistrations } from "./order";

export type ServiceItem = {
  description: string;
  icon: IconName;
  id: ProductCategoryId;
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
  "poster-flyer": "megaphone",
} as const satisfies Record<ProductCategoryId, IconName>;

export const services = productCategories.map((category) => {
  const product = orderProductRegistrations[category.id];

  return {
    description: product.type,
    icon: serviceIcons[category.id],
    id: category.id,
    isQuote: false,
    price: `${formatOrderCurrency(product.design_print_estimate)} ~`,
    title: category.label,
  };
}) satisfies ReadonlyArray<ServiceItem>;

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
