"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { Icon } from "../../../components/Icon";
import { KAKAO_CHANNEL_URL } from "../../_content/contact";
import {
  type OrderSelectionSummary,
  formatOrderCurrency,
  orderSteps,
} from "../../_content/order";
import styles from "./page.module.css";

type OrderPaymentSummary = Pick<
  OrderSelectionSummary,
  | "pageLabel"
  | "paperLabel"
  | "quantityLabel"
  | "serviceLabel"
  | "totalPrice"
>;

export type OrderPaymentDetailRow = {
  label: string;
  tone?: "total";
  value: string;
};

export type OrderPaymentSuccessData = {
  companyName: string;
  detailRows?: ReadonlyArray<OrderPaymentDetailRow>;
  paymentMethod: string;
  summary?: OrderPaymentSummary;
  totalPrice?: number;
};

export type OrderPaymentFailureData = {
  failureReason: string;
};

type OrderPaymentResultCommonProps = {
  backHref?: string;
  backLabel?: string;
  contentHeight?: boolean;
  failureRetryHref?: string;
  failureRetryLabel?: string;
  showProgress?: boolean;
  successPrimaryHref?: string;
  successPrimaryLabel?: string;
};

type OrderPaymentResultProps = OrderPaymentResultCommonProps &
  (
    | {
      data?: OrderPaymentSuccessData;
      variant: "success";
    }
    | {
      data?: OrderPaymentFailureData;
      variant: "failure";
    }
  );

const resultStepIndex = 3;

const defaultFailureResultData: OrderPaymentFailureData = {
  failureReason: "결제가 정상적으로 완료되지 않았습니다.",
};

const successDescriptionLines = [
  "주문이 접수되었습니다.",
  '아래 씨브레인 카카오톡 채널로 "결제완료" 메시지를 남겨주시면 담당자가',
  "확인 후 빠르게 일정 안내드리겠습니다.",
  "감사합니다.",
] as const;

function createPaymentDetailRows(
  data: OrderPaymentSuccessData,
): ReadonlyArray<OrderPaymentDetailRow> {
  if (data.detailRows) {
    return data.detailRows;
  }

  if (!data.summary) {
    return [];
  }

  const { summary } = data;

  return [
    { label: "서비스", value: summary.serviceLabel },
    { label: "용지", value: summary.paperLabel },
    { label: "페이지 수", value: summary.pageLabel },
    { label: "수량", value: summary.quantityLabel },
  ];
}

function createPaymentDetailGroups(data: OrderPaymentSuccessData) {
  const totalPrice =
    data.totalPrice ??
    data.summary?.totalPrice ??
    0;

  return [
    createPaymentDetailRows(data),
    [
      { label: "회사명", value: data.companyName },
      { label: "결제 수단", value: data.paymentMethod },
    ],
    [
      {
        label: "합계",
        tone: "total" as const,
        value: formatOrderCurrency(totalPrice),
      },
    ],
  ];
}

const successGuideLines = [
  '아래 [결제완료 상담하기] 클릭 후 씨브레인 카카오톡 채널로 "결제완료" 메시지를 남겨주세요.',
  "담당자가 확인 후 집중 상담 및 제작 일정을 안내드립니다.",
  "파일 전달 후 디자인·인쇄 제작을 시작합니다.",
  "제작 완료 후 배송 또는 방문 수령합니다.",
] as const;

function OrderResultDescription({
  failureReason,
  isSuccess,
}: {
  failureReason: string;
  isSuccess: boolean;
}) {
  if (!isSuccess) {
    return (
      <div className={styles.resultDescription}>
        <p>실패사유 : {failureReason}</p>
      </div>
    );
  }

  return (
    <div className={styles.resultDescription}>
      <div className={styles.resultDescriptionDesktop}>
        {successDescriptionLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div className={styles.resultDescriptionCompact}>
        {successDescriptionLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function OrderResultPaymentCard({
  data,
}: {
  data: OrderPaymentSuccessData;
}) {
  const paymentDetailGroups = createPaymentDetailGroups(data);

  return (
    <section
      className={styles.resultPaymentCard}
      aria-labelledby="order-result-payment-title"
    >
      <h2 id="order-result-payment-title">결제 내역</h2>

      {paymentDetailGroups.map((group, groupIndex) => (
        <div className={styles.resultPaymentGroupBlock} key={groupIndex}>
          {groupIndex > 0 ? (
            <div className={styles.resultPaymentDivider} />
          ) : null}
          <dl className={styles.resultPaymentGroup}>
            {group.map((row) => (
              <div
                className={`${styles.resultPaymentRow} ${
                  "tone" in row && row.tone === "total"
                    ? styles.resultPaymentTotal
                    : ""
                }`}
                key={row.label}
              >
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}

function OrderResultGuide() {
  return (
    <>
      <ol
        className={`${styles.resultGuideList} ${styles.resultGuideListDesktop}`}
      >
        {successGuideLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <ol
        className={`${styles.resultGuideList} ${styles.resultGuideListCompact}`}
      >
        {successGuideLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </>
  );
}

function OrderResultActions({
  failureRetryHref,
  failureRetryLabel,
  isSuccess,
  successPrimaryHref,
  successPrimaryLabel,
}: {
  failureRetryHref: string;
  failureRetryLabel: string;
  isSuccess: boolean;
  successPrimaryHref: string;
  successPrimaryLabel: string;
}) {
  if (!isSuccess) {
    return (
      <div className={styles.resultActionList}>
        <Link
          className={`${styles.resultActionButton} ${styles.resultActionBrand}`}
          href={failureRetryHref}
        >
          {failureRetryLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.resultActionList}>
      <Link
        className={`${styles.resultActionButton} ${styles.resultActionBrand}`}
        href={successPrimaryHref}
      >
        {successPrimaryLabel}
      </Link>
      <a
        className={`${styles.resultActionButton} ${styles.resultActionKakao}`}
        href={KAKAO_CHANNEL_URL}
        rel="noreferrer"
        target="_blank"
      >
        <span>결제완료 상담하기</span>
        <Icon
          className={styles.resultActionIcon}
          name="message-typing"
          size={16}
        />
      </a>
    </div>
  );
}

export function OrderPaymentResult(props: OrderPaymentResultProps) {
  const {
    backHref = "/order",
    backLabel = "정보 입력으로",
    contentHeight = false,
    failureRetryHref = "/order",
    failureRetryLabel = "다시 결제하기",
    showProgress = true,
    successPrimaryHref = "/order",
    successPrimaryLabel = "다른 제품 주문하기",
  } = props;
  const isSuccess = props.variant === "success";
  const failureData = props.variant === "failure"
    ? (props.data ?? defaultFailureResultData)
    : defaultFailureResultData;
  const successData = props.variant === "success" ? props.data : undefined;
  const title = isSuccess ? "결제가 완료되었습니다" : "결제에 실패했습니다";

  useEffect(() => {
    if (!showProgress) return;

    document.body.dataset.orderResultActive = "true";

    return () => {
      delete document.body.dataset.orderResultActive;
    };
  }, [showProgress]);

  if (isSuccess && !successData) {
    return null;
  }

  return (
    <div
      className={`${styles.orderPage} ${styles.resultPage} ${
        contentHeight ? styles.resultPageContentHeight : ""
      }`}
      data-order-result-active="true"
    >
      {showProgress ? (
        <div className={styles.resultMobileHeader}>
          <Link
            aria-label={`${backLabel} 돌아가기`}
            className={styles.resultMobileBackButton}
            href={backHref}
          >
            <Icon name="order-option-back" size={18} />
          </Link>
          <p>IV. 결제 완료</p>
          <span
            aria-hidden="true"
            className={styles.resultMobileHeaderSpacer}
          />
        </div>
      ) : null}

      <section className={styles.resultSection} aria-labelledby="result-title">
        <div className={styles.resultInner}>
          {showProgress ? (
            <div className={styles.resultProgress}>
              <Link className={styles.resultBackLink} href={backHref}>
                <Icon name="order-option-back" size={18} />
                <span>{backLabel}</span>
              </Link>

              <ol
                className={`${styles.stepList} ${styles.resultStepList}`}
                aria-label="주문 진행 단계"
              >
                {orderSteps.map((step, index) => (
                  <li
                    className={`${styles.stepItem} ${
                      index < resultStepIndex ? styles.stepItemComplete : ""
                    } ${index === resultStepIndex ? styles.stepItemActive : ""}`}
                    key={step.label}
                  >
                    {step.label}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className={styles.resultContent}>
            <div className={styles.resultStatus}>
              <Image
                alt=""
                className={styles.resultIcon}
                height={132}
                priority
                src="/figma-assets/order-payment-result-icon.png"
                unoptimized
                width={132}
              />
              <div className={styles.resultCopy}>
                <h1 className={styles.resultTitle} id="result-title">
                  {title}
                </h1>
                <OrderResultDescription
                  failureReason={failureData.failureReason}
                  isSuccess={isSuccess}
                />
              </div>
            </div>

            {successData ? (
              <>
                <OrderResultPaymentCard data={successData} />
                <OrderResultGuide />
              </>
            ) : null}

            <OrderResultActions
              failureRetryHref={failureRetryHref}
              failureRetryLabel={failureRetryLabel}
              isSuccess={isSuccess}
              successPrimaryHref={successPrimaryHref}
              successPrimaryLabel={successPrimaryLabel}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
