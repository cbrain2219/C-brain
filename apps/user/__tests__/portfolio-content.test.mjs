import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const portfolioModuleUrl = new URL(
  "../app/_content/portfolio.ts",
  import.meta.url,
).href;

test("portfolio DB rows preserve content, database order, and valid images", async () => {
  const check = `
    import assert from "node:assert/strict";
    const portfolio = await import(${JSON.stringify(portfolioModuleUrl)});
    const {
      getPortfolioDetailBySlug,
      getPortfolioCategoryIdFromValue,
      getPortfolioItemBySlug,
      getRelatedPortfolioItems,
      mapPortfolioRows,
      parsePortfolioImages,
    } = portfolio;

    assert.equal("portfolioItems" in portfolio, false);
    assert.equal("featuredPortfolioItems" in portfolio, false);

    assert.deepEqual(parsePortfolioImages([
      null,
      { path: "" },
      { path: "https://images.example/remote.webp" },
      { path: "//images.example/remote.webp" },
      { path: "data:image/png;base64,abc" },
      { alt: " 표지 ", path: " portfolio/cover.webp " },
      { alt: "로컬", path: "/figma-assets/local.webp" },
    ]), [
      { alt: "표지", path: "portfolio/cover.webp" },
      { alt: "로컬", path: "/figma-assets/local.webp" },
    ]);

    const items = mapPortfolioRows([
      {
        client_name: "테스트 기업",
        content: "<p>안전한 &amp; 본문</p><script>alert('xss')</script>",
        content_mode: "html",
        images: [
          { alt: "첫 이미지", path: "portfolio/first.webp" },
          { alt: "", path: "/figma-assets/portfolio-axis.png" },
        ],
        pinned: false,
        show_on_landing: false,
        slug: "ordered-images",
        title: "순서 테스트",
        type: "리플렛 · 팜플렛",
      },
      {
        client_name: "고정 기업",
        content: "고정 본문",
        content_mode: "markdown",
        images: [{ alt: "", path: "portfolio/pinned.webp" }],
        pinned: true,
        show_on_landing: true,
        slug: "pinned",
        title: "고정 테스트",
        type: "브로슈어 · 카탈로그",
      },
    ], (path) => "https://assets.example/" + path);

    assert.deepEqual(items.map((item) => item.slug), ["ordered-images", "pinned"]);
    assert.equal(items[0].showOnLanding, false);
    assert.equal(items[1].showOnLanding, true);
    assert.equal(items[0].categoryId, "leaflet-pamphlet");
    assert.equal(getPortfolioCategoryIdFromValue("banner-book"), "banner-display");
    assert.equal(items[0].description, "안전한 & 본문");
    assert.doesNotMatch(items[0].description, /<|alert/);
    assert.deepEqual(items[0].detailImages.map((image) => image.src), [
      "https://assets.example/portfolio/first.webp",
      "/figma-assets/portfolio-axis.png",
    ]);
    assert.equal(getPortfolioDetailBySlug("ordered-images", items)?.item, items[0]);
    assert.equal(getPortfolioItemBySlug("ordered-images", items), items[0]);
    assert.deepEqual(getRelatedPortfolioItems("pinned", items, 1), [items[0]]);

    const ordered = mapPortfolioRows([
      { slug: "unpinned-1", pinned: false, sort_order: 1 },
      { slug: "pinned-1", pinned: true, sort_order: 2 },
      { slug: "pinned-2", pinned: true, sort_order: 3 },
      { slug: "unpinned-2", pinned: false, sort_order: 4 },
    ].map((row) => ({
      client_name: "순서 기업",
      content: "본문",
      content_mode: "markdown",
      images: [{ alt: "", path: "portfolio/order.webp" }],
      show_on_landing: false,
      title: row.slug,
      type: "브로슈어 · 카탈로그",
      ...row,
    })), (path) => path);

    assert.deepEqual(ordered.map((item) => item.slug), [
      "unpinned-1",
      "pinned-1",
      "pinned-2",
      "unpinned-2",
    ]);

    const malformed = mapPortfolioRows([
      {
        client_name: null,
        content: "",
        content_mode: "markdown",
        images: { invalid: true },
        pinned: false,
        show_on_landing: false,
        slug: "fallback",
        title: "기본값",
        type: "알 수 없는 유형",
      },
    ], (path) => path);

    assert.deepEqual(malformed, []);

    const unsupportedCategory = mapPortfolioRows([{
      client_name: "지원 외 기업",
      content: "본문",
      content_mode: "markdown",
      images: [{ alt: "", path: "portfolio/unsupported.webp" }],
      pinned: false,
      show_on_landing: false,
      slug: "unsupported-category",
      title: "지원 외 유형",
      type: "촬영",
    }], (path) => path);

    assert.deepEqual(unsupportedCategory, []);

    const remoteOnly = mapPortfolioRows([{
      client_name: "외부 이미지 기업",
      content: "본문",
      content_mode: "markdown",
      images: [{ alt: "", path: "https://images.example/remote.webp" }],
      pinned: false,
      show_on_landing: false,
      slug: "remote-only",
      title: "외부 이미지",
      type: "브로슈어 · 카탈로그",
    }], (path) => "https://assets.example/" + path);

    assert.deepEqual(remoteOnly, []);
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  );
});
