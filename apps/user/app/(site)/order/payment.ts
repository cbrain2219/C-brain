import {
  parseNicepayCheckoutRequest,
  type NicepayCheckoutRequest,
} from "../../../lib/paymentCheckout";

import type { OrderPaymentSubmitPayload } from "./OrderCustomerInfoStep";

export type OrderPaymentSubmitResult =
  | {
      checkout: NicepayCheckoutRequest;
      status: "success";
    }
  | {
      failureReason: string;
      status: "failure";
    };

type OrderCheckoutRequest = {
  agreements: OrderPaymentSubmitPayload["agreements"];
  checkoutRequestId: string;
  customer: {
    company: string;
    email: string;
    name: string;
    phone: string;
  };
  selection: {
    hasPlanning: boolean;
    optionValues: OrderPaymentSubmitPayload["summary"]["ids"]["optionValues"];
    productId: string;
    quantity: number | null;
    quotedTotal: number;
    serviceId: OrderPaymentSubmitPayload["summary"]["ids"]["serviceId"];
    variant: OrderPaymentSubmitPayload["summary"]["ids"]["variant"];
  };
};

function createOrderCheckoutRequest(
  payload: OrderPaymentSubmitPayload,
  checkoutRequestId: string,
): OrderCheckoutRequest {
  return {
    agreements: payload.agreements,
    checkoutRequestId,
    customer: {
      company: payload.customer.customerCompany,
      email: payload.customer.customerEmail,
      name: payload.customer.customerName,
      phone: payload.customer.customerPhone,
    },
    selection: {
      hasPlanning: payload.summary.ids.hasPlanning,
      optionValues: payload.summary.ids.optionValues,
      productId: payload.summary.ids.productId,
      quantity: payload.summary.ids.quantity,
      quotedTotal: payload.summary.ids.quotedTotal,
      serviceId: payload.summary.ids.serviceId,
      variant: payload.summary.ids.variant,
    },
  };
}

export function getOrderCheckoutPayloadKey(payload: OrderPaymentSubmitPayload) {
  const { agreements, customer, selection } = createOrderCheckoutRequest(
    payload,
    "",
  );

  return JSON.stringify({ agreements, customer, selection });
}

export async function submitOrderPayment(
  payload: OrderPaymentSubmitPayload,
  checkoutRequestId: string,
): Promise<OrderPaymentSubmitResult> {
  try {
    const request = createOrderCheckoutRequest(payload, checkoutRequestId);
    const response = await fetch("/api/orders/checkout", {
      body: JSON.stringify(request),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result: unknown = await response.json();

    if (!response.ok) {
      const error = result as { error?: unknown };

      return {
        failureReason:
          typeof error.error === "string"
            ? error.error
            : "결제 요청을 준비하지 못했습니다. 잠시 후 다시 시도해주세요.",
        status: "failure",
      };
    }

    const checkout = parseNicepayCheckoutRequest(result);

    if (!checkout) {
      return {
        failureReason:
          "결제 요청을 준비하지 못했습니다. 잠시 후 다시 시도해주세요.",
        status: "failure",
      };
    }

    return { checkout, status: "success" };
  } catch {
    return {
      failureReason:
        "결제 요청을 준비하지 못했습니다. 잠시 후 다시 시도해주세요.",
      status: "failure",
    };
  }
}
