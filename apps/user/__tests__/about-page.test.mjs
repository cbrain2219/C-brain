import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesUrl = new URL(
  "../app/(site)/about/page.module.css",
  import.meta.url,
);
const pageUrl = new URL("../app/(site)/about/page.tsx", import.meta.url);
const companyUrl = new URL("../app/_content/company.ts", import.meta.url);

function cssBlock(source, selector) {
  const start = source.indexOf(selector);
  assert.notEqual(start, -1);

  const openBrace = source.indexOf("{", start);
  assert.notEqual(openBrace, -1);

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

test("about intro heading follows the responsive type scale", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");

  assert.match(
    stylesSource,
    /\.introCopy h2\s*\{[^}]*font-size:\s*28px[^}]*font-style:\s*normal[^}]*font-weight:\s*700[^}]*line-height:\s*36px[^}]*letter-spacing:\s*-0\.015em/s,
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*1080px\)[\s\S]*?\.introCopy h2\s*\{[^}]*font-size:\s*24px[^}]*line-height:\s*32px/s,
  );
});

test("about hero keeps the 1440 frame padding without a fixed hero height", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const heroStyles = cssBlock(stylesSource, ".hero {");

  assert.doesNotMatch(heroStyles, /min-height:/);
  assert.match(
    heroStyles,
    /padding:\s*var\(--site-page-top-offset, 124px\) 0 104px;/,
  );
});

test("about hero metric panel shares the badge gradient border", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const panelStyles = cssBlock(stylesSource, ".heroMetricPanel {");
  const borderStyles = cssBlock(stylesSource, ".heroMetricPanel::before {");

  assert.match(panelStyles, /background:\s*rgba\(255, 255, 255, 0\.1\);/);
  assert.doesNotMatch(panelStyles, /box-shadow:[^;]*inset/);
  assert.match(
    stylesSource,
    /\.heroBadge::before,\s*\.heroMetricPanel::before\s*\{/,
  );
  assert.match(
    borderStyles,
    /rgba\(255, 255, 255, 0\.08\) 0%[\s\S]*rgba\(255, 255, 255, 0\.8\) 100%/,
  );
  assert.match(
    borderStyles,
    /rgba\(255, 255, 255, 0\.8\) 0%[\s\S]*rgba\(255, 255, 255, 0\.08\) 100%/,
  );
});

test("about hero keeps the 1080 frame padding without a fixed hero height", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const tabletStart = stylesSource.indexOf("@media (max-width: 1399px)");
  const desktopStart = stylesSource.indexOf(
    "@media (max-width: 1080px)",
    tabletStart,
  );

  assert.notEqual(tabletStart, -1);
  assert.notEqual(desktopStart, -1);

  const tabletStyles = stylesSource.slice(tabletStart, desktopStart);
  const heroStyles = cssBlock(tabletStyles, ".hero {");
  const heroInnerStyles = cssBlock(tabletStyles, ".heroInner {");

  assert.doesNotMatch(heroStyles, /min-height:/);
  assert.match(
    heroStyles,
    /padding:\s*var\(--site-page-top-offset, 124px\) 0 72px;/,
  );
  assert.match(heroInnerStyles, /width:\s*min\(100%,\s*1080px\);/);
});

test("about section wrappers keep 20px horizontal padding through tablet", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const tabletStart = stylesSource.indexOf("@media (max-width: 1399px)");
  const desktopStart = stylesSource.indexOf(
    "@media (max-width: 1080px)",
    tabletStart,
  );

  assert.notEqual(tabletStart, -1);
  assert.notEqual(desktopStart, -1);

  const tabletStyles = stylesSource.slice(tabletStart, desktopStart);
  const sectionFrameStyles = cssBlock(tabletStyles, ".sectionInner,");

  assert.match(sectionFrameStyles, /padding:\s*0 20px;/);
});

test("about hero keeps the fold padding before the 870 mobile breakpoint", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const foldStart = stylesSource.indexOf("@media (max-width: 1080px)");
  const mobileStart = stylesSource.indexOf(
    "@media (max-width: 869px)",
    foldStart,
  );

  assert.notEqual(foldStart, -1);
  assert.notEqual(mobileStart, -1);

  const foldStyles = stylesSource.slice(foldStart, mobileStart);
  const heroStyles = cssBlock(foldStyles, ".hero {");
  const heroInnerStyles = cssBlock(foldStyles, ".heroInner {");

  assert.doesNotMatch(heroStyles, /min-height:/);
  assert.match(
    heroStyles,
    /padding:\s*var\(--site-page-top-offset, 124px\) 0 72px;/,
  );
  assert.match(heroInnerStyles, /padding:\s*0 20px;/);
  assert.doesNotMatch(
    foldStyles,
    /\.heroDescriptionMobileBreak\s*\{[\s\S]*?display:\s*block;/,
  );
});

test("about hero keeps flexible text before the compact mobile breakpoint", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const mobileStart = stylesSource.indexOf("@media (max-width: 869px)");
  const compactMobileStart = stylesSource.indexOf(
    "@media (max-width: 639px)",
    mobileStart,
  );
  const mobileHeroStyles = stylesSource.slice(mobileStart, compactMobileStart);

  assert.notEqual(mobileStart, -1);
  assert.notEqual(compactMobileStart, -1);
  assert.match(
    cssBlock(mobileHeroStyles, ".heroMetricPanel {"),
    /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/,
  );
  assert.doesNotMatch(
    mobileHeroStyles,
    /\.heroTitleMobileBreak\s*\{[\s\S]*?display:\s*block;/,
  );
  assert.doesNotMatch(
    mobileHeroStyles,
    /\.heroTitleLine\s*\{[\s\S]*?display:\s*block;/,
  );
  assert.doesNotMatch(
    mobileHeroStyles,
    /\.heroDescriptionMobileBreak\s*\{[\s\S]*?display:\s*block;/,
  );
});

test("about hero title uses the mobile line break below 640px", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const mobileStart = stylesSource.indexOf("@media (max-width: 639px)");
  const compactMobileStart = stylesSource.indexOf(
    "@media (max-width: 480px)",
    mobileStart,
  );

  assert.notEqual(mobileStart, -1);
  assert.notEqual(compactMobileStart, -1);

  assert.match(
    stylesSource.slice(mobileStart, compactMobileStart),
    /\.heroTitleMobileBreak\s*\{[\s\S]*?display:\s*block;/,
  );
  assert.match(
    stylesSource.slice(mobileStart, compactMobileStart),
    /\.heroTitleLine\s*\{[\s\S]*?display:\s*block;/,
  );
  assert.match(
    stylesSource.slice(mobileStart, compactMobileStart),
    /\.heroTitleAccent,\s*\.heroTitlePlain\s*\{[\s\S]*?display:\s*block;/,
  );
});

test("about hero title follows the blog hero responsive mobile type scale", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const mobileStart = stylesSource.indexOf("@media (max-width: 639px)");
  const compactMobileStart = stylesSource.indexOf(
    "@media (max-width: 480px)",
    mobileStart,
  );

  assert.notEqual(mobileStart, -1);
  assert.notEqual(compactMobileStart, -1);

  const mobileStyles = stylesSource.slice(mobileStart, compactMobileStart);
  const mobileTitleStyles = cssBlock(mobileStyles, ".heroCopy h1 {");

  assert.match(mobileTitleStyles, /font-size:\s*28px;/);
  assert.match(mobileTitleStyles, /line-height:\s*36px;/);
});

test("about hero description renders one text copy with responsive line breaks", async () => {
  const [stylesSource, pageSource] = await Promise.all([
    readFile(stylesUrl, "utf8"),
    readFile(pageUrl, "utf8"),
  ]);
  const responsiveStart = stylesSource.indexOf("@media (max-width: 1080px)");
  const mobileStart = stylesSource.indexOf("@media (max-width: 639px)");
  const compactMobileStart = stylesSource.indexOf(
    "@media (max-width: 480px)",
    mobileStart,
  );
  const responsiveStyles = stylesSource.slice(responsiveStart, mobileStart);
  const mobileStyles = stylesSource.slice(mobileStart, compactMobileStart);

  assert.notEqual(responsiveStart, -1);
  assert.notEqual(mobileStart, -1);
  assert.notEqual(compactMobileStart, -1);
  assert.equal(
    pageSource.match(/경기도 성남시 소재 · 2000년 설립 이후 26년간/g)?.length,
    1,
  );
  assert.equal(pageSource.match(/전국 1,200여\s*기업과 함께해 온/g)?.length, 1);
  assert.equal(
    pageSource.match(/각종 홍보물 기획·디자인·인쇄 원스톱 전문 기업입니다\./g)
      ?.length,
    1,
  );
  assert.doesNotMatch(pageSource, /heroDescriptionLineDesktop/);
  assert.doesNotMatch(pageSource, /heroDescriptionLineMobile/);
  assert.match(pageSource, /className=\{styles\.heroDescriptionBreak\}/);
  assert.match(pageSource, /className=\{styles\.heroDescriptionMobileBreak\}/);
  assert.match(
    cssBlock(stylesSource, ".heroDescription {"),
    /white-space:\s*nowrap;/,
  );
  assert.match(
    responsiveStyles,
    /\.heroDescription\s*\{\s*white-space:\s*normal;/,
  );
  assert.match(
    cssBlock(stylesSource, ".heroDescriptionMobileBreak {"),
    /display:\s*none;/,
  );
  assert.match(
    mobileStyles,
    /\.heroDescriptionMobileBreak\s*\{[\s\S]*?display:\s*block;/,
  );
});

test("about channel cards use exported Figma image icons", async () => {
  const pageSource = await readFile(pageUrl, "utf8");
  const companySource = await readFile(companyUrl, "utf8");
  const stylesSource = await readFile(stylesUrl, "utf8");

  [
    "about-channel-kakao.png",
    "about-channel-naver-blog.png",
    "about-channel-instagram.png",
    "about-channel-youtube.png",
    "about-channel-naver-place.png",
  ].forEach((fileName) => {
    assert.match(companySource, new RegExp(`/figma-assets/${fileName}`));
  });

  assert.match(companySource, /iconImage:\s*\{/);
  assert.match(pageSource, /<Image/);
  assert.match(pageSource, /src=\{channel\.iconImage\.src\}/);
  assert.match(pageSource, /alt=\{channel\.iconImage\.alt\}/);
  assert.match(pageSource, /width=\{channel\.iconImage\.width\}/);
  assert.match(pageSource, /height=\{channel\.iconImage\.height\}/);
  assert.doesNotMatch(pageSource, /<Icon name=\{channel\.icon\}/);
  assert.match(cssBlock(stylesSource, ".channelIcon img"), /display:\s*block;/);
});

test("about intro media and timeline marker follow the reviewed desktop design", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const introMediaStyles = cssBlock(stylesSource, ".introMedia {");
  const introMediaLargeStyles = cssBlock(stylesSource, ".introMediaLarge {");
  const timelineDotStyles = cssBlock(stylesSource, ".timelineDot {");

  assert.match(introMediaStyles, /gap:\s*20px;/);
  assert.match(introMediaLargeStyles, /aspect-ratio:\s*327 \/ 184;/);
  assert.match(timelineDotStyles, /width:\s*4px;/);
  assert.match(timelineDotStyles, /height:\s*4px;/);
  assert.match(timelineDotStyles, /border:\s*1px solid #f8fafc;/);
  assert.match(timelineDotStyles, /border-radius:\s*8px;/);
  assert.match(timelineDotStyles, /background:\s*#30bac3;/);
  assert.doesNotMatch(timelineDotStyles, /box-shadow:/);
});

test("about intro media stacks in one column through 600px", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const introMediaBreakpoint = cssBlock(
    stylesSource,
    "@media (max-width: 600px)",
  );

  assert.match(
    cssBlock(introMediaBreakpoint, ".introMedia {"),
    /grid-template-columns:\s*1fr;/,
  );
});

test("about channels follow the reviewed order and copy", async () => {
  const companySource = await readFile(companyUrl, "utf8");
  const channelSource = companySource.slice(
    companySource.indexOf("export const companyChannels"),
    companySource.indexOf("export const companyInfoRows"),
  );

  assert.match(
    channelSource,
    /title:\s*"네이버 블로그"[\s\S]*title:\s*"인스타그램"[\s\S]*title:\s*"유튜브"[\s\S]*title:\s*"네이버 플레이스"[\s\S]*title:\s*"카카오톡 채널"/,
  );
  assert.match(channelSource, /description:\s*"찾아오시는길"/);
  assert.match(channelSource, /description:\s*"빠른 견적 및 1:1 상담"/);
  assert.match(
    companySource,
    /naverPlace:\s*"https:\/\/map\.naver\.com\/p\/entry\/place\/18259776"/,
  );
  assert.doesNotMatch(channelSource, /title:\s*"공식 홈페이지"/);
});

test("about card grids follow the reviewed row and column breakpoints", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const reasonBreakpoint = cssBlock(stylesSource, "@media (max-width: 800px)");
  const compactChannelBreakpoint = cssBlock(
    stylesSource,
    "@media (max-width: 1137px)",
  );
  const channelBreakpoint = cssBlock(stylesSource, "@media (max-width: 899px)");

  assert.match(
    cssBlock(reasonBreakpoint, ".reasonGrid {"),
    /grid-template-columns:\s*1fr;/,
  );
  assert.match(
    cssBlock(compactChannelBreakpoint, ".channelGrid {"),
    /grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/,
  );
  assert.doesNotMatch(compactChannelBreakpoint, /\.channelCard:nth-child/);
  assert.match(
    cssBlock(channelBreakpoint, ".channelGrid {"),
    /grid-template-columns:\s*1fr;/,
  );
});

test("about mobile timeline keeps title fragments on the same line", async () => {
  const [stylesSource, pageSource, companySource] = await Promise.all([
    readFile(stylesUrl, "utf8"),
    readFile(pageUrl, "utf8"),
    readFile(companyUrl, "utf8"),
  ]);
  const mobileStart = stylesSource.indexOf("@media (max-width: 639px)");
  const compactMobileStart = stylesSource.indexOf(
    "@media (max-width: 480px)",
    mobileStart,
  );
  const mobileStyles = stylesSource.slice(mobileStart, compactMobileStart);

  assert.notEqual(mobileStart, -1);
  assert.notEqual(compactMobileStart, -1);
  const timelineTextStyles = cssBlock(mobileStyles, ".timelineBody p");

  assert.doesNotMatch(timelineTextStyles, /display:\s*flex;/);
  assert.doesNotMatch(timelineTextStyles, /flex-direction:/);
  assert.doesNotMatch(timelineTextStyles, /flex-wrap:/);
  assert.match(
    cssBlock(stylesSource, ".timelineDetailBreak"),
    /display:\s*block;/,
  );
  assert.doesNotMatch(
    mobileStyles,
    /\.timelineDetail\s*\{[\s\S]*?display:\s*block/,
  );
  assert.match(pageSource, /className=\{styles\.timelineTitle\}/);
  assert.match(pageSource, /styles\.timelineDetailBreak/);
  assert.match(companySource, /year:\s*"2010"[\s\S]*?detailLineBreak:\s*true/);
  assert.match(companySource, /year:\s*"2011"[\s\S]*?detailLineBreak:\s*true/);
  assert.match(companySource, /year:\s*"2015"[\s\S]*?detailPrefix:\s*" \/ "/);
});

test("about info section fills narrow screens", async () => {
  const stylesSource = await readFile(stylesUrl, "utf8");
  const tabletStart = stylesSource.indexOf("@media (max-width: 1080px)");
  const channelStart = stylesSource.indexOf(
    "@media (max-width: 1137px)",
    tabletStart,
  );
  const mobileStart = stylesSource.indexOf("@media (max-width: 639px)");
  const compactMobileStart = stylesSource.indexOf(
    "@media (max-width: 480px)",
    mobileStart,
  );
  const tabletStyles = stylesSource.slice(tabletStart, channelStart);
  const mobileStyles = stylesSource.slice(mobileStart, compactMobileStart);

  assert.notEqual(tabletStart, -1);
  assert.notEqual(channelStart, -1);
  assert.notEqual(mobileStart, -1);
  assert.notEqual(compactMobileStart, -1);

  assert.match(cssBlock(tabletStyles, ".infoContent {"), /width:\s*100%;/);
  assert.match(cssBlock(tabletStyles, ".mapWrap {"), /width:\s*100%;/);
  assert.match(
    cssBlock(tabletStyles, ".mapWrap {"),
    /justify-self:\s*stretch;/,
  );

  assert.match(
    cssBlock(mobileStyles, ".infoGrid {"),
    /justify-items:\s*stretch;/,
  );
  assert.match(cssBlock(mobileStyles, ".infoContent {"), /width:\s*100%;/);
  assert.match(cssBlock(mobileStyles, ".mapWrap {"), /width:\s*100%;/);
});
