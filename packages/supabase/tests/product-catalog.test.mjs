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
          { quantity: 100, unitPrice: 2100, printAmount: 210000 },
          { quantity: 200, unitPrice: 1850, printAmount: 370000 },
          { quantity: 300, unitPrice: 1633.3, printAmount: 490000 },
        ],
        "1:0:0:0": [{ quantity: 100, unitPrice: 2800, printAmount: 280000 }],
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
        material: ["일반지(스노우, 무광코팅)", "고급지(랑데뷰)"],
        people: ["1", "2", "3"],
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
        "0:0:0": [{ quantity: 500, unitPrice: 120, printAmount: 60000 }],
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
        0: { designPrintEstimate: 50000, planningEstimate: null },
      },
    },
  });
}

test("grouped products parse into profile-ordered public catalog items", () => {
  const product = createOrderProductCatalogItem(brochureProduct());

  assert.ok(product);
  assert.equal(product.categoryId, "brochure-catalog");
  assert.equal(product.startingPrice, 850000);
  assert.deepEqual(
    product.variants.map((variant) => variant.id),
    ["브로슈어 · 카탈로그"],
  );
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

test("service estimates plus entered print totals drive calculated totals", () => {
  const variant = createOrderProductCatalogItem(brochureProduct()).variants[0];
  const eightPages = {
    coverCoating: "무광",
    pageCount: "8",
    paper: "일반지",
    thickness: "보통",
  };

  assert.deepEqual(getProductPriceRows(variant, eightPages), [
    { quantity: 100, unitPrice: 2100, printAmount: 210000 },
    { quantity: 200, unitPrice: 1850, printAmount: 370000 },
    { quantity: 300, unitPrice: 1633.3, printAmount: 490000 },
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
    1130000,
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

test("business card printing and logo proposals use their multipliers", () => {
  const businessCardEnvelope = createOrderProductCatalogItem(
    businessCardEnvelopeProduct(),
  );
  const businessCard = businessCardEnvelope.variants[0];
  const logo = createOrderProductCatalogItem(logoProduct()).variants[0];

  assert.equal(
    businessCardEnvelope.startingPrice,
    90000,
    "the public card uses the lowest price across quantity and estimate variants",
  );

  assert.deepEqual(
    calculateProductSelection(businessCard, {
      hasPlanning: false,
      optionValues: {
        material: "일반지(스노우, 무광코팅, 500장)",
        people: "1",
        size: "90x50mm",
        thickness: "보통",
      },
      quantity: 500,
    }),
    {
      designPrintAmount: 50000,
      designPrintEstimate: 50000,
      estimateMultiplier: 1,
      optionRows: [
        { key: "size", label: "사이즈", value: "90x50mm" },
        {
          key: "material",
          label: "재질",
          value: "일반지(스노우, 무광코팅, 500장)",
        },
        { key: "thickness", label: "두께", value: "보통" },
        { key: "people", label: "인원", value: "1명" },
      ],
      planningAmount: 0,
      planningEstimate: 20000,
      priceRows: [
        { label: "디자인비", value: 50000 },
        { label: "인쇄비 (500장)", value: 40000 },
      ],
      printAmount: 40000,
      quantity: 500,
      quantityLabel: "500장",
      totalPrice: 90000,
    },
  );

  assert.equal(
    calculateProductSelection(businessCard, {
      hasPlanning: true,
      optionValues: {
        material: "고급지(랑데뷰 200장)",
        people: "3",
        size: "90x50mm",
        thickness: "두꺼운",
      },
      quantity: 500,
    }).totalPrice,
    200000,
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

test("business card service amounts match administrator estimates without deductions", () => {
  for (const amount of [0, 10000, 50000, 60000]) {
    const source = businessCardEnvelopeProduct();
    const card = source.configuration.variants.명함;
    card.serviceEstimatesBySelection["0:0"].designPrintEstimate = amount;
    const businessCard = createOrderProductCatalogItem(source).variants[0];
    const calculation = calculateProductSelection(businessCard, {
      hasPlanning: false,
      optionValues: {
        material: "일반지(스노우, 무광코팅, 500장)",
        people: "1",
        size: "90x50mm",
        thickness: "보통",
      },
      quantity: 500,
    });

    assert.ok(calculation);
    assert.equal(calculation.designPrintEstimate, amount);
    assert.equal(calculation.designPrintAmount, amount);
    assert.equal(calculation.printAmount, 40000);
    assert.equal(calculation.totalPrice, amount + 40000);
  }
});

test("business card people changes only increase printing fees", () => {
  const businessCard = createOrderProductCatalogItem(
    businessCardEnvelopeProduct(),
  ).variants[0];

  for (const hasPlanning of [false, true]) {
    for (const [quantity, basePrintAmount] of [
      [500, 40000],
      [1000, 60000],
    ]) {
      for (const people of ["1", "2", "3"]) {
        const printAmount = basePrintAmount * Number(people);
        const calculation = calculateProductSelection(businessCard, {
          hasPlanning,
          optionValues: {
            material: "일반지(스노우, 무광코팅, 500장)",
            people,
            size: "90x50mm",
            thickness: "보통",
          },
          quantity,
        });

        assert.ok(calculation);
        assert.equal(calculation.designPrintEstimate, 50000);
        assert.equal(calculation.designPrintAmount, 50000);
        assert.equal(calculation.printAmount, printAmount);
        assert.equal(calculation.planningAmount, hasPlanning ? 20000 : 0);
        assert.equal(
          calculation.totalPrice,
          50000 + printAmount + (hasPlanning ? 20000 : 0),
        );
        assert.deepEqual(calculation.priceRows, [
          { label: "디자인비", value: 50000 },
          {
            label: `인쇄비 (${quantity.toLocaleString("ko-KR")}장)`,
            value: printAmount,
          },
          ...(hasPlanning ? [{ label: "기획비", value: 20000 }] : []),
        ]);
      }
    }
  }
});

test("legacy business card configuration upgrades without mutating stored data", () => {
  const source = businessCardEnvelopeProduct();
  const original = clone(source);
  const product = createOrderProductCatalogItem(source);
  assert.ok(product);
  const card = product.variants[0];
  assert.deepEqual(
    card.optionSections.map((section) => section.key),
    ["size", "material", "thickness", "people"],
  );
  assert.equal(card.quantitySection.quantityUnit, "장");
  for (const key of ["0:0", "0:1", "1:0", "1:1"]) {
    assert.deepEqual(card.priceRowsBySelection[key], [
      { quantity: 500, unitPrice: 120, printAmount: 40000 },
      { quantity: 1000, unitPrice: 90, printAmount: 60000 },
    ]);
  }
  assert.deepEqual(source, original);
});

test("business card quantity tables preserve combination-specific edits and fail closed", () => {
  const source = businessCardEnvelopeProduct();
  const card = source.configuration.variants.명함;
  card.quantityTableVersion = 1;
  card.optionValues.material = [
    "일반지(스노우, 무광코팅, 500장)",
    "고급지(랑데뷰 200장)",
  ];
  card.priceRowsBySelection = {
    "0:0": [{ quantity: 500, unitPrice: 120, printAmount: 40000 }],
    "1:1": [{ quantity: 500, unitPrice: 175, printAmount: 75000 }],
  };
  const variant = createOrderProductCatalogItem(source).variants[0];
  const selected = {
    hasPlanning: true,
    optionValues: {
      material: "고급지(랑데뷰 200장)",
      thickness: "두꺼운",
      size: "90x50mm",
      people: "2",
    },
    quantity: 500,
  };
  assert.equal(calculateProductSelection(variant, selected).totalPrice, 230000);
  assert.equal(
    calculateProductSelection(variant, {
      ...selected,
      optionValues: { ...selected.optionValues, thickness: "보통" },
    }),
    null,
  );
  card.priceRowsBySelection = {};
  assert.equal(createOrderProductCatalogItem(source), null);
  card.priceRowsBySelection = {
    "0:0": [
      { quantity: 500, unitPrice: 120, printAmount: Number.MAX_SAFE_INTEGER },
    ],
  };
  assert.equal(createOrderProductCatalogItem(source), null);
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
    printAmount: 260000,
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

test("legacy rows without a print total keep the multiplication fallback", () => {
  const source = brochureProduct();
  delete source.configuration.variants["브로슈어 · 카탈로그"]
    .priceRowsBySelection["0:0:0:0"][0].printAmount;

  const variant = createOrderProductCatalogItem(source).variants[0];
  const selection = createDefaultProductSelection(variant);

  assert.equal(
    calculateProductSelection(variant, selection).printAmount,
    210000,
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
  ].serviceEstimatesBySelection[""].planningEstimate = Number.MAX_SAFE_INTEGER;
  const variant = createOrderProductCatalogItem(source).variants[0];
  const selection = createDefaultProductSelection(variant);

  assert.ok(selection);
  assert.equal(
    calculateProductSelection(variant, { ...selection, hasPlanning: true }),
    null,
  );
});
