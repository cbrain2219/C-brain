import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sectionPath = new URL(
  "../app/_components/ServicesSection.tsx",
  import.meta.url,
);
const iconPath = new URL("../components/Icon.tsx", import.meta.url);

test("landing services always render the nine design QA fixtures", async () => {
  const source = await readFile(sectionPath, "utf8");

  assert.match(source, /"use client"/);
  assert.match(source, /import Link from "next\/link"/);
  assert.match(source, /useState/);
  assert.match(source, /OrderConsultDialog/);
  assert.match(source, /getOrderDirectServiceHref/);
  assert.doesNotMatch(source, /getOrderQuoteConsultHref/);
  assert.doesNotMatch(source, /@repo\/supabase/);
  assert.doesNotMatch(source, /createUserSupabaseClient/);
  assert.doesNotMatch(source, /listPublishedProducts/);
  assert.doesNotMatch(source, /loadLandingServices/);
  assert.match(source, /const services = \[/);
  assert.match(source, /\{services\.map\(\(service\) =>/);

  const fixtureBlock = source.slice(
    source.indexOf("const services"),
    source.indexOf("const textButtonStyle"),
  );
  assert.equal(fixtureBlock.match(/title: /g)?.length, 9);
  assert.match(fixtureBlock, /price: "850,000원 ~"/);
  assert.match(fixtureBlock, /price: "370,000원 ~"/);
  assert.match(fixtureBlock, /price: "130,000원 ~"/);
  assert.match(fixtureBlock, /price: "80,000원 ~"/);
  assert.equal(fixtureBlock.match(/price: "50,000원 ~"/g)?.length, 2);
  assert.match(
    fixtureBlock,
    /title: "패키지 · 쇼핑백"[\s\S]*?isQuote: true[\s\S]*?price: "상담 후 견적"/,
  );
  assert.match(
    source,
    /const quoteButtonStyle[\s\S]*?color: "var\(--landing-info-500\)"/,
  );
  assert.doesNotMatch(source, /href=\{KAKAO_CHANNEL_URL\}[\s\S]*?견적 후 주문\(카카오톡\)/);
  assert.doesNotMatch(source, /getOrderQuoteConsultHref\(\)/);
  assert.match(
    source,
    /const openConsultDialog = \(\) => setIsConsultDialogOpen\(true\)/,
  );
  assert.match(
    source,
    /<button[\s\S]*?className=\{styles\.serviceCard\}[\s\S]*?onClick=\{openConsultDialog\}[\s\S]*?type="button"/,
  );
  assert.match(
    source,
    /<OrderConsultDialog[\s\S]*?isOpen=\{isConsultDialogOpen\}[\s\S]*?onClose=\{closeConsultDialog\}/,
  );
  assert.match(
    source,
    /href=\{getOrderDirectServiceHref\(service\.orderServiceId\)\}/,
  );
  assert.match(
    source,
    /<Link[\s\S]*?className=\{styles\.serviceCard\}/,
  );
  assert.match(source, /<span style=\{serviceButtonStyle\}>[\s\S]*?정찰제 즉시결제/);
  assert.match(source, /<span style=\{quoteButtonStyle\}>[\s\S]*?견적 후 주문\(카카오톡\)/);
  assert.match(source, /service\.isQuote \? styles\.serviceQuoteIcon : ""/);
});

test("quote service camera uses the supplied Figma glyph", async () => {
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
