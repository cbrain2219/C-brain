import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

import { JSDOM } from "jsdom";

const loader = `
export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts")) {
    const { readFile } = await import("node:fs/promises");
    const { stripTypeScriptTypes } = await import("node:module");
    return {
      format: "module",
      shortCircuit: true,
      source: stripTypeScriptTypes(await readFile(new URL(url), "utf8"), { mode: "transform" }),
    };
  }
  return nextLoad(url, context);
}`;

register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url);

const {
  MAX_FRAME_HEIGHT,
  MIN_FRAME_HEIGHT,
  RESIZE_MESSAGE_TYPE,
  createFramedHtml,
  getTrustedFrameResizeHeight,
} = await import("../components/rawHtmlFrameHelpers.ts");

test("raw HTML srcDoc removes supplied scripts and injects nonce-bound resize code", () => {
  const token = "test-nonce";
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const srcDoc = createFramedHtml(
    `<main data-kept="yes"><h1>Preserved markup</h1><script>window.attackerScript = true</script></main>`,
    token,
    dom.window.DOMParser,
  );
  const framed = new JSDOM(srcDoc);
  const scripts = framed.window.document.querySelectorAll("script");
  const policy = framed.window.document.querySelector(
    'meta[http-equiv="Content-Security-Policy"]',
  );

  assert.match(srcDoc, /data-kept="yes"/);
  assert.match(srcDoc, /Preserved markup/);
  assert.doesNotMatch(srcDoc, /attackerScript/);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].getAttribute("nonce"), token);
  assert.match(policy?.getAttribute("content") ?? "", /script-src 'nonce-test-nonce'/);
  assert.match(scripts[0].textContent ?? "", /cbrain:raw-html-resize/);
});

test("raw HTML resize messages require exact source, token, and finite height", () => {
  const source = {};
  const base = {
    expectedSource: source,
    expectedToken: "token",
    source,
  };

  assert.equal(
    getTrustedFrameResizeHeight({
      ...base,
      data: { height: 450.2, token: "token", type: RESIZE_MESSAGE_TYPE },
    }),
    451,
  );
  assert.equal(
    getTrustedFrameResizeHeight({
      ...base,
      data: { height: 1, token: "wrong", type: RESIZE_MESSAGE_TYPE },
    }),
    null,
  );
  assert.equal(
    getTrustedFrameResizeHeight({
      ...base,
      source: {},
      data: { height: 450, token: "token", type: RESIZE_MESSAGE_TYPE },
    }),
    null,
  );
  assert.equal(
    getTrustedFrameResizeHeight({
      ...base,
      data: { height: Number.POSITIVE_INFINITY, token: "token", type: RESIZE_MESSAGE_TYPE },
    }),
    null,
  );
  assert.equal(
    getTrustedFrameResizeHeight({
      ...base,
      data: { height: 0, token: "token", type: RESIZE_MESSAGE_TYPE },
    }),
    MIN_FRAME_HEIGHT,
  );
  assert.equal(
    getTrustedFrameResizeHeight({
      ...base,
      data: { height: MAX_FRAME_HEIGHT + 1, token: "token", type: RESIZE_MESSAGE_TYPE },
    }),
    MAX_FRAME_HEIGHT,
  );
});
