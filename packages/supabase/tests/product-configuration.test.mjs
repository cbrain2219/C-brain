import assert from "node:assert/strict";
import test from "node:test";

import {
  getProductEstimateMultiplier,
  getProductPriceOptionKeys,
  getProductSelectionKey,
  getProductServiceOptionKeys,
  getProductUiProfile,
  getProductVariants,
  productSubtypeOptions,
} from "../src/productConfiguration.ts";

test("shared product profiles preserve every administrator variant", () => {
  assert.deepEqual(productSubtypeOptions, {
    "브로슈어 · 카탈로그": [],
    "리플렛 · 팜플렛": [],
    "포스터 · 전단지": ["포스터", "전단지"],
    "배너 · 족자 · 현수막": ["배너", "족자", "현수막"],
    "명함 · 봉투": ["명함", "봉투"],
    로고: [],
  });
  assert.deepEqual(getProductVariants("포스터 · 전단지"), [
    "포스터",
    "전단지",
  ]);
  assert.deepEqual(getProductVariants("배너 · 족자 · 현수막"), [
    "배너",
    "족자",
    "현수막",
  ]);
  assert.deepEqual(getProductVariants("로고"), ["로고"]);
});

test("shared profiles preserve administrator option order and units", () => {
  assert.deepEqual(
    getProductUiProfile("브로슈어 · 카탈로그").sections,
    [
      {
        inputMode: "numeric",
        key: "pageCount",
        kind: "options",
        label: "페이지 수 선택",
        valueUnit: "p",
      },
      { inputMode: "text", key: "paper", kind: "options", label: "용지 선택" },
      {
        inputMode: "text",
        key: "thickness",
        kind: "options",
        label: "두께 선택",
      },
      {
        inputMode: "text",
        key: "coverCoating",
        kind: "options",
        label: "표지 코팅 선택",
      },
      {
        key: "quantity",
        kind: "quantity-prices",
        label: "수량 선택",
        quantityUnit: "부",
      },
    ],
  );
  assert.deepEqual(
    getProductUiProfile("명함 · 봉투", "명함").sections.map(
      (section) => section.key,
    ),
    ["size", "baseQuantity", "material", "thickness", "people"],
  );
  assert.deepEqual(
    getProductUiProfile("로고").sections.map((section) => section.key),
    ["logoType", "proposalCount"],
  );
});

test("shared price and service axes create the same keys as the admin form", () => {
  assert.deepEqual(
    getProductPriceOptionKeys("포스터 · 전단지", "전단지"),
    ["size", "paper", "thickness", "side"],
  );
  assert.deepEqual(
    getProductServiceOptionKeys("명함 · 봉투", "명함"),
    ["material", "thickness"],
  );
  assert.deepEqual(getProductPriceOptionKeys("로고"), []);
  assert.deepEqual(getProductServiceOptionKeys("로고"), ["logoType"]);
  assert.equal(
    getProductSelectionKey(
      ["size", "paper", "thickness", "side"],
      { paper: 0, side: 1, size: 2, thickness: 1 },
    ),
    "2:0:1:1",
  );
});

test("estimate multipliers follow the administrator per-unit labels", () => {
  assert.equal(
    getProductEstimateMultiplier("브로슈어 · 카탈로그", "", {
      pageCount: "12",
    }),
    12,
  );
  assert.equal(
    getProductEstimateMultiplier("리플렛 · 팜플렛", "", {}),
    6,
  );
  assert.equal(
    getProductEstimateMultiplier("포스터 · 전단지", "전단지", {
      side: "양면",
    }),
    2,
  );
  assert.equal(
    getProductEstimateMultiplier("명함 · 봉투", "명함", {
      people: "3",
    }),
    3,
  );
  assert.equal(
    getProductEstimateMultiplier("로고", "", { proposalCount: "2종" }),
    2,
  );
  assert.equal(
    getProductEstimateMultiplier("배너 · 족자 · 현수막", "배너", {}),
    1,
  );
  assert.equal(
    getProductEstimateMultiplier("로고", "", { proposalCount: "없음" }),
    null,
  );
});
