import {
  calculateProductSelection,
  createAdminSupabaseClient,
  createOrderProductCatalogItem,
  createSiteCheckout,
  getProductCategory,
  getPublishedProduct,
} from "@repo/supabase";
import type { ProductCategoryId } from "@repo/supabase/categories";
import {
  productOptionSectionKeys,
  type ProductOptionSectionKey,
} from "@repo/supabase/product-configuration";
import { NextResponse } from "next/server";

import { createNicepayCheckoutRequest } from "../../../../lib/paymentCheckout";
import { getNicepayConfig, isUuid } from "../../../../lib/nicepay";

export const runtime = "nodejs";

type CheckoutSelection = {
  hasPlanning: boolean;
  optionValues: Partial<Record<ProductOptionSectionKey, string>>;
  productId: string;
  quantity: number | null;
  quotedTotal: number;
  serviceId: ProductCategoryId;
  variant: string;
};

type CheckoutCustomer = {
  company: string | null;
  email: string;
  name: string;
  phone: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const koreanMobilePhonePattern = /^01[016789]\d{7,8}$/;
const validOptionKeys = new Set<string>(productOptionSectionKeys);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

function parseOptionValues(
  value: unknown,
): CheckoutSelection["optionValues"] | null {
  const optionValues = asRecord(value);

  if (!optionValues) return null;

  const entries = Object.entries(optionValues);
  if (entries.length > productOptionSectionKeys.length) return null;

  const parsed: Partial<Record<ProductOptionSectionKey, string>> = {};

  for (const [key, rawValue] of entries) {
    const optionValue = asString(rawValue);

    if (!validOptionKeys.has(key) || !optionValue || optionValue.length > 200) {
      return null;
    }

    parsed[key as ProductOptionSectionKey] = optionValue;
  }

  return parsed;
}

function parseSelection(value: unknown): CheckoutSelection | null {
  const selection = asRecord(value);

  if (!selection || typeof selection.hasPlanning !== "boolean") return null;

  const productId = asString(selection.productId);
  const serviceId = asString(selection.serviceId);
  const variant = asString(selection.variant);
  const optionValues = parseOptionValues(selection.optionValues);
  const quantity = selection.quantity;
  const quotedTotal = selection.quotedTotal;
  const category = serviceId ? getProductCategory(serviceId) : undefined;

  if (
    !productId ||
    !isUuid(productId) ||
    !category ||
    category.id !== serviceId ||
    !variant ||
    variant.length > 100 ||
    !optionValues ||
    !(
      quantity === null ||
      (typeof quantity === "number" &&
        Number.isSafeInteger(quantity) &&
        quantity > 0)
    ) ||
    typeof quotedTotal !== "number" ||
    !Number.isSafeInteger(quotedTotal) ||
    quotedTotal < 0
  ) {
    return null;
  }

  return {
    hasPlanning: selection.hasPlanning,
    optionValues,
    productId,
    quantity,
    quotedTotal,
    serviceId: category.id,
    variant,
  };
}

function parseCustomer(value: unknown): CheckoutCustomer | null {
  const customer = asRecord(value);

  if (!customer) return null;

  const name = asString(customer.name);
  const company = asString(customer.company);
  const email = asString(customer.email);
  const phone = asString(customer.phone)?.replace(/\D/g, "");

  if (
    !name ||
    name.length > 30 ||
    (company !== null && company.length > 100) ||
    !email ||
    email.length > 60 ||
    !emailPattern.test(email) ||
    !phone ||
    !koreanMobilePhonePattern.test(phone)
  ) {
    return null;
  }

  return { company: company || null, email, name, phone };
}

function hasRequiredAgreements(value: unknown) {
  const agreements = asRecord(value);

  return (
    agreements?.privacyCollection === true && agreements?.privacyPolicy === true
  );
}

const invalidRequest = (error: string) =>
  NextResponse.json({ error }, { status: 400 });

const staleSelection = () =>
  NextResponse.json(
    { error: "상품 옵션 또는 가격이 변경되었습니다. 옵션을 다시 선택해주세요." },
    { status: 409 },
  );

export async function POST(request: Request) {
  let payload: Record<string, unknown> | null;

  try {
    payload = asRecord(await request.json());
  } catch {
    return invalidRequest("결제 요청 형식이 올바르지 않습니다.");
  }

  if (!payload) return invalidRequest("결제 요청 형식이 올바르지 않습니다.");

  const checkoutRequestId = asString(payload.checkoutRequestId);
  const customer = parseCustomer(payload.customer);
  const selection = parseSelection(payload.selection);

  if (!checkoutRequestId || !isUuid(checkoutRequestId)) {
    return invalidRequest("결제 요청을 확인할 수 없습니다.");
  }

  if (!customer || !hasRequiredAgreements(payload.agreements)) {
    return invalidRequest("주문자 정보와 약관 동의를 확인해주세요.");
  }

  if (!selection) return invalidRequest("선택한 상품 정보를 찾을 수 없습니다.");

  let config: ReturnType<typeof getNicepayConfig>;

  try {
    config = getNicepayConfig();
  } catch (error) {
    console.error("[Site checkout] NICEPAY configuration error", error);

    return NextResponse.json(
      { error: "결제 서비스 설정이 완료되지 않았습니다." },
      { status: 503 },
    );
  }

  let client: ReturnType<typeof createAdminSupabaseClient>;
  let productRow: Awaited<ReturnType<typeof getPublishedProduct>>;

  try {
    client = createAdminSupabaseClient();
    productRow = await getPublishedProduct(client, selection.productId);
  } catch (error) {
    console.error("[Site checkout] Failed to load published product", error);

    return NextResponse.json(
      { error: "상품 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  if (!productRow) return staleSelection();

  const product = createOrderProductCatalogItem(productRow);
  const variant = product?.variants.find(
    (candidate) => candidate.id === selection.variant,
  );

  if (!product || product.categoryId !== selection.serviceId || !variant) {
    return staleSelection();
  }

  const calculation = calculateProductSelection(variant, {
    hasPlanning: selection.hasPlanning,
    optionValues: selection.optionValues,
    quantity: selection.quantity,
  });

  if (!calculation || calculation.totalPrice !== selection.quotedTotal) {
    return staleSelection();
  }

  const amount = calculation.totalPrice;
  const orderName = [
    product.productType,
    ...(variant.id === product.productType ? [] : [variant.id]),
    ...calculation.optionRows.map((row) => row.value),
    ...(calculation.quantityLabel ? [calculation.quantityLabel] : []),
  ]
    .join(" · ")
    .slice(0, 100);
  const itemSnapshot = {
    channel: "site",
    options: calculation.optionRows.map((row) => ({
      key: row.key,
      label: row.label,
      value: row.value,
    })),
    planning: {
      amount: calculation.planningAmount,
      included: selection.hasPlanning,
      label: "기획",
    },
    priceRows: calculation.priceRows.map((row) => ({
      label: row.label,
      value: row.value,
    })),
    product: { id: product.id, label: product.productType },
    quantity:
      calculation.quantity === null
        ? null
        : {
            label: calculation.quantityLabel,
            value: calculation.quantity,
          },
    service: { id: product.categoryId, label: product.productType },
    total: amount,
    variant: { id: variant.id, label: variant.id },
  };

  try {
    const checkout = await createSiteCheckout(client, {
      agreements: { privacyCollection: true, privacyPolicy: true },
      amount,
      checkoutRequestId,
      customer,
      customerLabel: customer.company ?? customer.name,
      itemSnapshot,
      orderName,
    });

    return NextResponse.json(createNicepayCheckoutRequest(config, checkout), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[Site checkout] Failed to create checkout", error);

    return NextResponse.json(
      { error: "결제 요청을 준비하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
