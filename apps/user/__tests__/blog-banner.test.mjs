import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { JSDOM } = require("jsdom");
const ts = require("typescript");
const blogDirectory = new URL("../app/(site)/blog/", import.meta.url);

async function loadModule(path, overrides = {}) {
  const source = await readFile(new URL(path, blogDirectory), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (specifier) => {
      if (specifier in overrides) return overrides[specifier];
      if (specifier.endsWith(".module.css")) {
        return {
          __esModule: true,
          default: new Proxy({}, { get: (_, name) => name }),
        };
      }
      return require(specifier);
    },
    module,
    module.exports,
  );
  return module.exports;
}

test("blog banners ignore categories, include every configured post, and do not gate the list", async () => {
  const passthrough = ({ children }) => children;
  const link = { default: ({ scroll, ...props }) => React.createElement("a", props) };
  const featuredCard = await loadModule("_components/BlogFeaturedCard.tsx", {
    "next/link": link,
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "../../../../components/ImageWithSkeleton": {
      ImageWithSkeleton: ({ alt, src }) => React.createElement("img", { alt, src }),
    },
  });
  const { BlogBoard } = await loadModule("_components/BlogBoard.tsx", {
    "next/link": link,
    "../../../../components/HorizontalDragScroll": { HorizontalDragScroll: passthrough },
    "../_utils/filterBlogPosts": await loadModule("_utils/filterBlogPosts.ts"),
    "./BlogFeaturedCard": featuredCard,
    "./BlogHistoryBoundary": { BlogHistoryBoundary: passthrough },
    "./BlogConsultCard": { BlogConsultCard: () => null },
    "./BlogPopularList": { BlogPopularList: () => null },
    "./BlogCard": {
      BlogCard: ({ post }) => React.createElement("li", { "data-post-id": post.id }),
    },
  });
  const categories = ["전체", "브로슈어", "리플렛", "로고"];
  const ranks = [4, 1, 6, 2, 5, 3];
  const posts = Array.from({ length: 7 }, (_, index) => ({
    id: `post-${index + 1}`,
    slug: `post-${index + 1}`,
    category: index % 2 === 0 ? "브로슈어" : "리플렛",
    title: `게시글 ${index + 1}`,
    summary: "요약",
    image: `/post-${index + 1}.png`,
    imageAlt: "썸네일",
    bannerRank: ranks[index],
  }));

  for (const activeCategory of categories) {
    const dom = new JSDOM(renderToStaticMarkup(
      React.createElement(BlogBoard, { activeCategory, categories, posts }),
    ));
    const document = dom.window.document;
    const banner = document.querySelector('[aria-roledescription="carousel"]');
    assert.ok(banner, `Banner must remain visible in ${activeCategory}`);
    assert.equal(banner.querySelector(".blogFeaturedIndex").textContent, "1/6");
    const slideSlugs = [...banner.querySelectorAll("article a")].map(
      (anchor) => new URL(anchor.href, "https://example.com").pathname,
    );
    assert.deepEqual(slideSlugs.slice(1, -1), [
      "/blog/post-2", "/blog/post-4", "/blog/post-6",
      "/blog/post-1", "/blog/post-5", "/blog/post-3",
    ]);
    const expectedPosts = activeCategory === "전체"
      ? posts
      : posts.filter((post) => post.category === activeCategory);
    assert.deepEqual(
      [...document.querySelectorAll("[data-post-id]")].map((card) => card.dataset.postId),
      expectedPosts.map((post) => post.id),
    );
    assert.equal(document.querySelector("#blog-board-title strong").textContent, String(expectedPosts.length));
    assert.equal(document.querySelectorAll(".blogEmptyState").length, expectedPosts.length === 0 ? 1 : 0);
    dom.window.close();
  }

  for (const ordinaryPosts of [posts.map((post) => ({ ...post, bannerRank: undefined })), []]) {
    const dom = new JSDOM(renderToStaticMarkup(
      React.createElement(BlogBoard, { activeCategory: "전체", categories, posts: ordinaryPosts }),
    ));
    assert.equal(dom.window.document.querySelector('[aria-roledescription="carousel"]'), null);
    assert.equal(dom.window.document.querySelectorAll("[data-post-id]").length, ordinaryPosts.length);
    assert.equal(dom.window.document.querySelectorAll(".blogEmptyState").length, ordinaryPosts.length === 0 ? 1 : 0);
    dom.window.close();
  }
});
