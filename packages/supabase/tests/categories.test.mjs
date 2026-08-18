import assert from "node:assert/strict";
import test from "node:test";

import {
  blogAllCategory,
  getBlogCategoryOptions,
  getPortfolioCategory,
  getPortfolioCategoryLabel,
  getProductCategory,
  getProductCategoryLabel,
  isPortfolioType,
  isProductType,
  normalizeBlogCategory,
  portfolioCategories,
  portfolioTypes,
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

test("portfolio categories append other without changing product categories", () => {
  assert.deepEqual(portfolioTypes, [...productTypes, "기타"]);
  assert.deepEqual(
    portfolioCategories.map(({ id }) => id),
    [...productCategories.map(({ id }) => id), "other"],
  );
  assert.equal(getPortfolioCategory("기타")?.id, "other");
  assert.equal(getPortfolioCategoryLabel("other"), "기타");
  assert.equal(isPortfolioType("기타"), true);
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

test("blog categories keep the fixed six first and append normalized custom values", () => {
  assert.equal(blogAllCategory, "전체");
  assert.equal(
    normalizeBlogCategory(" 브로슈어·카탈로그 "),
    "브로슈어 · 카탈로그",
  );
  assert.equal(normalizeBlogCategory(" 인쇄   실무팁 "), "인쇄 실무팁");
  assert.deepEqual(
    getBlogCategoryOptions([
      "인쇄 실무팁",
      "브로슈어·카탈로그",
      " 인쇄   실무팁 ",
      "DESIGN",
      "design",
      "전체",
      "",
    ]),
    [...productTypes, "인쇄 실무팁", "DESIGN"],
  );
});
