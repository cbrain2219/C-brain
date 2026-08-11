import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const read = (relativePath) =>
  readFileSync(path.join(repoRoot, relativePath), "utf8");

test("public LinkPay is a reusable payment-link template", () => {
  const contentPath = "apps/user/app/_content/linkPay.ts";
  const routePath = "apps/user/app/(site)/linkpay/[id]/page.tsx";
  const formPath = "apps/user/app/(site)/linkpay/[id]/LinkPayPaymentForm.tsx";
  const paymentPath = "apps/user/app/(site)/linkpay/[id]/payment.ts";
  const successRoutePath = "apps/user/app/(site)/linkpay/[id]/success/page.tsx";
  const failureRoutePath = "apps/user/app/(site)/linkpay/[id]/fail/page.tsx";
  const stylesPath = "apps/user/app/(site)/linkpay/[id]/page.module.css";

  assert.equal(existsSync(path.join(repoRoot, contentPath)), false);
  assert.equal(existsSync(path.join(repoRoot, routePath)), true);
  assert.equal(existsSync(path.join(repoRoot, formPath)), true);
  assert.equal(existsSync(path.join(repoRoot, paymentPath)), false);
  assert.equal(existsSync(path.join(repoRoot, successRoutePath)), false);
  assert.equal(existsSync(path.join(repoRoot, failureRoutePath)), false);
  assert.equal(existsSync(path.join(repoRoot, stylesPath)), true);

  const routeSource = read(routePath);
  const formSource = read(formPath);
  const stylesSource = read(stylesPath);

  assert.match(routeSource, /getPublicPaymentLink/);
  assert.match(routeSource, /createAdminSupabaseClient/);
  assert.match(routeSource, /notFound\(\)/);
  assert.doesNotMatch(routeSource, /redirect\(/);
  assert.match(routeSource, /disabled_at !== null/);
  assert.match(routeSource, /<LinkPayPaymentForm/);

  assert.match(formSource, /"use client"/);
  assert.match(formSource, /payment\.clientName/);
  assert.match(formSource, /payment\.paymentName/);
  assert.match(formSource, /카드 결제/);
  assert.match(
    formSource,
    /결제 완료 후 영업일 기준 1일 이내 배정 담당자가/,
  );
  assert.match(formSource, /payment\.category/);
  assert.match(formSource, /payment\.service/);
  assert.match(formSource, /formatOrderCurrency\(payment\.amount\)/);
  assert.match(formSource, /이름\(담당자명\)\*/);
  assert.match(formSource, /연락처\*/);
  assert.match(formSource, /이메일\*/);
  assert.match(formSource, /koreanMobilePhonePattern/);
  assert.match(formSource, /emailPattern/);
  assert.match(formSource, /function formatCustomerPhoneNumber/);
  assert.match(
    formSource,
    /normalizeCustomerPhoneNumber\(value\)\.slice\(0, 11\)/,
  );
  assert.match(formSource, /function sanitizeCustomerEmail/);
  assert.match(formSource, /function formatCustomerFieldValue/);
  assert.match(formSource, /inputMode:\s*"numeric"/);
  assert.match(formSource, /maxLength:\s*13/);
  assert.match(formSource, /placeholder:\s*"010-1234-1234"/);
  assert.match(
    formSource,
    /inputMode=\{"inputMode" in field \? field\.inputMode : undefined\}/,
  );
  assert.match(
    formSource,
    /maxLength=\{"maxLength" in field \? field\.maxLength : undefined\}/,
  );
  assert.match(formSource, /payment\.publicToken/);
  assert.match(formSource, /privacyCollection:\s*false/);
  assert.match(formSource, /privacyPolicy:\s*false/);
  assert.doesNotMatch(formSource, /privacyCollection:\s*true/);
  assert.doesNotMatch(formSource, /privacyPolicy:\s*true/);
  assert.doesNotMatch(formSource, /href="#"/);
  assert.match(formSource, /href=\{item\.href\}/);
  assert.match(formSource, /crypto\.randomUUID/);
  assert.match(formSource, /checkoutRequestId/);
  assert.match(formSource, /checkoutAttemptRef/);
  assert.match(formSource, /isSubmittingRef/);
  assert.match(formSource, /payloadKey/);
  assert.match(formSource, /releaseSubmission/);
  assert.match(formSource, /requestNicepayPayment/);
  assert.match(formSource, /parseNicepayCheckoutRequest/);
  assert.match(formSource, /\/api\/linkpay/);
  assert.match(formSource, /현재 결제가 중단된 링크입니다/);
  assert.match(formSource, /target="_blank"/);
  assert.match(formSource, /agreementCheckboxIcon/);
  assert.match(formSource, /name="check-01"/);
  assert.match(formSource, /size=\{20\}/);
  assert.match(formSource, /agreementDetailList/);

  assert.match(stylesSource, /\.linkPaySection/);
  assert.match(stylesSource, /--landing-gray-400:\s*#a0aab8/);
  assert.match(stylesSource, /max-width:\s*640px/);
  assert.match(stylesSource, /\.paymentCard/);
  assert.match(stylesSource, /background:\s*var\(--landing-gray-50\)/);
  assert.match(stylesSource, /repeating-linear-gradient/);
  assert.match(stylesSource, /\.agreementCheckboxMark/);
  assert.match(stylesSource, /border-radius:\s*8px/);
  assert.match(stylesSource, /width:\s*24px/);
  assert.match(stylesSource, /background:\s*var\(--landing-gray-400\)/);
  assert.match(stylesSource, /\.agreementDetailList/);
});
