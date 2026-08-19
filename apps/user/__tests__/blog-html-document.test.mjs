import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const frameUrl = new URL(
  "../components/RawHtmlDocumentFrame.tsx",
  import.meta.url,
);
const frameHelperUrl = new URL(
  "../components/rawHtmlFrameHelpers.ts",
  import.meta.url,
);
const pageUrl = new URL("../app/(site)/blog/[slug]/page.tsx", import.meta.url);
const packageUrl = new URL("../package.json", import.meta.url);

test("full blog HTML is rendered unchanged in a script-blocked frame", async () => {
  const [frame, frameHelper, page, packageSource] = await Promise.all([
    readFile(frameUrl, "utf8"),
    readFile(frameHelperUrl, "utf8"),
    readFile(pageUrl, "utf8"),
    readFile(packageUrl, "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource);

  assert.match(frame, /srcDoc=\{framedHtml\}/);
  assert.match(frame, /sandbox="allow-scripts"/);
  assert.match(frame, /scrolling="no"/);
  assert.doesNotMatch(frame, /allow-same-origin/);
  assert.match(frameHelper, /Content-Security-Policy/);
  assert.match(frameHelper, /document\.querySelectorAll\("script"\)/);
  assert.match(frameHelper, /ResizeObserver/);
  assert.match(page, /html=\{rawHtmlSource\}/);
  assert.match(page, /source\.content/);
  assert.match(page, /source\.contentAuthoringMode === "raw_html"/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(page, /parseBlogHtmlDocument/);
  assert.equal(packageJson.dependencies.jsdom, undefined);
  assert.equal(packageJson.dependencies.dompurify, undefined);
});
