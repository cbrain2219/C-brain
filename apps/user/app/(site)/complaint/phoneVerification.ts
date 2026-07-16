export type PhoneVerificationRequest = {
  phone: string;
};

export type PhoneVerificationResult =
  | {
      normalizedPhone: string;
      status: "not-configured";
    }
  | {
      normalizedPhone: string;
      requestId?: string;
      status: "requested";
    }
  | {
      message: string;
      normalizedPhone: string;
      status: "failed";
    };

export function normalizePhoneNumber(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function requestPhoneVerification({
  phone,
}: PhoneVerificationRequest): Promise<PhoneVerificationResult> {
  const normalizedPhone = normalizePhoneNumber(phone);

  // Replace this stub with the real verification API call when that work lands.
  return {
    normalizedPhone,
    status: "not-configured",
  };
}
