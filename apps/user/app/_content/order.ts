import type { ProductCategoryId } from "@repo/supabase/categories";
import type {
  ProductOptionSectionKey,
  ProductVariant,
} from "@repo/supabase/product-configuration";

type OrderStepState = "active" | "inactive";
type OrderMethodTone = "brand" | "quote";

export type OrderStepId = "category" | "option" | "customer";

export const orderCategories = [
  { id: "brochure-catalog", kind: "direct", slug: "brochure" },
  { id: "leaflet-pamphlet", kind: "direct", slug: "leaflet" },
  { id: "poster-flyer", kind: "direct", slug: "poster" },
  { id: "banner-display", kind: "direct", slug: "banner" },
  {
    id: "business-card-envelope",
    kind: "direct",
    slug: "business-card",
  },
  { id: "logo", kind: "direct", slug: "logo" },
  { id: "package-shopping-bag", kind: "quote", slug: "package" },
  { id: "photo-shoot", kind: "quote", slug: "photo" },
  { id: "etc", kind: "quote", slug: "custom" },
] as const;

export type OrderCategory = (typeof orderCategories)[number];
export type OrderCategoryId = OrderCategory["id"];
export type OrderCategorySlug = OrderCategory["slug"];
export type OrderQuoteCategoryId = Extract<
  OrderCategory,
  { kind: "quote" }
>["id"];
export type OrderCategoryHref = `/order/${OrderCategorySlug}`;

export type OrderMethod = {
  description: string;
  id: string;
  label: string;
  state: OrderStepState;
  title: string;
  tone: OrderMethodTone;
};

export const orderSteps = [
  { number: 1, label: "카테고리 선택" },
  { number: 2, label: "옵션 선택" },
  { number: 3, label: "정보 입력" },
  { number: 4, label: "결제 완료" },
] as const;

export const orderMethods = [
  {
    description:
      "규격·사양이 정해진 표준 제품\n사양 선택 → 가격 확인 → 카드 즉시결제",
    id: "direct",
    label: "바로 주문",
    state: "active",
    title: "정찰제 즉시결제",
    tone: "brand",
  },
  {
    description:
      "규격 협의 필요하거나 대량 주문\n카카오톡 1:1 상담으로 빠른 견적",
    id: "quote",
    label: "견적 후 주문",
    state: "inactive",
    title: "맞춤·대량·촬영",
    tone: "quote",
  },
] as const satisfies ReadonlyArray<OrderMethod>;

export type OrderSelectedOptionIds = {
  hasPlanning: boolean;
  optionValues: Partial<Record<ProductOptionSectionKey, string>>;
  productId: string;
  quantity: number | null;
  quotedTotal: number;
  serviceId: ProductCategoryId;
  variant: ProductVariant;
};

export type OrderSelectionSummary = {
  categoryLabel: string;
  ids: OrderSelectedOptionIds;
  optionRows: ReadonlyArray<{
    label: string;
    value: string;
  }>;
  priceRows: ReadonlyArray<{
    label: string;
    value: number;
  }>;
  serviceLabel: string;
  totalPrice: number;
};

export const formatOrderCurrency = (amount: number) =>
  `${amount.toLocaleString("ko-KR")}원`;

export const formatOrderUnitPrice = (amount: number) =>
  `${amount.toLocaleString("ko-KR", {
    maximumFractionDigits: 20,
  })}원`;

export function getOrderCategoryById(
  categoryId: OrderCategoryId,
): OrderCategory {
  return orderCategories.find((category) => category.id === categoryId)!;
}

export function getOrderCategoryBySlug(
  slug: string,
): OrderCategory | undefined {
  return orderCategories.find((category) => category.slug === slug);
}

export function getOrderCategoryHref(
  categoryId: OrderCategoryId,
): OrderCategoryHref {
  return `/order/${getOrderCategoryById(categoryId).slug}`;
}

export const getOrderDirectServiceHref = (
  serviceId: ProductCategoryId,
): OrderCategoryHref => getOrderCategoryHref(serviceId);
