import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import process, { env as runtimeEnvironment } from "node:process";
import { pathToFileURL, URL } from "node:url";

import {
  getProductEstimateMultiplier,
  getProductPriceOptionKeys,
  getProductSelectionKey,
  getProductServiceOptionKeys,
  getProductVariants,
} from "../src/productConfiguration.ts";
import { productTypes } from "../src/categories.ts";

const repoEnvUrl = new URL("../../../.env", import.meta.url);
const seedUrl = new URL("../../../supabase/seed_products.sql", import.meta.url);
const seedPayloadPattern = /(\$variants\$\n)([\s\S]*?)(\n\$variants\$::jsonb)/;
const legacyUnitPriceModel = "service-plus-print-unit-v1";
const workbookPrintTotalModel = "service-plus-print-total-v2";
export const priceModel = "service-plus-print-total-workbook-v3";

function assertSafeAmount(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
}

function assertPositiveInteger(value, label) {
  assertSafeAmount(value, label);
  if (value === 0) throw new Error(`${label} must be greater than zero.`);
}

function assertSafeUnitPrice(value, label) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > Number.MAX_SAFE_INTEGER
  ) {
    throw new Error(`${label} must be a non-negative finite number.`);
  }
}

function calculateLegacyUnitPrice(printAmount, quantity) {
  assertSafeAmount(printAmount, "printAmount");
  assertPositiveInteger(quantity, "quantity");

  return Number((printAmount / quantity).toFixed(1));
}

function getSelectionContext(configuration, optionKeys, selectionKey, label) {
  const indexes =
    selectionKey === "" ? [] : selectionKey.split(":").map(Number);

  if (
    indexes.length !== optionKeys.length ||
    indexes.some((index) => !Number.isSafeInteger(index) || index < 0)
  ) {
    throw new Error(`${label} has an invalid selection key: ${selectionKey}`);
  }

  const optionIndexes = {};
  const optionValues = {};

  optionKeys.forEach((optionKey, position) => {
    const index = indexes[position];
    const values = configuration.optionValues?.[optionKey];
    const value = Array.isArray(values) ? values[index] : undefined;

    if (typeof value !== "string") {
      throw new Error(
        `${label} cannot resolve ${optionKey} at index ${index}.`,
      );
    }

    optionIndexes[optionKey] = index;
    optionValues[optionKey] = value;
  });

  return { optionIndexes, optionValues };
}

function getDesignAmount(
  productType,
  productSubtype,
  configuration,
  optionIndexes,
  optionValues,
  label,
) {
  const serviceOptionKeys = getProductServiceOptionKeys(
    productType,
    productSubtype,
  );
  const serviceKey = getProductSelectionKey(serviceOptionKeys, optionIndexes);
  const serviceEstimate =
    configuration.serviceEstimatesBySelection?.[serviceKey];
  const designPrintEstimate = serviceEstimate?.designPrintEstimate;

  assertSafeAmount(designPrintEstimate, `${label} designPrintEstimate`);

  const multiplier = getProductEstimateMultiplier(
    productType,
    productSubtype,
    optionValues,
  );

  assertPositiveInteger(multiplier, `${label} estimate multiplier`);

  const designAmount = designPrintEstimate * multiplier;
  assertSafeAmount(designAmount, `${label} design amount`);

  return designAmount;
}

export function transformVariantConfiguration(
  productType,
  productSubtype,
  configuration,
) {
  const variantName = productSubtype || productType;
  const label = `${productType} / ${variantName}`;
  const priceOptionKeys = getProductPriceOptionKeys(
    productType,
    productSubtype,
  );
  const sourceRowsBySelection = configuration.priceRowsBySelection;

  if (
    typeof sourceRowsBySelection !== "object" ||
    sourceRowsBySelection === null ||
    Array.isArray(sourceRowsBySelection)
  ) {
    throw new Error(`${label} is missing priceRowsBySelection.`);
  }

  let priceRowCount = 0;
  let changedRowCount = 0;
  const usesPrintTotals = configuration.priceModel === priceModel;
  const usesWorkbookPrintTotals =
    configuration.priceModel === workbookPrintTotalModel;
  const usesLegacyUnitPrices =
    configuration.priceModel === legacyUnitPriceModel;
  const priceRowsBySelection = {};

  for (const [selectionKey, rows] of Object.entries(sourceRowsBySelection)) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error(`${label} has an invalid row list for ${selectionKey}.`);
    }

    const { optionIndexes, optionValues } = getSelectionContext(
      configuration,
      priceOptionKeys,
      selectionKey,
      label,
    );
    const designAmount = getDesignAmount(
      productType,
      productSubtype,
      configuration,
      optionIndexes,
      optionValues,
      label,
    );

    priceRowsBySelection[selectionKey] = rows.map((row) => {
      const { finalPrice: storedFinalPrice, ...storedRow } = row;
      const quantity = row.quantity;

      assertPositiveInteger(quantity, `${label} quantity`);

      let printAmount;
      let unitPrice;

      if (usesPrintTotals) {
        assertSafeUnitPrice(row.unitPrice, `${label} unitPrice`);
        assertSafeAmount(row.printAmount, `${label} printAmount`);
        unitPrice = row.unitPrice;
        printAmount = row.printAmount;
      } else if (usesWorkbookPrintTotals) {
        assertSafeUnitPrice(row.unitPrice, `${label} unitPrice`);
        assertSafeAmount(row.printAmount, `${label} printAmount`);
        unitPrice = row.unitPrice;
        printAmount = row.printAmount;
      } else if (usesLegacyUnitPrices) {
        assertSafeAmount(row.unitPrice, `${label} unitPrice`);
        unitPrice = row.unitPrice;
        printAmount = row.printAmount ?? quantity * unitPrice;
        assertSafeAmount(printAmount, `${label} printAmount`);
      } else {
        const legacyFinalPrice = storedFinalPrice ?? row.unitPrice;
        assertSafeAmount(legacyFinalPrice, `${label} legacy final price`);

        if (legacyFinalPrice < designAmount) {
          throw new Error(`${label} final price is below its design amount.`);
        }

        printAmount = legacyFinalPrice - designAmount;
        unitPrice = calculateLegacyUnitPrice(printAmount, quantity);
      }
      priceRowCount += 1;

      if (
        row.unitPrice !== unitPrice ||
        row.printAmount !== printAmount ||
        storedFinalPrice !== undefined
      ) {
        changedRowCount += 1;
      }

      return {
        ...storedRow,
        printAmount,
        quantity,
        unitPrice,
      };
    });
  }

  return {
    changedRowCount,
    configuration: {
      ...configuration,
      priceModel,
      priceRowsBySelection,
    },
    priceRowCount,
  };
}

export function transformSeedVariants(variants) {
  let priceRowCount = 0;
  let changedRowCount = 0;

  const transformed = variants.map((variant) => {
    const result = transformVariantConfiguration(
      variant.product_type,
      variant.product_subtype || "",
      variant.configuration,
    );

    priceRowCount += result.priceRowCount;
    changedRowCount += result.changedRowCount;

    return { ...variant, configuration: result.configuration };
  });

  return { changedRowCount, priceRowCount, variants: transformed };
}

function getSeedVariantKey(productType, productSubtype) {
  return `${productType}\u0000${productSubtype}`;
}

export function transformGroupedProducts(products, seedVariants = []) {
  const expectedProductTypes = [...productTypes];
  const actualProductTypes = products.map((product) => product.product_type);
  const seedVariantsByKey = new Map(
    seedVariants.map((variant) => [
      getSeedVariantKey(
        variant.product_type,
        variant.product_subtype || "",
      ),
      variant,
    ]),
  );

  if (
    products.length !== expectedProductTypes.length ||
    expectedProductTypes.some(
      (productType) =>
        actualProductTypes.filter((value) => value === productType).length !==
        1,
    )
  ) {
    throw new Error("Expected exactly six uniquely typed published products.");
  }

  let priceRowCount = 0;
  let changedRowCount = 0;

  const transformedProducts = products.map((product) => {
    const variants = product.configuration?.variants;
    const expectedVariants = getProductVariants(product.product_type);

    if (
      typeof variants !== "object" ||
      variants === null ||
      Array.isArray(variants) ||
      Object.keys(variants).length !== expectedVariants.length ||
      expectedVariants.some((variantName) => !(variantName in variants))
    ) {
      throw new Error(`${product.product_type} has an invalid variant set.`);
    }

    const nextVariants = {};

    for (const variantName of expectedVariants) {
      const subtype = variantName === product.product_type ? "" : variantName;
      const sourceConfiguration = variants[variantName];
      const seedVariant = seedVariantsByKey.get(
        getSeedVariantKey(product.product_type, subtype),
      );
      const needsExactSeedTotals =
        sourceConfiguration.priceModel !== priceModel && seedVariant;
      const configuration = needsExactSeedTotals
        ? {
            ...sourceConfiguration,
            priceModel,
            priceRowsBySelection:
              seedVariant.configuration.priceRowsBySelection,
          }
        : sourceConfiguration;
      const result = transformVariantConfiguration(
        product.product_type,
        subtype,
        configuration,
      );

      nextVariants[variantName] = result.configuration;
      priceRowCount += result.priceRowCount;
      changedRowCount += needsExactSeedTotals
        ? result.priceRowCount
        : result.changedRowCount;
    }

    return {
      ...product,
      configuration: { ...product.configuration, variants: nextVariants },
    };
  });

  if (priceRowCount !== 272) {
    throw new Error(
      `Expected 272 quantity price rows, found ${priceRowCount}.`,
    );
  }

  return { changedRowCount, priceRowCount, products: transformedProducts };
}

async function readLocalEnv() {
  let source = "";
  const localEnvironment = {};

  try {
    source = await readFile(repoEnvUrl, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    localEnvironment[match[1]] = value;
  }

  return { ...localEnvironment, ...runtimeEnvironment };
}

async function writeSeed() {
  const seed = await readFile(seedUrl, "utf8");
  const match = seed.match(seedPayloadPattern);

  if (!match) throw new Error("seed_products.sql variant payload is missing.");

  const sourceVariants = JSON.parse(match[2]);
  const result = transformSeedVariants(sourceVariants);

  if (result.priceRowCount !== 272) {
    throw new Error(
      `Expected 272 seed price rows, found ${result.priceRowCount}.`,
    );
  }

  const nextSeed = seed.replace(
    seedPayloadPattern,
    `$1${JSON.stringify(result.variants, null, 2)}$3`,
  );

  await writeFile(seedUrl, nextSeed);
  return result;
}

async function readPublishedProducts(client) {
  const { data, error } = await client
    .from("products")
    .select("id, configuration, product_type, status")
    .eq("status", "published")
    .order("product_type", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function readSeedVariants() {
  const seed = await readFile(seedUrl, "utf8");
  const match = seed.match(seedPayloadPattern);

  if (!match) throw new Error("seed_products.sql variant payload is missing.");

  return transformSeedVariants(JSON.parse(match[2])).variants;
}

async function syncDatabase({ apply }) {
  const environment = await readLocalEnv();

  const url =
    environment.NEXT_PUBLIC_SUPABASE_URL ?? environment.VITE_SUPABASE_URL;
  const secretKey = environment.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase URL and SUPABASE_SECRET_KEY are required.");
  }

  const client = createClient(url, secretKey, {
    auth: { persistSession: false },
  });
  const sourceProducts = await readPublishedProducts(client);
  const seedVariants = await readSeedVariants();
  const result = transformGroupedProducts(sourceProducts, seedVariants);

  if (apply) {
    for (const product of result.products) {
      const { error } = await client
        .from("products")
        .update({ configuration: product.configuration })
        .eq("id", product.id);

      if (error) throw error;
    }

    const storedProducts = await readPublishedProducts(client);
    const verification = transformGroupedProducts(storedProducts, seedVariants);

    if (verification.changedRowCount !== 0) {
      throw new Error(
        `Database verification found ${verification.changedRowCount} unsynchronized rows.`,
      );
    }
  }

  return result;
}

async function main() {
  const flags = new Set(process.argv.slice(2));
  const unknownFlags = [...flags].filter(
    (flag) => flag !== "--apply" && flag !== "--write-seed",
  );

  if (unknownFlags.length > 0) {
    throw new Error(`Unknown arguments: ${unknownFlags.join(", ")}`);
  }

  if (flags.has("--write-seed")) {
    const result = await writeSeed();
    process.stdout.write(
      `Seed synchronized: ${result.priceRowCount} rows, ${result.changedRowCount} changed.`,
    );
    process.stdout.write("\n");
    return;
  }

  const apply = flags.has("--apply");
  const result = await syncDatabase({ apply });
  process.stdout.write(
    `${apply ? "Database synchronized" : "Database dry run"}: ${result.priceRowCount} rows, ${result.changedRowCount} to change.`,
  );
  process.stdout.write("\n");
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";

if (import.meta.url === entryUrl) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
