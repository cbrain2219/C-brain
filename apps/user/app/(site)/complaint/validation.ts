export const requiredComplaintFieldNames = [
  "name",
  "email",
  "phone",
  "verificationCode",
  "service",
  "complaintType",
  "detail",
  "privacy",
] as const;

export type RequiredComplaintFieldName =
  (typeof requiredComplaintFieldNames)[number];

export const COMPLAINT_VERIFICATION_CODE_LENGTH = 6;
export const COMPLAINT_TEMP_VERIFICATION_CODE = "123456";
export const COMPLAINT_VERIFICATION_CODE_INPUT_PATTERN = `[0-9]{${COMPLAINT_VERIFICATION_CODE_LENGTH}}`;
export const COMPLAINT_PHONE_INPUT_MAX_LENGTH = 13;
export const COMPLAINT_PHONE_INPUT_PATTERN = "010-[0-9]{4}-[0-9]{4}";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const koreanMobilePhonePattern = /^010-\d{4}-\d{4}$/;
const complaintPhoneDigitMaxLength = 11;

type ComplaintFieldValues = Partial<
  Record<
    RequiredComplaintFieldName,
    boolean | FormDataEntryValue | null | undefined
  >
>;

export function hasComplaintFieldValue(
  value: boolean | FormDataEntryValue | null | undefined,
) {
  if (typeof value === "boolean") return value;

  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

export function isVerificationCodeValid(
  value: boolean | FormDataEntryValue | null | undefined,
) {
  return value === COMPLAINT_TEMP_VERIFICATION_CODE;
}

export function isEmailValid(
  value: boolean | FormDataEntryValue | null | undefined,
) {
  return typeof value === "string" && emailPattern.test(value.trim());
}

export function isPhoneValid(
  value: boolean | FormDataEntryValue | null | undefined,
) {
  return typeof value === "string" && koreanMobilePhonePattern.test(value);
}

export function formatComplaintPhoneNumber(value: string) {
  const digits = value
    .replace(/\D/g, "")
    .slice(0, complaintPhoneDigitMaxLength);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function isComplaintRequiredFieldValid(
  fieldName: RequiredComplaintFieldName,
  value: boolean | FormDataEntryValue | null | undefined,
) {
  if (fieldName === "email") return isEmailValid(value);
  if (fieldName === "phone") return isPhoneValid(value);
  if (fieldName === "verificationCode") return isVerificationCodeValid(value);

  return hasComplaintFieldValue(value);
}

export function getInvalidRequiredComplaintFields(
  values: ComplaintFieldValues,
) {
  return requiredComplaintFieldNames.filter(
    (fieldName) => !isComplaintRequiredFieldValid(fieldName, values[fieldName]),
  );
}

export const getEmptyRequiredComplaintFields =
  getInvalidRequiredComplaintFields;
