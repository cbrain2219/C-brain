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
  privacyCollection: new URL(
    "../app/(site)/privacy-collection/page.tsx",
    import.meta.url,
  ),
  privacyPolicy: new URL(
    "../app/(site)/privacy-policy/page.tsx",
    import.meta.url,
  ),
  refundPolicy: new URL(
    "../app/(site)/refund-policy/page.tsx",
    import.meta.url,
  ),
  reviews: new URL("../app/(site)/reviews/page.tsx", import.meta.url),
  terms: new URL("../app/(site)/terms/page.tsx", import.meta.url),
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
      ["terms", "termsSeo"],
      ["privacyPolicy", "privacyPolicySeo"],
      ["privacyCollection", "privacyCollectionSeo"],
      ["refundPolicy", "refundPolicySeo"],
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
      assert.equal(metadata.openGraph.images[0].url.pathname, "/opengraph-image.png");
      assert.equal(metadata.openGraph.images[0].width, 4800);
      assert.equal(metadata.openGraph.images[0].height, 3200);
      assert.equal(metadata.twitter.card, "summary_large_image");
      assert.equal(metadata.twitter.images[0].url.pathname, "/opengraph-image.png");
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

test("social images use the matching Vercel deployment URL", async () => {
  const check = `
    import assert from "node:assert/strict";
    const { createRootMetadata } = await import(${JSON.stringify(seoModuleUrl)});
    const metadata = createRootMetadata();

    assert.equal(metadata.openGraph.url.origin, "https://cbrain.kr");
    assert.equal(metadata.openGraph.images[0].url.origin, process.env.EXPECTED_IMAGE_ORIGIN);
    assert.equal(metadata.twitter.images[0].url.origin, process.env.EXPECTED_IMAGE_ORIGIN);
  `;
  const scenarios = [
    {
      expectedOrigin: "https://user-ten-ochre.vercel.app",
      vercelEnv: "production",
      vercelProjectProductionUrl: "user-ten-ochre.vercel.app",
      vercelUrl: "user-production-hash.vercel.app",
    },
    {
      expectedOrigin: "https://user-feature-hash.vercel.app",
      vercelEnv: "preview",
      vercelProjectProductionUrl: "user-ten-ochre.vercel.app",
      vercelUrl: "user-feature-hash.vercel.app",
    },
  ];

  await Promise.all(
    scenarios.map(
      ({ expectedOrigin, vercelEnv, vercelProjectProductionUrl, vercelUrl }) =>
        execFileAsync(
          process.execPath,
          [
            "--experimental-strip-types",
            "--input-type=module",
            "--eval",
            check,
          ],
          {
            env: {
              ...process.env,
              EXPECTED_IMAGE_ORIGIN: expectedOrigin,
              NEXT_PUBLIC_SITE_URL: "https://cbrain.kr",
              VERCEL_ENV: vercelEnv,
              VERCEL_PROJECT_PRODUCTION_URL: vercelProjectProductionUrl,
              VERCEL_URL: vercelUrl,
            },
          },
        ),
    ),
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
    privacyCollection: "privacyCollection",
    privacyPolicy: "privacyPolicy",
    refundPolicy: "refundPolicy",
    reviews: "reviews",
    terms: "terms",
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
