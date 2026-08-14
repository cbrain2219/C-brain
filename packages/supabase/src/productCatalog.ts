import {
  getProductCategory,
  isProductType,
} from "./categories.ts";
import type { ProductCategoryId, ProductType } from "./categories.ts";
import {
  getProductEstimateMultiplier,
  getProductPriceOptionKeys,
  getProductSelectionKey,
  getProductServiceOptionKeys,
  getProductUiProfile,
  getProductVariants,
} from "./productConfiguration.ts";
import type {
  ProductOptionSectionKey,
  ProductSubtype,
  ProductUiSection,
  ProductVariant,
} from "./productConfiguration.ts";
import type { Json } from "./types.ts";

type JsonObject = Record<string, Json | undefined>;

export type OrderProductOptionSection = Extract<
  ProductUiSection,
  { kind: "options" }
> & {
  values: readonly string[];
};

export type OrderProductQuantitySection = Extract<
  ProductUiSection,
  { kind: "quantity-prices" }
>;

export type OrderProductQuantityPrice = {
  quantity: number;
  unitPrice: number;
};

export type OrderProductServiceEstimate = {
  designPrintEstimate: number;
  planningEstimate: number | null;
};

export type OrderProductVariant = {
  estimateUnit: "페이지" | "시안";
  id: ProductVariant;
  optionSections: readonly OrderProductOptionSection[];
  priceRowsBySelection: Readonly<
    Record<string, readonly OrderProductQuantityPrice[]>
  >;
  productSubtype: ProductSubtype | "";
  productType: ProductType;
  quantitySection: OrderProductQuantitySection | null;
  serviceEstimatesBySelection: Readonly<
    Record<string, OrderProductServiceEstimate>
  >;
  showPlanningEstimate: boolean;
};

export type OrderProductCatalogItem = {
  categoryId: ProductCategoryId;
  id: string;
  productType: ProductType;
  sortOrder: number;
  startingPrice: number;
  variants: readonly OrderProductVariant[];
};

export type OrderProductSelection = {
  hasPlanning: boolean;
  optionValues: Partial<Record<ProductOptionSectionKey, string>>;
  quantity: number | null;
};

export type CalculatedProductSelection = {
  designPrintAmount: number;
  designPrintEstimate: number;
  estimateMultiplier: number;
  optionRows: readonly {
    key: ProductOptionSectionKey;
    label: string;
    value: string;
  }[];
  planningAmount: number;
  planningEstimate: number | null;
  priceRows: readonly { label: string; value: number }[];
  printAmount: number;
  quantity: number | null;
  quantityLabel: string | null;
  totalPrice: number;
};

type PublicProductLike = {
  configuration: Json;
  id: string;
  product_type: string;
  sort_order: number;
};

function isJsonObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeAmount(value: Json | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isPositiveInteger(value: Json | undefined): value is number {
  return isSafeAmount(value) && value > 0;
}

function hasUniqueStrings(values: readonly string[]) {
  const normalizedValues = values.map((value) =>
    value.trim().toLocaleLowerCase("ko-KR"),
  );

  return normalizedValues.every(
    (value, index) => value && normalizedValues.indexOf(value) === index,
  );
}

function readOptionSections(
  profile: ReturnType<typeof getProductUiProfile>,
  value: Json | undefined,
) {
  if (!isJsonObject(value)) return null;

  const optionSections: OrderProductOptionSection[] = [];

  for (const section of profile.sections) {
    if (section.kind !== "options") continue;

    const values = value[section.key];

    if (
      !Array.isArray(values) ||
      values.length === 0 ||
      !values.every((item): item is string => typeof item === "string") ||
      !hasUniqueStrings(values)
    ) {
      return null;
    }

    optionSections.push({
      ...section,
      values: values.map((item) => item.trim()),
    });
  }

  return optionSections;
}

function getExpectedSelectionKeys(
  optionKeys: readonly ProductOptionSectionKey[],
  optionSections: readonly OrderProductOptionSection[],
) {
  const valuesByKey = new Map(
    optionSections.map((section) => [section.key, section.values] as const),
  );

  return optionKeys.reduce<string[]>((keys, optionKey) => {
    const values = valuesByKey.get(optionKey);

    if (!values) return [];

    return keys.flatMap((key) =>
      values.map((_, index) => (key ? `${key}:${index}` : String(index))),
    );
  }, [""]);
}

function hasExactKeys(object: JsonObject, expectedKeys: readonly string[]) {
  const keys = Object.keys(object);

  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.hasOwn(object, key))
  );
}

function readPriceRows(
  value: Json | undefined,
  expectedKeys: readonly string[],
  hasQuantitySection: boolean,
) {
  if (!isJsonObject(value)) return null;

  const storedKeys = Object.keys(value);

  if (
    storedKeys.some((key) => !expectedKeys.includes(key)) ||
    (hasQuantitySection ? storedKeys.length === 0 : storedKeys.length > 0)
  ) {
    return null;
  }

  const rowsBySelection: Record<string, OrderProductQuantityPrice[]> = {};

  for (const selectionKey of storedKeys) {
    const rows = value[selectionKey];

    if (!Array.isArray(rows) || rows.length === 0) return null;

    const quantities = new Set<number>();
    const parsedRows: OrderProductQuantityPrice[] = [];

    for (const row of rows) {
      if (!isJsonObject(row)) return null;

      const quantity = row.quantity;
      const unitPrice = row.unitPrice;

      if (
        !isPositiveInteger(quantity) ||
        !isSafeAmount(unitPrice) ||
        quantities.has(quantity)
      ) {
        return null;
      }

      quantities.add(quantity);
      parsedRows.push({ quantity, unitPrice });
    }

    rowsBySelection[selectionKey] = parsedRows;
  }

  return rowsBySelection;
}

function readServiceEstimates(
  value: Json | undefined,
  expectedKeys: readonly string[],
  showPlanningEstimate: boolean,
) {
  if (!isJsonObject(value)) return null;

  const storedKeys = Object.keys(value);
  if (
    storedKeys.length === 0 ||
    storedKeys.some((key) => !expectedKeys.includes(key))
  ) {
    return null;
  }

  const estimatesBySelection: Record<string, OrderProductServiceEstimate> = {};

  for (const selectionKey of storedKeys) {
    const estimate = value[selectionKey];

    if (!isJsonObject(estimate)) return null;

    const designPrintEstimate = estimate.designPrintEstimate;
    const planningEstimate = estimate.planningEstimate;

    if (!isSafeAmount(designPrintEstimate)) {
      return null;
    }

    let storedPlanningEstimate: number | null = null;

    if (showPlanningEstimate) {
      if (!isSafeAmount(planningEstimate)) return null;
      storedPlanningEstimate = planningEstimate;
    } else if (planningEstimate !== null) {
      return null;
    }

    estimatesBySelection[selectionKey] = {
      designPrintEstimate,
      planningEstimate: storedPlanningEstimate,
    };
  }

  return estimatesBySelection;
}

function readVariant(
  productType: ProductType,
  variantName: ProductVariant,
  value: Json | undefined,
): OrderProductVariant | null {
  if (!isJsonObject(value)) return null;

  const productSubtype =
    variantName === productType ? "" : (variantName as ProductSubtype);
  const profile = getProductUiProfile(productType, productSubtype);
  const optionSections = readOptionSections(profile, value.optionValues);

  if (!optionSections) return null;

  const quantitySection =
    profile.sections.find((section) => section.kind === "quantity-prices") ??
    null;
  const priceKeys = getExpectedSelectionKeys(
    getProductPriceOptionKeys(productType, productSubtype),
    optionSections,
  );
  const serviceKeys = getExpectedSelectionKeys(
    getProductServiceOptionKeys(productType, productSubtype),
    optionSections,
  );
  const priceRowsBySelection = readPriceRows(
    value.priceRowsBySelection,
    priceKeys,
    quantitySection !== null,
  );
  const serviceEstimatesBySelection = readServiceEstimates(
    value.serviceEstimatesBySelection,
    serviceKeys,
    profile.showPlanningEstimate,
  );

  if (!priceRowsBySelection || !serviceEstimatesBySelection) return null;

  return {
    estimateUnit: profile.estimateUnit,
    id: variantName,
    optionSections,
    priceRowsBySelection,
    productSubtype,
    productType,
    quantitySection,
    serviceEstimatesBySelection,
    showPlanningEstimate: profile.showPlanningEstimate,
  };
}

function getOptionSelections(variant: OrderProductVariant) {
  return variant.optionSections.reduce<OrderProductSelection["optionValues"][]>(
    (selections, section) =>
      selections.flatMap((selection) =>
        section.values.map((value) => ({
          ...selection,
          [section.key]: value,
        })),
      ),
    [{}],
  );
}

function getStartingPrice(variants: readonly OrderProductVariant[]) {
  const quantityPrices: number[] = [];
  const estimatePrices: number[] = [];

  for (const variant of variants) {
    for (const optionValues of getOptionSelections(variant)) {
      const quantityRows = getProductPriceRows(variant, optionValues);

      if (variant.quantitySection) {
        for (const row of quantityRows) {
          const calculation = calculateProductSelection(variant, {
            hasPlanning: false,
            optionValues,
            quantity: row.quantity,
          });

          if (calculation) quantityPrices.push(calculation.totalPrice);
        }
      } else {
        const calculation = calculateProductSelection(variant, {
          hasPlanning: false,
          optionValues,
          quantity: null,
        });

        if (calculation) estimatePrices.push(calculation.totalPrice);
      }
    }
  }

  const prices = quantityPrices.length > 0 ? quantityPrices : estimatePrices;

  return prices.length > 0 ? Math.min(...prices) : null;
}

export function createOrderProductCatalogItem(
  product: PublicProductLike,
): OrderProductCatalogItem | null {
  if (!isProductType(product.product_type)) return null;
  if (!isJsonObject(product.configuration)) return null;

  const storedVariants = product.configuration.variants;
  if (!isJsonObject(storedVariants)) return null;

  const variantNames = getProductVariants(product.product_type);
  if (!hasExactKeys(storedVariants, variantNames)) return null;

  const variants: OrderProductVariant[] = [];

  for (const variantName of variantNames) {
    const variant = readVariant(
      product.product_type,
      variantName,
      storedVariants[variantName],
    );

    if (!variant || !createDefaultProductSelection(variant)) return null;
    variants.push(variant);
  }

  const category = getProductCategory(product.product_type);
  const startingPrice = getStartingPrice(variants);

  if (!category || startingPrice === null) return null;

  return {
    categoryId: category.id,
    id: product.id,
    productType: product.product_type,
    sortOrder: product.sort_order,
    startingPrice,
    variants,
  };
}

export function createOrderProductCatalog(
  products: readonly PublicProductLike[],
): readonly OrderProductCatalogItem[] {
  const rowsByType = new Map<string, PublicProductLike[]>();

  for (const product of products) {
    const rows = rowsByType.get(product.product_type) ?? [];
    rows.push(product);
    rowsByType.set(product.product_type, rows);
  }

  return [...rowsByType.values()]
    .filter((rows) => rows.length === 1)
    .flatMap((rows) => {
      const product = createOrderProductCatalogItem(rows[0]!);
      return product ? [product] : [];
    })
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.id.localeCompare(right.id),
    );
}

function resolveSelectionIndexes(
  variant: OrderProductVariant,
  optionValues: OrderProductSelection["optionValues"],
) {
  if (Object.keys(optionValues).length !== variant.optionSections.length) {
    return null;
  }

  const selectedIndexes: Partial<Record<ProductOptionSectionKey, number>> = {};

  for (const section of variant.optionSections) {
    const selectedValue = optionValues[section.key];
    const selectedIndex = section.values.indexOf(selectedValue ?? "");

    if (selectedIndex < 0) return null;
    selectedIndexes[section.key] = selectedIndex;
  }

  return selectedIndexes;
}

export function getProductPriceRows(
  variant: OrderProductVariant,
  optionValues: OrderProductSelection["optionValues"],
) {
  const selectedIndexes = resolveSelectionIndexes(variant, optionValues);
  if (!selectedIndexes) return [];

  const priceKey = getProductSelectionKey(
    getProductPriceOptionKeys(variant.productType, variant.productSubtype),
    selectedIndexes,
  );

  return variant.priceRowsBySelection[priceKey] ?? [];
}

function formatQuantity(
  quantity: number,
  quantitySection: OrderProductQuantitySection,
) {
  return `${quantity.toLocaleString("ko-KR")}${quantitySection.quantityUnit}`;
}

export function formatProductOptionValue(
  section: OrderProductOptionSection,
  value: string,
) {
  return section.valueUnit ? `${value}${section.valueUnit}` : value;
}

export function calculateProductSelection(
  variant: OrderProductVariant,
  selection: OrderProductSelection,
): CalculatedProductSelection | null {
  const selectedIndexes = resolveSelectionIndexes(
    variant,
    selection.optionValues,
  );

  if (!selectedIndexes) return null;
  if (selection.hasPlanning && !variant.showPlanningEstimate) return null;

  const priceKey = getProductSelectionKey(
    getProductPriceOptionKeys(variant.productType, variant.productSubtype),
    selectedIndexes,
  );
  const serviceKey = getProductSelectionKey(
    getProductServiceOptionKeys(variant.productType, variant.productSubtype),
    selectedIndexes,
  );
  const estimate = variant.serviceEstimatesBySelection[serviceKey];
  const quantityRows = variant.priceRowsBySelection[priceKey] ?? [];
  const quantityRow = quantityRows.find(
    (row) => row.quantity === selection.quantity,
  );
  const estimateMultiplier = getProductEstimateMultiplier(
    variant.productType,
    variant.productSubtype,
    selection.optionValues,
  );

  if (!estimate || estimateMultiplier === null) return null;
  if (variant.quantitySection ? !quantityRow : selection.quantity !== null) {
    return null;
  }

  const estimatedDesignAmount =
    estimate.designPrintEstimate * estimateMultiplier;
  const designPrintAmount = estimatedDesignAmount;
  const printAmount = quantityRow
    ? quantityRow.quantity * quantityRow.unitPrice
    : 0;
  const planningAmount = selection.hasPlanning
    ? (estimate.planningEstimate ?? 0) * estimateMultiplier
    : 0;
  const totalPrice = designPrintAmount + planningAmount + printAmount;

  if (
    !isSafeAmount(estimatedDesignAmount) ||
    !isSafeAmount(printAmount) ||
    !isSafeAmount(planningAmount) ||
    !isSafeAmount(totalPrice)
  ) {
    return null;
  }

  const quantityLabel =
    quantityRow && variant.quantitySection
      ? formatQuantity(quantityRow.quantity, variant.quantitySection)
      : null;
  const priceRows = [
    { label: "디자인비", value: designPrintAmount },
    ...(printAmount > 0
      ? [
          {
            label: quantityLabel ? `인쇄비 (${quantityLabel})` : "인쇄비",
            value: printAmount,
          },
        ]
      : []),
    ...(selection.hasPlanning
      ? [{ label: "기획비", value: planningAmount }]
      : []),
  ];

  return {
    designPrintAmount,
    designPrintEstimate: estimate.designPrintEstimate,
    estimateMultiplier,
    optionRows: variant.optionSections.map((section) => ({
      key: section.key,
      label: section.label.replace(/ 선택$/, ""),
      value: formatProductOptionValue(
        section,
        selection.optionValues[section.key]!,
      ),
    })),
    planningAmount,
    planningEstimate: estimate.planningEstimate,
    priceRows,
    printAmount,
    quantity: quantityRow?.quantity ?? null,
    quantityLabel,
    totalPrice,
  };
}

export function createDefaultProductSelection(
  variant: OrderProductVariant,
): OrderProductSelection | null {
  const optionSelections = getOptionSelections(variant);

  for (const optionValues of optionSelections) {
    const selection = createProductSelectionForOptions(
      variant,
      optionValues,
      false,
    );

    if (selection) return selection;
  }

  return null;
}

export function createProductSelectionForOptions(
  variant: OrderProductVariant,
  optionValues: OrderProductSelection["optionValues"],
  hasPlanning: boolean,
): OrderProductSelection | null {
  const firstQuantity = getProductPriceRows(variant, optionValues)[0];
  const selection = {
    hasPlanning,
    optionValues,
    quantity: firstQuantity?.quantity ?? null,
  } satisfies OrderProductSelection;

  return calculateProductSelection(variant, selection) ? selection : null;
}
