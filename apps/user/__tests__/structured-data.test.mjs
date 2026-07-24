import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const structuredDataModuleUrl = new URL(
  "../app/_content/structured-data.ts",
  import.meta.url,
).href;
const companyModuleUrl = new URL(
  "../app/_content/company.ts",
  import.meta.url,
).href;
const structuredDataPath = new URL(
  "../app/_content/structured-data.ts",
  import.meta.url,
);

const staticPageSources = {
  about: new URL("../app/(site)/about/page.tsx", import.meta.url),
  blog: new URL("../app/(site)/blog/page.tsx", import.meta.url),
  complaint: new URL("../app/(site)/complaint/page.tsx", import.meta.url),
  faq: new URL("../app/(site)/faq/page.tsx", import.meta.url),
  home: new URL("../app/(site)/page.tsx", import.meta.url),
  notice: new URL("../app/(site)/notice/page.tsx", import.meta.url),
  order: new URL("../app/(site)/order/page.tsx", import.meta.url),
  portfolio: new URL("../app/(site)/portfolio/page.tsx", import.meta.url),
  privacyCollection: new URL(
    "../app/(site)/privacy-collection/page.tsx",
    import.meta.url,
  ),
  privacyPolicy: new URL(
    "../app/(site)/privacy-policy/page.tsx",
    import.meta.url,
  ),
  reviews: new URL("../app/(site)/reviews/page.tsx", import.meta.url),
};

const detailPageSources = {
  blog: new URL("../app/(site)/blog/[slug]/page.tsx", import.meta.url),
  notice: new URL("../app/(site)/notice/[id]/page.tsx", import.meta.url),
  portfolio: new URL(
    "../app/(site)/portfolio/[slug]/page.tsx",
    import.meta.url,
  ),
  reviews: new URL("../app/(site)/reviews/[slug]/page.tsx", import.meta.url),
};

const privatePaymentPageSources = [
  new URL("../app/(site)/order/success/page.tsx", import.meta.url),
  new URL("../app/(site)/order/fail/page.tsx", import.meta.url),
  new URL("../app/(site)/linkpay/[id]/page.tsx", import.meta.url),
  new URL("../app/(site)/linkpay/[id]/success/page.tsx", import.meta.url),
  new URL("../app/(site)/linkpay/[id]/fail/page.tsx", import.meta.url),
];

test("structured data helpers centralize site, company, breadcrumb, and FAQ data", async () => {
  const check = `
    import assert from "node:assert/strict";
    const {
      companyProfile,
      companySocialLinks,
    } = await import(${JSON.stringify(companyModuleUrl)});
    const {
      createFaqPageStructuredData,
      createHomeStructuredData,
      createStaticPageStructuredData,
    } = await import(${JSON.stringify(structuredDataModuleUrl)});

    const homeGraph = createHomeStructuredData()["@graph"];
    const homeTypes = homeGraph.map((item) => item["@type"]);

    assert.deepEqual(homeTypes, [
      "Organization",
      "WebSite",
      "WebPage",
      "BreadcrumbList",
    ]);

    const organization = homeGraph[0];
    assert.equal(organization["@id"], "https://example.com/#organization");
    assert.equal(organization.name, companyProfile.name);
    assert.equal(organization.url, "https://example.com/");
    assert.equal(organization.logo, "https://example.com/figma-assets/cbrain-logo-main.svg");
    assert.equal(organization.telephone, companyProfile.phone);
    assert.equal(organization.email, companyProfile.email);
    assert.deepEqual(
      organization.sameAs,
      companySocialLinks.map((link) => link.href),
    );
    assert.equal(organization.address.streetAddress, companyProfile.address.streetAddress);
    assert.equal(organization.address.addressLocality, companyProfile.address.locality);
    assert.equal(organization.address.addressRegion, companyProfile.address.region);

    const aboutGraph = createStaticPageStructuredData("about", {
      includeOrganization: true,
      pageType: "AboutPage",
    })["@graph"];
    assert.equal(aboutGraph[0]["@type"], "Organization");
    assert.equal(aboutGraph[1]["@type"], "AboutPage");
    assert.equal(aboutGraph[1].url, "https://example.com/about");
    assert.equal(aboutGraph[2].itemListElement[0].item, "https://example.com/");
    assert.equal(aboutGraph[2].itemListElement[1].item, "https://example.com/about");

    const faqGraph = createFaqPageStructuredData()["@graph"];
    const faqPage = faqGraph.find((item) => item["@type"] === "FAQPage");

    assert.ok(faqPage);
    assert.ok(faqPage.mainEntity.length >= 20);
    assert.equal(faqPage.mainEntity[0]["@type"], "Question");
    assert.equal(faqPage.mainEntity[0].acceptedAnswer["@type"], "Answer");
    assert.ok(faqPage.mainEntity[0].name.length > 5);
    assert.ok(faqPage.mainEntity[0].acceptedAnswer.text.length > 20);
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: {
        ...process.env,
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        NODE_NO_WARNINGS: "1",
      },
    },
  );

  const structuredDataSource = await readFile(structuredDataPath, "utf8");

  assert.match(structuredDataSource, /companyProfile/);
  assert.match(structuredDataSource, /companySocialLinks/);
  assert.doesNotMatch(structuredDataSource, /const organizationProfile/);
});

test("detail structured data helpers create dynamic article and creative work nodes", async () => {
  const check = `
    import assert from "node:assert/strict";
    const {
      createArticleStructuredData,
      createBlogPostingStructuredData,
      createCreativeWorkStructuredData,
    } = await import(${JSON.stringify(structuredDataModuleUrl)});

    const blogPosting = createBlogPostingStructuredData({
      authorName: "씨브레인",
      dateModified: "2026-10-28T00:00:00+09:00",
      datePublished: "2026-10-28T00:00:00+09:00",
      description: "블로그 설명입니다.",
      headline: "블로그 제목",
      imagePath: "/figma-assets/blog-brochure.png",
      section: "인쇄 실무팁",
      urlPath: "/blog/catalog-coating-guide",
    });

    assert.equal(blogPosting["@graph"][0]["@type"], "BlogPosting");
    assert.equal(blogPosting["@graph"][0].mainEntityOfPage, "https://example.com/blog/catalog-coating-guide");
    assert.equal(blogPosting["@graph"][0].image, "https://example.com/figma-assets/blog-brochure.png");
    assert.equal(blogPosting["@graph"][0].publisher["@id"], "https://example.com/#organization");

    const noticeArticle = createArticleStructuredData({
      authorName: "씨브레인",
      datePublished: "2026-07-23",
      description: "공지 설명입니다.",
      headline: "공지 제목",
      section: "notice",
      urlPath: "/notice/notice-1",
    });

    assert.equal(noticeArticle["@graph"][0]["@type"], "Article");
    assert.equal(noticeArticle["@graph"][0].headline, "공지 제목");
    assert.equal(noticeArticle["@graph"][0].mainEntityOfPage, "https://example.com/notice/notice-1");

    const creativeWork = createCreativeWorkStructuredData({
      authorName: "씨브레인",
      category: "브로슈어 · 카탈로그",
      description: "포트폴리오 설명입니다.",
      imagePath: "/figma-assets/portfolio-shinlim.png",
      name: "신림산업㈜ 제품 카탈로그 A4 16P",
      urlPath: "/portfolio/shinlim-product-catalog",
    });

    assert.equal(creativeWork["@graph"][0]["@type"], "CreativeWork");
    assert.equal(creativeWork["@graph"][0].creator.name, "씨브레인");
    assert.equal(creativeWork["@graph"][0].image, "https://example.com/figma-assets/portfolio-shinlim.png");
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: {
        ...process.env,
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        NODE_NO_WARNINGS: "1",
      },
    },
  );
});

test("public pages render JSON-LD through the shared script component", async () => {
  const expectedStaticPageKeys = {
    about: "about",
    blog: "blog",
    complaint: "complaint",
    faq: "faq",
    home: "home",
    notice: "notice",
    order: "order",
    portfolio: "portfolio",
    privacyCollection: "privacyCollection",
    privacyPolicy: "privacyPolicy",
    reviews: "reviews",
  };

  await Promise.all(
    Object.entries(expectedStaticPageKeys).map(async ([sourceKey, pageKey]) => {
      const source = await readFile(staticPageSources[sourceKey], "utf8");

      assert.match(source, /JsonLdScript/);
      if (pageKey === "home") {
        assert.match(source, /createHomeStructuredData/);
      } else {
        assert.match(source, new RegExp(`"${pageKey}"`));
      }
      assert.doesNotMatch(source, /type="application\/ld\+json"/);
      assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
    }),
  );

  const detailSources = await Promise.all(
    Object.values(detailPageSources).map((sourcePath) =>
      readFile(sourcePath, "utf8"),
    ),
  );

  for (const source of detailSources) {
    assert.match(source, /JsonLdScript/);
    assert.doesNotMatch(source, /function stringifyJsonLd/);
    assert.doesNotMatch(source, /type="application\/ld\+json"/);
  }
});

test("private payment pages remain noindex-only without JSON-LD", async () => {
  await Promise.all(
    privatePaymentPageSources.map(async (pagePath) => {
      const source = await readFile(pagePath, "utf8");

      assert.doesNotMatch(source, /JsonLdScript/);
      assert.doesNotMatch(source, /structured-data/);
      assert.doesNotMatch(source, /application\/ld\+json/);
    }),
  );
});
