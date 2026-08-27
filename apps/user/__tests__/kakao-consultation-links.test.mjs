import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionPaths = [
  "../app/_components/ContactActionButtons.tsx",
  "../app/_components/ServicesSection.tsx",
  "../app/_components/ServiceCards.tsx",
  "../app/(site)/blog/_components/BlogConsultCard.tsx",
  "../app/(site)/faq-guide/FaqCategoryNavigation.tsx",
  "../app/(site)/order/OrderConsultDialog.tsx",
  "../app/(site)/order/OrderPaymentResult.tsx",
];

const contentPaths = ["../app/_content/company.ts"];

const sharedActionConsumerPaths = [
  "../app/_components/Header.tsx",
  "../app/_components/Hero.tsx",
  "../app/_components/CtaSection.tsx",
];

test("every Kakao consultation entry uses the shared channel URL", async () => {
  const contactSource = await readFile(
    new URL("../app/_content/contact.ts", import.meta.url),
    "utf8",
  );
  const implementationSources = await Promise.all(
    [...actionPaths, ...contentPaths].map((path) =>
      readFile(new URL(path, import.meta.url), "utf8"),
    ),
  );

  assert.match(
    contactSource,
    /KAKAO_CHANNEL_URL = "https:\/\/pf\.kakao\.com\/_JAFAG"/,
  );

  for (const source of implementationSources) {
    assert.match(source, /KAKAO_CHANNEL_URL/);
  }
});

test("visible consultation actions open the Kakao channel safely", async () => {
  const actionSources = await Promise.all(
    actionPaths.map((path) => readFile(new URL(path, import.meta.url), "utf8")),
  );

  for (const source of actionSources) {
    assert.match(source, /href=\{KAKAO_CHANNEL_URL\}/);
    assert.match(source, /target="_blank"/);
    assert.match(source, /rel="noreferrer"/);
  }
});

test("primary page surfaces reuse the shared contact action group", async () => {
  const consumerSources = await Promise.all(
    sharedActionConsumerPaths.map((path) =>
      readFile(new URL(path, import.meta.url), "utf8"),
    ),
  );

  for (const source of consumerSources) {
    assert.match(source, /ContactActionButtons/);
  }
});
