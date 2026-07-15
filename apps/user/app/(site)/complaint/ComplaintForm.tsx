"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  useRef,
  useState,
} from "react";

import { Icon } from "../../../components/Icon";
import styles from "../../page.module.css";
import {
  getAcceptedAttachmentFiles,
  getDisplayAttachmentFiles,
  MAX_COMPLAINT_ATTACHMENT_COUNT,
} from "./attachments";
import {
  COMPLAINT_VERIFICATION_CODE_INPUT_PATTERN,
  COMPLAINT_VERIFICATION_CODE_LENGTH,
  getInvalidRequiredComplaintFields,
  hasComplaintFieldValue,
  isComplaintRequiredFieldValid,
  type RequiredComplaintFieldName,
} from "./validation";
import {
  requestPhoneVerification,
  type PhoneVerificationResult,
} from "./phoneVerification";

const serviceOptions = ["디자인", "상세페이지", "브랜딩", "인쇄물", "기타"];

const complaintTypeOptions = [
  "상담/응대",
  "주문/결제",
  "제작/수정",
  "배송/전달",
  "기타",
];

type RequiredFieldControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

export function ComplaintForm() {
  const [invalidFieldNames, setInvalidFieldNames] = useState<
    RequiredComplaintFieldName[]
  >([]);
  const [isRequestingPhoneVerification, setIsRequestingPhoneVerification] =
    useState(false);
  const [phoneVerificationResult, setPhoneVerificationResult] =
    useState<PhoneVerificationResult | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const fieldRefs = useRef<
    Partial<Record<RequiredComplaintFieldName, HTMLElement>>
  >({});
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const displayAttachmentFiles = getDisplayAttachmentFiles(attachmentFiles);

  const isFieldInvalid = (fieldName: RequiredComplaintFieldName) =>
    invalidFieldNames.includes(fieldName);

  const setFieldRef =
    (fieldName: RequiredComplaintFieldName) => (node: HTMLElement | null) => {
      if (node) {
        fieldRefs.current[fieldName] = node;
        return;
      }

      delete fieldRefs.current[fieldName];
    };

  const clearFieldError = (
    fieldName: RequiredComplaintFieldName,
    value: boolean | FormDataEntryValue | null | undefined,
  ) => {
    if (!isComplaintRequiredFieldValid(fieldName, value)) return;

    setInvalidFieldNames((current) =>
      current.filter((currentFieldName) => currentFieldName !== fieldName),
    );
  };

  const markFieldInvalid = (fieldName: RequiredComplaintFieldName) => {
    setInvalidFieldNames((current) =>
      current.includes(fieldName) ? current : [...current, fieldName],
    );
  };

  const scrollToField = (fieldName: RequiredComplaintFieldName) => {
    // Wait for invalid state styles to commit before scrolling and moving focus.
    window.requestAnimationFrame(() => {
      const field = fieldRefs.current[fieldName];
      const control = field?.querySelector("input, select, textarea");

      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (control instanceof HTMLElement) {
        control.focus({ preventScroll: true });
      }
    });
  };

  const handleRequiredFieldChange = (
    event: ChangeEvent<RequiredFieldControl>,
  ) => {
    const fieldName = event.currentTarget.dataset.requiredFieldName as
      | RequiredComplaintFieldName
      | undefined;

    if (!fieldName) return;

    const value =
      event.currentTarget instanceof HTMLInputElement &&
      event.currentTarget.type === "checkbox"
        ? event.currentTarget.checked
        : event.currentTarget.value;

    clearFieldError(fieldName, value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const emptyFieldNames = getInvalidRequiredComplaintFields({
      complaintType: formData.get("complaintType"),
      detail: formData.get("detail"),
      email: formData.get("email"),
      name: formData.get("name"),
      phone: formData.get("phone"),
      privacy: formData.get("privacy"),
      service: formData.get("service"),
      verificationCode: formData.get("verificationCode"),
    });

    setInvalidFieldNames(emptyFieldNames);

    const firstEmptyFieldName = emptyFieldNames[0];
    if (firstEmptyFieldName) {
      scrollToField(firstEmptyFieldName);
    }
  };

  const handleRequestPhoneVerification = async () => {
    const phoneField = fieldRefs.current.phone;
    const phoneInput = phoneField?.querySelector<HTMLInputElement>(
      'input[name="phone"]',
    );
    const phone = phoneInput?.value ?? "";

    if (!hasComplaintFieldValue(phone)) {
      markFieldInvalid("phone");
      scrollToField("phone");
      return;
    }

    clearFieldError("phone", phone);
    setIsRequestingPhoneVerification(true);

    try {
      const result = await requestPhoneVerification({ phone });
      setPhoneVerificationResult(result);
    } finally {
      setIsRequestingPhoneVerification(false);
    }
  };

  const syncAttachmentInputFiles = (files: File[]) => {
    const input = attachmentInputRef.current;

    if (!input) return;

    if (typeof DataTransfer === "undefined") {
      // Partial FileList edits need DataTransfer; clear native input to avoid stale deleted files.
      input.value = "";
      return;
    }

    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;
  };

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = getAcceptedAttachmentFiles(
      Array.from(event.target.files ?? []),
    );

    setAttachmentFiles(nextFiles);
    syncAttachmentInputFiles(nextFiles);
  };

  const handleRemoveAttachment = (fileId: string) => {
    const displayFiles = getDisplayAttachmentFiles(attachmentFiles);
    const nextFiles = attachmentFiles.filter(
      (_, index) => displayFiles[index]?.id !== fileId,
    );

    setAttachmentFiles(nextFiles);
    syncAttachmentInputFiles(nextFiles);
  };

  const handleRemoveAttachmentClick = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const fileId = event.currentTarget.dataset.attachmentId;

    if (fileId) {
      handleRemoveAttachment(fileId);
    }
  };

  return (
    <form className={styles.complaintForm} noValidate onSubmit={handleSubmit}>
      <div className={styles.complaintFields}>
        <div className={styles.complaintFieldGrid}>
          <label
            className={styles.complaintField}
            data-invalid={isFieldInvalid("name")}
            ref={setFieldRef("name")}
          >
            <span>이름*</span>
            <input
              aria-invalid={isFieldInvalid("name")}
              autoComplete="name"
              data-required-field-name="name"
              name="name"
              onChange={handleRequiredFieldChange}
              placeholder="성함을 입력해주세요."
              required
              type="text"
            />
          </label>

          <label
            className={styles.complaintField}
            data-invalid={isFieldInvalid("email")}
            ref={setFieldRef("email")}
          >
            <span>이메일*</span>
            <input
              aria-invalid={isFieldInvalid("email")}
              autoComplete="email"
              data-required-field-name="email"
              name="email"
              onChange={handleRequiredFieldChange}
              placeholder="답변 받으실 이메일 주소를 입력해주세요."
              required
              type="email"
            />
          </label>
        </div>

        <div className={styles.complaintPhoneGroup}>
          <label
            className={styles.complaintField}
            data-invalid={isFieldInvalid("phone")}
            ref={setFieldRef("phone")}
          >
            <span>휴대폰 번호*</span>
            <span className={styles.complaintPhoneRow}>
              <input
                aria-invalid={isFieldInvalid("phone")}
                autoComplete="tel"
                data-required-field-name="phone"
                inputMode="numeric"
                name="phone"
                onChange={handleRequiredFieldChange}
                placeholder="휴대폰 번호를 입력해주세요.(‘-’ 제외)"
                required
                type="tel"
              />
              <button
                aria-busy={isRequestingPhoneVerification}
                className={styles.complaintVerifyButton}
                data-verification-status={
                  phoneVerificationResult?.status ?? "idle"
                }
                disabled={isRequestingPhoneVerification}
                onClick={handleRequestPhoneVerification}
                type="button"
              >
                {isRequestingPhoneVerification ? "요청중" : "인증요청"}
              </button>
            </span>
          </label>

          <label
            className={styles.complaintField}
            data-invalid={isFieldInvalid("verificationCode")}
            ref={setFieldRef("verificationCode")}
          >
            <span className={styles.complaintVisuallyHidden}>
              휴대폰 인증번호
            </span>
            <input
              aria-invalid={isFieldInvalid("verificationCode")}
              data-required-field-name="verificationCode"
              inputMode="numeric"
              maxLength={COMPLAINT_VERIFICATION_CODE_LENGTH}
              minLength={COMPLAINT_VERIFICATION_CODE_LENGTH}
              name="verificationCode"
              onChange={handleRequiredFieldChange}
              pattern={COMPLAINT_VERIFICATION_CODE_INPUT_PATTERN}
              placeholder={`인증번호 ${COMPLAINT_VERIFICATION_CODE_LENGTH}자리를 입력해주세요.`}
              required
              type="text"
            />
          </label>
        </div>

        <div className={styles.complaintFieldGrid}>
          <label
            className={styles.complaintField}
            data-invalid={isFieldInvalid("service")}
            ref={setFieldRef("service")}
          >
            <span>이용 서비스*</span>
            <span className={styles.complaintSelectWrap}>
              <select
                aria-invalid={isFieldInvalid("service")}
                data-required-field-name="service"
                defaultValue=""
                name="service"
                onChange={handleRequiredFieldChange}
                required
              >
                <option disabled value="">
                  이용 서비스를 선택해주세요.
                </option>
                {serviceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" size={24} />
            </span>
          </label>

          <label
            className={styles.complaintField}
            data-invalid={isFieldInvalid("complaintType")}
            ref={setFieldRef("complaintType")}
          >
            <span>불편 유형*</span>
            <span className={styles.complaintSelectWrap}>
              <select
                aria-invalid={isFieldInvalid("complaintType")}
                data-required-field-name="complaintType"
                defaultValue=""
                name="complaintType"
                onChange={handleRequiredFieldChange}
                required
              >
                <option disabled value="">
                  불편 유형을 선택해주세요.
                </option>
                {complaintTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" size={24} />
            </span>
          </label>
        </div>

        <label
          className={styles.complaintField}
          data-invalid={isFieldInvalid("detail")}
          ref={setFieldRef("detail")}
        >
          <span>상세 내용*</span>
          <textarea
            aria-invalid={isFieldInvalid("detail")}
            data-required-field-name="detail"
            name="detail"
            onChange={handleRequiredFieldChange}
            placeholder={`빠른 사실확인 및 안내를 위해 경위를 최대한 자세하게 작성해주세요.
본문에 불건전 내용이나 욕설 등을 남기면 등록이 어려워요.`}
            required
          />
        </label>

        <div className={styles.complaintAttachmentField}>
          <label className={styles.complaintField}>
            <span>첨부 파일</span>
            <span className={styles.complaintFileDrop}>
              <span className={styles.complaintFileIcon}>
                <Icon name="folder-up-02" size={20} />
              </span>
              <span className={styles.complaintFileText}>
                <strong>
                  {`파일을 드래그 또는 클릭 후 파일 업로드 (${displayAttachmentFiles.length}/${MAX_COMPLAINT_ATTACHMENT_COUNT})`}
                </strong>
                <span>PNG, JPEG, WEBP 등 / 최대 50MB 제한</span>
              </span>
              <input
                aria-label="첨부 파일 업로드"
                multiple
                name="attachments"
                onChange={handleAttachmentChange}
                ref={attachmentInputRef}
                type="file"
              />
            </span>
          </label>

          {displayAttachmentFiles.length > 0 ? (
            <ul
              aria-label="첨부 파일 목록"
              className={styles.complaintAttachmentList}
            >
              {displayAttachmentFiles.map((file) => (
                <li className={styles.complaintAttachmentItem} key={file.id}>
                  <span className={styles.complaintAttachmentDetails}>
                    <span className={styles.complaintAttachmentName}>
                      {file.name}
                    </span>
                    <span className={styles.complaintAttachmentSize}>
                      {file.sizeLabel}
                    </span>
                  </span>
                  <button
                    aria-label={`${file.name} 첨부파일 삭제`}
                    className={styles.complaintAttachmentRemoveButton}
                    data-attachment-id={file.id}
                    onClick={handleRemoveAttachmentClick}
                    type="button"
                  >
                    <Icon name="x-close" size={24} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div
          className={styles.complaintConsent}
          data-invalid={isFieldInvalid("privacy")}
          ref={setFieldRef("privacy")}
        >
          <label>
            <input
              aria-invalid={isFieldInvalid("privacy")}
              data-required-field-name="privacy"
              defaultChecked
              name="privacy"
              onChange={handleRequiredFieldChange}
              required
              type="checkbox"
            />
            <span className={styles.complaintConsentBox} />
            <span>개인정보 수집 및 이용 동의</span>
          </label>
          <a href="#privacy-policy" rel="noreferrer" target="_blank">
            보기
          </a>
        </div>
      </div>

      <button className={styles.complaintSubmitButton} type="submit">
        <Icon name="edit-03" size={24} />
        <span>불편사항 접수하기</span>
      </button>
    </form>
  );
}
