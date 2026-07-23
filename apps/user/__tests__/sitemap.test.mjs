import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const sitemapContentModuleUrl = new URL(
  "../app/_content/sitemap.ts",
  import.meta.url,
).href;
const appSitemapPath = new URL("../app/sitemap.ts", import.meta.url);

test("sitemap helper lists public pages and excludes private payment routes", async () => {
  const check = `
    import assert from "node:assert/strict";
    const {
      createSitemapEntries,
      sitemapStaticPageKeys,
    } = await import(${JSON.stringify(sitemapContentModuleUrl)});

    const entries = createSitemapEntries([
      {
        changeFrequency: "monthly",
        lastModified: "2026-09-16T00:00:00+09:00",
        path: "/blog/brand-color-printing",
        priority: 0.65,
      },
      {
        changeFrequency: "monthly",
        path: "/portfolio/shinlim-product-catalog",
        priority: 0.7,
      },
      {
        changeFrequency: "monthly",
        path: "/blog/brand-color-printing",
        priority: 0.65,
      },
    ]);
    const paths = entries.map((entry) => new URL(entry.url).pathname);

    assert.deepEqual(sitemapStaticPageKeys, [
      "home",
      "about",
      "portfolio",
      "reviews",
      "blog",
      "notice",
      "faq",
      "order",
      "complaint",
      "privacyPolicy",
      "privacyCollection",
    ]);
    assert.equal(entries[0].url, "https://example.com/");
    assert.equal(entries[0].priority, 1);
    assert.equal(entries[0].changeFrequency, "weekly");
    assert.ok(paths.includes("/about"));
    assert.ok(paths.includes("/portfolio"));
    assert.ok(paths.includes("/order"));
    assert.ok(paths.includes("/privacy-policy"));
    assert.ok(paths.includes("/blog/brand-color-printing"));
    assert.ok(paths.includes("/portfolio/shinlim-product-catalog"));
    assert.equal(
      paths.filter((path) => path === "/blog/brand-color-printing").length,
      1,
    );
    assert.equal(
      entries.find((entry) => new URL(entry.url).pathname === "/blog/brand-color-printing")?.lastModified,
      "2026-09-16T00:00:00+09:00",
    );
    assert.ok(!paths.includes("/order/success"));
    assert.ok(!paths.includes("/order/fail"));
    assert.ok(!paths.some((path) => path.startsWith("/linkpay/")));
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

test("Next sitemap route assembles public dynamic detail groups", async () => {
  const source = await readFile(appSitemapPath, "utf8");

  assert.match(source, /export default function sitemap/);
  assert.match(source, /createSitemapEntries/);
  assert.match(source, /blogPosts\.map/);
  assert.match(source, /path: `\/blog\/\$\{post\.slug\}`/);
  assert.match(source, /portfolioItems\.map/);
  assert.match(source, /path: `\/portfolio\/\$\{item\.slug\}`/);
  assert.match(source, /customerInterviews\.map/);
  assert.match(source, /path: `\/reviews\/\$\{interview\.detailSlug\}`/);
  assert.match(source, /getNoticePageData\("all"\)/);
  assert.match(source, /path: `\/notice\/\$\{notice\.id\}`/);
  assert.doesNotMatch(source, /@repo\/supabase/);
  assert.doesNotMatch(source, /createUserSupabaseClient/);
  assert.doesNotMatch(source, /listPublishedPortfolioItems/);
  assert.doesNotMatch(source, /\/order\/success/);
  assert.doesNotMatch(source, /\/order\/fail/);
  assert.doesNotMatch(source, /\/linkpay/);
});
