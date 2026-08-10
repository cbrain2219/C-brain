import {
  createLinkPayCheckout,
  createAdminSupabaseClient,
  getPublicPaymentLink,
} from "@repo/supabase";
import { NextResponse } from "next/server";

import { getNicepayConfig, isUuid } from "../../../../../lib/nicepay";
import { createNicepayCheckoutRequest } from "../../../../../lib/paymentCheckout";

export const runtime = "nodejs";

type OrderRouteContext = {
  params: Promise<{ publicToken: string }>;
};

type CheckoutRequestBody = {
  agreements?: {
    privacyCollection?: unknown;
    privacyPolicy?: unknown;
  };
  checkoutRequestId?: unknown;
  customer?: {
    company?: unknown;
    email?: unknown;
    name?: unknown;
    phone?: unknown;
  };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const koreanMobilePhonePattern = /^01[016789]\d{7,8}$/;

function parseCheckoutRequestBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const body = value as CheckoutRequestBody;
  const checkoutRequestId =
    typeof body.checkoutRequestId === "string" ? body.checkoutRequestId : "";
  const customer = body.customer;
  const company = typeof customer?.company === "string" ? customer.company.trim() : "";
  const email = typeof customer?.email === "string" ? customer.email.trim() : "";
  const name = typeof customer?.name === "string" ? customer.name.trim() : "";
  const phone = typeof customer?.phone === "string" ? customer.phone.replace(/\D/g, "") : "";

  if (
    !isUuid(checkoutRequestId) ||
    !name ||
    name.length > 30 ||
    company.length > 100 ||
    !emailPattern.test(email) ||
    email.length > 60 ||
    !koreanMobilePhonePattern.test(phone) ||
    body.agreements?.privacyCollection !== true ||
    body.agreements?.privacyPolicy !== true
  ) {
    return null;
  }

  return {
    agreements: {
      privacyCollection: true,
      privacyPolicy: true,
    },
    checkoutRequestId,
    customer: { company: company || null, email, name, phone },
  };
}

export async function POST(request: Request, context: OrderRouteContext) {
  const { publicToken } = await context.params;

  if (!isUuid(publicToken)) {
    return NextResponse.json(
      { error: "결제 요청을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "결제 정보를 확인해주세요." },
      { status: 400 },
    );
  }

  try {
    const body = parseCheckoutRequestBody(requestBody);

    if (!body) {
      return NextResponse.json(
        { error: "결제 정보를 확인해주세요." },
        { status: 400 },
      );
    }

    let config: ReturnType<typeof getNicepayConfig>;

    try {
      config = getNicepayConfig();
    } catch (error) {
      console.error("[LinkPay checkout] NICEPAY configuration error", error);

      return NextResponse.json(
        { error: "결제 서비스 설정이 완료되지 않았습니다." },
        { status: 503 },
      );
    }

    const client = createAdminSupabaseClient();
    const link = await getPublicPaymentLink(client, publicToken);

    if (!link) {
      return NextResponse.json(
        { error: "결제 요청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (link.disabled_at !== null) {
      return NextResponse.json(
        { error: "현재 결제가 중단된 링크입니다." },
        { status: 409 },
      );
    }

    const checkout = await createLinkPayCheckout(client, {
      ...body,
      customerLabel: body.customer.name,
      publicToken,
    });

    return NextResponse.json(
      createNicepayCheckoutRequest(config, checkout),
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && /disabled/i.test(error.message)) {
      return NextResponse.json(
        { error: "현재 결제가 중단된 링크입니다." },
        { status: 409 },
      );
    }

    console.error("[LinkPay checkout] Failed to create checkout", error);

    return NextResponse.json(
      { error: "결제 요청을 준비하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
