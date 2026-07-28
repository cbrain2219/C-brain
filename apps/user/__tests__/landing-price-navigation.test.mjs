import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const headerUrl = new URL("../app/_components/Header.tsx", import.meta.url);
const heroUrl = new URL("../app/_components/Hero.tsx", import.meta.url);
const landingStylesUrl = new URL("../app/page.module.css", import.meta.url);

test("landing price buttons navigate to the order page", async () => {
  const [headerSource, heroSource, landingStyles] = await Promise.all([
    readFile(headerUrl, "utf8"),
    readFile(heroUrl, "utf8"),
    readFile(landingStylesUrl, "utf8"),
  ]);

  for (const source of [headerSource, heroSource]) {
    assert.match(source, /useRouter/);
    assert.match(source, /router\.push\("\/order"\)/);
    assert.match(
      source,
      /<Button[\s\S]*?onClick=\{handlePriceButtonClick\}[\s\S]*?>[\s\S]*?정찰제 가격 보기[\s\S]*?<\/Button>/,
    );
  }

  assert.match(heroSource, /includeBorder: false/);
  assert.match(heroSource, /className=\{styles\.heroGradientButton\}/);
  assert.doesNotMatch(heroSource, /rightIcon=\{/);
  assert.match(heroSource, /className=\{styles\.heroGradientButtonIcon\}/);
  assert.match(heroSource, /name="message-typing"[\s\S]*?size=\{24\}/);
  assert.match(heroSource, /name="arrow-right"[\s\S]*?size=\{24\}/);
  assert.match(
    landingStyles,
    /\.heroGradientButton\s*\{[\s\S]*?isolation: isolate;[\s\S]*?overflow: hidden;/,
  );
  assert.match(
    landingStyles,
    /\.heroGradientButton::before\s*\{[\s\S]*?inset: 0;[\s\S]*?z-index: 0;/,
  );
  assert.match(
    landingStyles,
    /\.heroGradientButton::before\s*\{[\s\S]*?border-radius: inherit;/,
  );
  assert.match(
    landingStyles,
    /\.heroGradientButton::before\s*\{[\s\S]*?var\(--landing-button-border-end\), var\(--landing-button-border-start\);/,
  );
  assert.match(
    landingStyles,
    /\.heroGradientButton > \*\s*\{[\s\S]*?z-index: 1;/,
  );
});
