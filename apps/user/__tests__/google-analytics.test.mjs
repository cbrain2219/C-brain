import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("GA initializes once in production and stays disabled elsewhere", async () => {
  const source = await readFile(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });

  for (const environment of [undefined, "development", "preview", "production"]) {
    const exports = {};
    runInNewContext(outputText, {
      exports,
      process: { env: { NODE_ENV: "production", VERCEL_ENV: environment } },
      require(specifier) {
        if (specifier === "next/script") return { default: "script" };
        if (specifier === "./_content/seo") {
          return { createRootMetadata: () => ({}) };
        }
        if (specifier.endsWith(".css")) return {};
        return require(specifier);
      },
    });

    const dom = new JSDOM(
      renderToStaticMarkup(exports.default({ children: "Page content" })),
    );
    const scripts = [...dom.window.document.querySelectorAll("script")];
    dom.window.close();

    assert.equal(scripts.length, environment === "production" ? 2 : 0);
    if (environment !== "production") continue;

    const loader = scripts.find((script) => script.src);
    const initializer = scripts.find((script) => !script.src);
    assert.equal(
      loader.src,
      "https://www.googletagmanager.com/gtag/js?id=G-C4HDFLN1QQ",
    );
    assert.ok(initializer.id, "Next.js needs an ID to deduplicate the script");

    const browser = { dataLayer: [["existing"]] };
    browser.window = browser;
    runInNewContext(initializer.textContent, browser);
    assert.equal(browser.dataLayer.length, 3);
    assert.deepEqual(browser.dataLayer[0], ["existing"]);
    assert.equal(browser.dataLayer[1][0], "js");
    assert.deepEqual(Array.from(browser.dataLayer[2]), ["config", "G-C4HDFLN1QQ"]);
  }
});
