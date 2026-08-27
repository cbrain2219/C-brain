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
const companyModuleUrl = new URL("../app/_content/company.ts", import.meta.url)
  .href;
const faqModuleUrl = new URL("../app/_content/faqs.ts", import.meta.url).href;
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
  refundPolicy: new URL(
    "../app/(site)/refund-policy/page.tsx",
    import.meta.url,
  ),
  reviews: new URL("../app/(site)/reviews/page.tsx", import.meta.url),
  terms: new URL("../app/(site)/terms/page.tsx", import.meta.url),
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
  new URL("../app/(site)/linkpay/[id]/page.tsx", import.meta.url),
  new URL(
    "../app/(site)/payment/result/[publicToken]/page.tsx",
    import.meta.url,
  ),
];

test("structured data helpers centralize site, company, breadcrumb, and FAQ data", async () => {
  const check = `
    import assert from "node:assert/strict";
    const {
      companyLinks,
      companyProfile,
    } = await import(${JSON.stringify(companyModuleUrl)});
    const {
      createAboutBreadcrumbStructuredData,
      createAboutPageStructuredData,
      createBlogBreadcrumbStructuredData,
      createBlogPageStructuredData,
      createComplaintBreadcrumbStructuredData,
      createComplaintPageStructuredData,
      createFaqBreadcrumbStructuredData,
      createFaqPageStructuredData,
      createHomeStructuredData,
      createNoticeBreadcrumbStructuredData,
      createNoticePageStructuredData,
      createOrderBreadcrumbStructuredData,
      createOrderOfferCatalogStructuredData,
      createOrderPageStructuredData,
      createPortfolioBreadcrumbStructuredData,
      createPortfolioPageStructuredData,
      createReviewsBreadcrumbStructuredData,
      createReviewsPageStructuredData,
    } = await import(${JSON.stringify(structuredDataModuleUrl)});

    const homeGraph = createHomeStructuredData()["@graph"];
    const homeTypes = homeGraph.map((item) => item["@type"]);

    assert.deepEqual(homeTypes, [
      "ProfessionalService",
      "WebSite",
      "WebPage",
      "BreadcrumbList",
    ]);

    const organization = homeGraph[0];
    assert.equal(organization["@id"], "https://example.com/#organization");
    assert.equal(organization.name, companyProfile.name);
    assert.equal(organization.url, "https://example.com");
    assert.equal(organization.logo, "https://example.com/figma-assets/cbrain-logo-main.svg");
    assert.equal(organization.telephone, "+82-70-8830-2219");
    assert.equal(organization.email, companyProfile.email);
    assert.deepEqual(
      organization.sameAs,
      [
        companyLinks.naverBlog,
        companyLinks.instagram,
        companyLinks.youtube,
        companyLinks.kakao,
      ],
    );
    assert.equal(organization.address.streetAddress, companyProfile.address.streetAddress);
    assert.equal(organization.address.addressLocality, companyProfile.address.locality);
    assert.equal(organization.address.addressRegion, companyProfile.address.region);
    assert.equal(organization.foundingDate, "2000");
    assert.equal(organization.founder.name, "정혜영");
    assert.equal(organization.taxID, "120-07-84415");
    assert.equal(organization.identifier.value, "2022-성남중원-0006");
    assert.equal(organization.geo.latitude, 37.4387404);
    assert.equal(organization.geo.longitude, 127.1738368);
    assert.equal(organization.image.length, 3);
    assert.equal(organization.openingHoursSpecification.length, 4);
    assert.equal(organization.hasOfferCatalog.itemListElement.length, 9);
    assert.equal(
      organization.hasOfferCatalog.itemListElement[0].itemOffered.url,
      "https://example.com/portfolio/brochure",
    );
    assert.equal(
      organization.hasOfferCatalog.itemListElement[8].itemOffered.provider[
        "@id"
      ],
      "https://example.com/#organization",
    );

    const website = homeGraph[1];
    assert.equal(website["@id"], "https://example.com/#website");
    assert.equal(website.url, "https://example.com");
    assert.equal(website.publisher["@id"], organization["@id"]);
    assert.equal(website.inLanguage, "ko-KR");
    assert.doesNotMatch(JSON.stringify(homeGraph), /삽입|\\[https?:/);

    const aboutPage = createAboutPageStructuredData();
    assert.equal(aboutPage["@context"], "https://schema.org");
    assert.equal(aboutPage["@type"], "AboutPage");
    assert.equal(aboutPage["@id"], "https://example.com/about#aboutpage");
    assert.equal(aboutPage.url, "https://example.com/about");
    assert.equal(
      aboutPage.name,
      "2000년 설립 홍보물 디자인·제작 전문기업 | 씨브레인",
    );
    assert.equal(
      aboutPage.description,
      "2000년 설립, 누적 4,000건+ 프로젝트를 수행한 홍보물 디자인 전문기업입니다. 코리아 나라장터엑스포 등 다양한 제작 경험을 바탕으로 1:1 전담 디자이너가 기획부터 제작까지 진행합니다.",
    );
    assert.equal(aboutPage.isPartOf["@id"], "https://example.com/#website");
    assert.equal(aboutPage.about["@id"], "https://example.com/#organization");
    assert.equal(aboutPage.mainEntity["@id"], "https://example.com/#organization");

    const aboutBreadcrumb = createAboutBreadcrumbStructuredData();
    assert.equal(aboutBreadcrumb["@context"], "https://schema.org");
    assert.equal(aboutBreadcrumb["@type"], "BreadcrumbList");
    assert.equal(aboutBreadcrumb.itemListElement[0].item, "https://example.com");
    assert.equal(aboutBreadcrumb.itemListElement[0].name, "홈");
    assert.equal(aboutBreadcrumb.itemListElement[1].item, "https://example.com/about");
    assert.equal(aboutBreadcrumb.itemListElement[1].name, "회사소개");

    const blogPage = createBlogPageStructuredData();
    assert.equal(blogPage["@context"], "https://schema.org");
    assert.equal(blogPage["@type"], "Blog");
    assert.equal(blogPage["@id"], "https://example.com/blog#blog");
    assert.equal(blogPage.url, "https://example.com/blog");
    assert.equal(
      blogPage.name,
      "홍보물 디자인·제작 노하우 | 씨브레인 블로그",
    );
    assert.equal(
      blogPage.description,
      "씨브레인이 직접 전하는 브로슈어·카탈로그 등 홍보물 디자인·제작·인쇄 노하우와 실무 팁을 블로그에서 확인하세요.",
    );
    assert.equal(blogPage.isPartOf["@id"], "https://example.com/#website");
    assert.equal(blogPage.about["@id"], "https://example.com/#organization");

    const blogBreadcrumb = createBlogBreadcrumbStructuredData();
    assert.equal(blogBreadcrumb["@context"], "https://schema.org");
    assert.equal(blogBreadcrumb["@type"], "BreadcrumbList");
    assert.equal(blogBreadcrumb.itemListElement[0].item, "https://example.com");
    assert.equal(blogBreadcrumb.itemListElement[0].name, "홈");
    assert.equal(
      blogBreadcrumb.itemListElement[1].item,
      "https://example.com/blog",
    );
    assert.equal(blogBreadcrumb.itemListElement[1].name, "블로그");

    const complaintPage = createComplaintPageStructuredData();
    assert.equal(complaintPage["@context"], "https://schema.org");
    assert.equal(complaintPage["@type"], "ContactPage");
    assert.equal(
      complaintPage["@id"],
      "https://example.com/complaint#contactpage",
    );
    assert.equal(complaintPage.url, "https://example.com/complaint");
    assert.equal(complaintPage.name, "고객센터·불편 접수 | 씨브레인");
    assert.equal(
      complaintPage.description,
      "씨브레인 이용 중 불편사항이나 홍보물 제작 관련 문의를 접수해주세요. 남겨주신 의견 확인 후 신속하게 안내해드립니다.",
    );
    assert.equal(
      complaintPage.isPartOf["@id"],
      "https://example.com/#website",
    );
    assert.equal(
      complaintPage.about["@id"],
      "https://example.com/#organization",
    );

    const complaintBreadcrumb = createComplaintBreadcrumbStructuredData();
    assert.equal(complaintBreadcrumb["@context"], "https://schema.org");
    assert.equal(complaintBreadcrumb["@type"], "BreadcrumbList");
    assert.equal(
      complaintBreadcrumb.itemListElement[0].item,
      "https://example.com",
    );
    assert.equal(complaintBreadcrumb.itemListElement[0].name, "홈");
    assert.equal(
      complaintBreadcrumb.itemListElement[1].item,
      "https://example.com/complaint",
    );
    assert.equal(complaintBreadcrumb.itemListElement[1].name, "불편 접수");

    const noticePage = createNoticePageStructuredData();
    assert.equal(noticePage["@context"], "https://schema.org");
    assert.equal(noticePage["@type"], "CollectionPage");
    assert.equal(
      noticePage["@id"],
      "https://example.com/notice#collectionpage",
    );
    assert.equal(noticePage.url, "https://example.com/notice");
    assert.equal(noticePage.name, "공지사항 | 씨브레인");
    assert.equal(
      noticePage.description,
      "씨브레인의 서비스 변경, 휴무 안내, 이벤트, 수상 소식 등 주요 공지사항을 확인하세요.",
    );
    assert.equal(noticePage.isPartOf["@id"], "https://example.com/#website");
    assert.equal(noticePage.about["@id"], "https://example.com/#organization");

    const noticeBreadcrumb = createNoticeBreadcrumbStructuredData();
    assert.equal(noticeBreadcrumb["@context"], "https://schema.org");
    assert.equal(noticeBreadcrumb["@type"], "BreadcrumbList");
    assert.equal(noticeBreadcrumb.itemListElement[0].item, "https://example.com");
    assert.equal(noticeBreadcrumb.itemListElement[0].name, "홈");
    assert.equal(
      noticeBreadcrumb.itemListElement[1].item,
      "https://example.com/notice",
    );
    assert.equal(noticeBreadcrumb.itemListElement[1].name, "공지사항");

    const portfolioPage = createPortfolioPageStructuredData();
    assert.equal(portfolioPage["@context"], "https://schema.org");
    assert.equal(portfolioPage["@type"], "CollectionPage");
    assert.equal(
      portfolioPage["@id"],
      "https://example.com/portfolio#collectionpage",
    );
    assert.equal(portfolioPage.url, "https://example.com/portfolio");
    assert.equal(
      portfolioPage.name,
      "홍보물 디자인·제작 사례 | 씨브레인 포트폴리오",
    );
    assert.equal(
      portfolioPage.description,
      "브로슈어, 카탈로그, 리플렛, 패키지 등 다양한 기업·기관 홍보물의 실제 디자인·제작 사례를 확인하세요.",
    );
    assert.equal(portfolioPage.isPartOf["@id"], "https://example.com/#website");
    assert.equal(portfolioPage.about["@id"], "https://example.com/#organization");
    assert.equal(portfolioPage.hasPart["@type"], "ItemList");
    assert.equal(portfolioPage.hasPart.name, "포트폴리오 카테고리");
    assert.deepEqual(
      portfolioPage.hasPart.itemListElement.map((item) => ({
        name: item.name,
        position: item.position,
        url: item.url,
      })),
      [
        { name: "브로슈어·카탈로그", position: 1, url: "https://example.com/portfolio/brochure" },
        { name: "리플렛·팜플렛", position: 2, url: "https://example.com/portfolio/leaflet" },
        { name: "포스터·전단지", position: 3, url: "https://example.com/portfolio/poster" },
        { name: "배너·족자·현수막", position: 4, url: "https://example.com/portfolio/banner" },
        { name: "명함·봉투", position: 5, url: "https://example.com/portfolio/business-card" },
        { name: "로고", position: 6, url: "https://example.com/portfolio/logo" },
        { name: "패키지·쇼핑백", position: 7, url: "https://example.com/portfolio/package" },
        { name: "촬영", position: 8, url: "https://example.com/portfolio/photo" },
        { name: "기타", position: 9, url: "https://example.com/portfolio/custom" },
      ],
    );

    const portfolioBreadcrumb = createPortfolioBreadcrumbStructuredData();
    assert.equal(portfolioBreadcrumb["@context"], "https://schema.org");
    assert.equal(portfolioBreadcrumb["@type"], "BreadcrumbList");
    assert.equal(portfolioBreadcrumb.itemListElement[0].item, "https://example.com");
    assert.equal(portfolioBreadcrumb.itemListElement[0].name, "홈");
    assert.equal(
      portfolioBreadcrumb.itemListElement[1].item,
      "https://example.com/portfolio",
    );
    assert.equal(portfolioBreadcrumb.itemListElement[1].name, "포트폴리오");

    const reviewsPage = createReviewsPageStructuredData();
    assert.equal(reviewsPage["@context"], "https://schema.org");
    assert.equal(reviewsPage["@type"], "CollectionPage");
    assert.equal(
      reviewsPage["@id"],
      "https://example.com/reviews#collectionpage",
    );
    assert.equal(reviewsPage.url, "https://example.com/reviews");
    assert.equal(
      reviewsPage.name,
      "홍보물 제작 고객후기·리뷰 | 씨브레인",
    );
    assert.equal(
      reviewsPage.description,
      "다양한 기업·기관이 남긴 브로슈어·카탈로그 등 홍보물 제작 후기를 확인하세요. 실제 고객의 제작 경험과 만족도를 살펴볼 수 있습니다.",
    );
    assert.equal(reviewsPage.isPartOf["@id"], "https://example.com/#website");
    assert.equal(reviewsPage.about["@id"], "https://example.com/#organization");

    const reviewsBreadcrumb = createReviewsBreadcrumbStructuredData();
    assert.equal(reviewsBreadcrumb["@context"], "https://schema.org");
    assert.equal(reviewsBreadcrumb["@type"], "BreadcrumbList");
    assert.equal(reviewsBreadcrumb.itemListElement[0].item, "https://example.com");
    assert.equal(reviewsBreadcrumb.itemListElement[0].name, "홈");
    assert.equal(
      reviewsBreadcrumb.itemListElement[1].item,
      "https://example.com/reviews",
    );
    assert.equal(reviewsBreadcrumb.itemListElement[1].name, "고객 후기");

    const orderPage = createOrderPageStructuredData();
    assert.equal(orderPage["@context"], "https://schema.org");
    assert.equal(orderPage["@type"], "CollectionPage");
    assert.equal(
      orderPage["@id"],
      "https://example.com/order#collectionpage",
    );
    assert.equal(orderPage.url, "https://example.com/order");
    assert.equal(
      orderPage.name,
      "홍보물 제작 견적·비용 안내 | 씨브레인",
    );
    assert.equal(
      orderPage.description,
      "브로슈어·카탈로그 등 홍보물 디자인부터 인쇄, 견적, 결제, 전국 배송까지 한 번에 진행하세요. 제작 문의부터 1:1 상담까지 빠르게 안내해드립니다.",
    );
    assert.equal(orderPage.isPartOf["@id"], "https://example.com/#website");
    assert.equal(orderPage.about["@id"], "https://example.com/#organization");

    const orderCatalog = createOrderOfferCatalogStructuredData([
      { categoryId: "brochure-catalog", startingPrice: 850000 },
      { categoryId: "leaflet-pamphlet", startingPrice: 370000 },
      { categoryId: "poster-flyer", startingPrice: 130000 },
      { categoryId: "banner-display", startingPrice: 80000 },
      { categoryId: "business-card-envelope", startingPrice: 90000 },
      { categoryId: "logo", startingPrice: 50000 },
    ]);
    assert.equal(orderCatalog["@context"], "https://schema.org");
    assert.equal(orderCatalog["@type"], "OfferCatalog");
    assert.equal(orderCatalog["@id"], "https://example.com/order#offercatalog");
    assert.equal(orderCatalog.url, "https://example.com/order");
    assert.equal(orderCatalog.name, "씨브레인 정찰제 홍보물 제작 가격");
    assert.equal(orderCatalog.itemListElement.length, 9);
    assert.deepEqual(
      orderCatalog.itemListElement.slice(0, 6).map((offer) => ({
        availability: offer.availability,
        minPrice: offer.priceSpecification.minPrice,
        name: offer.itemOffered.name,
        priceCurrency: offer.priceCurrency,
        url: offer.url,
      })),
      [
        ["브로슈어·카탈로그", 850000, "brochure-catalog"],
        ["리플렛·팜플렛", 370000, "leaflet-pamphlet"],
        ["포스터·전단지", 130000, "poster-flyer"],
        ["배너·족자·현수막", 80000, "banner-display"],
        ["명함·봉투", 90000, "business-card-envelope"],
        ["로고", 50000, "logo"],
      ].map(([name, minPrice, service]) => ({
        availability: "https://schema.org/InStock",
        minPrice,
        name,
        priceCurrency: "KRW",
        url: "https://example.com/order?service=" + service,
      })),
    );
    assert.deepEqual(
      orderCatalog.itemListElement.slice(6).map((offer) => ({
        description: offer.description,
        name: offer.itemOffered.name,
        priceCurrency: offer.priceCurrency,
        url: offer.url,
      })),
      [
        ["패키지·쇼핑백", "견적 후 카카오톡으로 주문 진행"],
        ["촬영", "견적 후 진행"],
        ["기타", "카카오톡 1:1 문의"],
      ].map(([name, description]) => ({
        description,
        name,
        priceCurrency: undefined,
        url: "https://example.com/order",
      })),
    );
    assert.ok(
      orderCatalog.itemListElement.every(
        (offer) =>
          offer.seller["@id"] === "https://example.com/#organization" &&
          offer.itemOffered.provider["@id"] ===
            "https://example.com/#organization",
      ),
    );

    const orderBreadcrumb = createOrderBreadcrumbStructuredData();
    assert.equal(orderBreadcrumb["@context"], "https://schema.org");
    assert.equal(orderBreadcrumb["@type"], "BreadcrumbList");
    assert.equal(orderBreadcrumb.itemListElement[0].item, "https://example.com");
    assert.equal(orderBreadcrumb.itemListElement[0].name, "홈");
    assert.equal(
      orderBreadcrumb.itemListElement[1].item,
      "https://example.com/order",
    );
    assert.equal(orderBreadcrumb.itemListElement[1].name, "주문·결제");

    const faqPage = createFaqPageStructuredData();
    assert.equal(faqPage["@context"], "https://schema.org");
    assert.equal(faqPage["@type"], "FAQPage");
    assert.equal(faqPage["@id"], "https://example.com/faq#faqpage");
    assert.equal(faqPage.url, "https://example.com/faq");
    assert.equal(faqPage.name, "홍보물 제작 FAQ·가이드 | 씨브레인");
    assert.equal(
      faqPage.description,
      "홍보물 제작 기간, 비용, 최소 수량, 디자인, 인쇄, 결제와 배송까지 제작 전 자주 묻는 질문과 실무 정보를 확인하세요.",
    );
    assert.equal(faqPage.isPartOf["@id"], "https://example.com/#website");
    assert.equal(faqPage.about["@id"], "https://example.com/#organization");
    assert.equal(faqPage.mainEntity.length, 29);
    assert.equal(faqPage.mainEntity[0]["@type"], "Question");
    assert.equal(faqPage.mainEntity[0].acceptedAnswer["@type"], "Answer");
    assert.ok(faqPage.mainEntity[0].name.length > 5);
    assert.ok(faqPage.mainEntity[0].acceptedAnswer.text.length > 20);

    const faqBreadcrumb = createFaqBreadcrumbStructuredData();
    assert.equal(faqBreadcrumb["@context"], "https://schema.org");
    assert.equal(faqBreadcrumb["@type"], "BreadcrumbList");
    assert.equal(faqBreadcrumb.itemListElement[0].item, "https://example.com");
    assert.equal(faqBreadcrumb.itemListElement[0].name, "홈");
    assert.equal(
      faqBreadcrumb.itemListElement[1].item,
      "https://example.com/faq",
    );
    assert.equal(faqBreadcrumb.itemListElement[1].name, "FAQ & 가이드");
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

test("FAQ structured data preserves the approved FAQ wording", async () => {
  const check = `
    import assert from "node:assert/strict";
    const { faqCategories } = await import(${JSON.stringify(faqModuleUrl)});
    const firstAnswer = faqCategories[0].items[0].answer;
    const paymentAnswer = faqCategories[0].items[2].answer;
    const alternateSpellingAnswer = faqCategories[3].items[3].answer;

    assert.match(firstAnswer, /^씨브레인 홈페이지에서 원하는 제품 카테고리를 선택해/);
    assert.match(paymentAnswer, /^신용카드 즉시결제와 계좌이체를 지원합니다\\./);
    assert.equal(alternateSpellingAnswer, "표기 방식만 다를 뿐 동일한 인쇄물입니다.");
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: {
        ...process.env,
        NODE_NO_WARNINGS: "1",
      },
    },
  );
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

    const interviewArticle = createArticleStructuredData({
      authorName: "씨브레인",
      datePublished: "2026-08-14",
      description: "인터뷰 영상입니다.",
      headline: "고객 인터뷰",
      section: "고객 인터뷰",
      urlPath: "/reviews/youtube-interview",
      video: {
        description: "고객 인터뷰 영상",
        embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        name: "고객 인터뷰",
        thumbnailUrl: "https://example.com/interview.png",
        uploadDate: "2026-08-14",
      },
    });

    assert.equal(
      interviewArticle["@graph"][0].video.embedUrl,
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    assert.equal(interviewArticle["@graph"][0].video.contentUrl, undefined);

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
    refundPolicy: "refundPolicy",
    reviews: "reviews",
    terms: "terms",
  };

  await Promise.all(
    Object.entries(expectedStaticPageKeys).map(async ([sourceKey, pageKey]) => {
      const source = await readFile(staticPageSources[sourceKey], "utf8");

      assert.match(source, /JsonLdScript/);
      if (pageKey === "home") {
        assert.match(source, /createHomeStructuredData/);
      } else if (pageKey === "order") {
        assert.match(source, /createOrderPageStructuredData/);
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
