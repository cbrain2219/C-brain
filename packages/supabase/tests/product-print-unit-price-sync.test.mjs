import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

import {
  calculateUnitPrice,
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

test("decimal unit prices retain the exact supplied print totals", () => {
  assert.equal(calculateUnitPrice(90000, 4000), 22.5);
  assert.equal(calculateUnitPrice(110000, 4000), 27.5);
  assert.equal(calculateUnitPrice(190000, 4000), 47.5);
  assert.equal(calculateUnitPrice(210000, 4000), 52.5);
  assert.equal(calculateUnitPrice(490000, 300), 1633.3);
  assert.equal(calculateUnitPrice(500000, 300), 1666.7);
});

test("all seed quantity rows keep decimal unit prices and exact print totals", () => {
  const result = transformSeedVariants(JSON.parse(payload));

  assert.equal(result.priceRowCount, 272);

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
  for (const configuration of Object.values(byVariant)) {
    for (const rows of Object.values(configuration.priceRowsBySelection)) {
      for (const row of rows) {
        assert.equal(
          row.unitPrice,
          Number((row.printAmount / row.quantity).toFixed(1)),
        );
      }
    }
  }

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
    brochure.configuration.variants["브로슈어 · 카탈로그"]
      .priceRowsBySelection["0:0:0:0"][2];

  assert.equal(first.changedRowCount, 272);
  assert.deepEqual(recoveredRow, {
    printAmount: 490000,
    quantity: 300,
    unitPrice: 1633.3,
  });

  const second = transformGroupedProducts(first.products, seedVariants);
  assert.equal(second.changedRowCount, 0);
});
