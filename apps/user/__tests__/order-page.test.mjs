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
  const flowSectionPath = "apps/user/app/(site)/order/OrderFlowSection.tsx";
  const methodSelectorPath =
    "apps/user/app/(site)/order/OrderMethodSelector.tsx";
  const optionSelectionPath =
    "apps/user/app/(site)/order/OrderOptionSelection.tsx";
  const customerInfoPath =
    "apps/user/app/(site)/order/OrderCustomerInfoStep.tsx";
  const dialogPath = "apps/user/app/(site)/order/OrderConsultDialog.tsx";
  const stylesPath = "apps/user/app/(site)/order/page.module.css";
  const contentPath = "apps/user/app/_content/order.ts";

  assert.equal(existsSync(path.join(repoRoot, routePath)), true);
  assert.equal(existsSync(path.join(repoRoot, flowSectionPath)), true);
  assert.equal(existsSync(path.join(repoRoot, methodSelectorPath)), true);
  assert.equal(existsSync(path.join(repoRoot, optionSelectionPath)), true);
  assert.equal(existsSync(path.join(repoRoot, customerInfoPath)), true);
  assert.equal(existsSync(path.join(repoRoot, dialogPath)), true);
  assert.equal(existsSync(path.join(repoRoot, stylesPath)), true);
  assert.equal(existsSync(path.join(repoRoot, contentPath)), true);

  const routeSource = read(routePath);
  const flowSectionSource = read(flowSectionPath);
  const methodSelectorSource = read(methodSelectorPath);
  const optionSelectionSource = read(optionSelectionPath);
  const customerInfoSource = read(customerInfoPath);
  const dialogSource = read(dialogPath);
  const stylesSource = read(stylesPath);
  const landingStylesSource = read("apps/user/app/page.module.css");
  const contentSource = read(contentPath);
  const headerSource = read("apps/user/app/_components/Header.tsx");
  const iconSource = read("apps/user/components/Icon.tsx");
  const orderMethodsSource = extractBetween(
    contentSource,
    "export const orderMethods",
    "] as const satisfies ReadonlyArray<OrderMethod>;",
  );
  const servicesSource = read("apps/user/app/_content/services.ts");
  const servicesArraySource = extractBetween(
    servicesSource,
    "export const services",
    "] as const satisfies ReadonlyArray<ServiceItem>;",
  );
  const serviceCardsSource = read("apps/user/app/_components/ServiceCards.tsx");
  const orderInnerRule = extractBlock(stylesSource, ".orderInner");
  const tabletMediaStyles = extractBlock(
    stylesSource,
    "@media (min-width: 640px)",
  );
  const tabletToFoldMediaStyles = extractBlock(
    stylesSource,
    "@media (min-width: 640px) and (max-width: 1079px)",
  );
  const desktopMediaStyles = extractBlock(
    stylesSource,
    "@media (min-width: 1080px)",
  );
  const pcMediaStyles = extractBlock(
    stylesSource,
    "@media (min-width: 1440px)",
  );

  assert.match(routeSource, /export default function OrderPage/);
  assert.match(routeSource, /"use client"/);
  assert.match(routeSource, /useEffect/);
  assert.match(routeSource, /useState<OrderStepId>\("category"\)/);
  assert.match(routeSource, /useState<ServiceItem \| null>\(null\)/);
  assert.match(routeSource, /useState<OrderSelectionSummary \| null>\(null\)/);
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
  assert.match(routeSource, /selectedDirectService=\{selectedDirectService\}/);
  assert.match(
    routeSource,
    /onDirectServiceSelect=\{handleDirectServiceSelect\}/,
  );
  assert.match(routeSource, /onCategoryReset=\{handleCategoryReset\}/);
  assert.match(routeSource, /orderStep=\{orderStep\}/);
  assert.match(routeSource, /onCustomerInfoStart=\{handleCustomerInfoStart\}/);
  assert.match(routeSource, /onOptionBack=\{handleOptionBack\}/);
  assert.match(routeSource, /selectedOrderSummary=\{selectedOrderSummary\}/);
  assert.doesNotMatch(routeSource, /orderProducts\.map/);
  assert.match(routeSource, /order-hero-background\.png/);
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
  assert.match(flowSectionSource, /onCategoryReset:\s*\(\) => void/);
  assert.match(flowSectionSource, /import \{ OrderMethodSelector \}/);
  assert.match(flowSectionSource, /import \{ OrderOptionSelection \}/);
  assert.match(flowSectionSource, /import \{ OrderCustomerInfoStep \}/);
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
  assert.match(flowSectionSource, /<OrderMethodSelector onQuoteSelect=/);
  assert.match(flowSectionSource, /selectedDirectService/);
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
  assert.match(flowSectionSource, /activeStepIndex/);
  assert.match(flowSectionSource, /stepItemComplete/);
  assert.match(flowSectionSource, /optionBackButton/);
  assert.match(flowSectionSource, /optionBackButtonText/);
  assert.match(flowSectionSource, /name="order-option-back"/);
  assert.match(flowSectionSource, /size=\{18\}/);
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
  assert.match(flowSectionSource, /summary=\{selectedOrderSummary\}/);
  assert.match(
    flowSectionSource,
    /onDirectServiceSelect=\{onDirectServiceSelect\}/,
  );
  assert.match(flowSectionSource, /onQuoteServiceSelect=\{openConsultDialog\}/);
  assert.match(flowSectionSource, /setIsConsultDialogOpen\(true\)/);
  assert.match(
    flowSectionSource,
    /onClose=\{\(\) => setIsConsultDialogOpen\(false\)\}/,
  );
  assert.match(methodSelectorSource, /"use client"/);
  assert.match(methodSelectorSource, /useState/);
  assert.match(methodSelectorSource, /onQuoteSelect\?: \(\) => void/);
  assert.match(methodSelectorSource, /aria-pressed/);
  assert.match(methodSelectorSource, /setSelectedMethodId\(method\.id\)/);
  assert.match(methodSelectorSource, /onQuoteSelect\?\.\(\)/);
  assert.match(methodSelectorSource, /methodCardActiveQuote/);
  assert.match(optionSelectionSource, /"use client"/);
  assert.match(optionSelectionSource, /getOrderOptionConfig\(service\.id\)/);
  assert.match(optionSelectionSource, /II\. 서비스 선택/);
  assert.match(optionSelectionSource, /optionConfig\.pageSectionTitle/);
  assert.match(optionSelectionSource, /optionConfig\.paperSectionTitle/);
  assert.match(optionSelectionSource, /V\. 수량 선택/);
  assert.match(optionSelectionSource, /주문 요약/);
  assert.match(optionSelectionSource, /mobilePaymentBar/);
  assert.match(optionSelectionSource, /결제하기/);
  assert.match(optionSelectionSource, /onPaymentStart/);
  assert.match(optionSelectionSource, /OrderSelectionSummary/);
  assert.match(optionSelectionSource, /handlePaymentStart/);
  assert.match(optionSelectionSource, /onClick=\{handlePaymentStart\}/);
  assert.match(optionSelectionSource, /카카오톡 1:1 상담/);
  assert.match(customerInfoSource, /"use client"/);
  assert.match(customerInfoSource, /useRef/);
  assert.match(customerInfoSource, /OrderSelectionSummary/);
  assert.match(customerInfoSource, /formatOrderCurrency/);
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
  assert.match(customerInfoSource, /<form[^>]*noValidate/s);
  assert.match(customerInfoSource, /onSubmit=\{handleCustomerInfoSubmit\}/);
  assert.match(customerInfoSource, /III\. 주문자 정보 입력/);
  assert.match(customerInfoSource, /결제 완료 후 영업일 기준 1일 이내/);
  assert.match(customerInfoSource, /결제 내역/);
  assert.match(customerInfoSource, /페이지 수 \/ 수량/);
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
  assert.match(customerInfoSource, /function AgreementCheckIcon/);
  assert.match(customerInfoSource, /agreementCheckboxIcon/);
  assert.match(customerInfoSource, /M10\.6 1L3\.44048 8\.2L1 5\.74572/);
  assert.match(customerInfoSource, /href="#"/);
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
  assert.match(serviceCardsSource, /type ServiceItem/);
  assert.match(serviceCardsSource, /onDirectServiceSelect\?:/);
  assert.match(serviceCardsSource, /onQuoteServiceSelect\?:/);
  assert.match(serviceCardsSource, /serviceCardClickable/);
  assert.match(serviceCardsSource, /onDirectServiceSelect\(service\)/);
  assert.match(serviceCardsSource, /onQuoteServiceSelect\(service\)/);
  assert.match(
    serviceCardsSource,
    /role=\{cardClickHandler \? "button" : undefined\}/,
  );
  assert.match(
    serviceCardsSource,
    /tabIndex=\{cardClickHandler \? 0 : undefined\}/,
  );
  assert.match(dialogSource, /role="dialog"/);
  assert.match(dialogSource, /aria-modal="true"/);
  assert.match(dialogSource, /handleOverlayMouseDown/);
  assert.match(dialogSource, /event\.target === event\.currentTarget/);
  assert.match(dialogSource, /맞춤·대량·촬영/);
  assert.match(dialogSource, /카카오톡 1:1 상담으로 이동합니다/);
  assert.match(dialogSource, /https:\/\/pf\.kakao\.com\/_JAFAG/);
  assert.match(stylesSource, /\.stepList\s*\{[^}]*display:\s*none/s);
  assert.match(orderInnerRule, /width:\s*100%/);
  assert.match(
    stylesSource,
    /\.optionHeader\s*\{[^}]*scroll-margin-top:\s*96px/s,
  );
  assert.match(stylesSource, /\.optionHeaderTitle\s*\{[^}]*display:\s*none/s);
  assert.match(stylesSource, /\.optionHeaderSpacer\s*\{[^}]*display:\s*none/s);
  assert.match(
    stylesSource,
    /@media \(max-width:\s*639px\)[\s\S]*?\.optionHeader\s*\{[\s\S]*?position:\s*fixed[\s\S]*?top:\s*0[\s\S]*?left:\s*0[\s\S]*?z-index:\s*30[\s\S]*?width:\s*100vw[\s\S]*?height:\s*64px[\s\S]*?box-sizing:\s*border-box[\s\S]*?border-bottom:\s*1px solid var\(--landing-gray-100\)[\s\S]*?backdrop-filter:\s*blur\(10px\)/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*639px\)[\s\S]*?\.orderPage\[data-order-option-active="true"\] \.orderFlow\s*\{[\s\S]*?padding-top:\s*100px/,
  );
  assert.match(
    tabletToFoldMediaStyles,
    /\.orderPage\[data-order-option-active="true"\] \.orderFlow\s*\{[\s\S]*?padding-top:\s*132px/,
  );
  assert.match(
    tabletToFoldMediaStyles,
    /\.orderPage\[data-order-option-active="true"\] \.optionHeader\s*\{[\s\S]*?scroll-margin-top:\s*132px/,
  );
  assert.doesNotMatch(tabletMediaStyles, /\.heroInner,\s*\.orderInner/);
  assert.doesNotMatch(desktopMediaStyles, /\.heroInner,\s*\.orderInner/);
  assert.match(
    pcMediaStyles,
    /\.heroInner,\s*\.orderInner\s*\{[\s\S]*?width:\s*1360px/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*639px\)[\s\S]*?\.optionHeaderTitle\s*\{[\s\S]*?display:\s*block[\s\S]*?font-size:\s*14px[\s\S]*?line-height:\s*20px/,
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
    /\.stepItemComplete\s*\{[^}]*border-color:\s*var\(--landing-gray-800\)/s,
  );
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
    /@media \(min-width:\s*640px\)[\s\S]*?\.stepList\s*\{[\s\S]*?display:\s*grid[\s\S]*?grid-template-columns:\s*repeat\(4,/,
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
  assert.match(stylesSource, /\.optionMain\s*\{[^}]*gap:\s*32px/s);
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
    /\.optionServiceBadge\s*\{[^}]*border:\s*1px solid transparent/s,
  );
  assert.match(
    stylesSource,
    /\.optionServiceBadge::before\s*\{[^}]*background-image:/s,
  );
  assert.match(
    stylesSource,
    /\.optionChoiceButton\s*\{[^}]*min-height:\s*52px/s,
  );
  assert.match(
    stylesSource,
    /\.quantityTableHeader,\s*\.quantityRow\s*\{[^}]*grid-template-columns:\s*69px repeat\(3,/s,
  );
  assert.match(stylesSource, /\.quantityTable\s*\{[^}]*gap:\s*20px/s);
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
    /\.agreementCheckboxMark\s*\{[^}]*border-radius:\s*8px/s,
  );
  assert.match(
    stylesSource,
    /\.agreementCheckboxMark\s*\{[^}]*display:\s*inline-flex[^}]*align-items:\s*center[^}]*justify-content:\s*center/s,
  );
  assert.match(stylesSource, /\.agreementCheckboxIcon\s*\{[^}]*opacity:\s*0/s);
  assert.match(
    stylesSource,
    /\.agreementCheckboxInput:checked\s*\+\s*\.agreementCheckboxMark\s*\.agreementCheckboxIcon\s*\{[^}]*opacity:\s*1/s,
  );
  assert.match(
    stylesSource,
    /\.agreementRow\[data-invalid="true"\] \.agreementCheckboxMark\s*\{[^}]*border-color:\s*#ef4444/s,
  );
  assert.match(
    stylesSource,
    /\.agreementDivider\s*\{[^}]*background:\s*var\(--landing-gray-100\)/s,
  );
  assert.match(
    stylesSource,
    /\.agreementViewButton\s*\{[^}]*text-decoration:\s*underline/s,
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
    /@media \(min-width:\s*768px\)[\s\S]*?\.mobilePaymentBar\s*\{[^}]*display:\s*none/s,
  );
  assert.match(
    stylesSource,
    /@media \(min-width:\s*1440px\)[\s\S]*?\.optionMain\s*\{[^}]*gap:\s*52px/s,
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
  assert.match(contentSource, /Ⅲ\. 정보 입력/);
  assert.match(contentSource, /export type OrderStepId/);
  assert.match(contentSource, /export type OrderSelectionSummary/);
  assert.match(contentSource, /export const formatOrderCurrency/);
  assert.match(contentSource, /export const orderOptionCatalog/);
  assert.match(contentSource, /export const getOrderOptionConfig/);
  assert.match(contentSource, /pageSectionTitle:\s*"III\. 페이지 수 선택"/);
  assert.match(contentSource, /paperSectionTitle:\s*"IV\. 용지 선택"/);
  assert.match(contentSource, /"brochure-catalog"/);
  assert.match(contentSource, /"leaflet-pamphlet"/);
  assert.match(contentSource, /"package-shopping-bag"/);
  assert.match(contentSource, /디자인 \+ 인쇄/);
  assert.match(contentSource, /500부/);
  assert.equal(countMatches(servicesArraySource, /title:/g), 9);
  assert.equal(countMatches(servicesArraySource, /id:/g), 9);
  assert.match(servicesSource, /브로슈어 · 카탈로그/);
  assert.match(serviceCardsSource, /serviceGrid/);
  assert.match(serviceCardsSource, /serviceCard/);
  assert.match(serviceCardsSource, /견적 후 주문\(카카오톡\)/);
  assert.match(iconSource, /"order-option-back"/);
  assert.match(iconSource, /function OrderOptionBackIcon/);
  assert.match(iconSource, /viewBox="0 0 18 16"/);
  assert.match(iconSource, /M7\.66667 1L1 8L7\.66667 15M1 8L17 8/);
  assert.match(iconSource, /strokeWidth="2"/);
  assert.match(headerSource, /usePathname/);
  assert.match(headerSource, /href:\s*"\/order"/);
  assert.match(headerSource, /aria-current/);
  assert.doesNotMatch(
    [routeSource, stylesSource, contentSource, headerSource].join("\n"),
    /figma\.com\/api\/mcp\/asset|https:\/\/www\.figma\.com\/api/,
  );
});
