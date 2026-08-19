# Raw HTML Detail Frame Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make sandboxed Raw HTML detail documents resize in both directions without nested vertical scrollbars, and render Raw HTML notices through the same shared frame used by Blog, Portfolio, and Review details.

**Architecture:** Keep `RawHtmlDocumentFrame` as the single security and sizing boundary for full-document HTML. Measure rendered content bounds without using the iframe viewport-sized `documentElement`, then route Notice `html/raw_html` records into that shared frame while preserving the existing WYSIWYG and Markdown paths.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, Node test runner, JSDOM

**Spec:** `design.md` plus the user-approved 2026-08-19 scope: Blog, Portfolio, Review, and Notice Raw HTML details share the sandboxed document frame; WYSIWYG and Markdown behavior remains unchanged.

## Global Constraints

- Preserve `sandbox="allow-scripts"`; never add `allow-same-origin`.
- Continue removing supplied scripts and using the nonce-bound resize script and CSP.
- Preserve the existing `body { margin: 0; }` frame reset introduced by commit `e2979f0`.
- The outer detail page owns vertical scrolling; the embedded document must not expose a second vertical scrollbar.
- Raw HTML notices use the shared sandbox; WYSIWYG notices remain sanitized inline; Markdown notices retain the legacy paragraph/list renderer.
- Follow `design.md`; this change adds no icons, assets, typography, or spacing tokens.

---

### Task 1: Bidirectional shared frame sizing

**Files:**
- Modify: `apps/user/__tests__/raw-html-document-frame.test.mjs`
- Modify: `apps/user/__tests__/blog-html-document.test.mjs`
- Modify: `apps/user/components/rawHtmlFrameHelpers.ts`
- Modify: `apps/user/components/RawHtmlDocumentFrame.tsx`

**Interfaces:**
- Consumes: `createFramedHtml(html: string, token: string, DomParser?: DomParserConstructor): string` and `getTrustedFrameResizeHeight(...)`.
- Produces: the same public interfaces, with content-bound measurement that can shrink and an iframe whose own scrolling is disabled.

- [x] **Step 1: Write the failing frame regression tests**

Extend the generated-document test so it executes the injected resize script in a layout-mocked JSDOM. Mock a stale `documentElement.scrollHeight`, give the body/content explicit geometry, invoke the captured `ResizeObserver`, and assert the second posted height is smaller than the first:

```js
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
  assert.equal(messages.at(-1).height, 580);

  const body = framed.window.document.body;
  const content = framed.window.document.querySelector("main");
  body.dataset.bottom = "340";
  body.dataset.offsetHeight = "340";
  body.dataset.scrollHeight = "340";
  content.dataset.bottom = "360";
  notifyResize();

  assert.equal(messages.at(-1).height, 380);
  framed.window.close();
});
```

Also assert the injected reset hides root vertical overflow and the React iframe includes `scrolling="no"`.

- [x] **Step 2: Run the focused tests and verify they fail**

Run:

```bash
pnpm --filter user exec node --test \
  __tests__/raw-html-document-frame.test.mjs \
  __tests__/blog-html-document.test.mjs
```

Expected: FAIL because the current script reports the stale root height and the iframe does not disable its own scrolling.

- [x] **Step 3: Implement content-bound measurement and scrollbar suppression**

Keep the existing script/CSP boundary. Change the injected reset to preserve the body reset and hide only the document-level vertical overflow:

```ts
frameReset.textContent =
  "html { overflow-y: hidden !important; } body { margin: 0; }";
```

Replace the root-based height calculation with a content-bound calculation that:

```js
const getElementBottom = (element) => {
  const style = getComputedStyle(element);
  if (style.display === "none" || style.position === "fixed") return 0;
  const marginBottom = Number.parseFloat(style.marginBottom);
  return (
    element.getBoundingClientRect().bottom +
    window.scrollY +
    (Number.isFinite(marginBottom) ? marginBottom : 0)
  );
};

const sendHeight = () => {
  const body = document.body;
  if (!body) return;
  let height = Math.max(
    body.offsetHeight,
    body.scrollHeight,
    getElementBottom(body),
  );
  for (const element of body.querySelectorAll("*")) {
    height = Math.max(height, getElementBottom(element));
  }
  window.parent.postMessage(
    { type: "cbrain:raw-html-resize", token, height },
    "*",
  );
};
```

Schedule resize work through one animation frame for `load`, `document.fonts.ready`, the initial measurement, and `ResizeObserver`. Do not include `documentElement.offsetHeight` or `documentElement.scrollHeight`. Add `scrolling="no"` to `RawHtmlDocumentFrame`.

- [x] **Step 4: Run the focused tests and verify they pass**

Run the Step 2 command.

Expected: PASS; the mocked height drops from `580` to `380`, supplied scripts remain removed, CSP/token checks remain intact, and the iframe contract includes scrolling suppression.

- [x] **Step 5: Commit the shared frame fix**

```bash
git add \
  docs/superpowers/plans/2026-08-19-raw-html-detail-frame-resize.md \
  apps/user/__tests__/raw-html-document-frame.test.mjs \
  apps/user/__tests__/blog-html-document.test.mjs \
  apps/user/components/rawHtmlFrameHelpers.ts \
  apps/user/components/RawHtmlDocumentFrame.tsx
git commit -m "fix(user): resize raw HTML frames to content"
```

---

### Task 2: Raw HTML Notice detail rendering

**Files:**
- Modify: `apps/user/__tests__/notice-pages.test.mjs`
- Modify: `apps/user/app/(site)/notice/[id]/_components/NoticeDetailArticle.tsx`

**Interfaces:**
- Consumes: `notice.managedContent` and `RawHtmlDocumentFrame({ html, title })` from Task 1.
- Produces: Notice rendering with three explicit branches: `html/raw_html` frame, sanitized WYSIWYG inline content, and legacy Markdown blocks.

- [x] **Step 1: Write the failing Notice routing test**

Extend the Notice detail source contract to require:

```js
assert.match(article, /import \{ RawHtmlDocumentFrame \}/);
assert.match(article, /notice\.managedContent\.contentMode === "html"/);
assert.match(
  article,
  /notice\.managedContent\.contentAuthoringMode === "raw_html"/,
);
assert.match(
  article,
  /<RawHtmlDocumentFrame html=\{rawHtmlSource\} title=\{notice\.title\} \/>/,
);
assert.match(article, /<ManagedContent/);
assert.match(article, /notice\.content\.map/);
```

- [x] **Step 2: Run the Notice test and verify it fails**

Run:

```bash
pnpm --filter user exec node --test __tests__/notice-pages.test.mjs
```

Expected: FAIL because Notice detail currently sends every Raw HTML record to the plain legacy fallback.

- [x] **Step 3: Route Notice Raw HTML through the shared frame**

Import `RawHtmlDocumentFrame`, derive the source without trimming the persisted value, and branch before `ManagedContent`:

```tsx
const rawHtmlSource =
  notice.managedContent.contentMode === "html" &&
  notice.managedContent.contentAuthoringMode === "raw_html" &&
  notice.managedContent.content.trim()
    ? notice.managedContent.content
    : undefined;

{rawHtmlSource ? (
  <RawHtmlDocumentFrame html={rawHtmlSource} title={notice.title} />
) : (
  <ManagedContent legacyFallback={...} value={notice.managedContent} />
)}
```

Do not change Notice list/excerpt plain-text derivation, WYSIWYG sanitization, Markdown parsing, metadata, or back-navigation.

- [x] **Step 4: Run the Notice test and verify it passes**

Run the Step 2 command.

Expected: PASS with existing Notice behavior assertions unchanged.

- [x] **Step 5: Commit the Notice integration**

```bash
git add \
  apps/user/__tests__/notice-pages.test.mjs \
  'apps/user/app/(site)/notice/[id]/_components/NoticeDetailArticle.tsx'
git commit -m "feat(user): render raw HTML notices in shared frame"
```

---

### Task 3: Full verification and responsive browser regression

**Files:**
- Verify only; no planned source modifications.

**Interfaces:**
- Consumes: shared frame sizing and four detail-surface routing from Tasks 1-2.
- Produces: test, type, lint, and live-browser evidence that the change is complete.

- [x] **Step 1: Run the full User test suite**

```bash
pnpm --filter user test
```

Expected: all User tests pass.

- [x] **Step 2: Run User type checking and linting**

```bash
pnpm --filter user check-types
pnpm --filter user lint
```

Expected: both commands exit `0` with no warnings.

- [x] **Step 3: Verify the live frame can shrink**

At `http://localhost:3000/blog/brochure-vs-catalogue` with a `390x800` viewport:

1. Record the Raw HTML iframe and body heights.
2. Open and close the first FAQ; assert the final iframe height returns to the initial height.
3. Resize from `390x800` to `1024x800`; assert the iframe height matches the shorter reflowed content instead of retaining the mobile height.
4. Confirm the root document has no active vertical scrollbar.

- [x] **Step 4: Verify shared detail surfaces**

Repeat the narrow-to-wide height comparison for every currently published Raw HTML Portfolio and Review route. Confirm the existing Notice detail still renders its current non-Raw-HTML mode, and rely on the focused Notice routing contract for the Raw HTML branch if no published Raw HTML notice fixture exists.

- [x] **Step 5: Confirm repository scope**

```bash
git status --short
git diff --check HEAD~2..HEAD
```

Expected: no uncommitted changes and no whitespace errors; only the shared frame, Notice integration, tests, and this plan are in scope.
