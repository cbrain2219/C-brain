import { createAdminSupabaseClient, createSiteCheckout } from "@repo/supabase";
import { NextResponse } from "next/server";

import {
  getOrderOptionConfig,
  getOrderQuantityOptions,
} from "../../../_content/order";
import { getDirectServiceItemById } from "../../../_content/services";
import { createNicepayCheckoutRequest } from "../../../../lib/paymentCheckout";
import { getNicepayConfig, isUuid } from "../../../../lib/nicepay";

export const runtime = "nodejs";

type CheckoutSelection = {
  hasPlanning: boolean;
  pageId: string;
  paperId: string;
  quantityId: string;
  serviceId: string;
};

type CheckoutCustomer = {
  company: string | null;
  email: string;
  name: string;
  phone: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const koreanMobilePhonePattern = /^01[016789]\d{7,8}$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

function parseSelection(value: unknown): CheckoutSelection | null {
  const selection = asRecord(value);

  if (!selection || typeof selection.hasPlanning !== "boolean") return null;

  const serviceId = asString(selection.serviceId);
  const pageId = asString(selection.pageId);
  const paperId = asString(selection.paperId);
  const quantityId = asString(selection.quantityId);

  return serviceId && pageId && paperId && quantityId
    ? {
        hasPlanning: selection.hasPlanning,
        pageId,
        paperId,
        quantityId,
        serviceId,
      }
    : null;
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

  const optionConfig = getOrderOptionConfig(selection.serviceId);
  const service = getDirectServiceItemById(selection.serviceId);
  const page = optionConfig?.pageOptions.find(
    (option) => option.id === selection.pageId,
  );
  const paper = optionConfig?.paperOptions.find(
    (option) => option.id === selection.paperId,
  );
  const quantity = optionConfig
    ? getOrderQuantityOptions(
        optionConfig,
        selection.pageId,
        selection.paperId,
      ).find((option) => option.id === selection.quantityId)
    : undefined;

  if (!optionConfig || !service || !page || !paper || !quantity) {
    return invalidRequest("선택한 상품 정보를 찾을 수 없습니다.");
  }

  const planningFee = selection.hasPlanning
    ? optionConfig.planningService.fee
    : 0;
  const amount = quantity.total + planningFee;
  const orderName = [service.title, page.label, paper.label, quantity.quantity]
    .join(" · ")
    .slice(0, 100);
  const itemSnapshot = {
    channel: "site",
    page: { id: page.id, label: page.label },
    paper: { id: paper.id, label: paper.label },
    planning: {
      amount: planningFee,
      included: selection.hasPlanning,
      label: optionConfig.planningService.title,
    },
    quantity: {
      id: quantity.id,
      label: quantity.quantity,
      total: quantity.total,
      unitPrice: quantity.unitPriceAmount,
    },
    service: { id: service.id, label: service.title },
    total: amount,
  };

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

  try {
    const checkout = await createSiteCheckout(createAdminSupabaseClient(), {
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
