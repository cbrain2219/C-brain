import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const frameUrl = new URL(
  "../app/(site)/blog/[slug]/BlogHtmlDocumentFrame.tsx",
  import.meta.url,
);
const pageUrl = new URL("../app/(site)/blog/[slug]/page.tsx", import.meta.url);
const packageUrl = new URL("../package.json", import.meta.url);

test("full blog HTML is rendered unchanged in a script-blocked frame", async () => {
  const [frame, page, packageSource] = await Promise.all([
    readFile(frameUrl, "utf8"),
    readFile(pageUrl, "utf8"),
    readFile(packageUrl, "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource);

  assert.match(frame, /srcDoc=\{framedHtml\}/);
  assert.match(frame, /sandbox="allow-scripts"/);
  assert.doesNotMatch(frame, /allow-same-origin/);
  assert.match(frame, /Content-Security-Policy/);
  assert.match(frame, /document\.querySelectorAll\("script"\)/);
  assert.match(frame, /ResizeObserver/);
  assert.match(page, /html=\{htmlSource\}/);
  assert.match(page, /source\.content/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(page, /parseBlogHtmlDocument/);
  assert.equal(packageJson.dependencies.jsdom, undefined);
  assert.equal(packageJson.dependencies.dompurify, undefined);
});
