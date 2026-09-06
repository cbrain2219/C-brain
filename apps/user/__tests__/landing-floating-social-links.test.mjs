import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL(
  "../app/_components/FloatingSocialLinks.tsx",
  import.meta.url,
);
const pageUrl = new URL("../app/(site)/page.tsx", import.meta.url);
const stylesUrl = new URL(
  "../app/_components/FloatingSocialLinks.module.css",
  import.meta.url,
);

test("landing reuses footer social links in the fixed Figma rail", async () => {
  const [component, page, styles] = await Promise.all([
    readFile(componentUrl, "utf8"),
    readFile(pageUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
  ]);

  assert.match(page, /<FloatingSocialLinks \/>/);
  assert.match(component, /companySocialLinks/);
  assert.match(
    component,
    /"instagram",\s*"naverBlog",\s*"youtube"/,
  );
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /target="_blank"/);
  assert.match(styles, /position:\s*fixed/);
  assert.match(styles, /top:\s*66\.6667dvh/);
  assert.match(styles, /right:\s*0/);
  assert.match(styles, /width:\s*52px/);
  assert.match(styles, /height:\s*52px/);
  assert.match(styles, /gap:\s*4px/);
  assert.match(styles, /transform:\s*translateY\(-50%\)/);
});
