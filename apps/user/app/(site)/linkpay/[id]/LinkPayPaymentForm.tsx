"use client";

import { type ChangeEvent, type FormEvent, useRef, useState } from "react";

import { formatOrderCurrency } from "../../../_content/order";
import { Icon } from "../../../../components/Icon";
import {
  parseNicepayCheckoutRequest,
  requestNicepayPayment,
} from "../../../../lib/paymentCheckout";
import styles from "./page.module.css";

type AgreementId = "privacyCollection" | "privacyPolicy";
type CustomerFieldId =
  | "customerName"
  | "customerCompany"
  | "customerPhone"
  | "customerEmail";
type RequiredCustomerFieldId = Exclude<CustomerFieldId, "customerCompany">;
type LinkPayValidationTarget = CustomerFieldId | AgreementId;

type LinkPayPaymentFormProps = {
  payment: LinkPayPayment;
};

export type LinkPayPayment = {
  amount: number;
  category: string;
  clientName: string;
  isDisabled: boolean;
  pageQuantity: string;
  paper: string;
  paymentName: string;
  publicToken: string;
  service: string;
};

const agreementItems = [
  {
    href: "/privacy-collection",
    id: "privacyCollection",
    label: "개인정보 수집 및 이용에 동의합니다.",
  },
  {
    href: "/privacy-policy",
    id: "privacyPolicy",
    label: "개인정보 처리방침에 동의합니다.",
  },
] as const satisfies ReadonlyArray<{
  href: string;
  id: AgreementId;
  label: string;
}>;

const requiredCustomerFieldIds = [
  "customerName",
  "customerPhone",
  "customerEmail",
] as const satisfies ReadonlyArray<RequiredCustomerFieldId>;

const validationTargetsInOrder = [
  "customerName",
  "customerPhone",
  "customerEmail",
  "privacyCollection",
  "privacyPolicy",
] as const satisfies ReadonlyArray<LinkPayValidationTarget>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const koreanMobilePhonePattern = /^01[016789]\d{7,8}$/;

const customerFields = [
  {
    autoComplete: "name",
    id: "linkpay-customer-name",
    label: "이름(담당자명)*",
    name: "customerName",
    placeholder: "이름을 입력해주세요.",
    required: true,
    type: "text",
  },
  {
    autoComplete: "organization",
    id: "linkpay-customer-company",
    label: "회사명",
    name: "customerCompany",
    placeholder: "회사명을 입력해주세요.",
    type: "text",
  },
  {
    autoComplete: "tel",
    helper: "카카오톡 상담 연락처",
    id: "linkpay-customer-phone",
    inputMode: "numeric",
    label: "연락처*",
    maxLength: 13,
    name: "customerPhone",
    placeholder: "전화번호를 입력해주세요.",
    required: true,
    type: "tel",
  },
  {
    autoComplete: "email",
    helper: "영수증·파일 전달",
    id: "linkpay-customer-email",
    inputMode: "email",
    label: "이메일*",
    name: "customerEmail",
    placeholder: "이메일을 입력해주세요.",
    required: true,
    type: "email",
  },
] as const;

const customerFieldDefaultValues = {
  customerCompany: "",
  customerEmail: "",
  customerName: "",
  customerPhone: "",
} satisfies Record<CustomerFieldId, string>;

function normalizeCustomerPhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

function formatCustomerPhoneNumber(value: string) {
  const digits = normalizeCustomerPhoneNumber(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function sanitizeCustomerEmail(value: string) {
  return value.replace(/[^A-Za-z0-9.!#$%&'*+/=?^_\x60{|}~@-]/g, "");
}

function formatCustomerFieldValue(fieldName: CustomerFieldId, value: string) {
  if (fieldName === "customerPhone") {
    return formatCustomerPhoneNumber(value);
  }

  if (fieldName === "customerEmail") {
    return sanitizeCustomerEmail(value);
  }

  return value;
}

function isRequiredCustomerFieldId(
  fieldName: CustomerFieldId,
): fieldName is RequiredCustomerFieldId {
  return requiredCustomerFieldIds.some(
    (requiredFieldName) => requiredFieldName === fieldName,
  );
}

function isCustomerFieldValid(fieldName: RequiredCustomerFieldId, value: string) {
  if (fieldName === "customerEmail") {
    return emailPattern.test(value.trim());
  }

  if (fieldName === "customerPhone") {
    return koreanMobilePhonePattern.test(normalizeCustomerPhoneNumber(value));
  }

  return value.trim().length > 0;
}

export function LinkPayPaymentForm({
  payment,
}: LinkPayPaymentFormProps) {
  const checkoutAttemptRef = useRef<{
    payloadKey: string;
    requestId: string;
  } | null>(null);
  const isSubmittingRef = useRef(false);
  const validationTargetRefs = useRef<
    Partial<Record<LinkPayValidationTarget, HTMLElement>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldValues, setFieldValues] = useState(customerFieldDefaultValues);
  const [invalidTargets, setInvalidTargets] = useState<
    Partial<Record<LinkPayValidationTarget, boolean>>
  >({});
  const [agreements, setAgreements] = useState<Record<AgreementId, boolean>>({
    privacyCollection: false,
    privacyPolicy: false,
  });
  const isAllAgreed = agreementItems.every((item) => agreements[item.id]);
  const isTargetInvalid = (target: LinkPayValidationTarget) =>
    Boolean(invalidTargets[target]);

  const setValidationTargetRef =
    (target: LinkPayValidationTarget) => (node: HTMLElement | null) => {
      if (node) {
        validationTargetRefs.current[target] = node;
        return;
      }

      delete validationTargetRefs.current[target];
    };

  const clearInvalidTarget = (target: LinkPayValidationTarget) => {
    setInvalidTargets((current) => {
      if (!current[target]) return current;

      const nextTargets = { ...current };
      delete nextTargets[target];

      return nextTargets;
    });
  };

  const scrollToValidationTarget = (target: LinkPayValidationTarget) => {
    window.requestAnimationFrame(() => {
      const field = validationTargetRefs.current[target];
      const control = field?.querySelector("input");

      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (control instanceof HTMLElement) {
        control.focus({ preventScroll: true });
      }
    });
  };

  const handleCustomerFieldChange =
    (fieldName: CustomerFieldId) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = formatCustomerFieldValue(
        fieldName,
        event.currentTarget.value,
      );

      setFieldValues((current) => ({
        ...current,
        [fieldName]: value,
      }));

      if (
        isRequiredCustomerFieldId(fieldName) &&
        isCustomerFieldValid(fieldName, value)
      ) {
        clearInvalidTarget(fieldName);
      }
    };

  const toggleAllAgreements = () => {
    const nextValue = !isAllAgreed;

    setAgreements({
      privacyCollection: nextValue,
      privacyPolicy: nextValue,
    });

    if (nextValue) {
      clearInvalidTarget("privacyCollection");
      clearInvalidTarget("privacyPolicy");
    }
  };

  const toggleAgreement = (id: AgreementId) => {
    if (!agreements[id]) {
      clearInvalidTarget(id);
    }

    setAgreements((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextInvalidTargets: Partial<
      Record<LinkPayValidationTarget, boolean>
    > = {};

    for (const fieldName of requiredCustomerFieldIds) {
      if (!isCustomerFieldValid(fieldName, fieldValues[fieldName])) {
        nextInvalidTargets[fieldName] = true;
      }
    }

    for (const item of agreementItems) {
      if (!agreements[item.id]) {
        nextInvalidTargets[item.id] = true;
      }
    }

    setInvalidTargets(nextInvalidTargets);

    const firstInvalidTarget = validationTargetsInOrder.find(
      (target) => nextInvalidTargets[target],
    );

    if (firstInvalidTarget) {
      scrollToValidationTarget(firstInvalidTarget);
      return;
    }

    if (payment.isDisabled || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError("");

    const releaseSubmission = () => {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    };
    const checkoutPayload = {
      agreements,
      customer: {
        company: fieldValues.customerCompany,
        email: fieldValues.customerEmail,
        name: fieldValues.customerName,
        phone: normalizeCustomerPhoneNumber(fieldValues.customerPhone),
      },
    };
    const payloadKey = JSON.stringify(checkoutPayload);
    const previousAttempt = checkoutAttemptRef.current;
    const checkoutRequestId =
      previousAttempt?.payloadKey === payloadKey
        ? previousAttempt.requestId
        : crypto.randomUUID();

    checkoutAttemptRef.current = { payloadKey, requestId: checkoutRequestId };

    try {
      const response = await fetch(
        `/api/linkpay/${encodeURIComponent(payment.publicToken)}/order`,
        {
          body: JSON.stringify({ ...checkoutPayload, checkoutRequestId }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const result: unknown = await response.json();
      const checkout = parseNicepayCheckoutRequest(result);
      const errorMessage =
        result &&
        typeof result === "object" &&
        "error" in result &&
        typeof result.error === "string"
          ? result.error
          : "결제 요청을 준비하지 못했습니다.";

      if (!response.ok || !checkout) {
        throw new Error(errorMessage);
      }

      await requestNicepayPayment(checkout, (message) => {
        setSubmitError(message);
        releaseSubmission();
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "결제 요청을 준비하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
      releaseSubmission();
    }
  };

  return (
    <section className={styles.linkPaySection} aria-labelledby="linkpay-title">
      <div className={styles.linkPayInner}>
        <div className={styles.linkPayHeader}>
          <h1 id="linkpay-title">
            {payment.clientName}의 {payment.paymentName} 카드 결제
          </h1>
          <p>
            결제 완료 후 영업일 기준 1일 이내 배정 담당자가 카카오톡으로 집중
            상담 및 제작 일정을 안내드립니다.
          </p>
        </div>

        <section
          className={styles.paymentCard}
          aria-labelledby="linkpay-payment-title"
        >
          <h2 id="linkpay-payment-title">결제 내역</h2>
          <dl className={styles.paymentDetailList}>
            {[
              { label: "카테고리", value: payment.category },
              { label: "서비스", value: payment.service },
              { label: "용지", value: payment.paper },
              { label: "페이지 수 / 수량", value: payment.pageQuantity },
            ].map((row) => (
              <div key={`${row.label}-${row.value}`}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.paymentDivider} />
          <div className={styles.paymentTotal}>
            <span>합계</span>
            <strong>{formatOrderCurrency(payment.amount)}</strong>
          </div>
        </section>

        <form
          className={styles.customerForm}
          noValidate
          onSubmit={handlePaymentSubmit}
        >
          {payment.isDisabled ? (
            <p role="status">현재 결제가 중단된 링크입니다.</p>
          ) : null}
          {submitError ? <p role="alert">{submitError}</p> : null}
          {customerFields.map((field) => (
            <div
              className={styles.customerField}
              data-invalid={isTargetInvalid(field.name)}
              key={field.id}
              ref={setValidationTargetRef(field.name)}
            >
              <div className={styles.customerLabelRow}>
                <label htmlFor={field.id}>{field.label}</label>
                {"helper" in field ? <span>{field.helper}</span> : null}
              </div>
              <input
                aria-invalid={isTargetInvalid(field.name)}
                autoComplete={field.autoComplete}
                className={styles.customerInput}
                id={field.id}
                inputMode={"inputMode" in field ? field.inputMode : undefined}
                maxLength={"maxLength" in field ? field.maxLength : undefined}
                name={field.name}
                onChange={handleCustomerFieldChange(field.name)}
                placeholder={field.placeholder}
                required={"required" in field ? field.required : undefined}
                type={field.type}
                value={fieldValues[field.name]}
              />
            </div>
          ))}

          <section className={styles.agreementList} aria-label="약관 동의">
            <label className={styles.agreementRow}>
              <input
                checked={isAllAgreed}
                className={styles.agreementCheckboxInput}
                onChange={toggleAllAgreements}
                type="checkbox"
              />
              <span className={styles.agreementCheckboxMark} aria-hidden="true">
                <Icon
                  className={styles.agreementCheckboxIcon}
                  name="check-01"
                  size={20}
                />
              </span>
              <strong>전체 동의</strong>
            </label>

            <div className={styles.agreementDivider} />

            <div className={styles.agreementDetailList}>
              {agreementItems.map((item) => (
                <div className={styles.agreementDetailRow} key={item.id}>
                  <label
                    className={styles.agreementRow}
                    data-invalid={isTargetInvalid(item.id)}
                    ref={setValidationTargetRef(item.id)}
                  >
                    <input
                      aria-invalid={isTargetInvalid(item.id)}
                      checked={agreements[item.id]}
                      className={styles.agreementCheckboxInput}
                      onChange={() => toggleAgreement(item.id)}
                      required
                      type="checkbox"
                    />
                    <span
                      className={styles.agreementCheckboxMark}
                      aria-hidden="true"
                    >
                      <Icon
                        className={styles.agreementCheckboxIcon}
                        name="check-01"
                        size={20}
                      />
                    </span>
                    <span>{item.label}</span>
                  </label>
                  <a
                    className={styles.agreementViewButton}
                    href={item.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    보기
                  </a>
                </div>
              ))}
            </div>
          </section>

          <button
            aria-busy={isSubmitting}
            className={styles.paymentButton}
            disabled={isSubmitting || payment.isDisabled}
            type="submit"
          >
            <span>{payment.isDisabled ? "결제가 중단되었습니다" : "결제하기"}</span>
            <Icon name="arrow-right" size={16} />
          </button>
        </form>
      </div>
    </section>
  );
}
