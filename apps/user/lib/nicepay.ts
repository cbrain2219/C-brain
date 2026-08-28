import { Buffer } from "node:buffer";
import { createHash, timingSafeEqual } from "node:crypto";

const NICEPAY_API_BASE_URL = {
  production: "https://api.nicepay.co.kr",
  sandbox: "https://sandbox-api.nicepay.co.kr",
} as const;

const NICEPAY_PAYMENT_STATUSES = [
  "ready",
  "paid",
  "failed",
  "cancelled",
  "partialCancelled",
  "expired",
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/i;
const NICEPAY_TIMEOUT_MS = 30_000;

export type NicepayMode = keyof typeof NICEPAY_API_BASE_URL;
export type NicepayPaymentStatus = (typeof NICEPAY_PAYMENT_STATUSES)[number];

export type NicepayConfig = {
  apiBaseUrl: string;
  clientKey: string;
  mode: NicepayMode;
  secretKey: string;
  siteUrl: URL;
};

export type NicepayAuthCallback = {
  amount: number;
  authResultCode: string;
  authResultMsg: string;
  authToken: string;
  clientId: string;
  orderId: string;
  signature: string;
  tid: string;
};

export type NicepayCancellation = {
  amount: number;
  cancelledAt: string;
  reason: string;
  receiptUrl: string | null;
  tid: string;
};

export type NicepayPayment = {
  amount: number;
  balanceAmt: number;
  cancelledAt: string | null;
  cancelledTid: string | null;
  cancels: ReadonlyArray<NicepayCancellation>;
  card: { canPartCancel: boolean } | null;
  ediDate: string;
  orderId: string;
  paidAt: string | null;
  payMethod: string | null;
  receiptUrl: string | null;
  resultCode: string;
  resultMsg: string;
  signature: string;
  status: NicepayPaymentStatus;
  tid: string;
};

export class NicepayRejectedError extends Error {
  constructor(
    readonly resultCode: string,
    readonly resultMessage: string,
  ) {
    super(resultMessage);
    this.name = "NicepayRejectedError";
  }
}

type NicepayAuthExpectation = {
  amount: number;
  clientKey: string;
  orderId: string;
};

type NicepayPaymentExpectation = {
  amount: number;
  orderId: string;
  tid: string;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readOptionalTimestamp(value: unknown) {
  const timestamp = readString(value);
  return timestamp === "0" ? null : timestamp;
}

function readAmount(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN;

  return Number.isSafeInteger(amount) &&
    amount >= 1 &&
    amount <= 999_999_999_999
    ? amount
    : null;
}

function readBalanceAmount(value: unknown, amount: number) {
  const balanceAmount =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN;

  return Number.isSafeInteger(balanceAmount) &&
    balanceAmount >= 0 &&
    balanceAmount <= amount
    ? balanceAmount
    : null;
}

function parseNicepayCancels(value: unknown) {
  if (!Array.isArray(value)) return null;

  const cancels = value.map((cancel) => {
    if (!cancel || typeof cancel !== "object" || Array.isArray(cancel)) {
      return null;
    }

    const input = cancel as Record<string, unknown>;
    const amount = readAmount(input.amount);
    const cancelledAt = readString(input.cancelledAt);
    const reason = readString(input.reason);
    const tid = readString(input.tid);

    if (amount === null || !cancelledAt || !reason || !tid) return null;

    return {
      amount,
      cancelledAt,
      reason,
      receiptUrl: readString(input.receiptUrl),
      tid,
    };
  });

  return cancels.every((cancel) => cancel !== null) ? cancels : null;
}

function parseNicepayCard(value: unknown) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const canPartCancel = (value as Record<string, unknown>).canPartCancel;
  return typeof canPartCancel === "boolean" ? { canPartCancel } : null;
}

function parseNicepayRejection(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  const resultCode = readString(input.resultCode);
  const resultMessage = readString(input.resultMsg);

  return resultCode && resultCode !== "0000" && resultMessage
    ? { resultCode, resultMessage }
    : null;
}

function hasPaymentStatus(value: unknown): value is NicepayPaymentStatus {
  return NICEPAY_PAYMENT_STATUSES.some((status) => status === value);
}

function signaturesMatch(received: string, expected: string) {
  if (
    !SHA256_HEX_PATTERN.test(received) ||
    !SHA256_HEX_PATTERN.test(expected)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(received.toLowerCase(), "hex"),
    Buffer.from(expected.toLowerCase(), "hex"),
  );
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function getNicepayConfig(): NicepayConfig {
  const mode = requireEnv("NICEPAY_MODE");

  if (mode !== "sandbox" && mode !== "production") {
    throw new Error("NICEPAY_MODE must be sandbox or production.");
  }

  const siteUrl = new URL(requireEnv("NEXT_PUBLIC_SITE_URL"));
  const isLocalhost = ["localhost", "127.0.0.1"].includes(siteUrl.hostname);

  if (siteUrl.protocol !== "https:" && !isLocalhost) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS outside localhost.");
  }

  return {
    apiBaseUrl: NICEPAY_API_BASE_URL[mode],
    clientKey: requireEnv("NEXT_PUBLIC_NICEPAY_CLIENT_KEY"),
    mode,
    secretKey: requireEnv("NICEPAY_SECRET_KEY"),
    siteUrl,
  };
}

export function createNicepayAuthorization(config: NicepayConfig) {
  const credentials = Buffer.from(
    `${config.clientKey}:${config.secretKey}`,
    "utf8",
  ).toString("base64");

  return `Basic ${credentials}`;
}

export function createNicepaySignature(parts: string[], secretKey: string) {
  return createHash("sha256")
    .update(`${parts.join("")}${secretKey}`, "utf8")
    .digest("hex");
}

export function parseNicepayAuthCallback(formData: FormData) {
  const amount = readAmount(formData.get("amount"));
  const authResultCode = readString(formData.get("authResultCode"));
  const authToken = readString(formData.get("authToken"));
  const clientId = readString(formData.get("clientId"));
  const orderId = readString(formData.get("orderId"));
  const signature = readString(formData.get("signature"));
  const tid = readString(formData.get("tid"));

  if (
    amount === null ||
    !authResultCode ||
    !authToken ||
    !clientId ||
    !orderId ||
    !signature ||
    !SHA256_HEX_PATTERN.test(signature) ||
    !tid
  ) {
    return null;
  }

  return {
    amount,
    authResultCode,
    authResultMsg:
      readString(formData.get("authResultMsg")) ?? "인증 실패",
    authToken,
    clientId,
    orderId,
    signature,
    tid,
  } satisfies NicepayAuthCallback;
}

export function verifyNicepayAuthCallback(
  callback: NicepayAuthCallback,
  expected: NicepayAuthExpectation,
  secretKey: string,
) {
  if (
    callback.authResultCode !== "0000" ||
    callback.amount !== expected.amount ||
    callback.clientId !== expected.clientKey ||
    callback.orderId !== expected.orderId
  ) {
    return false;
  }

  return signaturesMatch(
    callback.signature,
    createNicepaySignature(
      [callback.authToken, callback.clientId, String(callback.amount)],
      secretKey,
    ),
  );
}

export function parseNicepayPayment(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  const amount = readAmount(input.amount);
  const balanceAmt =
    amount === null ? null : readBalanceAmount(input.balanceAmt, amount);
  const cancels = parseNicepayCancels(input.cancels ?? []);
  const card = parseNicepayCard(input.card);
  const ediDate = readString(input.ediDate);
  const orderId = readString(input.orderId);
  const resultCode = readString(input.resultCode);
  const resultMsg = readString(input.resultMsg);
  const signature = readString(input.signature);
  const tid = readString(input.tid);

  if (
    amount === null ||
    balanceAmt === null ||
    !cancels ||
    !ediDate ||
    !orderId ||
    !resultCode ||
    !resultMsg ||
    !signature ||
    !SHA256_HEX_PATTERN.test(signature) ||
    !hasPaymentStatus(input.status) ||
    !tid
  ) {
    return null;
  }

  return {
    amount,
    balanceAmt,
    cancelledAt: readOptionalTimestamp(input.cancelledAt),
    cancelledTid: readString(input.cancelledTid),
    cancels,
    card,
    ediDate,
    orderId,
    paidAt: readOptionalTimestamp(input.paidAt),
    payMethod: readString(input.payMethod),
    receiptUrl: readString(input.receiptUrl),
    resultCode,
    resultMsg,
    signature,
    status: input.status,
    tid,
  } satisfies NicepayPayment;
}

export function findLatestNicepayCancellation(payment: NicepayPayment) {
  if (payment.cancelledTid) {
    const matches = payment.cancels.filter(
      (cancellation) =>
        cancellation.tid === payment.cancelledTid &&
        !Number.isNaN(Date.parse(cancellation.cancelledAt)),
    );

    return matches.length === 1 ? matches[0] : null;
  }

  const cancelledAt = payment.cancelledAt
    ? Date.parse(payment.cancelledAt)
    : Number.NaN;
  const matches = payment.cancels.filter(
    (cancellation) =>
      !Number.isNaN(cancelledAt) &&
      Date.parse(cancellation.cancelledAt) === cancelledAt,
  );

  return matches.length === 1 ? matches[0] : null;
}

export function findNicepayCancellation(
  payment: NicepayPayment,
  amount: number,
) {
  const cancellation = findLatestNicepayCancellation(payment);
  return cancellation?.amount === amount ? cancellation : null;
}

export function verifyNicepayPayment(
  payment: NicepayPayment,
  expected: NicepayPaymentExpectation,
  secretKey: string,
) {
  if (
    payment.amount !== expected.amount ||
    payment.orderId !== expected.orderId ||
    payment.tid !== expected.tid
  ) {
    return false;
  }

  return signaturesMatch(
    payment.signature,
    createNicepaySignature(
      [payment.tid, String(payment.amount), payment.ediDate],
      secretKey,
    ),
  );
}

async function requestNicepay(
  config: NicepayConfig,
  path: string,
  init: RequestInit,
) {
  // ponytail: one total timeout; split connect/read timers if provider latency diagnostics need it.
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: createNicepayAuthorization(config),
      "Content-Type": "application/json;charset=utf-8",
      ...init.headers,
    },
    signal: AbortSignal.timeout(NICEPAY_TIMEOUT_MS),
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok || body === null) {
    const rejection = parseNicepayRejection(body);
    if (rejection) {
      throw new NicepayRejectedError(
        rejection.resultCode,
        rejection.resultMessage,
      );
    }

    throw new Error(`NICEPAY request failed with HTTP ${response.status}.`);
  }

  return body;
}

export async function approveNicepayPayment(
  config: NicepayConfig,
  tid: string,
  amount: number,
) {
  return parseNicepayPayment(
    await requestNicepay(config, `/v1/payments/${encodeURIComponent(tid)}`, {
      body: JSON.stringify({ amount }),
      method: "POST",
    }),
  );
}

export async function retrieveNicepayPayment(
  config: NicepayConfig,
  tid: string,
) {
  return parseNicepayPayment(
    await requestNicepay(config, `/v1/payments/${encodeURIComponent(tid)}`, {
      method: "GET",
    }),
  );
}

export async function netCancelNicepayPayment(
  config: NicepayConfig,
  orderId: string,
) {
  return parseNicepayPayment(
    await requestNicepay(config, "/v1/payments/netcancel", {
      body: JSON.stringify({ orderId }),
      method: "POST",
    }),
  );
}

export async function cancelNicepayPayment(
  config: NicepayConfig,
  tid: string,
  input: {
    amount: number;
    currentBalance: number;
    orderId: string;
    originalAmount: number;
    reason: string;
  },
) {
  if (
    !Number.isSafeInteger(input.amount) ||
    !Number.isSafeInteger(input.currentBalance) ||
    !Number.isSafeInteger(input.originalAmount) ||
    input.amount < 1 ||
    input.currentBalance < input.amount ||
    input.originalAmount < input.currentBalance ||
    !input.orderId ||
    !input.reason.trim()
  ) {
    throw new Error("Invalid NICEPAY cancellation request.");
  }

  const body: Record<string, string | number> = {
    orderId: input.orderId,
    reason: input.reason.trim(),
  };

  if (input.amount < input.originalAmount) {
    body.cancelAmt = input.amount;
  }

  const response = await requestNicepay(
    config,
    `/v1/payments/${encodeURIComponent(tid)}/cancel`,
    {
      body: JSON.stringify(body),
      method: "POST",
    },
  );
  const payment = parseNicepayPayment(response);
  const rejection = payment ? null : parseNicepayRejection(response);

  if (rejection) {
    throw new NicepayRejectedError(
      rejection.resultCode,
      rejection.resultMessage,
    );
  }

  return payment;
}
