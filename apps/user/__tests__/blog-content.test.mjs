import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const blogModuleUrl = new URL(
  "../app/(site)/blog/_data/blogPosts.ts",
  import.meta.url,
).href;

test("blog DB rows map to the existing public content model", async () => {
  const check = `
    import assert from "node:assert/strict";
    const blog = await import(${JSON.stringify(blogModuleUrl)});
    const {
      getBlogPostBySlug,
      getRelatedBlogPosts,
      mapBlogRows,
    } = blog;

    const posts = mapBlogRows([
      {
        content: "<p>첫 문단 &amp; 안전</p><script>alert('xss')</script><h2>둘째 문단</h2>",
        content_mode: "html",
        excerpt: null,
        featured: true,
        id: "blog-1",
        kind: "blog",
        published_at: "2026-08-07T15:00:00.000Z",
        seo_description: "첫 번째 SEO 설명",
        show_as_banner: true,
        show_on_landing: true,
        slug: "first-post",
        thumbnail_alt: "첫 번째 썸네일",
        thumbnail_path: "blog-thumbnails/first.webp",
        title: "첫 번째 글",
        type: "인쇄 실무팁",
      },
      {
        content: "첫 문단\\n\\n둘째 문단",
        content_mode: "markdown",
        excerpt: "두 번째 요약",
        featured: true,
        id: "blog-2",
        kind: "blog",
        published_at: "2026-08-08T15:00:00.000Z",
        seo_description: null,
        show_as_banner: true,
        show_on_landing: false,
        slug: "second-post",
        thumbnail_alt: null,
        thumbnail_path: null,
        title: "두 번째 글",
        type: "인쇄 실무팁",
      },
    ], (path) => "https://assets.example/" + path);

    assert.equal("blogPosts" in blog, false);
    assert.deepEqual(posts.map((post) => post.slug), ["first-post", "second-post"]);
    assert.equal(posts[0].publishedAt, "2026. 08. 08");
    assert.equal(posts[0].publishedAtIso, "2026-08-07T15:00:00.000Z");
    assert.equal(posts[0].summary, "첫 번째 SEO 설명");
    assert.equal(posts[0].image, "https://assets.example/blog-thumbnails/first.webp");
    assert.equal(posts[0].imageAlt, "첫 번째 썸네일");
    assert.equal(posts[0].landingRank, 1);
    assert.equal(posts[0].bannerRank, 1);
    assert.equal(posts[0].popularRank, 1);
    assert.equal(posts[1].landingRank, undefined);
    assert.equal(posts[1].bannerRank, 2);
    assert.equal(posts[1].popularRank, 2);
    assert.equal(posts[1].image, "/figma-assets/blog-brochure.png");
    assert.equal(posts[1].imageAlt, "두 번째 글");
    assert.deepEqual(posts[0].detail.body.map((block) => block.text), [
      "첫 문단 & 안전",
      "둘째 문단",
    ]);
    assert.doesNotMatch(JSON.stringify(posts[0].detail.body), /script|alert|<p>/);
    assert.deepEqual(posts[1].detail.body.map((block) => block.text), [
      "첫 문단",
      "둘째 문단",
    ]);
    assert.equal(getBlogPostBySlug("second-post", posts), posts[1]);
    assert.deepEqual(
      getRelatedBlogPosts("first-post", posts, 1),
      [posts[1]],
    );
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  );
});
