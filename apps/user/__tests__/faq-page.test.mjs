import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesUrl = new URL(
  "../app/(site)/faq/page.module.css",
  import.meta.url,
);

test("FAQ category navigation follows the responsive header offset", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");

  assert.match(stylesSource, /--faq-header-offset:\s*80px;/);
  assert.match(stylesSource, /padding-top:\s*var\(--faq-header-offset\);/);
  assert.match(
    stylesSource,
    /\.mobileCategoryNav\s*\{[\s\S]*?top:\s*var\(--faq-header-offset\);/,
  );
  assert.match(
    stylesSource,
    /\.categorySection\s*\{[\s\S]*?var\(--faq-header-offset\)/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*1099px\)\s*\{[\s\S]*?\.faqPage\s*\{[\s\S]*?--faq-header-offset:\s*64px;/,
  );
});
