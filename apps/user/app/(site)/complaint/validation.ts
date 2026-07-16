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
export const COMPLAINT_VERIFICATION_CODE_INPUT_PATTERN = `[0-9]{${COMPLAINT_VERIFICATION_CODE_LENGTH}}`;

type ComplaintFieldValues = Partial<
  Record<
    RequiredComplaintFieldName,
    boolean | FormDataEntryValue | null | undefined
  >
>;

const verificationCodePattern = new RegExp(
  `^\\d{${COMPLAINT_VERIFICATION_CODE_LENGTH}}$`,
);

export function hasComplaintFieldValue(
  value: boolean | FormDataEntryValue | null | undefined,
) {
  if (typeof value === "boolean") return value;

  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

export function isVerificationCodeValid(
  value: boolean | FormDataEntryValue | null | undefined,
) {
  return typeof value === "string" && verificationCodePattern.test(value);
}

export function isComplaintRequiredFieldValid(
  fieldName: RequiredComplaintFieldName,
  value: boolean | FormDataEntryValue | null | undefined,
) {
  return fieldName === "verificationCode"
    ? isVerificationCodeValid(value)
    : hasComplaintFieldValue(value);
}

export function getInvalidRequiredComplaintFields(
  values: ComplaintFieldValues,
) {
  return requiredComplaintFieldNames.filter((fieldName) =>
    !isComplaintRequiredFieldValid(fieldName, values[fieldName]),
  );
}

export const getEmptyRequiredComplaintFields =
  getInvalidRequiredComplaintFields;
