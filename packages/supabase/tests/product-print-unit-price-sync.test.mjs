import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

import {
  priceModel,
  transformGroupedProducts,
  transformSeedVariants,
} from "../scripts/sync-product-print-unit-prices.mjs";

const seed = await readFile(
  new URL("../../../supabase/seed_products.sql", import.meta.url),
  "utf8",
);
const payload = seed.match(
  /\$variants\$\s*([\s\S]*?)\s*\$variants\$::jsonb/,
)?.[1];

assert.ok(payload, "seed_products.sql variant payload is missing");

test("all seed quantity rows keep workbook unit prices and print totals unchanged", () => {
  const sourceVariants = JSON.parse(payload);
  const result = transformSeedVariants(sourceVariants);

  assert.equal(result.priceRowCount, 280);

  const byVariant = Object.fromEntries(
    result.variants.map((variant) => [
      variant.product_subtype || variant.product_type,
      variant.configuration,
    ]),
  );

  assert.deepEqual(
    byVariant["브로슈어 · 카탈로그"].priceRowsBySelection["0:0:0:0"][0],
    {
      quantity: 100,
      unitPrice: 2100,
      printAmount: 210000,
    },
  );
  assert.deepEqual(
    byVariant["브로슈어 · 카탈로그"].priceRowsBySelection["0:0:0:0"][2],
    {
      quantity: 300,
      unitPrice: 1633.3,
      printAmount: 490000,
    },
  );
  assert.deepEqual(
    byVariant["리플렛 · 팜플렛"].priceRowsBySelection["0:0:0:0"][0],
    {
      quantity: 100,
      unitPrice: 3000,
      printAmount: 300000,
    },
  );
  assert.deepEqual(byVariant.전단지.priceRowsBySelection["0:0:0:0"][2], {
    quantity: 4000,
    unitPrice: 22.5,
    printAmount: 90000,
  });
  assert.deepEqual(byVariant.봉투.priceRowsBySelection["0:0:0"][0], {
    quantity: 500,
    unitPrice: 120,
    printAmount: 60000,
  });
  assert.ok(
    Object.values(byVariant).every(
      (configuration) => configuration.priceModel === priceModel,
    ),
  );
  result.variants.forEach((variant, index) => {
    assert.deepEqual(
      variant.configuration.priceRowsBySelection,
      sourceVariants[index].configuration.priceRowsBySelection,
    );
  });

  const secondPass = transformSeedVariants(result.variants);
  assert.equal(secondPass.changedRowCount, 0);
  assert.deepEqual(secondPass.variants, result.variants);
});

test("legacy grouped products recover exact totals from the seed only once", () => {
  const seedVariants = JSON.parse(payload);
  const productsByType = new Map();

  for (const variant of seedVariants) {
    const product = productsByType.get(variant.product_type) ?? {
      configuration: { variants: {} },
      product_type: variant.product_type,
      status: "published",
    };
    const variantName = variant.product_subtype || variant.product_type;
    const configuration = JSON.parse(JSON.stringify(variant.configuration));

    configuration.priceModel = "service-plus-print-unit-v1";
    for (const rows of Object.values(configuration.priceRowsBySelection)) {
      for (const row of rows) delete row.printAmount;
    }

    product.configuration.variants[variantName] = configuration;
    productsByType.set(variant.product_type, product);
  }

  const first = transformGroupedProducts(
    [...productsByType.values()],
    seedVariants,
  );
  const brochure = first.products.find(
    (product) => product.product_type === "브로슈어 · 카탈로그",
  );
  const recoveredRow =
    brochure.configuration.variants["브로슈어 · 카탈로그"].priceRowsBySelection[
      "0:0:0:0"
    ][2];

  assert.equal(first.changedRowCount, 280);
  assert.deepEqual(recoveredRow, {
    printAmount: 490000,
    quantity: 300,
    unitPrice: 1633.3,
  });

  const second = transformGroupedProducts(first.products, seedVariants);
  assert.equal(second.changedRowCount, 0);
});

test("existing v3 products upgrade the empty business card table without replacing other prices", () => {
  const seedVariants = JSON.parse(payload);
  const productsByType = new Map();
  for (const variant of seedVariants) {
    const product = productsByType.get(variant.product_type) ?? {
      configuration: { variants: {} },
      product_type: variant.product_type,
      status: "published",
    };
    product.configuration.variants[
      variant.product_subtype || variant.product_type
    ] = clone(variant.configuration);
    productsByType.set(variant.product_type, product);
  }
  const products = [...productsByType.values()];
  const card = productsByType.get("명함 · 봉투").configuration.variants.명함;
  delete card.quantityTableVersion;
  card.optionValues.material = ["일반지(스노우, 무광코팅)", "고급지(랑데뷰)"];
  card.priceRowsBySelection = {};
  const before = clone(products);
  const first = transformGroupedProducts(products, seedVariants);
  assert.equal(first.priceRowCount, 280);
  assert.equal(first.changedRowCount, 8);
  assert.deepEqual(products, before);
  assert.deepEqual(first.products.slice(0, 4), before.slice(0, 4));
  const upgraded = first.products.find(
    (product) => product.product_type === "명함 · 봉투",
  );
  assert.deepEqual(
    upgraded.configuration.variants.명함.priceRowsBySelection["1:1"],
    [
      { quantity: 500, unitPrice: 120, printAmount: 40000 },
      { quantity: 1000, unitPrice: 90, printAmount: 60000 },
    ],
  );
  assert.deepEqual(
    upgraded.configuration.variants.봉투,
    productsByType.get("명함 · 봉투").configuration.variants.봉투,
  );
  assert.equal(
    transformGroupedProducts(first.products, seedVariants).changedRowCount,
    0,
  );
});

function clone(value) {
  return structuredClone(value);
}
