import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

import {
  priceModel,
  roundHalfToEven,
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

test("round-half-to-even matches the supplied 4,000-sheet print prices", () => {
  assert.equal(roundHalfToEven(90000, 4000), 22);
  assert.equal(roundHalfToEven(110000, 4000), 28);
  assert.equal(roundHalfToEven(190000, 4000), 48);
  assert.equal(roundHalfToEven(210000, 4000), 52);
  assert.equal(roundHalfToEven(490000, 300), 1633);
  assert.equal(roundHalfToEven(500000, 300), 1667);
});

test("all seed quantity rows keep only option-specific print unit prices", () => {
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
    },
  );
  assert.deepEqual(
    byVariant["리플렛 · 팜플렛"].priceRowsBySelection["0:0:0:0"][0],
    {
      quantity: 100,
      unitPrice: 3000,
    },
  );
  assert.deepEqual(byVariant.전단지.priceRowsBySelection["0:0:0:0"][2], {
    quantity: 4000,
    unitPrice: 22,
  });
  assert.deepEqual(byVariant.봉투.priceRowsBySelection["0:0:0"][0], {
    quantity: 500,
    unitPrice: 120,
  });
  assert.ok(
    Object.values(byVariant).every(
      (configuration) => configuration.priceModel === priceModel,
    ),
  );

  const secondPass = transformSeedVariants(result.variants);
  assert.equal(secondPass.changedRowCount, 0);
  assert.deepEqual(secondPass.variants, result.variants);
});
