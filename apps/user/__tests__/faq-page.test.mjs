import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesUrl = new URL(
  "../app/(site)/faq/page.module.css",
  import.meta.url,
);

function cssBlock(sourceText, selector) {
  const selectorIndex = sourceText.indexOf(selector);
  assert.notEqual(selectorIndex, -1);

  const openBraceIndex = sourceText.indexOf("{", selectorIndex);
  assert.notEqual(openBraceIndex, -1);

  let depth = 0;
  for (let index = openBraceIndex; index < sourceText.length; index += 1) {
    if (sourceText[index] === "{") {
      depth += 1;
    } else if (sourceText[index] === "}") {
      depth -= 1;

      if (depth === 0) {
        return sourceText.slice(openBraceIndex + 1, index);
      }
    }
  }

  assert.fail(`Missing closing brace for ${selector}`);
}

test("FAQ category navigation follows the shared responsive header offset", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");

  assert.match(
    stylesSource,
    /--faq-header-offset:\s*var\(--site-header-height, 52px\);/,
  );
  assert.match(stylesSource, /padding-top:\s*var\(--faq-header-offset\);/);
  assert.match(
    stylesSource,
    /\.mainColumn\s*\{[\s\S]*?padding:\s*var\(--site-page-top-gap, 72px\) 20px 72px;/,
  );
  assert.match(
    stylesSource,
    /\.mobileCategoryNav\s*\{[\s\S]*?top:\s*var\(--faq-header-offset\);/,
  );
  assert.match(
    stylesSource,
    /\.categorySection\s*\{[\s\S]*?var\(--faq-header-offset\)/,
  );
});

test("FAQ main column fills the layout before the sidebar breakpoint", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const tabletStart = stylesSource.indexOf("@media (min-width: 640px)");
  const sidebarStart = stylesSource.indexOf("@media (min-width: 1200px)");
  const desktopStart = stylesSource.indexOf("@media (min-width: 1440px)");

  assert.notEqual(tabletStart, -1);
  assert.notEqual(sidebarStart, -1);
  assert.notEqual(desktopStart, -1);

  const baseMainColumnStyle = cssBlock(stylesSource, ".mainColumn {");
  const beforeSidebarStyles = stylesSource.slice(tabletStart, sidebarStart);
  const sidebarMainColumnStyle = cssBlock(
    stylesSource.slice(sidebarStart, desktopStart),
    ".mainColumn {",
  );

  assert.match(baseMainColumnStyle, /width:\s*100%;/);
  assert.doesNotMatch(beforeSidebarStyles, /\.mainColumn\s*\{/);
  assert.match(sidebarMainColumnStyle, /max-width:\s*820px;/);
});

test("FAQ active category tab overlaps the gray rail like portfolio tabs", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const mobileCategoryNavStyle = stylesSource.match(
    /\.mobileCategoryNav\s*\{[\s\S]*?\}/,
  )?.[0];
  const mobileCategoryLinkStyle = stylesSource.match(
    /(?:^|\n)\.mobileCategoryLink\s*\{[\s\S]*?\}/,
  )?.[0];

  assert.match(
    mobileCategoryNavStyle ?? "",
    /background:\s*linear-gradient\(var\(--landing-gray-100\), var\(--landing-gray-100\)\)[\s\S]*center\s+bottom\s*\/\s*100% 1px no-repeat,/,
  );
  assert.doesNotMatch(mobileCategoryNavStyle ?? "", /border-bottom:/);

  assert.match(
    mobileCategoryLinkStyle ?? "",
    /border:\s*0;/,
  );
  assert.match(
    mobileCategoryLinkStyle ?? "",
    /position:\s*relative;/,
  );
  assert.match(
    stylesSource,
    /\.mobileCategoryLink:active,\s*\.mobileCategoryLinkActive,\s*\.mobileCategoryLinkActive:hover,\s*\.mobileCategoryLinkActive:focus-visible,\s*\.mobileCategoryLinkActive:active\s*\{[\s\S]*?color:\s*var\(--landing-brand-500\);/,
  );
  assert.doesNotMatch(stylesSource, /border-bottom-color:\s*transparent;/);
  assert.match(
    stylesSource,
    /\.mobileCategoryLinkActive::after\s*\{[\s\S]*?height:\s*2px;[\s\S]*?bottom:\s*0;[\s\S]*?background:\s*linear-gradient\(/,
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
