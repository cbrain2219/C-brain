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
const landingPortfolioPath = new URL(
  "../app/_components/PortfolioSection.tsx",
  import.meta.url,
);
const landingStylesPath = new URL("../app/page.module.css", import.meta.url);
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

test("portfolio list and landing render a clear empty state", async () => {
  const [gallery, landingPortfolio, listStyles, landingStyles] =
    await Promise.all([
      readFile(galleryPath, "utf8"),
      readFile(landingPortfolioPath, "utf8"),
      readFile(stylesPath, "utf8"),
      readFile(landingStylesPath, "utf8"),
    ]);

  assert.match(gallery, /activeItems\.length > 0/);
  assert.match(landingPortfolio, /items\.length > 0/);
  assert.match(gallery, /등록된 포트폴리오가 없습니다\./);
  assert.match(landingPortfolio, /등록된 포트폴리오가 없습니다\./);
  assert.match(listStyles, /\.emptyState/);
  assert.match(landingStyles, /\.contentEmptyState/);
});

test("portfolio loaders keep fixtures for missing env and fail closed on query errors", async () => {
  const [listPage, detailPage, landingPortfolio] = await Promise.all([
    readFile(listPagePath, "utf8"),
    readFile(detailPagePath, "utf8"),
    readFile(landingPortfolioPath, "utf8"),
  ]);

  assert.match(listPage, /if \(!supabase\)[\s\S]*return portfolioItems/);
  assert.match(detailPage, /if \(!supabase\)[\s\S]*return portfolioItems/);
  assert.match(
    landingPortfolio,
    /if \(!supabase\)[\s\S]*return featuredPortfolioItems/,
  );

  for (const source of [listPage, detailPage, landingPortfolio]) {
    assert.match(source, /catch \(error\)/);
    assert.match(source, /console\.error\(/);
    assert.match(source, /return \[\]/);
  }
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
  assert.doesNotMatch(detailPage, /name="cbrain-author"/);
  assert.doesNotMatch(icons, /cbrain-author/);

  const authorIconRule = detailStyles.match(/\.authorIcon\s*\{([^}]*)\}/)?.[1];
  assert.ok(authorIconRule);
  assert.doesNotMatch(authorIconRule, /\b(?:width|height)\s*:/);
});
