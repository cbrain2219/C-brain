import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL(
  "../app/reviews/request/page.tsx",
  import.meta.url,
);
const formPath = new URL(
  "../app/reviews/request/ReviewRequestForm.tsx",
  import.meta.url,
);
const stylesPath = new URL(
  "../app/reviews/request/page.module.css",
  import.meta.url,
);
const iconPath = new URL("../components/Icon.tsx", import.meta.url);

test("review request page exposes the complete standalone Figma form", async () => {
  const [page, form, styles, icons] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(formPath, "utf8"),
    readFile(stylesPath, "utf8"),
    readFile(iconPath, "utf8"),
  ]);

  assert.match(page, /className=\{styles\.pageBackground\}/);
  assert.match(page, /<ReviewRequestForm \/>/);
  assert.match(page, /index:\s*false/);
  assert.match(page, /후기 등록 요청/);
  assert.doesNotMatch(page, /Header|Footer/);

  for (const label of [
    "회사명",
    "담당자명 · 직위",
    "의뢰하신 제품",
    "만족도",
    "후기 내용",
    "후기 제출하기",
  ]) {
    assert.match(form, new RegExp(label.replace("·", "·")));
  }

  assert.match(form, /useState\(1\)/);
  assert.match(form, /fetch\("\/api\/review-submissions"/);
  assert.match(form, /name="arrow-left"/);
  assert.match(form, /name="chevron-down"/);
  assert.match(form, /name="star-filled"/);
  assert.match(form, /name="arrow-right"/);
  assert.match(form, /aria-label=\{`\$\{value\}점`\}/);
  assert.match(form, /role="status"/);
  assert.match(form, /role="alert"/);

  assert.match(styles, /max-width:\s*390px/);
  assert.match(
    styles,
    /\.pageBackground\s*\{[^}]*min-height:\s*100svh;[^}]*background:\s*#f8fafc;/s,
  );
  assert.match(styles, /padding:\s*32px 20px/);
  assert.match(styles, /gap:\s*52px/);
  assert.match(styles, /height:\s*52px/);
  assert.match(styles, /min-height:\s*320px/);
  assert.match(styles, /border-radius:\s*16px/);
  assert.match(styles, /#30bac3/i);

  assert.match(icons, /\| "star-filled"/);
  assert.match(icons, /function StarFilledIcon/);
  assert.match(icons, /fill="currentColor"/);
  assert.doesNotMatch(`${page}\n${form}\n${styles}`, /ios_Status Bar|home indicator/);
});
