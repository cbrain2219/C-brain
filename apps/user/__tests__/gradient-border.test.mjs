import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const userRoot = fileURLToPath(new URL("../", import.meta.url));
const cssRoots = [
  fileURLToPath(new URL("../app/", import.meta.url)),
  fileURLToPath(new URL("../components/", import.meta.url)),
];
const outsideBorderAllowlist = new Set([
  "app/(site)/about/page.module.css .heroBadge::before, .heroMetricPanel::before",
]);

async function collectCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectCssFiles(entryPath);
      }

      return extname(entry.name) === ".css" ? [entryPath] : [];
    }),
  );

  return files.flat();
}

test("gradient border overlays use the shared one-pixel border pattern", async () => {
  const cssFiles = (await Promise.all(cssRoots.map(collectCssFiles))).flat();
  const inconsistentBlocks = [];

  for (const filePath of cssFiles) {
    const source = await readFile(filePath, "utf8");
    const blocks = source.matchAll(/([^{}]+)\{([^{}]*)\}/g);

    for (const [, selector, declarations] of blocks) {
      if (!/mask-composite:\s*exclude;/.test(declarations)) {
        continue;
      }

      const normalizedSelector = selector.replace(/\s+/g, " ").trim();
      const blockLabel = `${relative(userRoot, filePath)} ${normalizedSelector}`;

      if (
        /inset:\s*-1px;/.test(declarations) &&
        !outsideBorderAllowlist.has(blockLabel)
      ) {
        inconsistentBlocks.push(`${blockLabel}: uses outside inset`);
      }

      if (/padding:\s*1px;/.test(declarations)) {
        inconsistentBlocks.push(`${blockLabel}: uses padding ring`);
      }

      if (!/border:\s*1px solid transparent;/.test(declarations)) {
        inconsistentBlocks.push(`${blockLabel}: missing transparent border`);
      }

      if (!/background-origin:\s*border-box;/.test(declarations)) {
        inconsistentBlocks.push(`${blockLabel}: missing border-box origin`);
      }

      if (!/linear-gradient\(#ffffff 0 0\) padding-box,/.test(declarations)) {
        inconsistentBlocks.push(`${blockLabel}: missing padding-box mask`);
      }
    }
  }

  assert.deepEqual(inconsistentBlocks, []);
});

test("about hero surfaces keep their reviewed gradient borders outside the box", async () => {
  const stylesSource = await readFile(
    fileURLToPath(
      new URL("../app/(site)/about/page.module.css", import.meta.url),
    ),
    "utf8",
  );

  assert.match(
    stylesSource,
    /\.heroBadge::before,\s*\.heroMetricPanel::before\s*\{[^}]*inset:\s*-1px;/s,
  );
  assert.match(
    stylesSource,
    /\.heroMetricPanel\s*\{[^}]*background-clip:\s*border-box;[^}]*overflow:\s*visible;/s,
  );
});
