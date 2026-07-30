import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const fileUrls = {
  about: new URL("../app/(site)/about/page.module.css", import.meta.url),
  app: new URL("../app/page.module.css", import.meta.url),
  blogDetail: new URL(
    "../app/(site)/blog/[slug]/page.module.css",
    import.meta.url,
  ),
  faq: new URL("../app/(site)/faq/page.module.css", import.meta.url),
  linkPay: new URL(
    "../app/(site)/linkpay/[id]/page.module.css",
    import.meta.url,
  ),
  noticeDetail: new URL(
    "../app/(site)/notice/[id]/page.module.css",
    import.meta.url,
  ),
  order: new URL("../app/(site)/order/page.module.css", import.meta.url),
  pageHero: new URL("../components/PageHero.module.css", import.meta.url),
  portfolio: new URL(
    "../app/(site)/portfolio/page.module.css",
    import.meta.url,
  ),
  portfolioDetail: new URL(
    "../app/(site)/portfolio/[slug]/page.module.css",
    import.meta.url,
  ),
  privacy: new URL(
    "../app/(site)/privacy-collection/page.module.css",
    import.meta.url,
  ),
  reviewDetail: new URL(
    "../app/(site)/reviews/[slug]/page.module.css",
    import.meta.url,
  ),
};

async function readStyles() {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(fileUrls).map(async ([name, url]) => [
        name,
        await readFile(url, "utf8"),
      ]),
    ),
  );
}

test("site shell defines the two responsive page-start measurements", async () => {
  const { app } = await readStyles();

  assert.match(app, /--site-header-height:\s*52px;/);
  assert.match(app, /--site-page-top-gap:\s*72px;/);
  assert.match(
    app,
    /--site-page-top-offset:\s*calc\(\s*var\(--site-header-height\) \+ var\(--site-page-top-gap\)\s*\);/,
  );
  assert.match(
    app,
    /@media \(min-width: 1081px\)[\s\S]*?--site-header-height:\s*80px;[\s\S]*?--site-page-top-gap:\s*104px;/,
  );
  assert.match(app, /\.header\s*\{[\s\S]*?height:\s*var\(--site-header-height\);/);
});

test("every public page start consumes the shared responsive spacing", async () => {
  const styles = await readStyles();
  const directOffsetSources = [
    styles.pageHero,
    styles.portfolio,
    styles.about,
    styles.order,
    styles.privacy,
    styles.portfolioDetail,
    styles.linkPay,
  ];

  for (const source of directOffsetSources) {
    assert.match(source, /var\(--site-page-top-offset(?:, 124px)?\)/);
  }

  assert.match(
    styles.app,
    /\.reviewsHeroContent\s*\{[\s\S]*?var\(--site-page-top-offset\)/,
  );
  assert.match(
    styles.app,
    /\.complaintSection\s*\{[\s\S]*?var\(--site-page-top-offset\)/,
  );
  assert.match(
    styles.order,
    /\.resultSection\s*\{[\s\S]*?var\(--site-page-top-offset, 124px\)/,
  );

  assert.match(styles.blogDetail, /var\(--site-header-height, 52px\)/);
  assert.match(
    styles.blogDetail,
    /\.blogDetailInner\s*\{[^}]*padding:\s*52px 0;/s,
  );
  assert.match(styles.noticeDetail, /var\(--site-header-height, 52px\)/);
  assert.match(
    styles.noticeDetail,
    /\.detailInner\s*\{[^}]*max-width:\s*680px;[^}]*padding:\s*52px 20px;/s,
  );
  assert.match(styles.reviewDetail, /var\(--site-header-height, 52px\)/);
  assert.match(
    styles.reviewDetail,
    /\.reviewDetailInner\s*\{[^}]*padding:\s*52px 0;/s,
  );

  assert.match(
    styles.faq,
    /--faq-header-offset:\s*var\(--site-header-height, 52px\);/,
  );
  assert.match(styles.faq, /var\(--site-page-top-gap, 72px\)/);
});
