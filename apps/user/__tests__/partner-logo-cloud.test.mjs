import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL(
  "../app/_components/PartnerLogoCloud.tsx",
  import.meta.url,
);
const stylesUrl = new URL("../app/page.module.css", import.meta.url);
const aboutPageUrl = new URL("../app/(site)/about/page.tsx", import.meta.url);

function cssBlock(source, selector) {
  const start = source.indexOf(selector);
  assert.notEqual(start, -1, `Missing ${selector}`);

  const openBrace = source.indexOf("{", start);
  assert.notEqual(openBrace, -1, `Missing opening brace for ${selector}`);

  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    } else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBrace + 1, index);
      }
    }
  }

  assert.fail(`Missing closing brace for ${selector}`);
}

test("partner logo variants share the landing marquee structure", async () => {
  const componentSource = await readFile(componentUrl, "utf8");

  assert.equal(componentSource.match(/<PartnerLogoMarquee/g)?.length, 2);
  assert.doesNotMatch(componentSource, /companyMarqueeClientRows/);
  assert.doesNotMatch(componentSource, /reviewLogoMarqueeCompany/);
  assert.doesNotMatch(componentSource, /!isCompanyVariant\s*\?/);
  assert.match(componentSource, /styles\.featuredClientLogoMarquee/);
  assert.match(componentSource, /styles\.reviewLogoMarqueePartners/);
});

test("company layout stays compact while responsive marquee rules are shared", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const companyLogo = cssBlock(
    stylesSource,
    ".reviewLogoCloudCompany .reviewClientLogo {",
  );
  const partnerBreakpoint = cssBlock(
    stylesSource,
    "@media (max-width: 1300px)",
  );
  const featuredBreakpoint = cssBlock(
    stylesSource,
    "@media (max-width: 825px)",
  );
  const compactBreakpoint = cssBlock(stylesSource, "@media (max-width: 640px)");

  assert.match(companyLogo, /width:\s*160px;/);
  assert.match(companyLogo, /height:\s*53px;/);
  assert.doesNotMatch(stylesSource, /reviewLogoMarqueeCompany/);
  assert.doesNotMatch(partnerBreakpoint, /:not\(\.reviewLogoCloudCompany\)/);
  assert.doesNotMatch(featuredBreakpoint, /:not\(\.reviewLogoCloudCompany\)/);
  assert.doesNotMatch(compactBreakpoint, /:not\(\.reviewLogoCloudCompany\)/);
  assert.match(
    partnerBreakpoint,
    /\.reviewLogoCloud\s+\.reviewClientLogoRows\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(
    partnerBreakpoint,
    /\.reviewLogoCloud\s+\.reviewLogoMarqueePartners\s*\{[^}]*display:\s*flex;/s,
  );
  assert.match(
    featuredBreakpoint,
    /\.reviewLogoCloud\s+\.featuredClientLogos\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(
    featuredBreakpoint,
    /\.reviewLogoCloud\s+\.featuredClientLogoMarquee\s*\{[^}]*display:\s*flex;/s,
  );
});

test("about page keeps the company desktop logo arrangement", async () => {
  const aboutPageSource = await readFile(aboutPageUrl, "utf8");

  assert.match(
    aboutPageSource,
    /<PartnerLogoCloud[\s\S]*?ariaLabel="씨브레인 고객사 로고"[\s\S]*?variant="company"[\s\S]*?\/>/,
  );
});
