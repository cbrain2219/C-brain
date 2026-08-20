import { NextResponse } from "next/server";

import { getPopbillConfig, sendPopbillAlimtalk } from "../../../../lib/popbill";

export const runtime = "nodejs";

const phonePattern = /^010\d{8}$/;
const verificationCodePattern = /^\d{6}$/;

export async function POST(request: Request) {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return invalidRequest();
  }

  if (
    !isRecord(input) ||
    typeof input.phone !== "string" ||
    typeof input.code !== "string" ||
    !phonePattern.test(input.phone) ||
    !verificationCodePattern.test(input.code)
  ) {
    return invalidRequest();
  }

  const templateCode = process.env.POPBILL_TEMPLATE_AUTH_CODE?.trim();

  if (!templateCode || !/^\d{12}$/.test(templateCode)) {
    console.error(
      "[phone-verification-alimtalk] POPBILL_TEMPLATE_AUTH_CODE is invalid",
    );
    return sendFailure();
  }

  try {
    const receiptNumber = await sendPopbillAlimtalk({
      config: getPopbillConfig(),
      content: [
        "[씨브레인] 본인인증 안내",
        "",
        `인증번호 [${input.code}]을(를) 입력해주세요.`,
      ].join("\n"),
      receiver: input.phone,
      receiverName: "",
      requestNumber: crypto.randomUUID(),
      templateCode,
    });

    console.info("[phone-verification-alimtalk] accepted", { receiptNumber });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[phone-verification-alimtalk] failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return sendFailure();
  }
}

function invalidRequest() {
  return NextResponse.json(
    { error: "휴대폰 번호 또는 인증번호 형식이 올바르지 않습니다." },
    { status: 400 },
  );
}

function sendFailure() {
  return NextResponse.json(
    { error: "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요." },
    { status: 502 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
