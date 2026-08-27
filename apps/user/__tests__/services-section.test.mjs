import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sectionPath = new URL(
  "../app/_components/ServicesSection.tsx",
  import.meta.url,
);
const homePath = new URL("../app/(site)/page.tsx", import.meta.url);
const iconPath = new URL("../components/Icon.tsx", import.meta.url);
const quoteServicesPath = new URL(
  "../app/_content/quoteServices.ts",
  import.meta.url,
);

test("landing services render the published admin product collection", async () => {
  const [source, homeSource, quoteServicesSource] = await Promise.all([
    readFile(sectionPath, "utf8"),
    readFile(homePath, "utf8"),
    readFile(quoteServicesPath, "utf8"),
  ]);

  assert.match(source, /"use client"/);
  assert.match(source, /import Link from "next\/link"/);
  assert.match(source, /import type \{ ServiceItem \}/);
  assert.match(source, /services: readonly ServiceItem\[\]/);
  assert.match(source, /getOrderCategoryHref/);
  assert.match(source, /getOrderDirectServiceHref/);
  assert.doesNotMatch(source, /useState/);
  assert.doesNotMatch(source, /OrderConsultDialog/);
  assert.doesNotMatch(source, /@repo\/supabase/);
  assert.doesNotMatch(source, /createUserSupabaseClient/);
  assert.doesNotMatch(source, /listPublishedProducts/);
  assert.doesNotMatch(source, /loadLandingServices/);
  assert.match(source, /\{services\.map\(\(service\) =>/);
  assert.match(homeSource, /getPublishedOrderProducts\(\)/);
  assert.match(
    homeSource,
    /<ServicesSection services=\{createServiceItems\(publishedOrderProducts\)\} \/>/,
  );
  assert.match(source, /href=\{getOrderDirectServiceHref\(service\.id\)\}/);
  assert.match(source, /<Link[\s\S]*?className=\{styles\.serviceCard\}/);
  assert.match(
    source,
    /<span style=\{serviceButtonStyle\}>[\s\S]*?정찰제 즉시결제/,
  );
  assert.match(source, /import \{ fixedQuoteServices \}/);
  assert.match(source, /\{fixedQuoteServices\.map\(\(service\) =>/);
  assert.match(source, /href=\{getOrderCategoryHref\(service\.id\)\}/);
  assert.match(
    quoteServicesSource,
    /const fixedQuoteServices = \[[\s\S]*?title: "패키지 · 쇼핑백"[\s\S]*?title: "촬영"[\s\S]*?title: "기타"/,
  );
  assert.match(
    source,
    /const quoteButtonStyle[\s\S]*?color: "var\(--landing-info-500\)"/,
  );
  assert.match(source, /styles\.serviceQuoteIcon/);
  assert.match(source, /styles\.serviceMetaQuote/);
  assert.match(source, /견적 후 주문\(카카오톡\)/);
  assert.match(
    source,
    /aria-label=\{`\$\{service\.title\} 견적 후 주문 상담으로 이동`\}/,
  );
  assert.match(source, /className=\{styles\.serviceConsultCard\}/);
});

test("camera icon keeps the supplied Figma glyph", async () => {
  const source = await readFile(iconPath, "utf8");
  const cameraBlock = source.slice(
    source.indexOf("function CameraIcon"),
    source.indexOf("function CreditCardIcon"),
  );

  assert.match(cameraBlock, /viewBox="0 0 22 18"/);
  assert.match(cameraBlock, /height=\{\(size \* 18\) \/ 24\}/);
  assert.match(cameraBlock, /width=\{\(size \* 22\) \/ 24\}/);
  assert.match(cameraBlock, /d="M14\.0217 1\.28239/);
  assert.match(cameraBlock, /stroke="currentColor"/);
  assert.match(cameraBlock, /strokeWidth="2"/);
  assert.match(cameraBlock, /<circle[\s\S]*?cx="11"/);
  assert.match(cameraBlock, /cy="10\.5"/);
  assert.match(cameraBlock, /r="3"/);
});
