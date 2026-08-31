"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "../../../components/Icon";
import styles from "./page.module.css";
import {
  reviewProductTypeOptions,
  type ReviewProductType,
} from "./reviewSubmission";

type SubmissionState = "idle" | "submitting" | "success" | "error";

const ratings = [1, 2, 3, 4, 5] as const;

export function ReviewRequestForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [productType, setProductType] = useState<ReviewProductType | "">("");
  const [rating, setRating] = useState(1);
  const [content, setContent] = useState("");
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const isLocked =
    submissionState === "submitting" || submissionState === "success";

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productType || isLocked) return;

    setSubmissionState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/review-submissions", {
        body: JSON.stringify({
          companyName,
          content,
          managerName,
          productType,
          rating,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : "후기를 제출하지 못했습니다. 잠시 후 다시 시도해주세요.";

        throw new Error(message);
      }

      setSubmissionState("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "후기를 제출하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
      setSubmissionState("error");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button
          aria-label="이전 화면으로 이동"
          className={styles.headerButton}
          onClick={handleBack}
          type="button"
        >
          <Icon name="arrow-left" size={16} />
        </button>
        <h1 className={styles.headerTitle}>후기 남기기</h1>
        <span aria-hidden="true" className={styles.headerSpacer} />
      </header>

      <form
        aria-busy={submissionState === "submitting"}
        className={styles.form}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <section className={styles.fields}>
          <div className={styles.intro}>
            <h2>후기 남기기</h2>
            <p>
              <span>씨브레인과 함께한 경험, 편하게 들려주세요!</span>
              <span>여러분의 솔직한 이야기가 저희에게 큰 힘이 됩니다.</span>
              <span>
                정성스러운 후기를 남겨주신 분들께는 커피 기프티콘을
                보내드립니다! 🙂
              </span>
            </p>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldHeading}>
              <span className={styles.label}>회사명</span>
              <span className={styles.helper}>
                * 개인일 시, 개인이라고 기재해주세요.
              </span>
            </span>
            <input
              autoComplete="organization"
              className={styles.control}
              disabled={isLocked}
              maxLength={100}
              name="companyName"
              onChange={(event) => setCompanyName(event.currentTarget.value)}
              placeholder="예 : 씨브레인"
              required
              type="text"
              value={companyName}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>담당자명 · 직위</span>
            <input
              autoComplete="name"
              className={styles.control}
              disabled={isLocked}
              maxLength={100}
              name="managerName"
              onChange={(event) => setManagerName(event.currentTarget.value)}
              placeholder="예 : 홍길동 과장"
              required
              type="text"
              value={managerName}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>의뢰하신 제품</span>
            <span className={styles.selectWrap}>
              <select
                className={styles.control}
                data-placeholder={!productType || undefined}
                disabled={isLocked}
                name="productType"
                onChange={(event) =>
                  setProductType(event.currentTarget.value as ReviewProductType)
                }
                required
                value={productType}
              >
                <option disabled value="">
                  선택해주세요.
                </option>
                {reviewProductTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" size={24} />
            </span>
          </label>

          <fieldset className={styles.ratingField}>
            <legend className={styles.label}>만족도</legend>
            <div aria-label="만족도 선택" className={styles.ratingOptions}>
              {ratings.map((value) => (
                <label
                  className={styles.ratingOption}
                  data-checked={value <= rating || undefined}
                  key={value}
                >
                  <input
                    aria-label={`${value}점`}
                    checked={rating === value}
                    disabled={isLocked}
                    name="rating"
                    onChange={() => setRating(value)}
                    type="radio"
                    value={value}
                  />
                  <Icon name="star-filled" size={44} />
                </label>
              ))}
            </div>
          </fieldset>

          <label className={styles.field}>
            <span className={styles.label}>후기 내용</span>
            <textarea
              className={`${styles.control} ${styles.textarea}`}
              disabled={isLocked}
              maxLength={20_000}
              name="content"
              onChange={(event) => setContent(event.currentTarget.value)}
              placeholder="씨브레인과의 경험을 자유롭게, 자세히 적어주시면 큰 도움이 됩니다."
              required
              value={content}
            />
          </label>
        </section>

        <div className={styles.submitGroup}>
          <button
            className={styles.submitButton}
            disabled={isLocked}
            type="submit"
          >
            <span>
              {submissionState === "submitting"
                ? "제출 중"
                : submissionState === "success"
                  ? "제출 완료"
                  : "후기 제출하기"}
            </span>
            <Icon name="arrow-right" size={16} />
          </button>

          {submissionState === "success" ? (
            <p className={styles.successMessage} role="status">
              소중한 후기가 제출되었습니다. 감사합니다.
            </p>
          ) : null}
          {submissionState === "error" ? (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </form>
    </main>
  );
}
