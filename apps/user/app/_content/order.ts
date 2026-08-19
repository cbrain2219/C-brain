import type { ProductCategoryId } from "@repo/supabase/categories";
import type {
  ProductOptionSectionKey,
  ProductVariant,
} from "@repo/supabase/product-configuration";

type OrderStepState = "active" | "inactive";
type OrderMethodTone = "brand" | "quote";

export type OrderStepId = "category" | "option" | "customer";

export const orderServiceSearchParam = "service";

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

export type OrderDirectServiceHref =
  `/order?${typeof orderServiceSearchParam}=${ProductCategoryId}`;

export const getOrderDirectServiceHref = (
  serviceId: ProductCategoryId,
): OrderDirectServiceHref => `/order?${orderServiceSearchParam}=${serviceId}`;
