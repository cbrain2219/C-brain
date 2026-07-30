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

test("FAQ sidebar replaces mobile navigation from the 800px breakpoint", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const tabletStart = stylesSource.indexOf("@media (min-width: 800px)");
  const desktopStart = stylesSource.indexOf("@media (min-width: 1200px)");

  assert.notEqual(tabletStart, -1);
  assert.notEqual(desktopStart, -1);

  const baseSidebarStyle = cssBlock(stylesSource, ".sidebar {");
  const baseMainColumnStyle = cssBlock(stylesSource, ".mainColumn {");
  const tabletStyles = stylesSource.slice(tabletStart, desktopStart);
  const tabletLayoutStyle = cssBlock(tabletStyles, ".faqLayout {");
  const tabletSidebarStyle = cssBlock(tabletStyles, ".sidebar {");
  const tabletMainColumnStyle = cssBlock(tabletStyles, ".mainColumn {");
  const tabletMobileNavigationStyle = cssBlock(
    tabletStyles,
    ".mobileCategoryNav {",
  );

  assert.match(baseSidebarStyle, /display:\s*none;/);
  assert.match(baseMainColumnStyle, /width:\s*100%;/);
  assert.match(tabletLayoutStyle, /display:\s*grid;/);
  assert.match(
    tabletLayoutStyle,
    /grid-template-columns:\s*260px minmax\(0, 1fr\);/,
  );
  assert.match(tabletSidebarStyle, /display:\s*block;/);
  assert.match(tabletMainColumnStyle, /max-width:\s*820px;/);
  assert.match(tabletMobileNavigationStyle, /display:\s*none;/);
});

test("FAQ main column owns responsive section spacing", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const expandedStart = stylesSource.indexOf("@media (min-width: 1081px)");
  const desktopStart = stylesSource.indexOf("@media (min-width: 1200px)");

  assert.notEqual(expandedStart, -1);
  assert.notEqual(desktopStart, -1);

  const baseMainColumnStyle = cssBlock(stylesSource, ".mainColumn {");
  const baseHeroStyle = cssBlock(stylesSource, ".hero {");
  const baseMobileNavigationStyle = cssBlock(
    stylesSource,
    ".mobileCategoryNav {",
  );
  const expandedMainColumnStyle = cssBlock(
    stylesSource.slice(expandedStart, desktopStart),
    ".mainColumn {",
  );

  assert.match(baseMainColumnStyle, /display:\s*flex;/);
  assert.match(baseMainColumnStyle, /flex-direction:\s*column;/);
  assert.match(baseMainColumnStyle, /gap:\s*32px;/);
  assert.doesNotMatch(baseHeroStyle, /margin-bottom:/);
  assert.match(
    baseMobileNavigationStyle,
    /margin:\s*0 0 0 calc\(50% - 50cqw\);/,
  );
  assert.match(expandedMainColumnStyle, /gap:\s*52px;/);
});

test("FAQ columns use 32px vertical padding through 1080px", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const tabletStart = stylesSource.indexOf("@media (min-width: 800px)");
  const compactEnd = stylesSource.indexOf("@media (max-width: 1080px)");
  const expandedStart = stylesSource.indexOf("@media (min-width: 1081px)");
  const desktopStart = stylesSource.indexOf("@media (min-width: 1200px)");
  const wideStart = stylesSource.indexOf("@media (min-width: 1440px)");

  assert.notEqual(tabletStart, -1);
  assert.notEqual(compactEnd, -1);
  assert.notEqual(expandedStart, -1);
  assert.notEqual(desktopStart, -1);
  assert.notEqual(wideStart, -1);

  const tabletStyles = stylesSource.slice(tabletStart, compactEnd);
  const compactStyles = stylesSource.slice(compactEnd, expandedStart);
  const wideStyles = stylesSource.slice(wideStart);
  const tabletSidebarStyle = cssBlock(tabletStyles, ".sidebar {");
  const tabletMainColumnStyle = cssBlock(tabletStyles, ".mainColumn {");
  const compactSidebarStyle = cssBlock(compactStyles, ".sidebar {");
  const compactMainColumnStyle = cssBlock(compactStyles, ".mainColumn {");
  const wideSidebarStyle = cssBlock(wideStyles, ".sidebar {");
  const wideMainColumnStyle = cssBlock(wideStyles, ".mainColumn {");

  assert.match(tabletSidebarStyle, /padding:\s*52px 20px;/);
  assert.match(tabletMainColumnStyle, /padding:\s*52px 20px;/);
  assert.match(compactSidebarStyle, /padding-top:\s*32px;/);
  assert.match(compactSidebarStyle, /padding-bottom:\s*32px;/);
  assert.match(compactMainColumnStyle, /padding-top:\s*32px;/);
  assert.match(compactMainColumnStyle, /padding-bottom:\s*32px;/);
  assert.match(wideSidebarStyle, /padding:\s*52px 40px;/);
  assert.match(wideMainColumnStyle, /padding:\s*52px 40px;/);
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
