import assert from "node:assert/strict";
import test from "node:test";

import {
  getProductCategory,
  getProductCategoryLabel,
  isProductType,
  productCategories,
  productTypes,
} from "../src/categories.ts";

test("product categories are fixed to the admin order", () => {
  assert.deepEqual(productTypes, [
    "브로슈어 · 카탈로그",
    "리플렛 · 팜플렛",
    "포스터 · 전단지",
    "배너 · 족자 · 현수막",
    "명함 · 봉투",
    "로고",
  ]);
  assert.deepEqual(
    productCategories.map(({ id }) => id),
    [
      "brochure-catalog",
      "leaflet-pamphlet",
      "poster-flyer",
      "banner-display",
      "business-card-envelope",
      "logo",
    ],
  );
});

test("product category lookup accepts stored labels and legacy public values", () => {
  assert.equal(getProductCategory("브로슈어·카탈로그")?.id, "brochure-catalog");
  assert.equal(getProductCategory(" banner-book ")?.id, "banner-display");
  assert.equal(getProductCategory("기타"), undefined);
  assert.equal(getProductCategoryLabel("logo"), "로고");
});

test("product type guard accepts only the canonical six labels", () => {
  assert.equal(isProductType("명함 · 봉투"), true);
  assert.equal(isProductType("명함·봉투"), false);
  assert.equal(isProductType("촬영"), false);
});
