import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import process from "node:process";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const seoModuleUrl = new URL("../app/_content/seo.ts", import.meta.url).href;
const appFaviconUrl = new URL("../app/favicon.ico", import.meta.url);
const publicFaviconUrl = new URL(
  "../public/cbrain-favicon.ico",
  import.meta.url,
);

const pageSources = {
  about: new URL("../app/(site)/about/page.tsx", import.meta.url),
  blog: new URL("../app/(site)/blog/page.tsx", import.meta.url),
  complaint: new URL("../app/(site)/report/page.tsx", import.meta.url),
  faq: new URL("../app/(site)/faq-guide/page.tsx", import.meta.url),
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
  reviews: new URL("../app/(site)/customer-review/page.tsx", import.meta.url),
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
    assert.equal(siteSeo.url, "https://www.cbrain.kr");
    assert.ok(siteSeo.defaultDescription.length > 20);
    assert.equal(
      pageSeo.home.title,
      "브로슈어·카탈로그·홍보물 디자인·제작 전문 | 씨브레인",
    );
    assert.equal(
      pageSeo.home.description,
      "2000년 설립 4,000건+ 실적의 홍보물 디자인·제작 전문기업 씨브레인. 브로슈어·카탈로그·리플렛·패키지·포스터 등 기업 홍보물을 기획·디자인·인쇄·이북까지 원스톱 제작합니다.",
    );
    assert.equal(
      pageSeo.about.title,
      "2000년 설립 홍보물 디자인·제작 전문기업 | 씨브레인",
    );
    assert.equal(
      pageSeo.about.description,
      "2000년 설립, 누적 4,000건+ 프로젝트를 수행한 홍보물 디자인 전문기업입니다. 코리아 나라장터엑스포 등 다양한 제작 경험을 바탕으로 1:1 전담 디자이너가 기획부터 제작까지 진행합니다.",
    );
    assert.equal(
      pageSeo.blog.title,
      "홍보물 디자인·제작 노하우 | 씨브레인 블로그",
    );
    assert.equal(
      pageSeo.blog.description,
      "씨브레인이 직접 전하는 브로슈어·카탈로그 등 홍보물 디자인·제작·인쇄 노하우와 실무 팁을 블로그에서 확인하세요.",
    );
    assert.equal(
      pageSeo.complaint.title,
      "고객센터·불편 접수 | 씨브레인",
    );
    assert.equal(
      pageSeo.complaint.description,
      "씨브레인 이용 중 불편사항이나 홍보물 제작 관련 문의를 접수해주세요. 남겨주신 의견 확인 후 신속하게 안내해드립니다.",
    );
    assert.equal(
      pageSeo.faq.title,
      "홍보물 제작 FAQ·가이드 | 씨브레인",
    );
    assert.equal(
      pageSeo.faq.description,
      "홍보물 제작 기간, 비용, 최소 수량, 디자인, 인쇄, 결제와 배송까지 제작 전 자주 묻는 질문과 실무 정보를 확인하세요.",
    );
    assert.equal(pageSeo.notice.title, "공지사항 | 씨브레인");
    assert.equal(
      pageSeo.notice.description,
      "씨브레인의 서비스 변경, 휴무 안내, 이벤트, 수상 소식 등 주요 공지사항을 확인하세요.",
    );
    assert.equal(
      pageSeo.portfolio.title,
      "홍보물 디자인·제작 사례 | 씨브레인 포트폴리오",
    );
    assert.equal(
      pageSeo.portfolio.description,
      "브로슈어, 카탈로그, 리플렛, 패키지 등 다양한 기업·기관 홍보물의 실제 디자인·제작 사례를 확인하세요.",
    );
    assert.equal(
      pageSeo.reviews.title,
      "홍보물 제작 고객후기·리뷰 | 씨브레인",
    );
    assert.equal(
      pageSeo.reviews.description,
      "다양한 기업·기관이 남긴 브로슈어·카탈로그 등 홍보물 제작 후기를 확인하세요. 실제 고객의 제작 경험과 만족도를 살펴볼 수 있습니다.",
    );
    assert.equal(
      pageSeo.order.title,
      "홍보물 제작 견적·비용 안내 | 씨브레인",
    );
    assert.equal(
      pageSeo.order.description,
      "브로슈어·카탈로그 등 홍보물 디자인부터 인쇄, 견적, 결제, 전국 배송까지 한 번에 진행하세요. 제작 문의부터 1:1 상담까지 빠르게 안내해드립니다.",
    );
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

    assert.equal(metadata.openGraph.url.origin, "https://www.cbrain.kr");
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
              NEXT_PUBLIC_SITE_URL: "https://www.cbrain.kr",
              VERCEL_ENV: vercelEnv,
              VERCEL_PROJECT_PRODUCTION_URL: vercelProjectProductionUrl,
              VERCEL_URL: vercelUrl,
            },
          },
        ),
    ),
  );
});

test("production canonical URLs ignore deployment-host overrides", async () => {
  const check = `
    import assert from "node:assert/strict";
    const {
      createRootMetadata,
      getPageUrl,
      getSiteUrl,
    } = await import(${JSON.stringify(seoModuleUrl)});
    const metadata = createRootMetadata();

    assert.equal(getSiteUrl().origin, "https://www.cbrain.kr");
    assert.equal(getPageUrl("/sitemap.xml").href, "https://www.cbrain.kr/sitemap.xml");
    assert.equal(metadata.metadataBase.origin, "https://www.cbrain.kr");
    assert.equal(metadata.openGraph.url.origin, "https://www.cbrain.kr");
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: {
        ...process.env,
        NEXT_PUBLIC_SITE_URL: "https://c-brain-user.vercel.app",
        NODE_NO_WARNINGS: "1",
        VERCEL_ENV: "production",
      },
    },
  );
});

test("root metadata includes the Naver site verification token", async () => {
  const check = `
    import assert from "node:assert/strict";
    const { createRootMetadata } = await import(${JSON.stringify(seoModuleUrl)});
    const metadata = createRootMetadata();

    assert.deepEqual(metadata.verification.other, {
      "naver-site-verification": "76713c667f883801426f306acc098d7a0bbee337",
    });
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  );
});

test("root metadata serves the site favicon from an explicit public asset", async () => {
  const check = `
    import assert from "node:assert/strict";
    const { createRootMetadata } = await import(${JSON.stringify(seoModuleUrl)});
    const metadata = createRootMetadata();

    assert.deepEqual(metadata.icons, {
      icon: "/cbrain-favicon.ico",
    });
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  );
});

test("the favicon remains opt-out capable for route metadata", async () => {
  await assert.rejects(access(appFaviconUrl), { code: "ENOENT" });
  await access(publicFaviconUrl);
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

test("noindex metadata can include social sharing cards", async () => {
  const check = `
    import assert from "node:assert/strict";
    const { createNoIndexMetadata } = await import(${JSON.stringify(seoModuleUrl)});

    const metadata = createNoIndexMetadata({
      description: "후기 공유 설명",
      includeSocial: true,
      path: "/reviews/request",
      title: "후기 남기기 | 씨브레인",
    });

    assert.equal(metadata.openGraph.title, "후기 남기기 | 씨브레인");
    assert.equal(metadata.openGraph.description, "후기 공유 설명");
    assert.equal(metadata.openGraph.url.pathname, "/reviews/request");
    assert.equal(
      metadata.openGraph.images[0].url.pathname,
      "/opengraph-image.png",
    );
    assert.equal(metadata.twitter.card, "summary_large_image");
    assert.equal(metadata.twitter.title, "후기 남기기 | 씨브레인");
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  );
});
