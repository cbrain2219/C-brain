import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const seoModuleUrl = new URL("../app/_content/seo.ts", import.meta.url).href;

const pageSources = {
  about: new URL("../app/(site)/about/page.tsx", import.meta.url),
  blog: new URL("../app/(site)/blog/page.tsx", import.meta.url),
  complaint: new URL("../app/(site)/complaint/page.tsx", import.meta.url),
  faq: new URL("../app/(site)/faq/page.tsx", import.meta.url),
  home: new URL("../app/(site)/page.tsx", import.meta.url),
  notice: new URL("../app/(site)/notice/page.tsx", import.meta.url),
  orderLayout: new URL("../app/(site)/order/layout.tsx", import.meta.url),
  portfolio: new URL("../app/(site)/portfolio/page.tsx", import.meta.url),
  reviews: new URL("../app/(site)/reviews/page.tsx", import.meta.url),
};

const noIndexPageSources = [
  new URL("../app/(site)/linkpay/[id]/page.tsx", import.meta.url),
  new URL(
    "../app/(site)/payment/result/[publicToken]/page.tsx",
    import.meta.url,
  ),
];

test("static page metadata is configured from one SEO content module", async () => {
  const check = `
    import assert from "node:assert/strict";
    const seoModule = await import(${JSON.stringify(seoModuleUrl)});
    const { createPageMetadata, pageSeo, siteSeo } = seoModule;

    const expectedEntries = [
      ["home", "homeSeo"],
      ["about", "aboutSeo"],
      ["portfolio", "portfolioSeo"],
      ["reviews", "reviewsSeo"],
      ["blog", "blogSeo"],
      ["notice", "noticeSeo"],
      ["faq", "faqSeo"],
      ["order", "orderSeo"],
      ["complaint", "complaintSeo"],
      ["privacyPolicy", "privacyPolicySeo"],
      ["privacyCollection", "privacyCollectionSeo"],
    ];
    const expectedKeys = expectedEntries.map(([key]) => key);

    assert.equal(siteSeo.name, "C-Brain");
    assert.ok(siteSeo.defaultDescription.length > 20);
    assert.deepEqual(Object.keys(pageSeo), expectedKeys);

    for (const [key, variableName] of expectedEntries) {
      const entry = pageSeo[key];
      const metadata = createPageMetadata(key);

      assert.equal(entry, seoModule[variableName]);
      assert.equal(metadata.title.absolute, entry.title);
      assert.equal(metadata.description, entry.description);
      assert.deepEqual(metadata.keywords, entry.keywords);
      assert.equal(metadata.alternates.canonical.pathname, entry.path);
      assert.equal(metadata.openGraph.siteName, siteSeo.name);
      assert.equal(metadata.openGraph.locale, "ko_KR");
      assert.equal(metadata.openGraph.url.pathname, entry.path);
      assert.equal(metadata.twitter.card, "summary");
    }
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  );
});

test("public static pages import metadata by key instead of inlining copy", async () => {
  const expectedPageKeys = {
    about: "about",
    blog: "blog",
    complaint: "complaint",
    faq: "faq",
    home: "home",
    notice: "notice",
    orderLayout: "order",
    portfolio: "portfolio",
    reviews: "reviews",
  };

  await Promise.all(
    Object.entries(expectedPageKeys).map(async ([sourceKey, pageKey]) => {
      const source = await readFile(pageSources[sourceKey], "utf8");

      assert.match(source, /createPageMetadata/);
      assert.match(source, new RegExp(`createPageMetadata\\("${pageKey}"\\)`));
      assert.doesNotMatch(source, /siteName: "C-Brain"/);
    }),
  );
});

test("private payment routes use noindex metadata", async () => {
  const check = `
    import assert from "node:assert/strict";
    const { createNoIndexMetadata } = await import(${JSON.stringify(seoModuleUrl)});

    const metadata = createNoIndexMetadata({
      description: "테스트 결제 페이지입니다.",
      path: "/order/fail",
      title: "결제 실패 | C-Brain",
    });

    assert.equal(metadata.title.absolute, "결제 실패 | C-Brain");
    assert.equal(metadata.description, "테스트 결제 페이지입니다.");
    assert.equal(metadata.robots.index, false);
    assert.equal(metadata.robots.follow, false);
    assert.equal(metadata.alternates.canonical.pathname, "/order/fail");
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  );

  await Promise.all(
    noIndexPageSources.map(async (pagePath) => {
      const source = await readFile(pagePath, "utf8");

      assert.match(source, /createNoIndexMetadata/);
      assert.doesNotMatch(source, /robots: \{/);
    }),
  );
});
