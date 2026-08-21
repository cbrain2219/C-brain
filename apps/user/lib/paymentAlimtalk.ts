import "server-only";

import type { Json, PaymentRow, PaymentWithOrder } from "@repo/supabase";

import {
  getPopbillConfig,
  sendPopbillAlimtalk,
  type PopbillConfig,
  type PopbillKakaoService,
} from "./popbill";

type Environment = Record<string, string | undefined>;
type Audience = "admin" | "user";

export type PaymentAlimtalkInput = {
  amount: number;
  buyerCompany: string | null;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string;
  channel: "linkpay" | "site";
  itemSnapshot: Json;
  orderName: string;
  orderNumber: string;
  paidAt: string;
  paymentId: string;
  publicToken: string;
};

type PaymentAlimtalkConfig = PopbillConfig & {
  adminAppUrl: string;
  adminReceiver: string;
  adminTemplateCode: string;
  userAppUrl: string;
  userTemplateCode: string;
};

type SendPaymentAlimtalkOptions = {
  environment?: Environment;
  service?: Pick<PopbillKakaoService, "sendATS_one">;
  timeoutMs?: number;
};

const EMPTY_VALUE = "해당 없음";

const koreanDateTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

function requireEnvironmentValue(environment: Environment, name: string) {
  const value = environment[name]?.trim();

  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function requireHttpsOrigin(environment: Environment, name: string) {
  const value = requireEnvironmentValue(environment, name);
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL.`);
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${name} must be a public HTTPS origin.`);
  }

  return url.origin;
}

function normalizeTemplateValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function readText(value: unknown) {
  return typeof value === "string" ? normalizeTemplateValue(value) : "";
}

function readObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readNestedText(
  object: Record<string, unknown>,
  key: string,
  nestedKey: string,
) {
  return readText(readObject(object[key])?.[nestedKey]);
}

function readOption(snapshot: Record<string, unknown>, key: string) {
  const options = snapshot.options;
  if (!Array.isArray(options)) return "";

  for (const option of options) {
    const row = readObject(option);
    if (readText(row?.key) === key) return readText(row?.value);
  }

  return "";
}

function splitLinkPayPageQuantity(value: string) {
  const parts = value
    .split(/\s*\/\s*/)
    .map(normalizeTemplateValue)
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      pageCount: parts[0]!,
      quantity: parts.slice(1).join(" / "),
    };
  }

  if (
    /\d\s*(?:부|장|개|매|세트)/i.test(value) &&
    !/\d\s*(?:p|페이지)/i.test(value)
  ) {
    return { pageCount: EMPTY_VALUE, quantity: value };
  }

  return { pageCount: value || EMPTY_VALUE, quantity: EMPTY_VALUE };
}

export function createPaymentAlimtalkOrderFields(
  input: Pick<PaymentAlimtalkInput, "channel" | "itemSnapshot" | "orderName">,
) {
  const snapshot = readObject(input.itemSnapshot) ?? {};

  if (input.channel === "linkpay") {
    const pageQuantity = splitLinkPayPageQuantity(
      readText(snapshot.pageQuantity),
    );

    return {
      category: readText(snapshot.category) || input.orderName || EMPTY_VALUE,
      pageCount: pageQuantity.pageCount,
      paper: readText(snapshot.paper) || EMPTY_VALUE,
      quantity: pageQuantity.quantity,
      service: readText(snapshot.service) || input.orderName || EMPTY_VALUE,
    };
  }

  const category =
    readNestedText(snapshot, "product", "label") ||
    readNestedText(snapshot, "service", "label") ||
    input.orderName ||
    EMPTY_VALUE;
  const variant = readNestedText(snapshot, "variant", "label");
  const planningIncluded = readObject(snapshot.planning)?.included === true;
  const baseService = planningIncluded
    ? "디자인 + 인쇄 + 기획"
    : "디자인 + 인쇄";
  const service =
    category === "로고"
      ? "로고 디자인"
      : variant && variant !== category
        ? `${variant} · ${baseService}`
        : baseService;
  const paper = readOption(snapshot, "paper");
  const material = readOption(snapshot, "material");
  const selectedQuantity = readNestedText(snapshot, "quantity", "label");
  const baseQuantity = readOption(snapshot, "baseQuantity");
  const people = readOption(snapshot, "people");

  return {
    category,
    pageCount: readOption(snapshot, "pageCount") || EMPTY_VALUE,
    paper: paper || (material ? `${material} (재질)` : EMPTY_VALUE),
    quantity:
      selectedQuantity ||
      (baseQuantity
        ? `${baseQuantity}${people ? ` × ${people}` : ""}`
        : EMPTY_VALUE),
    service,
  };
}

function formatKoreanDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Payment date must be a valid ISO date.");
  }

  return koreanDateTimeFormatter.format(date);
}

function normalizePhone(value: string, name: string) {
  const phone = value.replace(/[-\s]/g, "");

  if (!/^\d{10,11}$/.test(phone)) {
    throw new Error(`${name} must contain 10 or 11 digits.`);
  }

  return phone;
}

function formatPhone(value: string) {
  const phone = normalizePhone(value, "Buyer phone");

  return phone.length === 11
    ? `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
    : `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
}

function formatAmount(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Payment amount must be a positive safe integer.");
  }

  return value.toLocaleString("ko-KR");
}

export function createPaymentAdminAlimtalkContent(input: PaymentAlimtalkInput) {
  const fields = createPaymentAlimtalkOrderFields(input);

  return [
    "[고객 정보]",
    `▪ 담당자명: ${normalizeTemplateValue(input.buyerName)}`,
    `▪ 회사명: ${input.buyerCompany ? normalizeTemplateValue(input.buyerCompany) : "-"}`,
    `▪ 연락처: ${formatPhone(input.buyerPhone)}`,
    `▪ 이메일: ${normalizeTemplateValue(input.buyerEmail)}`,
    "",
    "[주문 정보]",
    `▪ 주문번호: ${normalizeTemplateValue(input.orderNumber)}`,
    `▪ 카테고리: ${fields.category}`,
    `▪ 서비스: ${fields.service}`,
    `▪ 용지: ${fields.paper}`,
    `▪ 페이지 수: ${fields.pageCount}`,
    `▪ 수량: ${fields.quantity}`,
    `▪ 결제금액: ${formatAmount(input.amount)}원`,
    `▪ 결제일시: ${formatKoreanDateTime(input.paidAt)}`,
    "",
    "채팅방 문의 확인 후 상담 진행해주세요.",
  ].join("\n");
}

export function createPaymentUserAlimtalkContent(input: PaymentAlimtalkInput) {
  const fields = createPaymentAlimtalkOrderFields(input);

  return [
    "[결제 완료 안내]",
    "",
    `${normalizeTemplateValue(input.buyerName)}님, 주문 결제가 완료되었습니다.`,
    "",
    `▪ 주문번호: ${normalizeTemplateValue(input.orderNumber)}`,
    `▪ 카테고리: ${fields.category}`,
    `▪ 서비스: ${fields.service}`,
    `▪ 용지: ${fields.paper}`,
    `▪ 페이지 수: ${fields.pageCount}`,
    `▪ 수량: ${fields.quantity}`,
    `▪ 결제금액: ${formatAmount(input.amount)}원`,
    `▪ 결제일시: ${formatKoreanDateTime(input.paidAt)}`,
    "",
    "▶ 다음 절차 안내",
    '본 채팅방에 "결제완료" 남겨주시면',
    "담당자 확인 후 ",
    "빠른 상담 도와드리겠습니다.",
    "",
    "감사합니다.",
  ].join("\n");
}

export function getPaymentAlimtalkConfig(
  environment: Environment = process.env,
): PaymentAlimtalkConfig {
  const adminPhoneName =
    environment.VERCEL_ENV?.trim() === "production"
      ? "POPBILL_ADMIN_PHONE_LIVE"
      : "POPBILL_ADMIN_PHONE_DEV";
  const adminTemplateCode = requireEnvironmentValue(
    environment,
    "POPBILL_TEMPLATE_PAYMENT_ADMIN",
  );
  const userTemplateCode = requireEnvironmentValue(
    environment,
    "POPBILL_TEMPLATE_PAYMENT_USER",
  );

  if (!/^\d{12}$/.test(adminTemplateCode)) {
    throw new Error(
      "POPBILL_TEMPLATE_PAYMENT_ADMIN must be exactly 12 digits.",
    );
  }

  if (!/^\d{12}$/.test(userTemplateCode)) {
    throw new Error("POPBILL_TEMPLATE_PAYMENT_USER must be exactly 12 digits.");
  }

  return {
    ...getPopbillConfig(environment),
    adminAppUrl: requireHttpsOrigin(environment, "ADMIN_APP_URL"),
    adminReceiver: normalizePhone(
      requireEnvironmentValue(environment, adminPhoneName),
      adminPhoneName,
    ),
    adminTemplateCode,
    userAppUrl: requireHttpsOrigin(
      {
        ...environment,
        PAYMENT_ALIMTALK_USER_APP_URL:
          environment.PAYMENT_ALIMTALK_USER_APP_URL?.trim() ||
          environment.NEXT_PUBLIC_SITE_URL,
      },
      "PAYMENT_ALIMTALK_USER_APP_URL",
    ),
    userTemplateCode,
  };
}

function paymentRequestNumber(audience: Audience, paymentId: string) {
  const compactId = paymentId.replaceAll("-", "");

  if (!/^[0-9a-fA-F]{32}$/.test(compactId)) {
    throw new Error("Payment ID must be a UUID.");
  }

  return `${audience === "admin" ? "pa" : "pu"}${compactId}`;
}

export async function sendPaymentAlimtalk(
  input: PaymentAlimtalkInput,
  options: SendPaymentAlimtalkOptions = {},
) {
  const config = getPaymentAlimtalkConfig(options.environment ?? process.env);
  const sharedOptions = {
    service: options.service,
    timeoutMs: options.timeoutMs,
  };
  const adminDetailUrl = new URL("/sales", config.adminAppUrl).toString();
  const userDetailUrl = new URL(
    `/payment/result/${encodeURIComponent(input.publicToken)}`,
    config.userAppUrl,
  ).toString();

  const [adminReceiptNumber, userReceiptNumber] = await Promise.all([
    sendPopbillAlimtalk(
      {
        buttons: [
          {
            n: "주문상세 확인",
            t: "WL",
            u1: adminDetailUrl,
            u2: adminDetailUrl,
          },
        ],
        config,
        content: createPaymentAdminAlimtalkContent(input),
        emphasizeTitle: "고객 결제 알림",
        receiver: config.adminReceiver,
        receiverName: "관리자",
        requestNumber: paymentRequestNumber("admin", input.paymentId),
        templateCode: config.adminTemplateCode,
      },
      sharedOptions,
    ),
    sendPopbillAlimtalk(
      {
        buttons: [
          { n: "채널 추가", t: "AC" },
          {
            n: "주문상세 확인",
            t: "WL",
            u1: userDetailUrl,
            u2: userDetailUrl,
          },
        ],
        config,
        content: createPaymentUserAlimtalkContent(input),
        receiver: normalizePhone(input.buyerPhone, "Buyer phone"),
        receiverName: normalizeTemplateValue(input.buyerName),
        requestNumber: paymentRequestNumber("user", input.paymentId),
        templateCode: config.userTemplateCode,
      },
      sharedOptions,
    ),
  ]);

  return { adminReceiptNumber, userReceiptNumber };
}

export async function notifyNewPaidPayment(
  payment: PaymentWithOrder,
  finishedPayment: PaymentRow,
  options: SendPaymentAlimtalkOptions = {},
) {
  // ponytail: status + deterministic request numbers cover ordinary retries;
  // add a durable outbox only if simultaneous return/webhook duplicates occur.
  if (payment.status === "paid" || finishedPayment.status !== "paid") {
    return false;
  }

  try {
    if (!finishedPayment.paidAt) {
      throw new Error("Paid payment is missing paidAt.");
    }

    await sendPaymentAlimtalk(
      {
        amount: finishedPayment.amount,
        buyerCompany: payment.order.buyerCompany,
        buyerEmail: payment.order.buyerEmail,
        buyerName: payment.order.buyerName,
        buyerPhone: payment.order.buyerPhone,
        channel: payment.order.channel,
        itemSnapshot: payment.order.itemSnapshot,
        orderName: payment.order.orderName,
        orderNumber: payment.order.orderNumber,
        paidAt: finishedPayment.paidAt,
        paymentId: finishedPayment.id,
        publicToken: payment.order.publicToken,
      },
      options,
    );
    return true;
  } catch (error) {
    console.error(
      `[Payment AlimTalk] Failed to notify payment ${finishedPayment.id}.`,
      error,
    );
    return false;
  }
}
