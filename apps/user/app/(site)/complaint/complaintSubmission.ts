import {
  COMPLAINT_ATTACHMENT_MIME_TYPES,
  MAX_COMPLAINT_ATTACHMENT_COUNT,
  MAX_COMPLAINT_ATTACHMENT_SIZE_BYTES,
} from "../../../constants/complaint";
import { isEmailValid, isPhoneValid } from "./validation";
import { complaintTypeOptions } from "./complaintTypes";

export const serviceOptions = [
  "브로슈어 · 카탈로그",
  "리플렛 · 팜플렛",
  "포스터 · 전단지",
  "배너 · 족자 · 현수막",
  "명함 · 봉투",
  "로고",
  "패키지 · 쇼핑백",
  "촬영",
  "기타",
] as const;

export type ComplaintSubmissionValues = {
  complaintType: string;
  detail: string;
  email: string;
  name: string;
  phone: string;
  privacy: boolean;
  service: string;
  website?: string;
};

export type ComplaintAttachmentMetadata = Pick<File, "name" | "size" | "type">;

export type ComplaintUploadedAttachment = ComplaintAttachmentMetadata & {
  path: string;
};

const complaintSubmissionLimits = {
  complaintType: 100,
  detail: 20_000,
  email: 320,
  name: 100,
  phone: 20,
  service: 100,
} as const;

const requiredFieldError = "필수 항목을 모두 올바르게 입력해주세요.";
const submissionIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createComplaintUploadRequest(
  submissionId: string,
  attachments: ComplaintAttachmentMetadata[],
  values: Pick<
    ComplaintSubmissionValues,
    "complaintType" | "service" | "website"
  >,
) {
  return {
    attachments: attachments.map(({ name, size, type }) => ({
      name,
      size,
      type,
    })),
    complaintType: values.complaintType,
    service: values.service,
    submissionId,
    website: values.website ?? "",
  };
}

export function createComplaintSubmissionPayload(
  values: ComplaintSubmissionValues,
  submissionId: string,
  attachments: ComplaintUploadedAttachment[],
) {
  return { attachments, submissionId, values };
}

export function getComplaintUploadPrefix(submissionId: string) {
  return `inquiry-submissions/${submissionId}`;
}

export function isComplaintSubmissionId(value: unknown): value is string {
  return typeof value === "string" && submissionIdPattern.test(value);
}

export function isComplaintUploadPath(submissionId: string, path: string) {
  const prefix = `${getComplaintUploadPrefix(submissionId)}/`;
  const fileName = path.startsWith(prefix) ? path.slice(prefix.length) : "";

  return /^[0-9a-f-]{36}\.(?:jpe?g|png|webp)$/i.test(fileName);
}

export function validateComplaintAttachments(
  attachments: ComplaintAttachmentMetadata[],
) {
  if (attachments.length > MAX_COMPLAINT_ATTACHMENT_COUNT) {
    return `첨부 파일은 최대 ${MAX_COMPLAINT_ATTACHMENT_COUNT}개까지 등록할 수 있습니다.`;
  }

  if (
    attachments.some(
      (file) =>
        !file.name.trim() ||
        file.name.length > 255 ||
        !Number.isSafeInteger(file.size) ||
        file.size < 0 ||
        file.size > MAX_COMPLAINT_ATTACHMENT_SIZE_BYTES,
    )
  ) {
    return "첨부 파일은 파일당 최대 50MB까지 등록할 수 있습니다.";
  }

  if (
    attachments.some(
      (file) =>
        !COMPLAINT_ATTACHMENT_MIME_TYPES.includes(
          file.type as (typeof COMPLAINT_ATTACHMENT_MIME_TYPES)[number],
        ),
    )
  ) {
    return "첨부 파일은 PNG, JPEG, WEBP 형식만 등록할 수 있습니다.";
  }

  return null;
}

export function validateComplaintSubmission(
  values: ComplaintSubmissionValues,
  attachments: ComplaintAttachmentMetadata[],
) {
  const textFields = [
    "complaintType",
    "detail",
    "email",
    "name",
    "phone",
    "service",
  ] as const;

  if (
    textFields.some((field) => {
      const value = values[field].trim();
      return (
        value.length === 0 || value.length > complaintSubmissionLimits[field]
      );
    }) ||
    !values.privacy ||
    Boolean(values.website?.trim()) ||
    !serviceOptions.includes(
      values.service as (typeof serviceOptions)[number],
    ) ||
    !complaintTypeOptions.some(({ title }) => title === values.complaintType) ||
    !isEmailValid(values.email) ||
    !isPhoneValid(values.phone)
  ) {
    return requiredFieldError;
  }

  return validateComplaintAttachments(attachments);
}

export function parseComplaintUploadRequest(input: unknown) {
  if (
    !isRecord(input) ||
    !isComplaintSubmissionId(input.submissionId) ||
    typeof input.complaintType !== "string" ||
    !complaintTypeOptions.some(({ title }) => title === input.complaintType) ||
    typeof input.service !== "string" ||
    !serviceOptions.includes(
      input.service as (typeof serviceOptions)[number],
    ) ||
    typeof input.website !== "string" ||
    Boolean(input.website.trim())
  ) {
    return invalidSubmission();
  }

  const attachments = parseAttachmentMetadata(input.attachments, false);
  if (!attachments) return invalidSubmission();

  const error = validateComplaintAttachments(attachments);
  if (error) return { error, ok: false } as const;

  return {
    attachments,
    ok: true,
    submissionId: input.submissionId,
  } as const;
}

export function parseComplaintSubmission(input: unknown) {
  if (
    !isRecord(input) ||
    !isComplaintSubmissionId(input.submissionId) ||
    !isRecord(input.values)
  ) {
    return invalidSubmission();
  }

  const values = parseComplaintValues(input.values);
  const attachments = parseAttachmentMetadata(input.attachments, true);
  const submissionId = input.submissionId;

  if (!values || !attachments) return invalidSubmission();

  if (
    attachments.some(
      (attachment) => !isComplaintUploadPath(submissionId, attachment.path),
    ) ||
    new Set(attachments.map(({ path }) => path)).size !== attachments.length
  ) {
    return invalidSubmission();
  }

  const error = validateComplaintSubmission(values, attachments);
  if (error) return { error, ok: false } as const;

  return {
    attachments,
    ok: true,
    submissionId,
    values,
  } as const;
}

export function parseComplaintCleanupRequest(input: unknown) {
  if (!isRecord(input) || !isComplaintSubmissionId(input.submissionId)) {
    return invalidSubmission();
  }

  const submissionId = input.submissionId;

  if (
    !Array.isArray(input.paths) ||
    input.paths.length > MAX_COMPLAINT_ATTACHMENT_COUNT ||
    input.paths.some(
      (path) =>
        typeof path !== "string" || !isComplaintUploadPath(submissionId, path),
    )
  ) {
    return invalidSubmission();
  }

  return {
    ok: true,
    paths: input.paths as string[],
    submissionId,
  } as const;
}

export function toComplaintInquiryInput(
  values: ComplaintSubmissionValues,
  privacyAgreedAt: string,
) {
  return {
    complaint_type: values.complaintType.trim(),
    content: values.detail.trim(),
    email: values.email.trim(),
    name: values.name.trim(),
    phone: values.phone,
    phone_verified: false,
    privacy_agreed_at: privacyAgreedAt,
    service: values.service.trim(),
    status: "received" as const,
    title: `${values.complaintType.trim()} - ${values.service.trim()}`,
    user_id: null,
  };
}

function invalidSubmission() {
  return { error: "접수 형식이 올바르지 않습니다.", ok: false } as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAttachmentMetadata(
  value: unknown,
  includePath: false,
): ComplaintAttachmentMetadata[] | null;
function parseAttachmentMetadata(
  value: unknown,
  includePath: true,
): ComplaintUploadedAttachment[] | null;
function parseAttachmentMetadata(value: unknown, includePath: boolean) {
  if (!Array.isArray(value)) return null;

  const attachments = value.map((attachment) => {
    if (
      !isRecord(attachment) ||
      typeof attachment.name !== "string" ||
      typeof attachment.size !== "number" ||
      typeof attachment.type !== "string" ||
      (includePath && typeof attachment.path !== "string")
    ) {
      return null;
    }

    return includePath
      ? {
          name: attachment.name,
          path: attachment.path as string,
          size: attachment.size,
          type: attachment.type,
        }
      : {
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
        };
  });

  return attachments.includes(null) ? null : attachments;
}

function parseComplaintValues(
  value: Record<string, unknown>,
): ComplaintSubmissionValues | null {
  const stringFields = [
    "complaintType",
    "detail",
    "email",
    "name",
    "phone",
    "service",
  ] as const;

  if (
    stringFields.some((field) => typeof value[field] !== "string") ||
    typeof value.privacy !== "boolean"
  ) {
    return null;
  }

  return {
    complaintType: (value.complaintType as string).trim(),
    detail: (value.detail as string).trim(),
    email: (value.email as string).trim(),
    name: (value.name as string).trim(),
    phone: (value.phone as string).replace(/\D/g, ""),
    privacy: value.privacy,
    service: (value.service as string).trim(),
    website: typeof value.website === "string" ? value.website.trim() : "",
  };
}
