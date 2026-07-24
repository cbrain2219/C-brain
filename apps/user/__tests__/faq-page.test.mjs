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

test("FAQ active category tab uses the notice-style gradient underline", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");

  assert.match(
    stylesSource,
    /\.mobileCategoryLink\s*\{[\s\S]*?position:\s*relative;/,
  );
  assert.match(
    stylesSource,
    /\.mobileCategoryLink:active,\s*\.mobileCategoryLinkActive,\s*\.mobileCategoryLinkActive:hover,\s*\.mobileCategoryLinkActive:focus-visible,\s*\.mobileCategoryLinkActive:active\s*\{[\s\S]*?color:\s*var\(--landing-brand-500\);/,
  );
  assert.match(
    stylesSource,
    /\.mobileCategoryLinkActive\s*\{[\s\S]*?border-bottom-color:\s*transparent;/,
  );
  assert.match(
    stylesSource,
    /\.mobileCategoryLinkActive::after\s*\{[\s\S]*?height:\s*2px;[\s\S]*?bottom:\s*-1px;[\s\S]*?background:\s*linear-gradient\(/,
  );
  assert.match(
    stylesSource,
    /\.mobileCategoryLinkActive::after\s*\{[\s\S]*?rgba\(48,\s*186,\s*195,\s*0\)\s*0%[\s\S]*?var\(--landing-brand-500\)\s*50%[\s\S]*?rgba\(48,\s*186,\s*195,\s*0\)\s*100%/,
  );
  assert.match(
    stylesSource,
    /\.sidebarLinkActive:hover,\s*\.sidebarLinkActive:focus-visible,\s*\.sidebarLinkActive:active\s*\{[\s\S]*?color:\s*var\(--landing-brand-500\);/,
  );
});
