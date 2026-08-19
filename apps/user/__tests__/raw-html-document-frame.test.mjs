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
  const frameReset = framed.window.document.querySelector(
    "style[data-cbrain-frame-reset]",
  );

  assert.match(srcDoc, /data-kept="yes"/);
  assert.match(srcDoc, /Preserved markup/);
  assert.doesNotMatch(srcDoc, /attackerScript/);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].getAttribute("nonce"), token);
  assert.match(policy?.getAttribute("content") ?? "", /script-src 'nonce-test-nonce'/);
  assert.equal(
    frameReset?.textContent,
    "html { overflow-y: hidden !important; } body { margin: 0; }",
  );
  assert.match(scripts[0].textContent ?? "", /cbrain:raw-html-resize/);
});

test("raw HTML resize follows content bounds when content shrinks", async () => {
  const messages = [];
  let notifyResize;
  const srcDoc = createFramedHtml(
    `<!doctype html><html data-scroll-height="1000"><body data-bottom="400" data-offset-height="400" data-scroll-height="400"><main data-bottom="560" data-margin-bottom="20px">Content</main></body></html>`,
    "resize-token",
    new JSDOM("<!doctype html>").window.DOMParser,
  );

  const framed = new JSDOM(srcDoc, {
    runScripts: "dangerously",
    beforeParse(window) {
      window.postMessage = (message) => messages.push(message);
      window.requestAnimationFrame = (callback) => {
        callback();
        return 1;
      };
      window.cancelAnimationFrame = () => {};
      window.ResizeObserver = class {
        constructor(callback) {
          notifyResize = callback;
        }

        observe() {}
      };
      Object.defineProperties(window.HTMLElement.prototype, {
        offsetHeight: {
          configurable: true,
          get() {
            return Number(this.dataset.offsetHeight ?? 0);
          },
        },
        scrollHeight: {
          configurable: true,
          get() {
            return Number(this.dataset.scrollHeight ?? 0);
          },
        },
      });
      window.HTMLElement.prototype.getBoundingClientRect = function () {
        const bottom = Number(this.dataset.bottom ?? 0);
        return {
          bottom,
          height: bottom,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          x: 0,
          y: 0,
          toJSON() {
            return {};
          },
        };
      };
      window.getComputedStyle = (element) => ({
        display:
          element.dataset.display ??
          (element.tagName === "SCRIPT" ? "none" : "block"),
        marginBottom: element.dataset.marginBottom ?? "0px",
        position: element.dataset.position ?? "static",
      });
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(messages.at(-1)?.height, 580);

  const body = framed.window.document.body;
  const content = framed.window.document.querySelector("main");
  assert.ok(content);
  body.dataset.bottom = "340";
  body.dataset.offsetHeight = "340";
  body.dataset.scrollHeight = "340";
  content.dataset.bottom = "360";
  assert.equal(typeof notifyResize, "function");
  notifyResize();

  assert.equal(messages.at(-1)?.height, 380);
  framed.window.close();
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
