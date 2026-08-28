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

const extractBetween = (source, start, end) => {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);

  assert.notEqual(startIndex, -1, `${start} marker should exist`);
  assert.notEqual(endIndex, -1, `${end} marker should exist`);

  return source.slice(startIndex, endIndex);
};

const extractBlock = (source, marker) => {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${marker} marker should exist`);

  const openIndex = source.indexOf("{", markerIndex);
  assert.notEqual(openIndex, -1, `${marker} block should open`);

  let depth = 0;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;
    }

    if (depth === 0) {
      return source.slice(openIndex + 1, index);
    }
  }

  assert.fail(`${marker} block should close`);
};

const countMatches = (source, pattern) => source.match(pattern)?.length ?? 0;

test("order page route, content, responsive styles, and navigation are wired", () => {
  const routePath = "apps/user/app/(site)/order/page.tsx";
  const categoryRoutePath =
    "apps/user/app/(site)/order/[category]/page.tsx";
  const pageContentPath =
    "apps/user/app/(site)/order/OrderPageContent.tsx";
  const clientPath = "apps/user/app/(site)/order/OrderPageClient.tsx";
  const flowSectionPath = "apps/user/app/(site)/order/OrderFlowSection.tsx";
  const progressPath = "apps/user/app/(site)/order/OrderProgress.tsx";
  const methodSelectorPath =
    "apps/user/app/(site)/order/OrderMethodSelector.tsx";
  const optionSelectionPath =
    "apps/user/app/(site)/order/OrderOptionSelection.tsx";
  const customerInfoPath =
    "apps/user/app/(site)/order/OrderCustomerInfoStep.tsx";
  const dialogPath = "apps/user/app/(site)/order/OrderConsultDialog.tsx";
  const stylesPath = "apps/user/app/(site)/order/page.module.css";
  const contentPath = "apps/user/app/_content/order.ts";
  const contactPath = "apps/user/app/_content/contact.ts";

  assert.equal(existsSync(path.join(repoRoot, routePath)), true);
  assert.equal(existsSync(path.join(repoRoot, categoryRoutePath)), true);
  assert.equal(existsSync(path.join(repoRoot, pageContentPath)), true);
  assert.equal(existsSync(path.join(repoRoot, clientPath)), true);
  assert.equal(existsSync(path.join(repoRoot, flowSectionPath)), true);
  assert.equal(existsSync(path.join(repoRoot, progressPath)), true);
  assert.equal(existsSync(path.join(repoRoot, methodSelectorPath)), true);
  assert.equal(existsSync(path.join(repoRoot, optionSelectionPath)), true);
  assert.equal(existsSync(path.join(repoRoot, customerInfoPath)), true);
  assert.equal(existsSync(path.join(repoRoot, dialogPath)), true);
  assert.equal(existsSync(path.join(repoRoot, stylesPath)), true);
  assert.equal(existsSync(path.join(repoRoot, contentPath)), true);
  assert.equal(existsSync(path.join(repoRoot, contactPath)), true);

  const serverRouteSource = read(routePath);
  const categoryRouteSource = read(categoryRoutePath);
  const pageContentSource = read(pageContentPath);
  const routeSource = read(clientPath);
  const flowSectionSource = read(flowSectionPath);
  const progressSource = read(progressPath);
  const methodSelectorSource = read(methodSelectorPath);
  const optionSelectionSource = read(optionSelectionPath);
  const customerInfoSource = read(customerInfoPath);
  const dialogSource = read(dialogPath);
  const stylesSource = read(stylesPath);
  const landingStylesSource = read("apps/user/app/page.module.css");
  const contentSource = read(contentPath);
  const contactSource = read(contactPath);
  const headerSource = read("apps/user/app/_components/Header.tsx");
  const iconSource = read("apps/user/components/Icon.tsx");
  const chevronRightIconSource = extractBetween(
    iconSource,
    "function ChevronRightIcon",
    "function BookOpenIcon",
  );
  const orderMethodsSource = extractBetween(
    contentSource,
    "export const orderMethods",
    "] as const satisfies ReadonlyArray<OrderMethod>;",
  );
  const servicesSource = read("apps/user/app/_content/services.ts");
  const quoteServicesSource = read(
    "apps/user/app/_content/quoteServices.ts",
  );
  const serviceCardsSource = read("apps/user/app/_components/ServiceCards.tsx");
  const orderFlowRule = extractBlock(stylesSource, ".orderFlow");
  const orderInnerRule = extractBlock(stylesSource, ".orderInner");
  const tabletMediaStyles = extractBlock(
    stylesSource,
    "@media (min-width: 640px)",
  );
  const desktopMediaStyles = extractBlock(
    stylesSource,
    "@media (min-width: 1080px)",
  );
  const pcMediaStyles = extractBlock(
    stylesSource,
    "@media (min-width: 1440px)",
  );

  assert.match(progressSource, /type OrderProgressProps = \{/);
  assert.match(progressSource, /activeStepIndex:\s*number/);
  assert.match(progressSource, /aria-label="주문 진행 단계"/);
  assert.match(
    progressSource,
    /aria-current=\{isActive \? "step" : undefined\}/,
  );
  assert.match(progressSource, /styles\.stepChip/);
  assert.match(progressSource, /styles\.stepLabel/);
  assert.match(progressSource, /name="chevron-right"/);
  assert.match(progressSource, /size=\{16\}/);
  assert.doesNotMatch(progressSource, /stepItemComplete/);

  assert.match(contentSource, /number:\s*1,\s*label:\s*"카테고리 선택"/);
  assert.match(contentSource, /number:\s*2,\s*label:\s*"옵션 선택"/);
  assert.match(contentSource, /number:\s*3,\s*label:\s*"정보 입력"/);
  assert.match(contentSource, /number:\s*4,\s*label:\s*"결제 완료"/);

  assert.match(iconSource, /\| "chevron-right"/);
  assert.match(iconSource, /function ChevronRightIcon/);
  assert.match(chevronRightIconSource, /stroke="currentColor"/);
  assert.match(chevronRightIconSource, /strokeWidth="1\.5"/);
  assert.match(iconSource, /"chevron-right": ChevronRightIcon/);

  assert.match(serverRouteSource, /<OrderPageContent \/>/);
  assert.match(pageContentSource, /export async function OrderPageContent/);
  assert.match(pageContentSource, /await getPublishedOrderProducts\(\)/);
  assert.match(
    pageContentSource,
    /services=\{createServiceItems\(products\)\}/,
  );
  assert.match(categoryRouteSource, /params: Promise<\{/);
  assert.match(categoryRouteSource, /getOrderCategoryBySlug\(categorySlug\)/);
  assert.match(categoryRouteSource, /if \(!category\) notFound\(\)/);
  assert.match(
    categoryRouteSource,
    /<OrderPageContent initialCategoryId=\{category\.id\} \/>/,
  );
  assert.match(categoryRouteSource, /alternates: \{ canonical: canonicalUrl \}/);
  assert.match(routeSource, /export function OrderPageClient/);
  assert.match(routeSource, /"use client"/);
  assert.match(routeSource, /useEffect/);
  assert.match(routeSource, /useState<OrderStepId>\("category"\)/);
  assert.match(routeSource, /useState<ServiceItem \| null>\(null\)/);
  assert.match(routeSource, /useState<OrderSelectionSummary \| null>\(null\)/);
  assert.match(routeSource, /const ORDER_HISTORY_STATE_KEY/);
  assert.match(routeSource, /window\.history\.replaceState/);
  assert.match(routeSource, /window\.history\.pushState/);
  assert.match(routeSource, /window\.addEventListener\("popstate"/);
  assert.match(routeSource, /window\.removeEventListener\("popstate"/);
  assert.match(routeSource, /window\.history\.back\(\)/);
  assert.match(routeSource, /restoreOrderHistoryEntry/);
  assert.match(routeSource, /getDirectServiceItemById/);
  assert.match(routeSource, /getOrderCategoryHref/);
  assert.match(routeSource, /getFixedQuoteServiceById/);
  assert.match(routeSource, /initialCategoryId\?: OrderCategoryId/);
  assert.doesNotMatch(routeSource, /orderServiceSearchParam/);
  assert.doesNotMatch(routeSource, /new URLSearchParams/);
  assert.match(
    routeSource,
    /replaceOrderHistoryEntry\(optionEntry, initialService\.id\)/,
  );
  assert.match(routeSource, /replaceOrderHistoryEntry\(quoteEntry, initialQuoteService\.id\)/);
  assert.match(routeSource, /restoreOrderHistoryEntry\(optionEntry\)/);
  assert.match(routeSource, /restoreOrderHistoryEntry\(quoteEntry\)/);
  assert.match(routeSource, /setOrderStep\("option"\)/);
  assert.match(routeSource, /OrderPaymentSubmitPayload/);
  assert.match(routeSource, /handlePaymentSubmit/);
  assert.match(routeSource, /submitOrderPayment\(payload, checkoutRequestId\)/);
  assert.match(routeSource, /requestNicepayPayment/);
  assert.match(routeSource, /setOrderStep\("category"\)/);
  assert.match(routeSource, /setOrderStep\("option"\)/);
  assert.match(routeSource, /setOrderStep\("customer"\)/);
  assert.match(routeSource, /handleDirectServiceSelect/);
  assert.match(routeSource, /handleCustomerInfoStart/);
  assert.match(routeSource, /handleOptionBack/);
  assert.match(
    routeSource,
    /document\.body\.dataset\.orderOptionActive = "true"/,
  );
  assert.match(
    routeSource,
    /delete document\.body\.dataset\.orderOptionActive/,
  );
  assert.match(routeSource, /data-order-option-active=/);
  assert.match(routeSource, /selectedDirectService \? null :/);
  assert.match(routeSource, /import \{ OrderFlowSection \}/);
  assert.match(routeSource, /<OrderFlowSection/);
  assert.doesNotMatch(routeSource, /openConsultDialogOnMount=/);
  assert.match(routeSource, /selectedDirectService=\{selectedDirectService\}/);
  assert.match(routeSource, /isConsultDialogOpen=\{isConsultDialogOpen\}/);
  assert.match(routeSource, /onConsult=\{handleConsultStart\}/);
  assert.match(
    routeSource,
    /onConsultDialogClose=\{handleConsultDialogClose\}/,
  );
  assert.match(
    routeSource,
    /onDirectServiceSelect=\{handleDirectServiceSelect\}/,
  );
  assert.match(
    routeSource,
    /onQuoteServiceSelect=\{handleQuoteServiceSelect\}/,
  );
  assert.match(routeSource, /onCategoryReset=\{handleCategoryReset\}/);
  assert.match(routeSource, /orderStep=\{orderStep\}/);
  assert.match(routeSource, /onCustomerInfoStart=\{handleCustomerInfoStart\}/);
  assert.match(routeSource, /onOptionBack=\{handleOptionBack\}/);
  assert.match(routeSource, /onPaymentSubmit=\{handlePaymentSubmit\}/);
  assert.match(routeSource, /selectedOrderSummary=\{selectedOrderSummary\}/);
  assert.doesNotMatch(routeSource, /orderProducts\.map/);
  assert.match(routeSource, /order-hero-background\.jpg/);
  assert.match(routeSource, /씨브레인 홍보물 제작/);
  assert.match(
    routeSource,
    /<br className=\{styles\.heroTitleMobileBreak\} \/>/,
  );
  assert.match(routeSource, /heroTitleDesktopSpace/);
  assert.match(routeSource, /가격·주문 안내/);
  assert.match(routeSource, /import \{ CtaSection \}/);
  assert.match(routeSource, /<CtaSection/);
  assert.match(routeSource, /orderStep === "category" \? \(/);
  assert.match(routeSource, /id="contact"/);
  assert.match(
    routeSource,
    /titleLines=\{\["원하는 홍보물이 따로 있으신가요\?"\]\}/,
  );
  assert.match(routeSource, /label: "FAQ 보기"/);
  assert.doesNotMatch(routeSource, /styles\.cta/);
  assert.match(flowSectionSource, /"use client"/);
  assert.match(flowSectionSource, /useEffect/);
  assert.match(flowSectionSource, /useRef/);
  assert.match(
    flowSectionSource,
    /selectedDirectService:\s*ServiceItem \| null/,
  );
  assert.match(
    flowSectionSource,
    /onDirectServiceSelect:\s*\(service:\s*ServiceItem\) => void/,
  );
  assert.match(flowSectionSource, /isConsultDialogOpen:\s*boolean/);
  assert.match(flowSectionSource, /onConsult:\s*\(\) => void/);
  assert.match(flowSectionSource, /onConsultDialogClose:\s*\(\) => void/);
  assert.match(
    flowSectionSource,
    /onQuoteServiceSelect:\s*\(service:\s*FixedQuoteService\) => void/,
  );
  assert.match(flowSectionSource, /onCategoryReset:\s*\(\) => void/);
  assert.match(flowSectionSource, /import \{ OrderMethodSelector \}/);
  assert.match(flowSectionSource, /import \{ OrderOptionSelection \}/);
  assert.match(flowSectionSource, /OrderCustomerInfoStep/);
  assert.match(flowSectionSource, /import \{ OrderConsultDialog \}/);
  assert.match(flowSectionSource, /orderStep:\s*OrderStepId/);
  assert.match(
    flowSectionSource,
    /onCustomerInfoStart:\s*\(summary:\s*OrderSelectionSummary\) => void/,
  );
  assert.match(flowSectionSource, /onOptionBack:\s*\(\) => void/);
  assert.match(
    flowSectionSource,
    /selectedOrderSummary:\s*OrderSelectionSummary \| null/,
  );
  assert.match(flowSectionSource, /type OrderPaymentSubmitPayload/);
  assert.match(
    flowSectionSource,
    /onPaymentSubmit\?:\s*\(\s*payload:\s*OrderPaymentSubmitPayload,?\s*\)\s*=>\s*Promise<void>\s*\|\s*void/,
  );
  assert.match(flowSectionSource, /<OrderMethodSelector onQuoteSelect=/);
  assert.match(flowSectionSource, /selectedDirectService/);
  assert.doesNotMatch(flowSectionSource, /openConsultDialogOnMount/);
  assert.doesNotMatch(flowSectionSource, /setIsConsultDialogOpen/);
  assert.match(flowSectionSource, /orderStep === "customer"/);
  assert.match(
    flowSectionSource,
    /const activeStepIndex = isCustomerStep \? 2 : selectedDirectService \? 1 : 0/,
  );
  assert.match(flowSectionSource, /useRef<HTMLDivElement>\(null\)/);
  assert.match(flowSectionSource, /optionHeaderRef/);
  assert.match(
    flowSectionSource,
    /scrollIntoView\(\{\s*behavior:\s*"smooth",\s*block:\s*"start",\s*\}\)/s,
  );
  assert.match(flowSectionSource, /import \{ OrderProgress \}/);
  assert.match(
    flowSectionSource,
    /<OrderProgress activeStepIndex=\{activeStepIndex\} \/>/,
  );
  assert.doesNotMatch(flowSectionSource, /orderSteps\.map/);
  assert.doesNotMatch(flowSectionSource, /stepItemComplete/);
  assert.match(flowSectionSource, /optionBackButton/);
  assert.match(flowSectionSource, /optionBackButtonText/);
  assert.match(flowSectionSource, /name="order-option-back"/);
  assert.match(flowSectionSource, /size=\{20\}/);
  assert.match(flowSectionSource, /optionHeaderTitle/);
  assert.match(flowSectionSource, /II\. 옵션 선택/);
  assert.match(flowSectionSource, /III\. 정보 입력/);
  assert.match(flowSectionSource, /옵션 선택으로/);
  assert.match(flowSectionSource, /optionHeaderSpacer/);
  assert.match(flowSectionSource, /ref=\{optionHeaderRef\}/);
  assert.match(flowSectionSource, /<OrderOptionSelection/);
  assert.match(flowSectionSource, /onClick=\{handleOptionHeaderBack\}/);
  assert.match(flowSectionSource, /onPaymentStart=\{onCustomerInfoStart\}/);
  assert.match(flowSectionSource, /<OrderCustomerInfoStep/);
  assert.match(flowSectionSource, /onPaymentSubmit=\{onPaymentSubmit\}/);
  assert.match(flowSectionSource, /summary=\{selectedOrderSummary\}/);
  assert.match(
    flowSectionSource,
    /onDirectServiceSelect=\{onDirectServiceSelect\}/,
  );
  assert.match(flowSectionSource, /onQuoteServiceSelect=\{onQuoteServiceSelect\}/);
  assert.match(
    flowSectionSource,
    /onClose=\{onConsultDialogClose\}/,
  );
  assert.match(flowSectionSource, /<OrderMethodSelector onQuoteSelect=\{onConsult\} \/>/);
  assert.match(methodSelectorSource, /"use client"/);
  assert.match(methodSelectorSource, /useState/);
  assert.match(methodSelectorSource, /onQuoteSelect\?: \(\) => void/);
  assert.match(methodSelectorSource, /aria-pressed/);
  assert.match(
    methodSelectorSource,
    /if \(method\.tone === "quote"\) \{\s*onQuoteSelect\?\.\(\);\s*return;\s*\}\s*setSelectedMethodId\(method\.id\);/,
  );
  assert.match(methodSelectorSource, /methodCardActiveQuote/);
  assert.match(optionSelectionSource, /"use client"/);
  assert.match(optionSelectionSource, /calculateProductSelection/);
  assert.match(optionSelectionSource, /createDefaultProductSelection/);
  assert.match(optionSelectionSource, /getProductPriceRows/);
  assert.match(optionSelectionSource, /product\.variants/);
  assert.match(optionSelectionSource, /selectedVariantId/);
  assert.match(optionSelectionSource, /hasProductTypeSelection/);
  assert.match(optionSelectionSource, /selectedVariant\.optionSections\.map/);
  assert.match(optionSelectionSource, /disabled=\{!isAvailable \|\| !nextSelection\}/);
  assert.match(
    optionSelectionSource,
    /<h3 id="variant-option-title">I\. 상품종류<\/h3>/,
  );
  assert.match(
    optionSelectionSource,
    /hasProductTypeSelection\s*\? "II\. 서비스 선택"\s*: "I\. 서비스 선택"/s,
  );
  assert.match(
    optionSelectionSource,
    /index=\{index \+ sectionNumberOffset\}/,
  );
  assert.match(
    optionSelectionSource,
    /selectedVariant\.optionSections\.length \+ sectionNumberOffset/,
  );
  assert.match(
    optionSelectionSource,
    /const sectionNumbers = \["II", "III", "IV", "V", "VI", "VII", "VIII"\]/,
  );
  assert.match(optionSelectionSource, /selectedVariant\.quantitySection/);
  assert.match(optionSelectionSource, /quantityRows\.map/);
  assert.match(optionSelectionSource, /quantityTableScroll/);
  assert.match(
    optionSelectionSource,
    /<span role="columnheader">인쇄단가<\/span>/,
  );
  assert.match(
    optionSelectionSource,
    /<span role="columnheader">합계<\/span>/,
  );
  assert.match(optionSelectionSource, /주문 요약/);
  assert.match(optionSelectionSource, /mobilePaymentBar/);
  assert.match(optionSelectionSource, /결제하기/);
  assert.match(optionSelectionSource, /onPaymentStart/);
  assert.match(optionSelectionSource, /OrderSelectionSummary/);
  assert.match(optionSelectionSource, /ids:\s*\{/);
  assert.match(optionSelectionSource, /productId:\s*product\.id/);
  assert.match(optionSelectionSource, /optionValues:\s*selection\.optionValues/);
  assert.match(optionSelectionSource, /quantity:\s*selection\.quantity/);
  assert.match(optionSelectionSource, /quotedTotal:\s*calculation\.totalPrice/);
  assert.match(optionSelectionSource, /serviceId:\s*service\.id/);
  assert.match(optionSelectionSource, /variant:\s*selectedVariant\.id/);
  assert.match(optionSelectionSource, /categoryLabel:\s*service\.title/);
  assert.match(
    optionSelectionSource,
    /<dt>카테고리<\/dt>\s*<dd>\{service\.title\}<\/dd>/s,
  );
  assert.match(optionSelectionSource, /hasPlanning,/);
  assert.match(
    optionSelectionSource,
    /onClick=\{\(\) => onPaymentStart\(selectedSummary\)\}/,
  );
  assert.match(optionSelectionSource, /카카오톡 1:1 상담/);
  assert.match(optionSelectionSource, /summaryConsultLead/);
  assert.match(customerInfoSource, /"use client"/);
  assert.match(customerInfoSource, /useRef/);
  assert.match(customerInfoSource, /OrderSelectionSummary/);
  assert.match(customerInfoSource, /formatOrderCurrency/);
  assert.match(customerInfoSource, /export type OrderCustomerInfo/);
  assert.match(customerInfoSource, /export type OrderPaymentSubmitPayload/);
  assert.match(
    customerInfoSource,
    /onPaymentSubmit\?:\s*\(\s*payload:\s*OrderPaymentSubmitPayload,?\s*\)\s*=>\s*Promise<void>\s*\|\s*void/,
  );
  assert.match(customerInfoSource, /type RequiredCustomerFieldId/);
  assert.match(customerInfoSource, /type OrderCustomerValidationTarget/);
  assert.match(customerInfoSource, /requiredCustomerFieldIds/);
  assert.match(customerInfoSource, /customerValidationTargetsInOrder/);
  assert.match(
    customerInfoSource,
    /const emailPattern = \/\^\[\^\\s@\]\+@\[\^\\s@\]\+\\\.\[\^\\s@\]\+\$\//,
  );
  assert.match(
    customerInfoSource,
    /const koreanMobilePhonePattern = \/\^01\[016789\]\\d\{7,8\}\$\//,
  );
  assert.match(customerInfoSource, /function normalizeCustomerPhoneNumber/);
  assert.match(customerInfoSource, /function formatCustomerPhoneNumber/);
  assert.match(
    customerInfoSource,
    /normalizeCustomerPhoneNumber\(value\)\.slice\(0, 11\)/,
  );
  assert.match(customerInfoSource, /function sanitizeCustomerEmail/);
  assert.match(customerInfoSource, /function formatCustomerFieldValue/);
  assert.match(customerInfoSource, /inputMode:\s*"numeric"/);
  assert.match(customerInfoSource, /maxLength:\s*13/);
  assert.match(
    customerInfoSource,
    /placeholder:\s*"전화번호를 입력해주세요\."/,
  );
  assert.match(
    customerInfoSource,
    /inputMode=\{"inputMode" in field \? field\.inputMode : undefined\}/,
  );
  assert.match(
    customerInfoSource,
    /maxLength=\{"maxLength" in field \? field\.maxLength : undefined\}/,
  );
  assert.match(customerInfoSource, /isCustomerInfoFieldValid/);
  assert.match(customerInfoSource, /fieldName === "customerPhone"/);
  assert.match(
    customerInfoSource,
    /koreanMobilePhonePattern\.test\(normalizeCustomerPhoneNumber\(value\)\)/,
  );
  assert.match(customerInfoSource, /handleCustomerInfoSubmit/);
  assert.match(customerInfoSource, /setInvalidTargets/);
  assert.match(customerInfoSource, /window\.requestAnimationFrame/);
  assert.match(
    customerInfoSource,
    /scrollIntoView\(\{\s*behavior:\s*"smooth",\s*block:\s*"center",?\s*\}\)/s,
  );
  assert.match(customerInfoSource, /focus\(\{\s*preventScroll:\s*true\s*\}\)/s);
  assert.match(
    customerInfoSource,
    /if \(firstInvalidTarget\) \{[\s\S]*?return;/,
  );
  assert.match(customerInfoSource, /onPaymentSubmit\?\.\(\{/);
  assert.match(customerInfoSource, /summary,/);
  assert.match(customerInfoSource, /customer:\s*fieldValues/);
  assert.match(customerInfoSource, /agreements/);
  assert.match(customerInfoSource, /<form[^>]*noValidate/s);
  assert.match(customerInfoSource, /onSubmit=\{handleCustomerInfoSubmit\}/);
  assert.match(customerInfoSource, /III\. 주문자 정보 입력/);
  assert.match(customerInfoSource, /결제 완료 후 영업일 기준 1일 이내/);
  assert.match(customerInfoSource, /결제 내역/);
  assert.match(
    customerInfoSource,
    /<dt>카테고리<\/dt>\s*<dd>\{summary\.categoryLabel\}<\/dd>/s,
  );
  assert.match(customerInfoSource, /summary\.optionRows\.map/);
  assert.match(customerInfoSource, /이름\(담당자명\)\*/);
  assert.match(customerInfoSource, /회사명/);
  assert.match(customerInfoSource, /연락처\*/);
  assert.match(customerInfoSource, /카카오톡 상담 연락처/);
  assert.match(customerInfoSource, /이메일\*/);
  assert.match(customerInfoSource, /영수증·파일 전달/);
  assert.match(customerInfoSource, /required:\s*true/);
  assert.match(
    customerInfoSource,
    /aria-invalid=\{isTargetInvalid\(field\.name\)\}/,
  );
  assert.match(
    customerInfoSource,
    /data-invalid=\{isTargetInvalid\(field\.name\)\}/,
  );
  assert.match(
    customerInfoSource,
    /ref=\{setValidationTargetRef\(field\.name\)\}/,
  );
  assert.match(customerInfoSource, /전체 동의/);
  assert.match(customerInfoSource, /개인정보 수집 및 이용에 동의합니다\./);
  assert.match(customerInfoSource, /개인정보 처리방침에 동의합니다\./);
  assert.match(customerInfoSource, /privacyCollection:\s*false/);
  assert.match(customerInfoSource, /privacyPolicy:\s*false/);
  assert.doesNotMatch(customerInfoSource, /privacyCollection:\s*true/);
  assert.doesNotMatch(customerInfoSource, /privacyPolicy:\s*true/);
  assert.match(customerInfoSource, /type="checkbox"/);
  assert.match(customerInfoSource, /required/);
  assert.match(
    customerInfoSource,
    /aria-invalid=\{isTargetInvalid\(item\.id\)\}/,
  );
  assert.match(
    customerInfoSource,
    /data-invalid=\{isTargetInvalid\(item\.id\)\}/,
  );
  assert.doesNotMatch(customerInfoSource, /function AgreementCheckIcon/);
  assert.match(customerInfoSource, /agreementCheckboxIcon/);
  assert.match(customerInfoSource, /name="check-01"/);
  assert.match(customerInfoSource, /size=\{20\}/);
  assert.match(customerInfoSource, /agreementDetailList/);
  assert.doesNotMatch(customerInfoSource, /href="#"/);
  assert.match(customerInfoSource, /href=\{item\.href\}/);
  assert.match(customerInfoSource, /target="_blank"/);
  assert.match(customerInfoSource, /rel="noreferrer"/);
  assert.doesNotMatch(
    customerInfoSource,
    /<button className=\{styles\.agreementViewButton\}/,
  );
  assert.match(customerInfoSource, /보기/);
  assert.match(customerInfoSource, /type="submit"/);
  assert.match(customerInfoSource, /결제하기/);
  assert.match(serviceCardsSource, /"use client"/);
  assert.match(serviceCardsSource, /import type \{ ServiceItem \}/);
  assert.match(serviceCardsSource, /onDirectServiceSelect\?:/);
  assert.match(serviceCardsSource, /onQuoteServiceSelect\?:/);
  assert.match(serviceCardsSource, /serviceCardClickable/);
  assert.match(serviceCardsSource, /onDirectServiceSelect\(service\)/);
  assert.match(serviceCardsSource, /onQuoteServiceSelect\(service\)/);
  assert.match(
    serviceCardsSource,
    /<button[\s\S]*className=\{`\$\{styles\.serviceCard\}/,
  );
  assert.doesNotMatch(
    serviceCardsSource,
    /role=\{cardClickHandler \? "button" : undefined\}/,
  );
  assert.doesNotMatch(
    serviceCardsSource,
    /tabIndex=\{cardClickHandler \? 0 : undefined\}/,
  );
  assert.match(dialogSource, /role="dialog"/);
  assert.match(dialogSource, /aria-modal="true"/);
  assert.match(dialogSource, /handleOverlayMouseDown/);
  assert.match(dialogSource, /event\.target === event\.currentTarget/);
  assert.match(dialogSource, /맞춤·대량·촬영/);
  assert.match(dialogSource, /카카오톡 1:1 상담으로 이동합니다/);
  assert.match(dialogSource, /href=\{KAKAO_CHANNEL_URL\}/);
  assert.match(contactSource, /https:\/\/pf\.kakao\.com\/_JAFAG/);
  assert.match(stylesSource, /\.stepList\s*\{[^}]*display:\s*none/s);
  assert.match(
    stylesSource,
    /\.orderPage\s*\{[^}]*--order-step-top-gap:\s*32px;/s,
  );
  assert.match(orderFlowRule, /padding:\s*72px 20px/);
  assert.match(
    stylesSource,
    /\.orderPage\[data-order-option-active="true"\] \.orderFlow\s*\{[^}]*padding-top:\s*var\(--site-header-height, 52px\);/s,
  );
  assert.match(
    stylesSource,
    /\.orderPage\[data-order-option-active="true"\] \.orderInner\s*\{[^}]*padding-top:\s*var\(--order-step-top-gap\);/s,
  );
  assert.doesNotMatch(
    stylesSource,
    /\.orderPage\[data-order-option-active="true"\] \.orderFlow\s*\{[^}]*padding-top:\s*calc\(/s,
  );
  assert.match(orderInnerRule, /width:\s*100%/);
  assert.match(orderInnerRule, /gap:\s*32px/);
  assert.match(
    flowSectionSource,
    /data-order-category-active=\{!selectedDirectService\}/,
  );
  assert.match(
    flowSectionSource,
    /<div className=\{styles\.categoryStep\}>[\s\S]*?<OrderMethodSelector[\s\S]*?<div className=\{styles\.productSection\}>[\s\S]*?styles\.productSectionHeader[\s\S]*?<ServiceCards/,
  );
  assert.match(
    stylesSource,
    /\.categoryStep\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*gap:\s*32px/s,
  );
  assert.match(
    stylesSource,
    /\.productSection\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*gap:\s*20px/s,
  );
  assert.match(pcMediaStyles, /\.categoryStep\s*\{[^}]*gap:\s*52px/s);
  assert.match(
    pcMediaStyles,
    /\.orderInner\[data-order-category-active="true"\]\s*\{[^}]*gap:\s*52px/s,
  );
  assert.match(
    stylesSource,
    /\.optionHeader\s*\{[^}]*scroll-margin-top:\s*calc\(\s*var\(--site-header-height, 52px\) \+ var\(--order-step-top-gap\)\s*\);/s,
  );
  assert.match(stylesSource, /\.optionHeaderTitle\s*\{[^}]*display:\s*none/s);
  assert.match(stylesSource, /\.optionHeaderSpacer\s*\{[^}]*display:\s*none/s);
  assert.match(
    stylesSource,
    /@media \(max-width:\s*639px\)[\s\S]*?\.optionHeader\s*\{[\s\S]*?position:\s*fixed[\s\S]*?top:\s*0[\s\S]*?left:\s*0[\s\S]*?z-index:\s*30[\s\S]*?width:\s*100vw[\s\S]*?height:\s*64px[\s\S]*?box-sizing:\s*border-box[\s\S]*?border-bottom:\s*1px solid var\(--landing-gray-100\)[\s\S]*?backdrop-filter:\s*blur\(10px\)/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*639px\)[\s\S]*?\.orderPage\[data-order-option-active="true"\] \.orderFlow\s*\{[^}]*padding-top:\s*64px;/,
  );
  assert.match(
    desktopMediaStyles,
    /\.orderPage\s*\{[^}]*--order-step-top-gap:\s*52px;/s,
  );
  assert.doesNotMatch(stylesSource, /padding-top:\s*(?:100|132)px/);
  assert.doesNotMatch(tabletMediaStyles, /\.heroInner,\s*\.orderInner/);
  assert.doesNotMatch(desktopMediaStyles, /\.heroInner,\s*\.orderInner/);
  assert.match(
    stylesSource,
    /\.heroInner\s*\{[\s\S]*?width:\s*min\(100%,\s*390px\);/,
  );
  assert.match(
    tabletMediaStyles,
    /\.heroInner\s*\{[\s\S]*?width:\s*min\(100%,\s*640px\);/,
  );
  assert.match(
    tabletMediaStyles,
    /\.heroInner\s*\{[\s\S]*?padding:\s*var\(--site-page-top-offset, 124px\) 20px 72px;/,
  );
  assert.match(
    desktopMediaStyles,
    /\.heroInner\s*\{[\s\S]*?width:\s*min\(100%,\s*1080px\);/,
  );
  assert.doesNotMatch(desktopMediaStyles, /\.hero\s*\{[^}]*min-height:/);
  assert.match(
    desktopMediaStyles,
    /\.heroInner\s*\{[\s\S]*?padding-top:\s*var\(--site-page-top-offset, 124px\);[\s\S]*?padding-left:\s*80px;[\s\S]*?padding-right:\s*80px;[\s\S]*?padding-bottom:\s*104px;/,
  );
  assert.doesNotMatch(
    extractBlock(stylesSource, ".heroInner"),
    /margin:\s*0 auto;/,
  );
  assert.doesNotMatch(
    tabletMediaStyles,
    /\.heroInner\s*\{[\s\S]*?margin:\s*0 auto;/,
  );
  assert.match(desktopMediaStyles, /\.heroInner\s*\{[\s\S]*?margin:\s*0 auto;/);
  assert.match(
    pcMediaStyles,
    /\.heroInner,\s*\.orderInner\s*\{[\s\S]*?width:\s*1360px/,
  );
  assert.doesNotMatch(pcMediaStyles, /\.hero\s*\{[^}]*min-height:/);
  assert.match(
    pcMediaStyles,
    /\.heroInner\s*\{[\s\S]*?padding-top:\s*var\(--site-page-top-offset, 124px\);[\s\S]*?padding-bottom:\s*104px;[\s\S]*?margin:\s*0 auto;/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*639px\)[\s\S]*?\.optionHeaderTitle\s*\{[\s\S]*?display:\s*block[\s\S]*?font-size:\s*20px[\s\S]*?line-height:\s*28px/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*639px\)[\s\S]*?\.optionBackButtonText\s*\{[\s\S]*?clip:\s*rect\(0 0 0 0\)/,
  );
  assert.match(
    landingStylesSource,
    /@media \(max-width:\s*639px\)[\s\S]*?:global\(body\[data-order-option-active="true"\]\) \.header\s*\{[\s\S]*?display:\s*none/,
  );
  assert.match(
    stylesSource,
    /\.stepList\s*\{[^}]*width:\s*fit-content[^}]*max-width:\s*100%[^}]*margin:\s*0;[^}]*display:\s*none/s,
  );
  assert.match(
    stylesSource,
    /\.stepItem\s*\{[^}]*display:\s*flex[^}]*align-items:\s*center[^}]*gap:\s*12px/s,
  );
  assert.match(stylesSource, /\.stepContent\s*\{[^}]*gap:\s*4px/s);
  assert.match(
    stylesSource,
    /\.stepChip\s*\{[^}]*width:\s*24px[^}]*height:\s*24px[^}]*border-radius:\s*100px/s,
  );
  assert.match(
    stylesSource,
    /\.stepItemActive \.stepChip\s*\{[^}]*background:\s*var\(--landing-brand-500\)/s,
  );
  assert.match(
    stylesSource,
    /\.stepItemActive \.stepLabel\s*\{[^}]*font-weight:\s*700/s,
  );
  assert.match(
    stylesSource,
    /\.stepChevron\s*\{[^}]*width:\s*16px[^}]*height:\s*16px/s,
  );
  assert.match(
    tabletMediaStyles,
    /\.stepList\s*\{[^}]*display:\s*flex[^}]*justify-content:\s*flex-start/s,
  );
  assert.doesNotMatch(stylesSource, /\.stepItemComplete/);
  assert.doesNotMatch(stylesSource, /\.resultStepList/);
  assert.match(
    stylesSource,
    /\.heroTitleMobileBreak\s*\{[^}]*display:\s*inline/s,
  );
  assert.match(
    stylesSource,
    /\.heroTitleDesktopSpace\s*\{[^}]*display:\s*none/s,
  );
  assert.match(
    stylesSource,
    /\.heroBadge\s*\{[^}]*border:\s*1px solid transparent[^}]*background-color:\s*rgba\(48,\s*186,\s*195,\s*0\.1\)[^}]*color:\s*var\(--landing-brand-500\)/s,
  );
  assert.match(
    stylesSource,
    /\.heroBadge::before\s*\{[^}]*background-image:\s*var\(--landing-brand-border-end\),\s*var\(--landing-brand-border-start\)/s,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*640px\)[\s\S]*?\.heroTitleMobileBreak\s*\{[^}]*display:\s*none/s,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*640px\)[\s\S]*?\.heroTitleDesktopSpace\s*\{[^}]*display:\s*inline/s,
  );
  assert.match(stylesSource, /\.methodCard\s*\{[^}]*border-radius:\s*16px/s);
  assert.match(stylesSource, /\.methodCard\s*\{[^}]*cursor:\s*pointer/s);
  assert.match(
    stylesSource,
    /\.methodLabel\s*\{[^}]*border:\s*1px solid transparent/s,
  );
  assert.match(
    stylesSource,
    /\.methodLabel\s*\{[^}]*background-clip:\s*padding-box/s,
  );
  assert.match(
    stylesSource,
    /\.methodLabel\s*\{[^}]*background-color:\s*var\(--method-label-background\)/s,
  );
  assert.doesNotMatch(
    stylesSource,
    /\.methodLabel\s*\{[^}]*background-image:/s,
  );
  assert.match(
    stylesSource,
    /\.methodLabel::before\s*\{[^}]*background-image:/s,
  );
  assert.match(
    stylesSource,
    /\.methodLabelBrand\s*\{[^}]*--method-label-background:\s*rgba\(48,\s*186,\s*195,\s*0\.1\)/s,
  );
  assert.match(
    stylesSource,
    /\.methodLabelBrand\s*\{[^}]*--method-label-border-start:\s*var\(--landing-brand-border-start\)/s,
  );
  assert.match(
    stylesSource,
    /\.methodLabelQuote\s*\{[^}]*--method-label-background:\s*rgba\(67,\s*160,\s*245,\s*0\.1\)/s,
  );
  assert.match(
    stylesSource,
    /\.methodLabelQuote\s*\{[^}]*--method-label-border-start:\s*var\(--landing-info-border-start\)/s,
  );
  assert.match(
    stylesSource,
    /\.methodCardActiveQuote\s*\{[^}]*border-color:\s*var\(--landing-info-500\)[^}]*background:\s*var\(--landing-info-50\)/s,
  );
  assert.match(
    stylesSource,
    /\.methodCardActiveQuote\s+\.methodTitle\s*\{[^}]*color:\s*var\(--landing-info-500\)/s,
  );
  assert.match(
    stylesSource,
    /\.consultDialogOverlay\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.5\)/s,
  );
  assert.match(stylesSource, /\.consultDialogPanel\s*\{[^}]*gap:\s*8px/s);
  assert.match(
    stylesSource,
    /\.consultDialogCard\s*\{[^}]*border-radius:\s*12px/s,
  );
  assert.match(stylesSource, /\.consultDialogAction\s*\{[^}]*width:\s*148px/s);
  assert.match(stylesSource, /\.optionLayout\s*\{[^}]*display:\s*flex/s);
  assert.match(stylesSource, /\.optionMain\s*\{[^}]*gap:\s*72px/s);
  assert.match(
    stylesSource,
    /\.optionServiceGrid\s*\{[^}]*grid-template-columns:\s*1fr/s,
  );
  assert.match(
    stylesSource,
    /\.optionServiceCard\s*\{[^}]*border-radius:\s*16px/s,
  );
  assert.match(
    stylesSource,
    /\.optionServiceCard\.optionServiceCardButton\s*\{[^}]*background:\s*var\(--landing-gray-50\)[^}]*padding:\s*32px[^}]*border-color:\s*transparent/s,
  );
  assert.match(
    stylesSource,
    /\.optionServiceCardButton\.optionServiceCardSelectedExtra\s*\{[^}]*border-color:\s*var\(--landing-brand-500\)[^}]*background:\s*#effcfd/s,
  );
  assert.match(
    stylesSource,
    /\.optionServiceBadge\s*\{[^}]*border:\s*1px solid transparent/s,
  );
  assert.match(
    stylesSource,
    /\.optionServiceBadge::before\s*\{[^}]*background-image:/s,
  );
  assert.match(
    stylesSource,
    /\.optionServiceBadgeInfo\s*\{[^}]*--option-service-badge-border-start:\s*linear-gradient[^}]*--option-service-badge-border-end:\s*linear-gradient[^}]*border-color:\s*transparent[^}]*color:\s*var\(--landing-gray-800\)/s,
  );
  assert.match(
    stylesSource,
    /\.optionServiceCardSelectedExtra \.optionServiceBadgeInfo\s*\{[^}]*--option-service-badge-background:\s*rgba\(48,\s*186,\s*195,\s*0\.1\)[^}]*--option-service-badge-border-start:\s*var\(--landing-brand-border-start\)[^}]*--option-service-badge-border-end:\s*var\(--landing-brand-border-end\)[^}]*background-color:\s*var\(--option-service-badge-background\)[^}]*color:\s*var\(--landing-brand-500\)/s,
  );
  assert.match(
    stylesSource,
    /\.optionServiceCardSelectedExtra \.optionServiceTitle\s*\{[^}]*color:\s*var\(--landing-brand-500\)/s,
  );
  assert.doesNotMatch(stylesSource, /\.optionServiceBadgeInfo::before/);
  assert.match(
    stylesSource,
    /\.optionChoiceButton\s*\{[^}]*min-height:\s*52px/s,
  );
  assert.match(
    stylesSource,
    /\.quantityTableHeader,\s*\.quantityRow\s*\{[^}]*grid-template-columns:\s*69px repeat\(3,\s*minmax\(max-content,\s*1fr\)\)/s,
  );
  assert.match(
    stylesSource,
    /\.quantityTableScroll\s*\{[^}]*width:\s*calc\(100% \+ 40px\)[^}]*margin-inline:\s*-20px[^}]*padding-inline:\s*20px[^}]*box-sizing:\s*border-box[^}]*overflow-x:\s*auto[^}]*scroll-padding-inline:\s*20px/s,
  );
  assert.match(
    stylesSource,
    /\.quantityTableScroll::-webkit-scrollbar\s*\{[^}]*display:\s*none/s,
  );
  assert.match(
    stylesSource,
    /\.quantityTable\s*\{[^}]*min-width:\s*max-content/s,
  );
  assert.match(stylesSource, /\.quantityTable\s*\{[^}]*gap:\s*20px/s);
  assert.match(
    stylesSource,
    /\.quantityTableHeader span,\s*\.quantityRow span,\s*\.quantityRow strong\s*\{[^}]*white-space:\s*nowrap/s,
  );
  assert.match(
    stylesSource,
    /\.quantityTableHeader,\s*\.quantityRow\s*\{[^}]*gap:\s*20px/s,
  );
  assert.match(stylesSource, /\.quantityTableBody\s*\{[^}]*gap:\s*16px/s);
  assert.match(
    stylesSource,
    /\.quantityRow:not\(:last-child\)::after\s*\{[^}]*background-image:\s*repeating-linear-gradient\([^}]*var\(--landing-gray-100\) 0 2px,[^}]*transparent 2px 4px/s,
  );
  assert.doesNotMatch(
    stylesSource,
    /\.quantityRow:not\(:last-child\)::after\s*\{[^}]*border-bottom:\s*1px dotted/s,
  );
  assert.doesNotMatch(
    stylesSource,
    /\.quantityRow\s*\{[^}]*border-bottom:\s*1px solid/s,
  );
  assert.match(
    stylesSource,
    /\.orderSummary\s*\{[^}]*background:\s*var\(--landing-gray-50\)/s,
  );
  assert.match(
    stylesSource,
    /\.productSectionHeader p\s*\{[^}]*font-size:\s*20px[^}]*line-height:\s*28px/s,
  );
  assert.match(stylesSource, /\.orderSummary h3\s*\{[^}]*font-size:\s*20px/s);
  assert.match(
    stylesSource,
    /\.optionSection h3,\s*\.optionSectionHeader h3,\s*\.orderSummary h3\s*\{[^}]*font-size:\s*20px[^}]*line-height:\s*28px/s,
  );
  assert.match(
    stylesSource,
    /\.summaryList\s*\{[^}]*background-image:\s*repeating-linear-gradient\([^}]*var\(--landing-gray-100\) 0 2px,[^}]*transparent 2px 4px/s,
  );
  assert.doesNotMatch(
    stylesSource,
    /\.summaryList\s*\{[^}]*border-bottom:\s*1px solid/s,
  );
  assert.match(
    stylesSource,
    /\.summaryActions p\s*\{[^}]*flex-wrap:\s*wrap[^}]*gap:\s*4px/s,
  );
  assert.match(
    stylesSource,
    /\.summaryConsultLead\s*\{[^}]*white-space:\s*nowrap/s,
  );
  assert.match(
    stylesSource,
    /\.summaryActions button:not\(\.paymentButton\)\s*\{[^}]*white-space:\s*nowrap/s,
  );
  assert.match(stylesSource, /\.mobilePaymentBar\s*\{[^}]*position:\s*sticky/s);
  assert.match(
    stylesSource,
    /\.customerInfoStep\s*\{[^}]*width:\s*min\(100%,\s*640px\)/s,
  );
  assert.match(stylesSource, /\.customerInfoStep\s*\{[^}]*gap:\s*20px/s);
  assert.match(
    stylesSource,
    /\.customerPaymentCard\s*\{[^}]*background:\s*var\(--landing-gray-50\)/s,
  );
  assert.match(
    stylesSource,
    /\.customerPaymentCard\s*\{[^}]*padding:\s*16px 20px/s,
  );
  assert.match(
    stylesSource,
    /\.customerInfoHeader h3,\s*\.customerPaymentCard h3\s*\{[^}]*font-size:\s*20px[^}]*line-height:\s*28px/s,
  );
  assert.match(
    stylesSource,
    /\.customerPaymentCard h3\s*\{[^}]*font-size:\s*20px[^}]*line-height:\s*28px/s,
  );
  assert.match(
    stylesSource,
    /\.resultPaymentCard h2\s*\{[^}]*font-size:\s*20px[^}]*line-height:\s*28px/s,
  );
  assert.match(
    stylesSource,
    /\.customerSummaryDivider\s*\{[^}]*background-image:\s*repeating-linear-gradient\([^}]*var\(--landing-gray-100\) 0 2px,[^}]*transparent 2px 4px/s,
  );
  assert.match(stylesSource, /\.customerInput\s*\{[^}]*height:\s*52px/s);
  assert.match(stylesSource, /\.customerInput\s*\{[^}]*border-radius:\s*16px/s);
  assert.match(
    stylesSource,
    /\.customerField\[data-invalid="true"\] \.customerInput\s*\{[^}]*border-color:\s*#ef4444/s,
  );
  assert.match(
    stylesSource,
    /\.customerField\[data-invalid="true"\] \.customerInput:focus\s*\{[^}]*border-color:\s*#ef4444/s,
  );
  assert.match(
    stylesSource,
    /\.agreementCheckboxInput\s*\{[^}]*clip:\s*rect\(0 0 0 0\)/s,
  );
  assert.match(
    stylesSource,
    /\.agreementCheckboxInput:checked \+ \.agreementCheckboxMark\s*\{[^}]*background:\s*var\(--landing-brand-500\)/s,
  );
  assert.match(
    stylesSource,
    /\.agreementCheckboxMark\s*\{[^}]*width:\s*24px[^}]*height:\s*24px[^}]*background:\s*var\(--landing-gray-400\)/s,
  );
  assert.match(
    stylesSource,
    /\.agreementCheckboxMark\s*\{[^}]*border-radius:\s*8px/s,
  );
  assert.match(
    stylesSource,
    /\.agreementCheckboxMark\s*\{[^}]*display:\s*inline-flex[^}]*align-items:\s*center[^}]*justify-content:\s*center/s,
  );
  assert.match(
    stylesSource,
    /\.agreementCheckboxIcon\s*\{[^}]*display:\s*block/s,
  );
  assert.match(
    stylesSource,
    /\.agreementRow\[data-invalid="true"\] \.agreementCheckboxMark\s*\{[^}]*outline:\s*2px solid #ef4444/s,
  );
  assert.match(
    stylesSource,
    /\.agreementDivider::before\s*\{[^}]*background:\s*var\(--landing-gray-100\)/s,
  );
  assert.match(stylesSource, /\.agreementList\s*\{[^}]*gap:\s*8px/s);
  assert.match(stylesSource, /\.agreementDetailRow\s*\{[^}]*padding:\s*8px 0/s);
  assert.match(
    stylesSource,
    /\.agreementViewButton\s*\{[^}]*font-size:\s*12px[^}]*line-height:\s*16px[^}]*text-decoration:\s*underline/s,
  );
  assert.match(
    stylesSource,
    /\.agreementViewButton\s*\{[^}]*color:\s*#64748b/s,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*768px\)[\s\S]*?\.optionLayout\s*\{[\s\S]*?display:\s*grid[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\) 280px/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*768px\)[\s\S]*?\.customerPaymentCard\s*\{[\s\S]*?padding:\s*24px 32px/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*768px\)[\s\S]*?\.quantityTableScroll\s*\{[\s\S]*?width:\s*100%[\s\S]*?margin-inline:\s*0[\s\S]*?padding-inline:\s*0[\s\S]*?scroll-padding-inline:\s*0/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*768px\)[\s\S]*?\.mobilePaymentBar\s*\{[^}]*display:\s*none/s,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*1440px\)[\s\S]*?\.optionMain\s*\{[^}]*gap:\s*72px/s,
  );
  assert.match(stylesSource, /grid-template-columns:\s*repeat\(2,/);
  assert.match(stylesSource, /grid-template-columns:\s*1fr/);
  assert.match(landingStylesSource, /\.serviceGrid/);
  assert.match(
    landingStylesSource,
    /--landing-brand-border-start:\s*linear-gradient/,
  );
  assert.match(
    landingStylesSource,
    /--landing-info-border-start:\s*linear-gradient/,
  );
  assert.match(landingStylesSource, /rgba\(67,\s*160,\s*245,\s*0\.8\)/);
  assert.match(landingStylesSource, /grid-template-columns:\s*repeat\(3,/);
  assert.match(landingStylesSource, /grid-template-columns:\s*repeat\(2,/);
  assert.match(landingStylesSource, /grid-template-columns:\s*1fr/);
  assert.equal(countMatches(orderMethodsSource, /title:/g), 2);
  assert.match(orderMethodsSource, /id:\s*"direct"/);
  assert.match(orderMethodsSource, /id:\s*"quote"/);
  assert.match(orderMethodsSource, /tone:\s*"brand"/);
  assert.match(orderMethodsSource, /tone:\s*"quote"/);
  assert.match(contentSource, /규격·사양이 정해진 표준 제품/);
  assert.match(contentSource, /규격 협의 필요하거나 대량 주문/);
  assert.match(contentSource, /정보 입력/);
  assert.match(contentSource, /export type OrderStepId/);
  assert.match(contentSource, /export type OrderSelectedOptionIds/);
  assert.match(contentSource, /export type OrderSelectionSummary/);
  assert.match(contentSource, /categoryLabel:\s*string/);
  assert.match(contentSource, /optionRows:\s*ReadonlyArray/);
  assert.match(contentSource, /priceRows:\s*ReadonlyArray/);
  assert.match(contentSource, /productId:\s*string/);
  assert.match(contentSource, /optionValues:\s*Partial<Record/);
  assert.match(contentSource, /quantity:\s*number \| null/);
  assert.match(contentSource, /quotedTotal:\s*number/);
  assert.match(contentSource, /variant:\s*ProductVariant/);
  assert.match(contentSource, /export const formatOrderCurrency/);
  assert.doesNotMatch(contentSource, /orderServiceSearchParam/);
  assert.match(contentSource, /export const orderCategories = \[/);
  for (const [categoryId, categorySlug] of [
    ["brochure-catalog", "brochure"],
    ["leaflet-pamphlet", "leaflet"],
    ["poster-flyer", "poster"],
    ["banner-display", "banner"],
    ["business-card-envelope", "business-card"],
    ["logo", "logo"],
    ["package-shopping-bag", "package"],
    ["photo-shoot", "photo"],
    ["etc", "custom"],
  ]) {
    assert.match(
      contentSource,
      new RegExp(
        `id: "${categoryId}"[\\s\\S]*?slug: "${categorySlug}"`,
      ),
    );
  }
  assert.match(contentSource, /export function getOrderCategoryBySlug/);
  assert.match(contentSource, /export function getOrderCategoryHref/);
  assert.match(contentSource, /export const getOrderDirectServiceHref/);
  assert.doesNotMatch(contentSource, /orderOptionCatalog|unit_prices/);
  assert.match(servicesSource, /export function createServiceItems/);
  assert.match(servicesSource, /products\.map\(\(product\) =>/);
  assert.match(servicesSource, /product\.startingPrice/);
  assert.match(servicesSource, /productId:\s*product\.id/);
  assert.match(servicesSource, /export function getDirectServiceItemById/);
  assert.match(
    servicesSource,
    /service\.id === serviceId && !service\.isQuote/,
  );
  assert.doesNotMatch(servicesSource, /photo-shoot|id:\s*"etc"/);
  assert.match(
    quoteServicesSource,
    /export const fixedQuoteServices = \[[\s\S]*?title: "패키지 · 쇼핑백"[\s\S]*?title: "촬영"[\s\S]*?title: "기타"/,
  );
  assert.match(quoteServicesSource, /export function getFixedQuoteServiceById/);
  assert.match(serviceCardsSource, /import \{[\s\S]*fixedQuoteServices/);
  assert.match(
    serviceCardsSource,
    /\[\s*\.\.\.services,\s*\.\.\.fixedQuoteServices,?\s*\]/,
  );
  assert.match(serviceCardsSource, /serviceGrid/);
  assert.match(serviceCardsSource, /serviceCard/);
  assert.match(serviceCardsSource, /견적 후 주문\(카카오톡\)/);
  assert.match(iconSource, /"order-option-back"/);
  assert.match(iconSource, /function OrderOptionBackIcon/);
  assert.match(iconSource, /viewBox="0 0 20 20"/);
  assert.match(
    iconSource,
    /M8\.88856 4\.16797L3\.33301 10\.0013L8\.88856 15\.8346M3\.33301 10\.0013L16\.6663 10\.0013/,
  );
  assert.match(iconSource, /strokeWidth="2"/);
  assert.match(headerSource, /usePathname/);
  assert.match(headerSource, /href:\s*"\/order"/);
  assert.match(headerSource, /aria-current/);
  assert.doesNotMatch(
    [routeSource, stylesSource, contentSource, headerSource].join("\n"),
    /figma\.com\/api\/mcp\/asset|https:\/\/www\.figma\.com\/api/,
  );
});

test("quantity table total shows print amount without the order total", () => {
  const optionSelectionSource = read(
    "apps/user/app/(site)/order/OrderOptionSelection.tsx",
  );
  const orderContentSource = read("apps/user/app/_content/order.ts");
  const quantitySectionSource = extractBetween(
    optionSelectionSource,
    "{selectedVariant.quantitySection ?",
    "</section>",
  );

  assert.match(
    quantitySectionSource,
    /formatOrderCurrency\(rowCalculation\.printAmount\)/,
  );
  assert.match(
    quantitySectionSource,
    /formatOrderUnitPrice\(quantityRow\.unitPrice\)/,
  );
  assert.doesNotMatch(orderContentSource, /minimumFractionDigits/);
  assert.match(orderContentSource, /maximumFractionDigits: 20/);
  assert.doesNotMatch(
    quantitySectionSource,
    /formatOrderCurrency\(rowCalculation\.totalPrice\)/,
  );
});

test("shared payment result presentation is wired", () => {
  const resultComponentPath =
    "apps/user/app/(site)/order/OrderPaymentResult.tsx";
  const stylesPath = "apps/user/app/(site)/order/page.module.css";
  const appStylesPath = "apps/user/app/page.module.css";

  assert.equal(existsSync(path.join(repoRoot, resultComponentPath)), true);

  const resultSource = read(resultComponentPath);
  const stylesSource = read(stylesPath);
  const appStylesSource = read(appStylesPath);
  const guideLinesSource = extractBetween(
    resultSource,
    "const successGuideLines",
    "] as const;",
  );

  assert.match(resultSource, /"use client"/);
  assert.match(resultSource, /useEffect/);
  assert.match(resultSource, /type OrderSelectionSummary/);
  assert.match(resultSource, /formatOrderCurrency/);
  assert.match(resultSource, /export type OrderPaymentSuccessData/);
  assert.match(resultSource, /export type OrderPaymentFailureData/);
  assert.match(resultSource, /data\?: OrderPaymentSuccessData/);
  assert.match(resultSource, /data\?: OrderPaymentFailureData/);
  assert.match(resultSource, /contentHeight\?: boolean/);
  assert.match(resultSource, /contentHeight = false/);
  assert.match(
    resultSource,
    /showProgress \? styles\.resultPageWithProgress : ""/,
  );
  assert.match(resultSource, /styles\.resultPageContentHeight/);
  assert.doesNotMatch(resultSource, /defaultSuccessResultData/);
  assert.match(resultSource, /defaultFailureResultData/);
  assert.match(resultSource, /function createPaymentDetailGroups/);
  assert.doesNotMatch(resultSource, /const paymentDetailGroups = \[/);
  assert.match(resultSource, /data-order-result-active/);
  assert.match(
    resultSource,
    /document\.body\.dataset\.orderResultActive = "true"/,
  );
  assert.match(
    resultSource,
    /delete document\.body\.dataset\.orderResultActive/,
  );
  assert.match(resultSource, /import \{ OrderProgress \}/);
  assert.match(
    resultSource,
    /<OrderProgress activeStepIndex=\{resultStepIndex\} \/>/,
  );
  assert.doesNotMatch(resultSource, /orderSteps\.map/);
  assert.doesNotMatch(resultSource, /stepItemComplete/);
  assert.match(resultSource, /const resultStepIndex = 3/);
  assert.match(resultSource, /name="order-option-back"/);
  assert.match(resultSource, /정보 입력으로/);
  assert.match(resultSource, /IV\. 결제 완료/);
  assert.match(resultSource, /\/figma-assets\/order-payment-result-icon\.png/);
  assert.match(resultSource, /결제가 완료되었습니다/);
  assert.match(resultSource, /결제에 실패했습니다/);
  assert.match(resultSource, /주문이 접수되었습니다\./);
  assert.match(
    resultSource,
    /아래 씨브레인 카카오톡 채널로 "결제완료" 메시지를 남겨주시면 담당자가/,
  );
  assert.match(resultSource, /확인 후 빠르게 일정 안내드리겠습니다\./);
  assert.match(
    resultSource,
    /failureReason:\s*"결제가 정상적으로 완료되지 않았습니다\."/,
  );
  assert.match(resultSource, /실패사유 : \{failureReason\}/);
  assert.match(resultSource, /결제 내역/);
  assert.match(
    resultSource,
    /function OrderResultPaymentCard\(\{\s*data\s*\}\s*:\s*\{\s*data:\s*OrderPaymentSuccessData;?\s*\}\)/s,
  );
  assert.match(resultSource, /"categoryLabel"/);
  assert.match(
    resultSource,
    /\.\.\.\(summary\.categoryLabel\s*\?\s*\[\{ label: "카테고리", value: summary\.categoryLabel \}\]\s*:\s*\[\]\),\s*\{ label: "서비스", value: summary\.serviceLabel \}/s,
  );
  assert.match(resultSource, /summary\.categoryLabel/);
  assert.match(resultSource, /summary\.serviceLabel/);
  assert.match(resultSource, /\.\.\.summary\.optionRows/);
  assert.doesNotMatch(
    resultSource,
    /summary\.(paperLabel|pageLabel|quantityLabel)/,
  );
  assert.match(resultSource, /data\.companyName/);
  assert.match(resultSource, /data\.paymentMethod/);
  assert.match(resultSource, /formatOrderCurrency\(totalPrice\)/);
  assert.match(resultSource, /failureReason=\{failureData\.failureReason\}/);
  assert.match(resultSource, /props\.data/);
  assert.match(resultSource, /if \(isSuccess && !successData\) \{/);
  assert.match(resultSource, /return null/);
  assert.match(resultSource, /data=\{successData\}/);
  assert.doesNotMatch(resultSource, /디자인 \+ 인쇄/);
  assert.doesNotMatch(resultSource, /일반지 \(스노우지 유광\)/);
  assert.doesNotMatch(resultSource, /12p/);
  assert.doesNotMatch(resultSource, /500부/);
  assert.doesNotMatch(resultSource, /노코더스/);
  assert.doesNotMatch(resultSource, /totalPrice:\s*520000/);
  assert.doesNotMatch(resultSource, /520,000원/);
  assert.match(resultSource, /결제완료 상담하기/);
  assert.doesNotMatch(resultSource, /카카오톡 채널 열기/);
  assert.doesNotMatch(resultSource, /resultActionTextDesktop/);
  assert.doesNotMatch(resultSource, /resultActionTextCompact/);
  assert.doesNotMatch(resultSource, /message-typing/);
  assert.doesNotMatch(resultSource, /styles\.resultActionIcon/);
  assert.match(resultSource, /다른 제품 주문하기/);
  assert.match(resultSource, /다시 결제하기/);
  assert.equal(countMatches(guideLinesSource, /\n\s*["']/g), 4);
  assert.match(guideLinesSource, /아래 \[결제완료 상담하기\]/);
  assert.match(resultSource, /href=\{KAKAO_CHANNEL_URL\}/);
  assert.match(resultSource, /target="_blank"/);
  assert.match(resultSource, /rel="noreferrer"/);
  assert.match(stylesSource, /\.resultPage\s*\{/);
  assert.match(
    stylesSource,
    /\.resultPage\s*\{[^}]*--order-result-header-height:\s*var\(--site-header-height, 52px\);/s,
  );
  assert.doesNotMatch(stylesSource, /--order-result-top-gap/);
  assert.match(stylesSource, /\.resultPageContentHeight\s*\{/);
  assert.match(stylesSource, /min-height:\s*auto/);
  assert.match(stylesSource, /\.resultSection\s*\{/);
  assert.match(
    stylesSource,
    /\.resultSection\s*\{[^}]*padding:\s*var\(--order-result-header-height\) 20px 72px;/s,
  );
  assert.match(stylesSource, /\.resultPageContentHeight \.resultSection\s*\{/);
  assert.match(stylesSource, /\.resultInner\s*\{/);
  assert.match(
    stylesSource,
    /\.resultInner\s*\{[^}]*padding-top:\s*var\(--order-step-top-gap\);/s,
  );
  assert.match(stylesSource, /\.resultProgress\s*\{/);
  assert.match(stylesSource, /\.resultMobileHeader\s*\{/);
  assert.match(stylesSource, /\.resultContent\s*\{/);
  assert.match(stylesSource, /\.resultIcon\s*\{/);
  assert.match(stylesSource, /\.resultTitle\s*\{/);
  assert.match(stylesSource, /\.resultDescription\s*\{/);
  assert.match(stylesSource, /\.resultPaymentCard\s*\{/);
  assert.match(
    stylesSource,
    /\.resultPaymentCard\s*\{[^}]*background:\s*var\(--landing-gray-50\)/s,
  );
  assert.match(
    stylesSource,
    /\.resultPaymentDivider\s*\{[^}]*background-image:\s*repeating-linear-gradient\([^}]*var\(--landing-gray-100\) 0 2px,[^}]*transparent 2px 4px/s,
  );
  assert.match(stylesSource, /\.resultGuideList\s*\{/);
  assert.match(
    stylesSource,
    /\.resultGuideList li\s*\{[^}]*color:\s*#475569[^}]*font-weight:\s*500/s,
  );
  assert.match(
    stylesSource,
    /\.resultGuideList li::before\s*\{[^}]*color:\s*#475569[^}]*font-weight:\s*500/s,
  );
  assert.match(stylesSource, /\.resultActionList\s*\{/);
  assert.match(
    stylesSource,
    /\.resultActionList\s*\{[^}]*flex-wrap:\s*nowrap/s,
  );
  assert.match(
    stylesSource,
    /\.resultActionButton\s*\{[^}]*width:\s*min\(148px,\s*calc\(\(100% - 8px\) \/ 2\)\)/s,
  );
  assert.doesNotMatch(stylesSource, /\.resultActionIcon\s*\{/);
  assert.match(stylesSource, /\.resultActionBrand\s*\{/);
  assert.match(stylesSource, /\.resultActionKakao\s*\{/);
  assert.match(
    stylesSource,
    /@media \(max-width:\s*399px\)[\s\S]*?\.resultProgress\s*\{[\s\S]*?display:\s*none/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*399px\)[\s\S]*?\.resultPageWithProgress\s*\{[^}]*--order-result-header-height:\s*64px;/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*400px\)[\s\S]*?\.resultMobileHeader\s*\{[\s\S]*?display:\s*none/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*768px\)[\s\S]*?\.resultPaymentCard\s*\{[\s\S]*?padding:\s*24px 32px/,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*1080px\)[\s\S]*?\.resultSection\s*\{[^}]*padding-bottom:\s*104px/,
  );
  assert.doesNotMatch(
    stylesSource,
    /\.resultSection\s*\{[^}]*padding-top:\s*var\(--site-page-top-offset, 124px\)/s,
  );
  assert.match(
    appStylesSource,
    /@media \(max-width:\s*399px\)[\s\S]*?:global\(body\[data-order-result-active="true"\]\) \.header\s*\{[\s\S]*?display:\s*none/,
  );
});

test("site orders use the common checkout and result flow", () => {
  const successRoutePath = "apps/user/app/(site)/order/success/page.tsx";
  const failRoutePath = "apps/user/app/(site)/order/fail/page.tsx";
  const checkoutRoutePath = "apps/user/app/api/orders/checkout/route.ts";
  const paymentPath = "apps/user/app/(site)/order/payment.ts";
  const pagePath = "apps/user/app/(site)/order/OrderPageClient.tsx";

  assert.equal(existsSync(path.join(repoRoot, successRoutePath)), false);
  assert.equal(existsSync(path.join(repoRoot, failRoutePath)), false);

  const checkoutRouteSource = read(checkoutRoutePath);
  const paymentSource = read(paymentPath);
  const pageSource = read(pagePath);

  assert.match(checkoutRouteSource, /getPublishedProduct/);
  assert.match(checkoutRouteSource, /createOrderProductCatalogItem/);
  assert.match(checkoutRouteSource, /calculateProductSelection/);
  assert.match(
    checkoutRouteSource,
    /calculation\.totalPrice !== selection\.quotedTotal/,
  );
  assert.match(checkoutRouteSource, /createSiteCheckout/);
  assert.match(checkoutRouteSource, /createNicepayCheckoutRequest/);
  assert.doesNotMatch(checkoutRouteSource, /payload\.amount/);
  assert.doesNotMatch(checkoutRouteSource, /payload\.totalPrice/);
  assert.match(paymentSource, /fetch\("\/api\/orders\/checkout"/);
  assert.match(paymentSource, /checkoutRequestId/);
  assert.match(paymentSource, /selection:/);
  assert.doesNotMatch(paymentSource, /totalPrice/);
  assert.match(pageSource, /crypto\.randomUUID/);
  assert.match(pageSource, /checkoutRequestRef/);
  assert.match(pageSource, /requestNicepayPayment/);
  assert.doesNotMatch(pageSource, /router\.push/);
  assert.doesNotMatch(pageSource, /pay\.nicepay\.co\.kr\/v1\/js/);
});
