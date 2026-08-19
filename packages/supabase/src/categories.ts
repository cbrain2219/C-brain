export const productCategories = [
  { id: "brochure-catalog", label: "브로슈어 · 카탈로그" },
  { id: "leaflet-pamphlet", label: "리플렛 · 팜플렛" },
  { id: "poster-flyer", label: "포스터 · 전단지" },
  { id: "banner-display", label: "배너 · 족자 · 현수막" },
  { id: "business-card-envelope", label: "명함 · 봉투" },
  { id: "logo", label: "로고" },
] as const;

export type ProductCategory = (typeof productCategories)[number];
export type ProductCategoryId = ProductCategory["id"];
export type ProductType = ProductCategory["label"];

export const productTypes = productCategories.map(
  ({ label }) => label,
) as readonly ProductType[];

export const portfolioCategories = [
  ...productCategories,
  { id: "package-shopping-bag", label: "패키지 · 쇼핑백" },
  { id: "photo-shoot", label: "촬영" },
  { id: "other", label: "기타" },
] as const;

export type PortfolioCategory = (typeof portfolioCategories)[number];
export type PortfolioCategoryId = PortfolioCategory["id"];
export type PortfolioType = PortfolioCategory["label"];

export const portfolioTypes = portfolioCategories.map(
  ({ label }) => label,
) as readonly PortfolioType[];

export const blogAllCategory = "전체" as const;

const productCategoryById = new Map(
  productCategories.map((category) => [category.id, category] as const),
);
const productCategoryByLabel = new Map(
  productCategories.map((category) => [
    normalizeProductType(category.label),
    category,
  ]),
);
const portfolioCategoryById = new Map(
  portfolioCategories.map((category) => [category.id, category] as const),
);
const portfolioCategoryByLabel = new Map(
  portfolioCategories.map((category) => [
    normalizeProductType(category.label),
    category,
  ]),
);
const legacyProductCategoryIds: Readonly<Record<string, ProductCategoryId>> = {
  "banner-book": "banner-display",
};

function normalizeProductType(value: string) {
  return value
    .trim()
    .replace(/\s*·\s*/g, " · ")
    .replace(/\s+/g, " ");
}

export function getProductCategory(value: string): ProductCategory | undefined {
  const trimmedValue = value.trim();
  const categoryId = legacyProductCategoryIds[trimmedValue] ?? trimmedValue;

  return (
    productCategoryById.get(categoryId as ProductCategoryId) ??
    productCategoryByLabel.get(normalizeProductType(trimmedValue))
  );
}

export function getPortfolioCategory(
  value: string,
): PortfolioCategory | undefined {
  const trimmedValue = value.trim();
  const categoryId = legacyProductCategoryIds[trimmedValue] ?? trimmedValue;

  return (
    portfolioCategoryById.get(categoryId as PortfolioCategoryId) ??
    portfolioCategoryByLabel.get(normalizeProductType(trimmedValue))
  );
}

export function normalizeBlogCategory(value: string) {
  const normalizedValue = normalizeProductType(value);

  return getProductCategory(normalizedValue)?.label ?? normalizedValue;
}

export function getBlogCategoryOptions(values: readonly string[]) {
  const categories: string[] = [...productTypes];
  const seenCategories = new Set(
    categories.map((category) => category.toLocaleLowerCase("ko-KR")),
  );

  for (const value of values) {
    const category = normalizeBlogCategory(value);
    const categoryKey = category.toLocaleLowerCase("ko-KR");

    if (
      !category ||
      category === blogAllCategory ||
      seenCategories.has(categoryKey)
    ) {
      continue;
    }

    categories.push(category);
    seenCategories.add(categoryKey);
  }

  return categories;
}

export function getProductCategoryLabel(
  categoryId: ProductCategoryId,
): ProductType {
  return (
    productCategoryById.get(categoryId)?.label ?? productCategories[0].label
  );
}

export function getPortfolioCategoryLabel(
  categoryId: PortfolioCategoryId,
): PortfolioType {
  return (
    portfolioCategoryById.get(categoryId)?.label ?? portfolioCategories[0].label
  );
}

export function isProductType(value: string): value is ProductType {
  return productTypes.some((productType) => productType === value);
}

export function isPortfolioType(value: string): value is PortfolioType {
  return portfolioTypes.some((portfolioType) => portfolioType === value);
}
