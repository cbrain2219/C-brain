import type { NicepayConfig } from "./nicepay";

export type NicepayCheckoutRequest = {
  amount: number;
  clientId: string;
  goodsName: string;
  method: "card";
  orderId: string;
  returnUrl: string;
};

function readRequiredString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isNicepayReturnUrl(value: string) {
  try {
    const url = new URL(value);
    const isLocalhost = url.hostname === "localhost";

    return (
      url.pathname === "/api/payments/nicepay/return" &&
      (url.protocol === "https:" || (isLocalhost && url.protocol === "http:"))
    );
  } catch {
    return false;
  }
}

/** Parses only the browser payload produced by a server-created checkout. */
export function parseNicepayCheckoutRequest(
  value: unknown,
): NicepayCheckoutRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  const amount = input.amount;
  const clientId = readRequiredString(input.clientId);
  const goodsName = readRequiredString(input.goodsName);
  const orderId = readRequiredString(input.orderId);
  const returnUrl = readRequiredString(input.returnUrl);

  if (
    typeof amount !== "number" ||
    !Number.isSafeInteger(amount) ||
    amount < 1 ||
    !clientId ||
    !goodsName ||
    !orderId ||
    input.method !== "card" ||
    !returnUrl ||
    !isNicepayReturnUrl(returnUrl)
  ) {
    return null;
  }

  return { amount, clientId, goodsName, method: "card", orderId, returnUrl };
}

export function isNicepayCheckoutRequest(
  value: unknown,
): value is NicepayCheckoutRequest {
  return parseNicepayCheckoutRequest(value) !== null;
}

export function toNicepayGoodsName(value: string) {
  const normalized = value.trim().replace(/["¦]/g, "-") || "결제 요청";
  const encoder = new TextEncoder();
  let result = "";

  for (const character of normalized) {
    if (encoder.encode(`${result}${character}`).byteLength > 40) break;
    result += character;
  }

  return result;
}

type NicepayBrowserRequest = NicepayCheckoutRequest & {
  fnError: (response: { errorMsg?: string }) => void;
};

declare global {
  interface Window {
    AUTHNICE?: {
      requestPay(request: NicepayBrowserRequest): void;
    };
  }
}

let nicepaySdkPromise: Promise<void> | undefined;
const NICEPAY_SDK_URL = "https://pay.nicepay.co.kr/v1/js/";

function loadNicepaySdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("NICEPAY can only start in a browser."));
  }

  if (window.AUTHNICE) return Promise.resolve();
  if (nicepaySdkPromise) return nicepaySdkPromise;

  nicepaySdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-nicepay-sdk="true"], script[src="${NICEPAY_SDK_URL}"]`,
    );
    const script = existing ?? document.createElement("script");
    const removeFailedScript = () => {
      if (script.dataset.nicepaySdk === "true") script.remove();
    };

    const complete = () => {
      if (window.AUTHNICE) resolve();
      else {
        removeFailedScript();
        reject(new Error("NICEPAY SDK did not initialize."));
      }
    };

    script.addEventListener(
      "error",
      () => {
        removeFailedScript();
        reject(new Error("NICEPAY SDK could not be loaded."));
      },
      { once: true },
    );
    script.addEventListener("load", complete, { once: true });

    if (!existing) {
      script.async = true;
      script.dataset.nicepaySdk = "true";
      script.src = NICEPAY_SDK_URL;
      document.head.append(script);
    }
  });

  nicepaySdkPromise = nicepaySdkPromise.catch((error: unknown) => {
    nicepaySdkPromise = undefined;
    throw error;
  });

  return nicepaySdkPromise;
}

/** Loads the official SDK once and opens the NICEPAY card checkout. */
export async function requestNicepayPayment(
  request: NicepayCheckoutRequest,
  onError: (message: string) => void,
) {
  const parsedRequest = parseNicepayCheckoutRequest(request);
  if (!parsedRequest) {
    throw new Error("Invalid NICEPAY checkout request.");
  }

  await loadNicepaySdk();

  if (!window.AUTHNICE) {
    throw new Error("NICEPAY SDK did not initialize.");
  }

  window.AUTHNICE.requestPay({
    ...parsedRequest,
    fnError: (response) => {
      onError(response.errorMsg ?? "결제를 시작하지 못했습니다.");
    },
  });
}

/** Builds the only browser-facing payload for a server-created checkout. */
export function createNicepayCheckoutRequest(
  config: NicepayConfig,
  checkout: { amount: number; orderName: string; providerOrderId: string },
): NicepayCheckoutRequest {
  return {
    amount: checkout.amount,
    clientId: config.clientKey,
    goodsName: toNicepayGoodsName(checkout.orderName),
    method: "card",
    orderId: checkout.providerOrderId,
    returnUrl: new URL(
      "/api/payments/nicepay/return",
      config.siteUrl,
    ).toString(),
  };
}
