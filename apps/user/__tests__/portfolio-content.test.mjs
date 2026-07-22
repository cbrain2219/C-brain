import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const portfolioModuleUrl = new URL(
  "../app/_content/portfolio.ts",
  import.meta.url,
).href;

test("portfolio DB rows preserve content, pinned order, and valid images", async () => {
  const check = `
    import assert from "node:assert/strict";
    const {
      getPortfolioDetailBySlug,
      mapPortfolioRows,
      parsePortfolioImages,
    } = await import(${JSON.stringify(portfolioModuleUrl)});

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
        image_path: null,
        images: [
          { alt: "첫 이미지", path: "portfolio/first.webp" },
          { alt: "", path: "/figma-assets/portfolio-axis.png" },
        ],
        is_pinned: false,
        slug: "ordered-images",
        summary: null,
        title: "순서 테스트",
        type: "리플렛 · 팜플렛",
      },
      {
        client_name: "고정 기업",
        content: "고정 본문",
        content_mode: "text",
        image_path: "portfolio/pinned.webp",
        images: [],
        is_pinned: true,
        slug: "pinned",
        summary: null,
        title: "고정 테스트",
        type: "브로슈어 · 카탈로그",
      },
    ], (path) => "https://assets.example/" + path);

    assert.deepEqual(items.map((item) => item.slug), ["pinned", "ordered-images"]);
    assert.equal(items[1].categoryId, "leaflet-pamphlet");
    assert.equal(items[1].description, "안전한 & 본문");
    assert.doesNotMatch(items[1].description, /<|alert/);
    assert.deepEqual(items[1].detailImages.map((image) => image.src), [
      "https://assets.example/portfolio/first.webp",
      "/figma-assets/portfolio-axis.png",
    ]);
    assert.equal(getPortfolioDetailBySlug("ordered-images", items)?.item, items[1]);

    const ordered = mapPortfolioRows([
      { slug: "unpinned-1", is_pinned: false, sort_order: 1 },
      { slug: "pinned-1", is_pinned: true, sort_order: 2 },
      { slug: "pinned-2", is_pinned: true, sort_order: 3 },
      { slug: "unpinned-2", is_pinned: false, sort_order: 4 },
    ].map((row) => ({
      client_name: "순서 기업",
      content: "본문",
      content_mode: "text",
      image_path: "portfolio/order.webp",
      images: [],
      summary: null,
      title: row.slug,
      type: "브로슈어 · 카탈로그",
      ...row,
    })), (path) => path);

    assert.deepEqual(ordered.map((item) => item.slug), [
      "pinned-1",
      "pinned-2",
      "unpinned-1",
      "unpinned-2",
    ]);

    const malformed = mapPortfolioRows([
      {
        client_name: null,
        content: "",
        content_mode: "text",
        image_path: null,
        images: { invalid: true },
        is_pinned: false,
        slug: "fallback",
        summary: null,
        title: "기본값",
        type: "알 수 없는 유형",
      },
    ], (path) => path);

    assert.deepEqual(malformed, []);

    const remoteOnly = mapPortfolioRows([{
      client_name: "외부 이미지 기업",
      content: "본문",
      content_mode: "text",
      image_path: "https://images.example/remote.webp",
      images: [],
      is_pinned: false,
      slug: "remote-only",
      summary: null,
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
