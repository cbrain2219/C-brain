import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPaths = [
  "../app/_components/Header.tsx",
  "../app/_components/Hero.tsx",
  "../app/_components/ServicesSection.tsx",
  "../app/_components/ServiceCards.tsx",
  "../app/_components/CtaSection.tsx",
  "../app/(site)/blog/_components/BlogConsultCard.tsx",
  "../app/(site)/faq/FaqCategoryNavigation.tsx",
  "../app/(site)/order/OrderConsultDialog.tsx",
  "../app/(site)/order/OrderPaymentResult.tsx",
  "../app/_content/company.ts",
];

test("every Kakao consultation entry uses the shared channel URL", async () => {
  const contactSource = await readFile(
    new URL("../app/_content/contact.ts", import.meta.url),
    "utf8",
  );
  const componentSources = await Promise.all(
    componentPaths.map((path) =>
      readFile(new URL(path, import.meta.url), "utf8"),
    ),
  );

  assert.match(
    contactSource,
    /KAKAO_CHANNEL_URL = "https:\/\/pf\.kakao\.com\/_JAFAG"/,
  );

  for (const source of componentSources) {
    assert.match(source, /KAKAO_CHANNEL_URL/);
  }
});

test("visible consultation actions open the Kakao channel safely", async () => {
  const actionPaths = componentPaths.slice(0, 9);
  const actionSources = await Promise.all(
    actionPaths.map((path) => readFile(new URL(path, import.meta.url), "utf8")),
  );

  for (const source of actionSources) {
    assert.match(source, /href=\{KAKAO_CHANNEL_URL\}/);
    assert.match(source, /target="_blank"/);
    assert.match(source, /rel="noreferrer"/);
  }
});
