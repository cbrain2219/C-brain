import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sourceRoots = [join(repoRoot, "apps"), join(repoRoot, "packages")];
const textExtensions = new Set([".css", ".html", ".js", ".jsx", ".svg", ".ts", ".tsx"]);
const skippedDirectories = new Set([".next", "dist", "node_modules"]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        files.push(...(await collectFiles(entryPath)));
      }
      continue;
    }

    files.push(entryPath);
  }

  return files;
}

test("Pretendard GOV Variable is the only font family", async () => {
  const designSystemPath = join(repoRoot, "design-system.css");
  const designSystem = await readFile(designSystemPath, "utf8");
  const sourceFiles = (await Promise.all(sourceRoots.map(collectFiles))).flat();
  const fontFiles = sourceFiles.filter((file) => /\.(?:eot|otf|ttf|woff2?)$/i.test(file));

  assert.match(designSystem, /--font-sans:\s*['"]Pretendard GOV Variable['"];/);
  assert.deepEqual(fontFiles, [], "Font binaries must come only from the pretendard-gov package");

  const textFiles = [designSystemPath, ...sourceFiles.filter((file) => textExtensions.has(extname(file)))];
  const invalidDeclarations = [];

  for (const file of textFiles) {
    const source = await readFile(file, "utf8");
    const fileName = relative(repoRoot, file);

    if (source.includes("@font-face")) {
      invalidDeclarations.push(`${fileName}: local @font-face`);
    }

    source.split("\n").forEach((line, index) => {
      if (/font-family\s*:/.test(line) && !line.includes("var(--font-sans)")) {
        invalidDeclarations.push(`${fileName}:${index + 1}: ${line.trim()}`);
      }

      if (/fontFamily\s*:/.test(line) && !line.includes("var(--font-sans)") && !line.includes("baseStyle.fontFamily")) {
        invalidDeclarations.push(`${fileName}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  assert.deepEqual(invalidDeclarations, []);
});

test("global text defaults keep Korean words together", async () => {
  const globalsPath = join(repoRoot, "apps/user/app/globals.css");
  const globals = await readFile(globalsPath, "utf8");
  const userTextRoots = [
    join(repoRoot, "apps/user/app"),
    join(repoRoot, "apps/user/components"),
  ];
  const userTextFiles = (await Promise.all(userTextRoots.map(collectFiles)))
    .flat()
    .filter((file) => textExtensions.has(extname(file)));
  const invalidWrappingDeclarations = [];

  assert.match(
    globals,
    /html,\s*body,\s*button,\s*input,\s*select,\s*textarea\s*\{[\s\S]*?word-break:\s*keep-all;/,
  );
  assert.match(
    globals,
    /html,\s*body,\s*button,\s*input,\s*select,\s*textarea\s*\{[\s\S]*?overflow-wrap:\s*normal;/,
  );

  for (const file of userTextFiles) {
    const source = await readFile(file, "utf8");
    const fileName = relative(repoRoot, file);

    source.split("\n").forEach((line, index) => {
      const isInvalidWordBreak =
        /word-break\s*:/.test(line) && !/word-break\s*:\s*keep-all/.test(line);
      const isInvalidInlineWordBreak =
        /wordBreak\s*:/.test(line) &&
        !/wordBreak\s*:\s*["']keep-all["']/.test(line);
      const isInvalidOverflowWrap =
        /overflow-wrap\s*:/.test(line) &&
        !/overflow-wrap\s*:\s*normal/.test(line);
      const isInvalidInlineOverflowWrap =
        /overflowWrap\s*:/.test(line) &&
        !/overflowWrap\s*:\s*["']normal["']/.test(line);

      if (
        isInvalidWordBreak ||
        isInvalidInlineWordBreak ||
        isInvalidOverflowWrap ||
        isInvalidInlineOverflowWrap
      ) {
        invalidWrappingDeclarations.push(
          `${fileName}:${index + 1}: ${line.trim()}`,
        );
      }
    });
  }

  assert.deepEqual(invalidWrappingDeclarations, []);
});
