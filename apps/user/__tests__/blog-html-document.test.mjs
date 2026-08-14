import { execFile } from "node:child_process";
import process from "node:process";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const moduleUrl = new URL(
  "../app/(site)/blog/_data/blogHtmlDocument.ts",
  import.meta.url,
).href;

test("full blog HTML keeps intended metadata, structured data, styles, and body safely", async () => {
  const source = `<!DOCTYPE html>
    <html lang="ko">
      <head>
        <title>의도한 문서 제목</title>
        <meta name="description" content="의도한 문서 설명">
        <meta name="keywords" content="브로슈어, 카탈로그">
        <meta name="author" content="씨브레인(C-BRAIN)">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="https://cbrain.kr/blog/intended/">
        <meta property="og:type" content="article">
        <meta property="og:title" content="의도한 OG 제목">
        <meta property="og:description" content="의도한 OG 설명">
        <meta property="og:url" content="https://cbrain.kr/blog/intended/">
        <meta property="og:image" content="https://cbrain.kr/images/intended.webp">
        <meta property="og:site_name" content="씨브레인">
        <meta property="og:locale" content="ko_KR">
        <meta property="article:published_time" content="2026-08-14">
        <meta property="article:modified_time" content="2026-08-15">
        <meta property="article:author" content="씨브레인(C-BRAIN)">
        <meta property="article:section" content="인쇄물 가이드">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="의도한 트위터 제목">
        <meta name="twitter:description" content="의도한 트위터 설명">
        <meta name="twitter:image" content="https://cbrain.kr/images/twitter.webp">
        <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"FAQPage"}
        </script>
        <script>alert("head xss")</script>
        <style>
          @import url("https://evil.example/global.css");
          *, *::before, *::after { box-sizing: border-box; }
          body { background: #fff; color: #111; }
          .article-wrap { max-width: 760px; margin: 0 auto; }
          @media (max-width: 480px) { .article-wrap { padding: 16px; } }
        </style>
      </head>
      <body>
        <article class="article-wrap" itemscope itemtype="https://schema.org/Article">
          <header class="article-header"><h1>문서 자체 헤더</h1></header>
          <div class="article-body" itemprop="articleBody">
            <h2 id="article-title">본문 제목</h2>
            <details class="faq-item"><summary>질문</summary><p>답변</p></details>
            <a href="https://example.com" target="_blank">외부 링크</a>
            <a href="javascript:alert('link xss')">위험 링크</a>
            <img src="/images/example.webp" alt="예시" onerror="alert('image xss')">
            <script>alert("body xss")</script>
          </div>
        </article>
      </body>
    </html>`;
  const check = `
    import assert from "node:assert/strict";
    const { BLOG_HTML_SCOPE_SELECTOR, parseBlogHtmlDocument } = await import(${JSON.stringify(moduleUrl)});
    const parsed = parseBlogHtmlDocument(${JSON.stringify(source)});

    assert.equal(parsed.metadata.title, "의도한 문서 제목");
    assert.equal(parsed.metadata.description, "의도한 문서 설명");
    assert.deepEqual(parsed.metadata.keywords, ["브로슈어", "카탈로그"]);
    assert.equal(parsed.metadata.author, "씨브레인(C-BRAIN)");
    assert.equal(parsed.metadata.robots, "index, follow");
    assert.equal(parsed.metadata.canonical, "https://cbrain.kr/blog/intended/");
    assert.equal(parsed.metadata.openGraph.type, "article");
    assert.equal(parsed.metadata.openGraph.title, "의도한 OG 제목");
    assert.equal(parsed.metadata.openGraph.publishedTime, "2026-08-14");
    assert.equal(parsed.metadata.openGraph.modifiedTime, "2026-08-15");
    assert.equal(parsed.metadata.openGraph.section, "인쇄물 가이드");
    assert.equal(parsed.metadata.twitter.card, "summary_large_image");
    assert.equal(parsed.metadata.twitter.title, "의도한 트위터 제목");

    assert.equal(parsed.jsonLd.length, 1);
    assert.equal(parsed.jsonLd[0]["@type"], "FAQPage");

    assert.ok(parsed.css.includes(BLOG_HTML_SCOPE_SELECTOR + " {"));
    assert.ok(parsed.css.includes(BLOG_HTML_SCOPE_SELECTOR + " .article-wrap"));
    assert.ok(parsed.css.includes("@media (max-width: 480px)"));
    assert.doesNotMatch(parsed.css, /@import|evil[.]example/);
    assert.equal(parsed.css.includes("body {"), false);

    assert.match(parsed.bodyHtml, /<div class="article-body"/);
    assert.match(parsed.bodyHtml, /<article class="article-wrap"/);
    assert.match(parsed.bodyHtml, /<header class="article-header"/);
    assert.match(parsed.bodyHtml, /<details class="faq-item">/);
    assert.match(parsed.bodyHtml, /itemprop="articleBody"/);
    assert.match(parsed.bodyHtml, /rel="noopener noreferrer"/);
    assert.equal(parsed.bodyHtml.includes("문서 자체 헤더"), true);
    assert.doesNotMatch(parsed.bodyHtml, /<script|onerror|javascript:|alert/i);
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  );
});

test("HTML fragments are sanitized", async () => {
  const check = `
    import assert from "node:assert/strict";
    const { parseBlogHtmlDocument } = await import(${JSON.stringify(moduleUrl)});
    const parsed = parseBlogHtmlDocument('<p class="intro">본문</p><script>alert(1)</script>');

    assert.equal(parsed.metadata.title, undefined);
    assert.equal(parsed.css, "");
    assert.equal(parsed.bodyHtml, '<p class="intro">본문</p>');
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  );
});
