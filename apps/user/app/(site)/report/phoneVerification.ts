export type PhoneVerificationRequest = {
  phone: string;
};

export type PhoneVerificationResult = {
  normalizedPhone: string;
  status: "requested";
  verificationCode: string;
};

export function normalizePhoneNumber(phone: string) {
  return phone.replace(/\D/g, "");
}

function createVerificationCode() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);

  return String((values[0] ?? 0) % 1_000_000).padStart(6, "0");
}

export async function requestPhoneVerification(
  { phone }: PhoneVerificationRequest,
  fetcher: typeof fetch = fetch,
): Promise<PhoneVerificationResult> {
  const normalizedPhone = normalizePhoneNumber(phone);
  const verificationCode = createVerificationCode();
  const response = await fetcher("/api/complaints/phone-verification", {
    body: JSON.stringify({
      code: verificationCode,
      phone: normalizedPhone,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const result = (await response.json().catch(() => null)) as {
    error?: unknown;
  } | null;

  if (!response.ok) {
    throw new Error(
      typeof result?.error === "string"
        ? result.error
        : "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.",
    );
  }

  return {
    normalizedPhone,
    status: "requested",
    verificationCode,
  };
}
