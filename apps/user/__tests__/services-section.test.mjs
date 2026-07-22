import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sectionPath = new URL(
  "../app/_components/ServicesSection.tsx",
  import.meta.url,
);

test("landing services use published product order and preserve env-only fallback", async () => {
  const source = await readFile(sectionPath, "utf8");

  assert.match(source, /listPublishedProducts\(client\)/);
  assert.match(source, /product\.name/);
  assert.match(source, /product\.type/);
  assert.match(source, /getLowestProductUnitPrice\(product\.unit_prices\)/);
  assert.match(
    source,
    /products === undefined \? fallbackServices : products\.map\(toServiceCard\)/,
  );
  assert.doesNotMatch(source, /products\.length.*fallbackServices/);

  const fallbackBlock = source.slice(
    source.indexOf("const fallbackServices"),
    source.indexOf("const priceFormatter"),
  );
  assert.equal(fallbackBlock.match(/title: /g)?.length, 9);
});

test("an empty published product result stays empty instead of using fixtures", () => {
  const fallback = Array.from({ length: 9 }, (_, index) => `fixture-${index}`);
  const selectServices = (products) =>
    products === undefined ? fallback : products;

  assert.equal(selectServices(undefined).length, 9);
  assert.deepEqual(selectServices([]), []);
});
