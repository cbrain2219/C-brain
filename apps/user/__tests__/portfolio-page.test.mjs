import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentPath = new URL(
  "../app/_content/portfolio.ts",
  import.meta.url,
);
const galleryPath = new URL(
  "../app/(site)/portfolio/PortfolioGallery.tsx",
  import.meta.url,
);
const listPagePath = new URL(
  "../app/(site)/portfolio/page.tsx",
  import.meta.url,
);
const homePagePath = new URL(
  "../app/(site)/page.tsx",
  import.meta.url,
);
const landingPortfolioPath = new URL(
  "../app/_components/PortfolioSection.tsx",
  import.meta.url,
);
const detailPagePath = new URL(
  "../app/(site)/portfolio/[slug]/page.tsx",
  import.meta.url,
);
const detailStylesPath = new URL(
  "../app/(site)/portfolio/[slug]/page.module.css",
  import.meta.url,
);
const iconPath = new URL("../components/Icon.tsx", import.meta.url);
const stylesPath = new URL(
  "../app/(site)/portfolio/page.module.css",
  import.meta.url,
);

test("portfolio category hover excludes the active tab", async () => {
  const styles = await readFile(stylesPath, "utf8");

  assert.match(
    styles,
    /\.categoryButton:not\(\.categoryButtonActive\):hover/,
  );
  assert.doesNotMatch(styles, /\.categoryButton:hover/);
});

test("portfolio active category underline stays visible while overlapping the rail", async () => {
  const styles = await readFile(stylesPath, "utf8");
  const categoryNavStyle = styles.match(/\.categoryNav\s*\{[\s\S]*?\}/)?.[0];

  assert.match(
    categoryNavStyle ?? "",
    /background:\s*linear-gradient\(var\(--landing-gray-100\), var\(--landing-gray-100\)\)[\s\S]*center bottom\s*\/\s*100% 1px no-repeat;/,
  );
  assert.doesNotMatch(categoryNavStyle ?? "", /border-bottom:/);

  assert.match(
    styles,
    /\.categoryButtonActive::after\s*\{[\s\S]*?bottom:\s*0;/,
  );
});

test("portfolio work content keeps a 32px gap up to its 1080px max width", async () => {
  const styles = await readFile(stylesPath, "utf8");
  const workInnerStyle = styles.match(/\.workInner\s*\{[\s\S]*?\}/)?.[0];

  assert.match(workInnerStyle ?? "", /gap:\s*32px;/);
});

test("portfolio grid keeps three columns from the 960px breakpoint", async () => {
  const [gallery, styles] = await Promise.all([
    readFile(galleryPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);
  const threeColumnStart = styles.indexOf("@media (min-width: 960px)");
  const nextBreakpointStart = styles.indexOf(
    "@media (min-width: 980px)",
    threeColumnStart,
  );
  const threeColumnStyles = styles.slice(
    threeColumnStart,
    nextBreakpointStart,
  );

  assert.notEqual(threeColumnStart, -1);
  assert.notEqual(nextBreakpointStart, -1);
  assert.match(
    threeColumnStyles,
    /\.portfolioGrid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/,
  );
  assert.match(
    gallery,
    /sizes="\(min-width: 1120px\) 347px, \(min-width: 960px\) calc\(33\.333vw - 26\.667px\), \(min-width: 640px\) calc\(50vw - 30px\), calc\(100vw - 40px\)"/,
  );
});

test("portfolio hero keeps frame padding without a fixed hero height", async () => {
  const styles = await readFile(stylesPath, "utf8");
  const baseHero = styles.match(/\.hero\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const baseHeroContent = styles.match(/\.heroContent\s*\{[\s\S]*?\}/)?.[0] ?? "";
  const foldStart = styles.indexOf("@media (min-width: 640px)");
  const desktopStart = styles.indexOf("@media (min-width: 1080px)");
  const pcStart = styles.indexOf("@media (min-width: 1440px)", desktopStart);

  assert.notEqual(foldStart, -1);
  assert.notEqual(desktopStart, -1);
  assert.notEqual(pcStart, -1);

  const foldStyles = styles.slice(foldStart, desktopStart);
  const desktopStyles = styles.slice(desktopStart, pcStart);
  const pcStyles = styles.slice(pcStart);

  assert.doesNotMatch(baseHero, /min-height:/);
  assert.match(
    baseHeroContent,
    /padding:\s*var\(--site-page-top-offset, 124px\) 0 72px;/,
  );
  assert.doesNotMatch(foldStyles, /\.hero\s*\{[\s\S]*?min-height:/);
  assert.match(
    desktopStyles,
    /\.heroContent\s*\{[\s\S]*?width:\s*min\(100%, 1080px\);[\s\S]*?padding:\s*var\(--site-page-top-offset, 124px\) 80px 72px;/,
  );
  assert.match(
    pcStyles,
    /\.heroContent\s*\{[\s\S]*?width:\s*1360px;[\s\S]*?padding:\s*var\(--site-page-top-offset, 124px\) 0 104px;/,
  );
});

test("portfolio landing tabs filter cards on click", async () => {
  const landingPortfolio = await readFile(landingPortfolioPath, "utf8");

  assert.match(landingPortfolio, /"use client";/);
  assert.match(landingPortfolio, /useState<PortfolioCategoryId>/);
  assert.match(landingPortfolio, /handleCategoryClick/);
  assert.match(landingPortfolio, /setActiveCategoryId\(categoryId\)/);
  assert.match(landingPortfolio, /aria-pressed=\{isActive\}/);
  assert.match(landingPortfolio, /activePortfolioItems\.map/);
});

test("portfolio detail returns to the landing section when opened from the landing page", async () => {
  const [content, detailPage, homePage, landingPortfolio] = await Promise.all([
    readFile(contentPath, "utf8"),
    readFile(detailPagePath, "utf8"),
    readFile(homePagePath, "utf8"),
    readFile(landingPortfolioPath, "utf8"),
  ]);

  assert.match(
    content,
    /export const landingPortfolioCategorySearchParam = "portfolioCategory";/,
  );
  assert.match(content, /type PortfolioDetailSource = "landing"/);
  assert.match(content, /return `\/\?\$\{landingPortfolioCategorySearchParam\}=\$\{categoryId\}#portfolio`;/);
  assert.match(
    landingPortfolio,
    /getPortfolioDetailHref\(item, activeCategoryId, "landing"\)/,
  );
  assert.match(homePage, /getPortfolioCategoryIdFromValue/);
  assert.match(homePage, /landingPortfolioCategorySearchParam/);
  assert.match(
    homePage,
    /<PortfolioSection initialCategoryId=\{initialPortfolioCategoryId\} \/>/,
  );
  assert.match(landingPortfolio, /initialCategoryId\?: PortfolioCategoryId/);
  assert.match(landingPortfolio, /landingPortfolioScrollStorageKey/);
  assert.match(landingPortfolio, /window\.sessionStorage\.setItem/);
  assert.match(landingPortfolio, /try \{[\s\S]*?window\.sessionStorage\.setItem/);
  assert.match(landingPortfolio, /try \{[\s\S]*?window\.sessionStorage\.getItem/);
  assert.match(landingPortfolio, /try \{[\s\S]*?window\.sessionStorage\.removeItem/);
  assert.match(landingPortfolio, /catch \{/);
  assert.match(landingPortfolio, /window\.scrollTo/);
  assert.match(landingPortfolio, /onClick=\{saveLandingPortfolioScroll\}/);
  assert.match(detailPage, /from\?: string \| string\[\]/);
  assert.match(
    detailPage,
    /getPortfolioDetailSourceFromValue\(\s*resolvedSearchParams\?\.from,\s*\)/,
  );
  assert.match(detailPage, /getPortfolioListHref\(listCategoryId, detailSource\)/);
});

test("portfolio cards expose semantic project markup and descriptive alt text", async () => {
  const content = await readFile(contentPath, "utf8");
  const gallery = await readFile(galleryPath, "utf8");
  const landingPortfolio = await readFile(landingPortfolioPath, "utf8");

  assert.match(content, /imageAlt: string/);
  assert.doesNotMatch(content, /export function getPortfolioImageAlt/);
  assert.doesNotMatch(content, /function createDetailImages/);
  assert.doesNotMatch(content, /detailImageSources/);
  assert.match(gallery, /<ul className=\{styles\.portfolioGrid\}>/);
  assert.match(gallery, /<li[^>]*>/);
  assert.match(gallery, /<article>/);
  assert.match(gallery, /<figure[^>]*>/);
  assert.match(gallery, /<figcaption[^>]*>/);
  assert.match(gallery, /alt=\{item\.imageAlt\}/);
  assert.match(landingPortfolio, /alt=\{item\.imageAlt\}/);
});

test("portfolio filtered list keeps a clear empty state", async () => {
  const [gallery, listStyles] = await Promise.all([
    readFile(galleryPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(gallery, /activeItems\.length > 0/);
  assert.match(gallery, /등록된 포트폴리오가 없습니다\./);
  assert.match(listStyles, /\.emptyState/);
});

test("portfolio landing, list, and detail stay fixture-only", async () => {
  const [listPage, detailPage, landingPortfolio] = await Promise.all([
    readFile(listPagePath, "utf8"),
    readFile(detailPagePath, "utf8"),
    readFile(landingPortfolioPath, "utf8"),
  ]);

  for (const source of [listPage, detailPage, landingPortfolio]) {
    assert.doesNotMatch(source, /@repo\/supabase/);
    assert.doesNotMatch(source, /createUserSupabaseClient/);
    assert.doesNotMatch(source, /listPublishedPortfolioItems/);
    assert.doesNotMatch(source, /mapPortfolioRows/);
  }

  assert.match(listPage, /items=\{portfolioItems\}/);
  assert.match(landingPortfolio, /activePortfolioItems\.map/);
  assert.match(detailPage, /getPortfolioDetailBySlug\(slug\)/);
  assert.match(detailPage, /portfolioItems\.map\(\(item\) =>/);
});

test("portfolio detail metadata and related cards reuse representative image semantics", async () => {
  const detailPage = await readFile(detailPagePath, "utf8");

  assert.match(detailPage, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(
    detailPage,
    /new URL\(`\/portfolio\/\$\{item\.slug\}`, siteUrl\)/,
  );
  assert.match(detailPage, /alternates:/);
  assert.match(detailPage, /canonical: canonicalUrl/);
  assert.match(detailPage, /new URL\(item\.image, siteUrl\)/);
  assert.match(detailPage, /alt: item\.imageAlt/);
  assert.equal(
    detailPage.match(/images: socialImage \? \[socialImage\] : undefined/g)
      ?.length,
    2,
  );
  assert.match(detailPage, /<ul className=\{styles\.relatedList\}>/);
  assert.match(detailPage, /<li[^>]*>/);
  assert.match(detailPage, /<article>/);
  assert.match(detailPage, /<figure[^>]*>/);
  assert.match(detailPage, /<figcaption[^>]*>/);
  assert.match(detailPage, /alt=\{relatedItem\.imageAlt\}/);
});

test("portfolio detail body is associated with its heading and images", async () => {
  const detailPage = await readFile(detailPagePath, "utf8");
  const detailStyles = await readFile(detailStylesPath, "utf8");
  const icons = await readFile(iconPath, "utf8");

  assert.match(detailPage, /<article className=\{styles\.detailPage\}>/);
  assert.match(detailPage, /<header className=\{styles\.detailHeader\}>/);
  assert.match(detailPage, /<h1 id="portfolio-detail-title">/);
  assert.match(
    detailPage,
    /<section[\s\S]*aria-labelledby="portfolio-detail-title"[\s\S]*className=\{styles\.detailContent\}/,
  );
  assert.match(
    detailPage,
    /<figure className=\{styles\.detailImageFrame\} key=\{image\.src\}>/,
  );
  assert.match(detailPage, /alt=\{image\.alt\}/);
  assert.match(detailPage, /src="\/figma-assets\/cbrain-author\.svg"/);
  assert.match(detailPage, /className=\{styles\.authorIdentity\}/);
  assert.doesNotMatch(detailPage, /name="cbrain-author"/);
  assert.doesNotMatch(icons, /cbrain-author/);

  assert.match(detailStyles, /\.authorLine\s*\{[\s\S]*gap: 8px;/);
  assert.match(detailStyles, /\.authorIdentity\s*\{[\s\S]*gap: 4px;/);

  const authorIconRule = detailStyles.match(/\.authorIcon\s*\{([^}]*)\}/)?.[1];
  assert.ok(authorIconRule);
  assert.doesNotMatch(authorIconRule, /\b(?:width|height)\s*:/);
});

test("portfolio detail spacing is expressed with responsive parent gaps", async () => {
  const [detailPage, detailStyles] = await Promise.all([
    readFile(detailPagePath, "utf8"),
    readFile(detailStylesPath, "utf8"),
  ]);

  assert.match(detailPage, /<div className=\{styles\.detailBody\}>/);
  assert.match(
    detailStyles,
    /\.detailPage\s*\{[\s\S]*?--site-page-top-gap:\s*52px;[\s\S]*?--site-page-top-offset:\s*calc\(\s*var\(--site-header-height\) \+ var\(--site-page-top-gap\)\s*\);/,
  );
  assert.match(
    detailStyles,
    /\.detailInner\s*\{[\s\S]*?padding:\s*var\(--site-page-top-offset\) 0 52px;[\s\S]*?gap:\s*32px;/,
  );
  assert.match(detailStyles, /\.detailBody\s*\{[\s\S]*?gap:\s*20px;/);
  assert.match(detailStyles, /\.detailHeader\s*\{[\s\S]*?gap:\s*20px;/);
  assert.match(
    detailStyles,
    /\.relatedSection\s*\{[\s\S]*?gap:\s*20px;/,
  );
  assert.match(
    detailStyles,
    /\.relatedList\s*\{[\s\S]*?margin:\s*0;[\s\S]*?gap:\s*20px;/,
  );
  assert.match(
    detailStyles,
    /@media \(min-width:\s*1081px\)[\s\S]*?\.detailInner\s*\{[\s\S]*?gap:\s*52px;/,
  );

  for (const selector of [
    "detailContent",
    "backLink",
    "relatedSection",
  ]) {
    const rule = detailStyles.match(
      new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`),
    )?.[1];

    assert.ok(rule);
    assert.doesNotMatch(rule, /margin-top:/);
  }
});
