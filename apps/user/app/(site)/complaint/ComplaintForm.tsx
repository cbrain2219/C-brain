"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
  useRef,
  useState,
} from "react";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";

import { Icon } from "../../../components/Icon";
import styles from "../../page.module.css";
import {
  getAcceptedAttachmentFiles,
  getDisplayAttachmentFiles,
  MAX_COMPLAINT_ATTACHMENT_COUNT,
} from "./attachments";
import {
  complaintTypeOptions,
  getComplaintTypeDescription,
} from "./complaintTypes";
import {
  COMPLAINT_VERIFICATION_CODE_INPUT_PATTERN,
  COMPLAINT_VERIFICATION_CODE_LENGTH,
  isComplaintRequiredFieldValid,
  requiredComplaintFieldNames,
  type RequiredComplaintFieldName,
} from "./validation";
import {
  requestPhoneVerification,
  type PhoneVerificationResult,
} from "./phoneVerification";

const serviceOptions = [
  "브로슈어 · 카탈로그",
  "리플렛 · 팜플렛",
  "포스터 · 전단지",
  "배너 · 족자 · 현수막",
  "명함 · 봉투",
  "로고",
  "패키지 · 쇼핑백",
  "촬영",
  "기타",
];

type ComplaintFormValues = {
  complaintType: string;
  detail: string;
  email: string;
  name: string;
  phone: string;
  privacy: boolean;
  service: string;
  verificationCode: string;
};

const complaintFormDefaultValues: ComplaintFormValues = {
  complaintType: "",
  detail: "",
  email: "",
  name: "",
  phone: "",
  privacy: true,
  service: "",
  verificationCode: "",
};

export function ComplaintForm() {
  const [isRequestingPhoneVerification, setIsRequestingPhoneVerification] =
    useState(false);
  const [phoneVerificationResult, setPhoneVerificationResult] =
    useState<PhoneVerificationResult | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const fieldRefs = useRef<
    Partial<Record<RequiredComplaintFieldName, HTMLElement>>
  >({});
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const successDialogRef = useRef<HTMLDialogElement>(null);
  const displayAttachmentFiles = getDisplayAttachmentFiles(attachmentFiles);
  const {
    clearErrors,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm<ComplaintFormValues>({
    defaultValues: complaintFormDefaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });
  const selectedComplaintType = watch("complaintType");
  const selectedComplaintTypeDescription = getComplaintTypeDescription(
    selectedComplaintType,
  );

  const isFieldInvalid = (fieldName: RequiredComplaintFieldName) =>
    Boolean(errors[fieldName]);

  const setFieldRef =
    (fieldName: RequiredComplaintFieldName) => (node: HTMLElement | null) => {
      if (node) {
        fieldRefs.current[fieldName] = node;
        return;
      }

      delete fieldRefs.current[fieldName];
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

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isComplaintRequiredFieldValid("phone", event.currentTarget.value)) {
      clearErrors("phone");
    }
  };

  const handleValidSubmit: SubmitHandler<ComplaintFormValues> = () => {
    successDialogRef.current?.showModal();
  };

  const handleInvalidSubmit: SubmitErrorHandler<ComplaintFormValues> = (
    fieldErrors,
  ) => {
    const firstInvalidFieldName = requiredComplaintFieldNames.find(
      (fieldName) => fieldErrors[fieldName],
    );

    if (firstInvalidFieldName) {
      scrollToField(firstInvalidFieldName);
    }
  };

  const handleRequestPhoneVerification = async () => {
    const phone = getValues("phone");

    if (!isComplaintRequiredFieldValid("phone", phone)) {
      setError("phone", { type: "required" });
      scrollToField("phone");
      return;
    }

    clearErrors("phone");
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

  const handleSuccessDialogClose = () => {
    successDialogRef.current?.close();
    reset();
    setAttachmentFiles([]);
    syncAttachmentInputFiles([]);
    setPhoneVerificationResult(null);
    setIsRequestingPhoneVerification(false);
  };

  const handleSuccessDialogCancel = (
    event: SyntheticEvent<HTMLDialogElement>,
  ) => {
    event.preventDefault();
    handleSuccessDialogClose();
  };

  const handleSuccessDialogBackdropClick = (
    event: MouseEvent<HTMLDialogElement>,
  ) => {
    if (event.target === event.currentTarget) {
      handleSuccessDialogClose();
    }
  };

  const handleSuccessDialogKeyDown = (
    event: KeyboardEvent<HTMLDialogElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleSuccessDialogClose();
    }
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
    <>
      <form
        className={styles.complaintForm}
        noValidate
        onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
      >
        <div className={styles.complaintFields}>
          <div className={styles.complaintFieldGrid}>
            <label
              className={styles.complaintField}
              data-invalid={isFieldInvalid("name")}
              ref={setFieldRef("name")}
            >
              <span>이름*</span>
              <input
                {...register("name", {
                  validate: (value) =>
                    isComplaintRequiredFieldValid("name", value),
                })}
                aria-invalid={isFieldInvalid("name")}
                autoComplete="name"
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
                {...register("email", {
                  validate: (value) =>
                    isComplaintRequiredFieldValid("email", value),
                })}
                aria-invalid={isFieldInvalid("email")}
                autoComplete="email"
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
                  {...register("phone", {
                    onChange: handlePhoneChange,
                    validate: (value) =>
                      isComplaintRequiredFieldValid("phone", value),
                  })}
                  aria-invalid={isFieldInvalid("phone")}
                  autoComplete="tel"
                  inputMode="numeric"
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
                {...register("verificationCode", {
                  validate: (value) =>
                    isComplaintRequiredFieldValid("verificationCode", value),
                })}
                aria-invalid={isFieldInvalid("verificationCode")}
                inputMode="numeric"
                maxLength={COMPLAINT_VERIFICATION_CODE_LENGTH}
                minLength={COMPLAINT_VERIFICATION_CODE_LENGTH}
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
                  {...register("service", {
                    validate: (value) =>
                      isComplaintRequiredFieldValid("service", value),
                  })}
                  aria-invalid={isFieldInvalid("service")}
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
              <span id="complaint-type-label">불편 유형*</span>
              <span className={styles.complaintTypeControl}>
                <span className={styles.complaintSelectWrap}>
                  <select
                    {...register("complaintType", {
                      validate: (value) =>
                        isComplaintRequiredFieldValid("complaintType", value),
                    })}
                    aria-describedby={
                      selectedComplaintTypeDescription
                        ? "complaint-type-description"
                        : undefined
                    }
                    aria-invalid={isFieldInvalid("complaintType")}
                    aria-labelledby="complaint-type-label"
                    required
                  >
                    <option disabled value="">
                      불편 유형을 선택해주세요.
                    </option>
                    {complaintTypeOptions.map((option) => (
                      <option key={option.title} value={option.title}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron-down" size={24} />
                </span>
                {selectedComplaintTypeDescription ? (
                  <span
                    aria-live="polite"
                    className={styles.complaintTypeDescription}
                    id="complaint-type-description"
                  >
                    {selectedComplaintTypeDescription}
                  </span>
                ) : null}
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
              {...register("detail", {
                validate: (value) =>
                  isComplaintRequiredFieldValid("detail", value),
              })}
              aria-invalid={isFieldInvalid("detail")}
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
                {...register("privacy", {
                  validate: (value) =>
                    isComplaintRequiredFieldValid("privacy", value),
                })}
                aria-invalid={isFieldInvalid("privacy")}
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

      <dialog
        aria-describedby="complaint-success-description"
        aria-labelledby="complaint-success-title"
        className={styles.complaintSuccessDialog}
        onCancel={handleSuccessDialogCancel}
        onClick={handleSuccessDialogBackdropClick}
        onKeyDown={handleSuccessDialogKeyDown}
        ref={successDialogRef}
      >
        <div className={styles.complaintSuccessDialogContent}>
          <button
            aria-label="접수 완료 팝업 닫기"
            className={styles.complaintSuccessCloseButton}
            onClick={handleSuccessDialogClose}
            type="button"
          >
            <Icon name="x-close" size={24} />
          </button>

          <div className={styles.complaintSuccessPanel}>
            <div className={styles.complaintSuccessMessage}>
              <strong id="complaint-success-title">
                소중한 의견 감사합니다.
              </strong>
              <p id="complaint-success-description">
                대표님 확인 후 영업일 기준 1~2일 내 회신드리겠습니다.
              </p>
            </div>
            <button
              className={styles.complaintSuccessConfirmButton}
              onClick={handleSuccessDialogClose}
              type="button"
            >
              확인
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
