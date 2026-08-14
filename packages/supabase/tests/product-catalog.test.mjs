import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateProductSelection,
  createDefaultProductSelection,
  createOrderProductCatalog,
  createOrderProductCatalogItem,
  getProductPriceRows,
} from "../src/productCatalog.ts";

const clone = (value) => JSON.parse(JSON.stringify(value));

function publicProduct(productType, variants, overrides = {}) {
  return {
    configuration: { variants },
    id: `product-${productType}`,
    product_type: productType,
    sort_order: 1,
    ...overrides,
  };
}

function brochureProduct() {
  return publicProduct("브로슈어 · 카탈로그", {
    "브로슈어 · 카탈로그": {
      optionValues: {
        coverCoating: ["무광"],
        pageCount: ["8", "12"],
        paper: ["일반지"],
        thickness: ["보통"],
      },
      priceRowsBySelection: {
        "0:0:0:0": [
          { quantity: 100, unitPrice: 2100 },
          { quantity: 200, unitPrice: 1850 },
          { quantity: 300, unitPrice: 1633 },
        ],
        "1:0:0:0": [{ quantity: 100, unitPrice: 2800 }],
      },
      serviceEstimatesBySelection: {
        "": { designPrintEstimate: 80000, planningEstimate: 50000 },
      },
    },
  });
}

function businessCardEnvelopeProduct() {
  const serviceEstimatesBySelection = {
    "0:0": { designPrintEstimate: 50000, planningEstimate: 20000 },
    "0:1": { designPrintEstimate: 60000, planningEstimate: 20000 },
    "1:0": { designPrintEstimate: 50000, planningEstimate: 20000 },
    "1:1": { designPrintEstimate: 60000, planningEstimate: 20000 },
  };

  return publicProduct("명함 · 봉투", {
    명함: {
      optionValues: {
        baseQuantity: ["일반지 500"],
        material: ["일반지", "고급지"],
        people: ["1", "3"],
        size: ["90x50mm"],
        thickness: ["보통", "두꺼운"],
      },
      priceRowsBySelection: {},
      serviceEstimatesBySelection,
    },
    봉투: {
      optionValues: {
        envelopeType: ["소봉투"],
        material: ["백모조지"],
        thickness: ["보통"],
      },
      priceRowsBySelection: {
        "0:0:0": [{ quantity: 500, unitPrice: 120 }],
      },
      serviceEstimatesBySelection: {
        "": { designPrintEstimate: 30000, planningEstimate: 20000 },
      },
    },
  });
}

function logoProduct() {
  return publicProduct("로고", {
    로고: {
      optionValues: {
        logoType: ["워드마크"],
        proposalCount: ["1", "3"],
      },
      priceRowsBySelection: {},
      serviceEstimatesBySelection: {
        "0": { designPrintEstimate: 50000, planningEstimate: null },
      },
    },
  });
}

test("grouped products parse into profile-ordered public catalog items", () => {
  const product = createOrderProductCatalogItem(brochureProduct());

  assert.ok(product);
  assert.equal(product.categoryId, "brochure-catalog");
  assert.equal(product.startingPrice, 850000);
  assert.deepEqual(product.variants.map((variant) => variant.id), [
    "브로슈어 · 카탈로그",
  ]);
  assert.deepEqual(
    product.variants[0].optionSections.map((section) => section.key),
    ["pageCount", "paper", "thickness", "coverCoating"],
  );
  assert.deepEqual(product.variants[0].quantitySection, {
    key: "quantity",
    kind: "quantity-prices",
    label: "수량 선택",
    quantityUnit: "부",
  });
});

test("service estimates plus quantity unit prices drive calculated totals", () => {
  const variant = createOrderProductCatalogItem(brochureProduct()).variants[0];
  const eightPages = {
    coverCoating: "무광",
    pageCount: "8",
    paper: "일반지",
    thickness: "보통",
  };

  assert.deepEqual(getProductPriceRows(variant, eightPages), [
    { quantity: 100, unitPrice: 2100 },
    { quantity: 200, unitPrice: 1850 },
    { quantity: 300, unitPrice: 1633 },
  ]);
  const calculated = calculateProductSelection(variant, {
    hasPlanning: false,
    optionValues: eightPages,
    quantity: 100,
  });

  assert.equal(calculated.designPrintAmount, 640000);
  assert.equal(calculated.printAmount, 210000);
  assert.equal(calculated.totalPrice, 850000);
  assert.equal(
    calculateProductSelection(variant, {
      hasPlanning: false,
      optionValues: eightPages,
      quantity: 300,
    }).totalPrice,
    1129900,
  );
  assert.equal(
    calculateProductSelection(variant, {
      hasPlanning: false,
      optionValues: { ...eightPages, pageCount: "12" },
      quantity: 100,
    }).totalPrice,
    1240000,
  );
  assert.equal(
    calculateProductSelection(variant, {
      hasPlanning: true,
      optionValues: eightPages,
      quantity: 100,
    }).totalPrice,
    1250000,
  );
});

test("service-only products use people and proposal count multipliers", () => {
  const businessCardEnvelope = createOrderProductCatalogItem(
    businessCardEnvelopeProduct(),
  );
  const businessCard = businessCardEnvelope.variants[0];
  const logo = createOrderProductCatalogItem(logoProduct()).variants[0];

  assert.equal(
    businessCardEnvelope.startingPrice,
    90000,
    "the public card matches the admin list, which prioritizes quantity prices",
  );

  assert.equal(
    calculateProductSelection(businessCard, {
      hasPlanning: true,
      optionValues: {
        baseQuantity: "일반지 500",
        material: "고급지",
        people: "3",
        size: "90x50mm",
        thickness: "두꺼운",
      },
      quantity: null,
    }).totalPrice,
    240000,
  );
  assert.equal(
    calculateProductSelection(logo, {
      hasPlanning: false,
      optionValues: { logoType: "워드마크", proposalCount: "3" },
      quantity: null,
    }).totalPrice,
    150000,
  );
  assert.equal(
    calculateProductSelection(logo, {
      hasPlanning: true,
      optionValues: { logoType: "워드마크", proposalCount: "3" },
      quantity: null,
    }),
    null,
  );
});

test("a published variant may expose only administrator-priced service choices", () => {
  const source = logoProduct();
  source.configuration.variants.로고.optionValues.logoType = [
    "워드마크",
    "심볼",
    "워드마크+심볼",
  ];
  source.configuration.variants.로고.serviceEstimatesBySelection["2"] = {
    designPrintEstimate: 80000,
    planningEstimate: null,
  };

  const logo = createOrderProductCatalogItem(source);

  assert.ok(logo);
  assert.equal(logo.startingPrice, 50000);
  assert.equal(
    calculateProductSelection(logo.variants[0], {
      hasPlanning: false,
      optionValues: { logoType: "심볼", proposalCount: "1" },
      quantity: null,
    }),
    null,
  );
  assert.equal(
    calculateProductSelection(logo.variants[0], {
      hasPlanning: false,
      optionValues: { logoType: "워드마크+심볼", proposalCount: "1" },
      quantity: null,
    }).totalPrice,
    80000,
  );
});

test("default selections always resolve to a valid first combination", () => {
  for (const source of [
    brochureProduct(),
    businessCardEnvelopeProduct(),
    logoProduct(),
  ]) {
  const product = createOrderProductCatalogItem(source);

    for (const variant of product.variants) {
      const selection = createDefaultProductSelection(variant);
      assert.ok(selection);
      assert.ok(calculateProductSelection(variant, selection));
    }
  }
});

test("sparse administrator prices fail closed per selection", () => {
  const missingCombination = clone(brochureProduct());
  delete missingCombination.configuration.variants["브로슈어 · 카탈로그"]
    .priceRowsBySelection["1:0:0:0"];

  const duplicateQuantity = clone(brochureProduct());
  duplicateQuantity.configuration.variants[
    "브로슈어 · 카탈로그"
  ].priceRowsBySelection["0:0:0:0"].push({
    quantity: 100,
    unitPrice: 2600,
  });

  const invalidEstimate = clone(logoProduct());
  invalidEstimate.configuration.variants.로고.serviceEstimatesBySelection[
    "0"
  ].designPrintEstimate = null;

  const sparse = createOrderProductCatalogItem(missingCombination);
  assert.ok(sparse);
  assert.deepEqual(
    getProductPriceRows(sparse.variants[0], {
      coverCoating: "무광",
      pageCount: "16",
      paper: "일반지",
      thickness: "보통",
    }),
    [],
  );
  assert.equal(createOrderProductCatalogItem(duplicateQuantity), null);
  assert.equal(createOrderProductCatalogItem(invalidEstimate), null);

  const brochure = brochureProduct();
  assert.deepEqual(
    createOrderProductCatalog([
      brochure,
      { ...clone(brochure), id: "duplicate-brochure" },
      logoProduct(),
    ]).map((product) => product.categoryId),
    ["logo"],
  );
});

test("stale or unknown selections are rejected", () => {
  const variant = createOrderProductCatalogItem(brochureProduct()).variants[0];
  const valid = createDefaultProductSelection(variant);
  assert.ok(valid);

  assert.equal(
    calculateProductSelection(variant, {
      ...valid,
      optionValues: { ...valid.optionValues, paper: "삭제된 용지" },
    }),
    null,
  );
  assert.equal(
    calculateProductSelection(variant, { ...valid, quantity: 999 }),
    null,
  );
  assert.equal(
    calculateProductSelection(variant, {
      ...valid,
      optionValues: { ...valid.optionValues, extra: "tampered" },
    }),
    null,
  );
});

test("calculated totals that exceed safe integer precision are rejected", () => {
  const source = brochureProduct();
  source.configuration.variants[
    "브로슈어 · 카탈로그"
  ].serviceEstimatesBySelection[""].planningEstimate =
    Number.MAX_SAFE_INTEGER;
  const variant = createOrderProductCatalogItem(source).variants[0];
  const selection = createDefaultProductSelection(variant);

  assert.ok(selection);
  assert.equal(
    calculateProductSelection(variant, { ...selection, hasPlanning: true }),
    null,
  );
});
