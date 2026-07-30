import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const aboutSectionPath = new URL(
  "../app/_components/AboutSection.tsx",
  import.meta.url,
);
const stylesPath = new URL("../app/page.module.css", import.meta.url);

function cssBlock(source, selector) {
  const start = source.indexOf(selector);
  assert.notEqual(start, -1, `${selector} should exist`);

  const openBrace = source.indexOf("{", start);
  assert.notEqual(openBrace, -1, `${selector} should open`);

  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    } else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBrace + 1, index);
      }
    }
  }

  assert.fail(`${selector} should close`);
}

test("landing about reason items stay one column before their body text has one-line room", async () => {
  const [sectionSource, stylesSource] = await Promise.all([
    readFile(aboutSectionPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);
  const baseReasonGrid = cssBlock(stylesSource, ".reasonGrid");
  const tabletMedia = cssBlock(stylesSource, "@media (min-width: 640px)");
  const desktopMedia = cssBlock(stylesSource, "@media (min-width: 1080px)");
  const pcMedia = cssBlock(stylesSource, "@media (min-width: 1440px)");

  assert.match(sectionSource, /className=\{styles\.aboutDesktopBreak\}/);
  assert.match(sectionSource, /className=\{styles\.reasonDivider\}/);
  assert.match(
    baseReasonGrid,
    /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*600px\),\s*1fr\)\);/,
  );
  assert.doesNotMatch(
    tabletMedia,
    /\.reasonGrid\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s,
  );
  assert.doesNotMatch(
    desktopMedia,
    /\.reasonGrid\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s,
  );
  assert.match(
    pcMedia,
    /\.reasonGrid\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  );
});

test("landing about reason items follow the Figma card and desktop list styles", async () => {
  const stylesSource = await readFile(stylesPath, "utf8");
  const baseReasonGrid = cssBlock(stylesSource, ".reasonGrid");
  const baseReasonItem = cssBlock(stylesSource, ".reasonItem {");
  const baseReasonIcon = cssBlock(stylesSource, ".reasonIcon {");
  const pcMedia = cssBlock(stylesSource, "@media (min-width: 1440px)");

  assert.match(baseReasonGrid, /gap:\s*8px;/);
  assert.match(baseReasonItem, /flex-direction:\s*column;/);
  assert.match(baseReasonItem, /gap:\s*8px;/);
  assert.match(baseReasonItem, /padding:\s*16px;/);
  assert.match(baseReasonItem, /border-radius:\s*16px;/);
  assert.match(baseReasonItem, /border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.1\);/);
  assert.match(baseReasonItem, /background:\s*rgba\(255,\s*255,\s*255,\s*0\.1\);/);
  assert.match(baseReasonIcon, /width:\s*24px;/);
  assert.match(baseReasonIcon, /height:\s*24px;/);
  assert.match(baseReasonIcon, /border-radius:\s*8px;/);
  assert.match(baseReasonIcon, /background:\s*var\(--landing-brand-50\);/);

  assert.match(pcMedia, /\.reasonGrid\s*\{[^}]*gap:\s*16px;/s);
  assert.match(pcMedia, /\.reasonItem\s*\{[^}]*flex-direction:\s*row;/s);
  assert.match(pcMedia, /\.reasonItem\s*\{[^}]*padding:\s*0;/s);
  assert.match(pcMedia, /\.reasonItem\s*\{[^}]*border:\s*0;/s);
  assert.match(pcMedia, /\.reasonDivider\s*\{/);
  assert.match(
    pcMedia,
    /\.reasonDivider\s*\{[^}]*border-top:\s*1px dashed #ffffff;[^}]*opacity:\s*0\.3;/s,
  );
  assert.doesNotMatch(pcMedia, /\.reasonDivider\s*\{[^}]*margin:/s);
});
