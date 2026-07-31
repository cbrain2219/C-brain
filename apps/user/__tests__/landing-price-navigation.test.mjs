import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const headerUrl = new URL("../app/_components/Header.tsx", import.meta.url);
const heroUrl = new URL("../app/_components/Hero.tsx", import.meta.url);
const actionsUrl = new URL(
  "../app/_components/ContactActionButtons.tsx",
  import.meta.url,
);
const actionsStylesUrl = new URL(
  "../app/_components/ContactActionButtons.module.css",
  import.meta.url,
);

test("shared contact actions keep price navigation and presentation consistent", async () => {
  const [headerSource, heroSource, actionsSource, actionsStyles] =
    await Promise.all([
      readFile(headerUrl, "utf8"),
      readFile(heroUrl, "utf8"),
      readFile(actionsUrl, "utf8"),
      readFile(actionsStylesUrl, "utf8"),
    ]);

  for (const source of [headerSource, heroSource]) {
    assert.match(source, /ContactActionButtons/);
    assert.match(source, /secondaryAction=\{FIXED_PRICE_ACTION\}/);
    assert.doesNotMatch(source, /useRouter/);
  }

  assert.match(headerSource, /actionOrder="secondary-first"/);
  assert.match(headerSource, /variant="compact"/);
  assert.doesNotMatch(heroSource, /actionOrder="secondary-first"/);
  assert.doesNotMatch(heroSource, /variant="compact"/);
  assert.match(
    actionsSource,
    /FIXED_PRICE_ACTION\s*=\s*\{[\s\S]*?label: "정찰제 가격 보기",[\s\S]*?href: "\/order"/,
  );
  assert.match(actionsSource, /includeBorder: false/);
  assert.match(actionsSource, /<span>실시간 카톡상담<\/span>/);
  assert.match(actionsSource, /name="message-typing" size=\{24\}/);
  assert.match(actionsSource, /name="arrow-right" size=\{24\}/);
  assert.match(actionsSource, /isCompact \? null/);
  assert.match(
    actionsSource,
    /actionOrder = "contact-first"[\s\S]*?isSecondaryActionFirst = actionOrder === "secondary-first"/,
  );
  assert.match(
    actionsSource,
    /\{isSecondaryActionFirst \? secondaryActionLink : null\}[\s\S]*?<ButtonLink[\s\S]*?\{isSecondaryActionFirst \? null : secondaryActionLink\}/,
  );
  assert.match(
    actionsStyles,
    /\.actions\s*\{[\s\S]*?--contact-action-width: 164px;/,
  );
  assert.match(
    actionsStyles,
    /\.compact\s*\{[\s\S]*?--contact-action-width: 148px;/,
  );
  assert.match(
    actionsStyles,
    /\.actionButton\s*\{[\s\S]*?isolation: isolate;[\s\S]*?overflow: hidden;/,
  );
  assert.match(
    actionsStyles,
    /\.actionButton::before\s*\{[\s\S]*?inset: 0;[\s\S]*?border-radius: inherit;[\s\S]*?var\(--landing-button-border-end\), var\(--landing-button-border-start\);/,
  );
  assert.match(actionsStyles, /\.actionButton > \*\s*\{[\s\S]*?z-index: 1;/);
});
