import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/reviews/request/page.tsx", import.meta.url);
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
  assert.match(page, /createNoIndexMetadata/);
  assert.match(page, /includeSocial:\s*true/);
  assert.match(page, /path:\s*"\/reviews\/request"/);
  assert.match(page, /title:\s*"후기 남기기 \| 씨브레인"/);
  assert.match(
    page,
    /씨브레인과 함께한 경험, 편하게 들려주세요! 여러분의 솔직한 이야기가 저희에게 큰 힘이 됩니다\./,
  );
  assert.match(page, /icon:\s*"\/cbrain-favicon\.ico"/);
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
  assert.match(form, /후기 남기기/);
  assert.match(form, /보내드립니다! 🙂/);
  assert.match(form, /placeholder="예 : 씨브레인"/);
  assert.match(form, /placeholder="예 : 홍길동 과장"/);
  assert.match(form, /선택해주세요\./);
  assert.match(
    form,
    /placeholder="씨브레인과의 경험을 자유롭게, 자세히 적어주시면 큰 도움이 됩니다\."/,
  );
  assert.doesNotMatch(form, /입력하신 성함은 가운데 글자를 가려 표시됩니다/);

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
  assert.match(styles, /\.intro h2\s*\{[^}]*margin:\s*0;/s);
  assert.match(styles, /\.ratingField\s*\{[^}]*margin:\s*0;/s);
  assert.match(
    styles,
    /\.ratingField legend\s*\{[^}]*margin:\s*0 0 8px;[^}]*padding:\s*0;/s,
  );

  assert.match(icons, /\| "star-filled"/);
  assert.match(icons, /function StarFilledIcon/);
  assert.match(icons, /fill="currentColor"/);
  assert.doesNotMatch(
    `${page}\n${form}\n${styles}`,
    /ios_Status Bar|home indicator/,
  );
});
