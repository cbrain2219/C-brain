import "server-only";

import {
  getPopbillConfig,
  sendPopbillAlimtalk,
  type PopbillConfig,
  type PopbillKakaoService,
} from "./popbill";

type Environment = Record<string, string | undefined>;

type ComplaintAlimtalkInput = {
  complaintType: string;
  createdAt: string;
  email: string;
  id: string;
  name: string;
  phone: string;
  service: string;
};

type ComplaintAlimtalkConfig = PopbillConfig & {
  adminAppUrl: string;
  receiver: string;
  templateCode: string;
};

type SendComplaintAlimtalkOptions = {
  environment?: Environment;
  service?: Pick<PopbillKakaoService, "sendATS_one">;
  timeoutMs?: number;
};

function requireEnvironmentValue(environment: Environment, name: string) {
  const value = environment[name]?.trim();

  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function normalizeTemplateValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

const koreanDateTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

function formatKoreanDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Complaint creation date must be a valid ISO date.");
  }

  return koreanDateTimeFormatter.format(date);
}

export function getComplaintAlimtalkConfig(
  environment: Environment = process.env,
): ComplaintAlimtalkConfig {
  const popbill = getPopbillConfig(environment);
  const receiverEnvironmentName =
    environment.VERCEL_ENV?.trim() === "production"
      ? "POPBILL_ADMIN_PHONE_LIVE"
      : "POPBILL_ADMIN_PHONE_DEV";
  const receiver = requireEnvironmentValue(
    environment,
    receiverEnvironmentName,
  ).replace(/[-\s]/g, "");
  const templateCode = requireEnvironmentValue(
    environment,
    "POPBILL_TEMPLATE_COMPLAINT",
  );
  const adminAppUrl = requireEnvironmentValue(environment, "ADMIN_APP_URL");
  let parsedAdminAppUrl: URL;

  if (!/^\d{10,11}$/.test(receiver)) {
    throw new Error(`${receiverEnvironmentName} must contain 10 or 11 digits.`);
  }

  if (!/^\d{12}$/.test(templateCode)) {
    throw new Error("POPBILL_TEMPLATE_COMPLAINT must be exactly 12 digits.");
  }

  try {
    parsedAdminAppUrl = new URL(adminAppUrl);
  } catch {
    throw new Error("ADMIN_APP_URL must be an absolute URL.");
  }

  if (parsedAdminAppUrl.protocol !== "https:") {
    throw new Error("ADMIN_APP_URL must use HTTPS for the approved button.");
  }

  if (
    parsedAdminAppUrl.username ||
    parsedAdminAppUrl.password ||
    parsedAdminAppUrl.pathname !== "/" ||
    parsedAdminAppUrl.search ||
    parsedAdminAppUrl.hash
  ) {
    throw new Error(
      "ADMIN_APP_URL must be an origin without path or credentials.",
    );
  }

  return {
    ...popbill,
    adminAppUrl: parsedAdminAppUrl.origin,
    receiver,
    templateCode,
  };
}

export function createComplaintAlimtalkContent(
  complaint: ComplaintAlimtalkInput,
) {
  return [
    `▪ 접수자: ${normalizeTemplateValue(complaint.name)}`,
    `▪ 연락처: ${normalizeTemplateValue(complaint.phone)}`,
    `▪ 이메일: ${normalizeTemplateValue(complaint.email)}`,
    `▪ 이용 서비스: ${normalizeTemplateValue(complaint.service)}`,
    `▪ 불편 유형: ${normalizeTemplateValue(complaint.complaintType)}`,
    `▪ 접수 시각: ${formatKoreanDateTime(complaint.createdAt)}`,
    "",
    "상세 내용 및 첨부파일은 관리자 페이지에서 확인해주세요.",
  ].join("\n");
}

export async function sendComplaintAlimtalk(
  complaint: ComplaintAlimtalkInput,
  options: SendComplaintAlimtalkOptions = {},
) {
  const config = getComplaintAlimtalkConfig(options.environment ?? process.env);
  const detailUrl = new URL(
    `/complaints/${encodeURIComponent(complaint.id)}`,
    config.adminAppUrl,
  ).toString();

  return sendPopbillAlimtalk(
    {
      buttons: [{ n: "상세보기", t: "WL", u1: detailUrl, u2: detailUrl }],
      config,
      content: createComplaintAlimtalkContent(complaint),
      receiver: config.receiver,
      receiverName: "관리자",
      requestNumber: complaint.id,
      templateCode: config.templateCode,
    },
    {
      service: options.service,
      timeoutMs: options.timeoutMs,
    },
  );
}
