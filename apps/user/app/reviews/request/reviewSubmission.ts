import { portfolioTypes } from "@repo/supabase/categories";
import type { ReviewSubmissionDraftInput } from "@repo/supabase";
import type { Json } from "@repo/supabase/types";

export const reviewProductTypeOptions = [...portfolioTypes, "없음"] as const;

export type ReviewProductType = (typeof reviewProductTypeOptions)[number];

export type ReviewSubmissionValues = {
  companyName: string;
  content: string;
  managerName: string;
  productType: ReviewProductType;
  rating: number;
};

const reviewSubmissionLimits = {
  companyName: 100,
  content: 20_000,
  managerName: 100,
} as const;

const invalidSubmissionMessage = "필수 항목을 모두 올바르게 입력해주세요.";

export function validateReviewSubmission(values: ReviewSubmissionValues) {
  if (
    !isBoundedText(values.companyName, reviewSubmissionLimits.companyName) ||
    !isBoundedText(values.managerName, reviewSubmissionLimits.managerName) ||
    !isBoundedText(values.content, reviewSubmissionLimits.content) ||
    !reviewProductTypeOptions.includes(values.productType) ||
    !Number.isInteger(values.rating) ||
    values.rating < 1 ||
    values.rating > 5
  ) {
    return invalidSubmissionMessage;
  }

  return null;
}

export function parseReviewSubmission(input: unknown) {
  if (
    !isRecord(input) ||
    typeof input.companyName !== "string" ||
    typeof input.managerName !== "string" ||
    typeof input.productType !== "string" ||
    typeof input.rating !== "number" ||
    typeof input.content !== "string"
  ) {
    return invalidSubmission();
  }

  const values = {
    companyName: input.companyName.trim(),
    content: input.content.trim(),
    managerName: input.managerName.trim(),
    productType: input.productType.trim() as ReviewProductType,
    rating: input.rating,
  } satisfies ReviewSubmissionValues;
  const error = validateReviewSubmission(values);

  if (error) return { error, ok: false } as const;

  return { ok: true, values } as const;
}

export function toReviewSubmissionDraftInput(
  values: ReviewSubmissionValues,
): ReviewSubmissionDraftInput {
  const lines = values.content.split(/\r?\n/u);
  const contentJson: Json = {
    content: lines.map((line) => ({
      ...(line
        ? { content: [{ text: line, type: "text" }] }
        : {}),
      type: "paragraph",
    })),
    type: "doc",
  };

  return {
    company_name: values.companyName,
    content: lines.map((line) => `<p>${escapeHtml(line)}</p>`).join(""),
    content_authoring_mode: "wysiwyg",
    content_json: contentJson,
    content_mode: "html",
    content_schema_version: 1,
    manager_name: values.managerName,
    product_type: values.productType,
    rating: values.rating,
  };
}

function isBoundedText(value: string, maxLength: number) {
  const length = value.trim().length;
  return length > 0 && length <= maxLength;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function invalidSubmission() {
  return { error: invalidSubmissionMessage, ok: false } as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
