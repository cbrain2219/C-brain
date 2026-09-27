import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ts from "typescript";

const require = createRequire(import.meta.url);
const componentUrl = new URL(
  "../components/ImageWithSkeleton.tsx",
  import.meta.url,
);

function loadImageWithSkeleton() {
  const source = require("node:fs").readFileSync(componentUrl, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const compiledModule = { exports: {} };
  const MockImage = React.forwardRef(function MockImage(props, ref) {
    const imageProps = { ...props };

    for (const propName of ["fill", "preload", "priority", "unoptimized"]) {
      delete imageProps[propName];
    }

    return React.createElement("img", { ...imageProps, ref });
  });
  const mockRequire = (specifier) => {
    if (specifier === "next/image") {
      return { __esModule: true, default: MockImage };
    }

    if (specifier === "./ImageWithSkeleton.module.css") {
      return { __esModule: true, default: { pending: "pending" } };
    }

    return require(specifier);
  };

  new Function("require", "module", "exports", compiled)(
    mockRequire,
    compiledModule,
    compiledModule.exports,
  );

  return compiledModule.exports.ImageWithSkeleton;
}

function installDom() {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const previous = {
    Event: globalThis.Event,
    HTMLElement: globalThis.HTMLElement,
    HTMLImageElement: globalThis.HTMLImageElement,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    document: globalThis.document,
    window: globalThis.window,
  };

  Object.assign(globalThis, {
    Event: dom.window.Event,
    HTMLElement: dom.window.HTMLElement,
    HTMLImageElement: dom.window.HTMLImageElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    document: dom.window.document,
    window: dom.window,
  });

  return {
    dom,
    restore() {
      Object.assign(globalThis, previous);
      dom.window.close();
    },
  };
}

async function renderImage(root, ImageWithSkeleton, props) {
  await act(async () => {
    root.render(
      React.createElement(ImageWithSkeleton, {
        alt: "테스트 이미지",
        className: "cover-image",
        height: 100,
        width: 100,
        ...props,
      }),
    );
    await Promise.resolve();
  });
}

test("image skeleton clears after a successful load and forwards the event", async () => {
  const { dom, restore } = installDom();
  const root = createRoot(dom.window.document.getElementById("root"));
  const ImageWithSkeleton = loadImageWithSkeleton();
  let loadCount = 0;

  try {
    await renderImage(root, ImageWithSkeleton, {
      onLoad: () => {
        loadCount += 1;
      },
      src: "/first.jpg",
    });
    const image = dom.window.document.querySelector("img");

    assert.ok(image?.classList.contains("pending"));
    assert.ok(image?.classList.contains("cover-image"));

    await act(async () => {
      image.dispatchEvent(new dom.window.Event("load", { bubbles: true }));
      await Promise.resolve();
    });

    assert.equal(loadCount, 1);
    assert.ok(!image.classList.contains("pending"));
  } finally {
    await act(async () => root.unmount());
    restore();
  }
});

test("image skeleton clears after an error and forwards the event", async () => {
  const { dom, restore } = installDom();
  const root = createRoot(dom.window.document.getElementById("root"));
  const ImageWithSkeleton = loadImageWithSkeleton();
  let errorCount = 0;

  try {
    await renderImage(root, ImageWithSkeleton, {
      onError: () => {
        errorCount += 1;
      },
      src: "/missing.jpg",
    });
    const image = dom.window.document.querySelector("img");

    await act(async () => {
      image.dispatchEvent(new dom.window.Event("error", { bubbles: true }));
      await Promise.resolve();
    });

    assert.equal(errorCount, 1);
    assert.ok(!image.classList.contains("pending"));
  } finally {
    await act(async () => root.unmount());
    restore();
  }
});

test("image skeleton clears for an image already complete on mount", async () => {
  const { dom, restore } = installDom();
  const root = createRoot(dom.window.document.getElementById("root"));
  const ImageWithSkeleton = loadImageWithSkeleton();
  const originalComplete = Object.getOwnPropertyDescriptor(
    dom.window.HTMLImageElement.prototype,
    "complete",
  );

  Object.defineProperty(dom.window.HTMLImageElement.prototype, "complete", {
    configurable: true,
    get() {
      return this.dataset.cached === "true";
    },
  });

  try {
    await renderImage(root, ImageWithSkeleton, {
      "data-cached": "true",
      src: "/cached.jpg",
    });
    const image = dom.window.document.querySelector("img");

    assert.ok(!image?.classList.contains("pending"));
  } finally {
    if (originalComplete) {
      Object.defineProperty(
        dom.window.HTMLImageElement.prototype,
        "complete",
        originalComplete,
      );
    }
    await act(async () => root.unmount());
    restore();
  }
});

test("a new source starts pending and old load events cannot clear it", async () => {
  const { dom, restore } = installDom();
  const root = createRoot(dom.window.document.getElementById("root"));
  const ImageWithSkeleton = loadImageWithSkeleton();

  try {
    await renderImage(root, ImageWithSkeleton, { src: "/first.jpg" });
    const firstImage = dom.window.document.querySelector("img");

    await renderImage(root, ImageWithSkeleton, { src: "/second.jpg" });
    const secondImage = dom.window.document.querySelector("img");

    assert.notEqual(secondImage, firstImage);
    assert.ok(secondImage?.classList.contains("pending"));

    await act(async () => {
      firstImage.dispatchEvent(new dom.window.Event("load", { bubbles: true }));
      await Promise.resolve();
    });

    assert.ok(secondImage.classList.contains("pending"));

    await act(async () => {
      secondImage.dispatchEvent(
        new dom.window.Event("load", { bubbles: true }),
      );
      await Promise.resolve();
    });

    assert.ok(!secondImage.classList.contains("pending"));
  } finally {
    await act(async () => root.unmount());
    restore();
  }
});

test("image skeleton uses the approved gray token without adding a wrapper", async () => {
  const [component, styles] = await Promise.all([
    readFile(componentUrl, "utf8"),
    readFile(
      new URL("../components/ImageWithSkeleton.module.css", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(component, /<Image[\s\S]*className=/);
  assert.doesNotMatch(component, /<div/);
  assert.match(styles, /var\(--landing-gray-100, #f1f5f9\)/);
  assert.doesNotMatch(styles, /animation|transition/);
});
