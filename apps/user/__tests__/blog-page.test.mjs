import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paths = {
  board: new URL(
    "../app/(site)/blog/_components/BlogBoard.tsx",
    import.meta.url,
  ),
  card: new URL("../app/(site)/blog/_components/BlogCard.tsx", import.meta.url),
  authorMeta: new URL(
    "../app/(site)/blog/_components/BlogAuthorMeta.tsx",
    import.meta.url,
  ),
  featuredCard: new URL(
    "../app/(site)/blog/_components/BlogFeaturedCard.tsx",
    import.meta.url,
  ),
  detailPage: new URL("../app/(site)/blog/[slug]/page.tsx", import.meta.url),
  detailStyles: new URL(
    "../app/(site)/blog/[slug]/page.module.css",
    import.meta.url,
  ),
  detailBackLink: new URL(
    "../app/(site)/blog/[slug]/BlogDetailBackLink.tsx",
    import.meta.url,
  ),
  posts: new URL("../app/(site)/blog/_data/blogPosts.ts", import.meta.url),
  types: new URL("../app/(site)/blog/_types/blog.ts", import.meta.url),
  header: new URL("../app/_components/Header.tsx", import.meta.url),
  historyBoundary: new URL(
    "../app/(site)/blog/_components/BlogHistoryBoundary.tsx",
    import.meta.url,
  ),
  page: new URL("../app/(site)/blog/page.tsx", import.meta.url),
  styles: new URL("../app/(site)/blog/page.module.css", import.meta.url),
};

async function source(name) {
  return readFile(paths[name], "utf8");
}

test("blog page keeps the shared header, hero, and category state contracts", async () => {
  const [header, page, board] = await Promise.all([
    source("header"),
    source("page"),
    source("board"),
  ]);

  assert.match(header, /label: "블로그", href: "\/blog"/);
  assert.match(
    header,
    /if \(href === "\/blog"\) return pathname\.startsWith\("\/blog"\);/,
  );
  assert.match(page, /searchParams: Promise<\{ category\?: string \}>/);
  assert.match(page, /resolveBlogCategory\(category\)/);
  assert.match(page, /activeCategory=\{activeCategory\}/);
  assert.match(board, /const params = new URLSearchParams\(\{ category \}\)/);
  assert.match(board, /href=\{getCategoryHref\(category\)\}/);
  assert.match(board, /scroll=\{false\}/);
  assert.match(
    board,
    /aria-current=\{activeCategory === category \? "page" : undefined\}/,
  );
});

test("blog list page exposes SEO metadata", async () => {
  const page = await source("page");

  assert.match(page, /import type \{ Metadata \} from "next"/);
  assert.match(page, /export const metadata: Metadata = \{/);
  assert.match(page, /title: "블로그 \| C-Brain"/);
  assert.match(page, /description:/);
  assert.match(page, /openGraph:/);
  assert.match(page, /twitter:/);
});

test("blog featured carousel supports configurable autoplay and hover pause", async () => {
  const featuredCard = await source("featuredCard");

  assert.match(featuredCard, /BLOG_FEATURED_SLIDE_INTERVAL_MS = 5000/);
  assert.match(featuredCard, /window\.setInterval\(/);
  assert.match(featuredCard, /setIsPaused\(true\)/);
  assert.match(featuredCard, /setIsPaused\(false\)/);
  assert.match(featuredCard, /translateX\(-\$\{trackIndex \* 100\}%\)/);
  assert.match(featuredCard, /BLOG_FEATURED_SWIPE_THRESHOLD_PX/);
  assert.match(featuredCard, /ArrowLeft/);
  assert.match(featuredCard, /ArrowRight/);
});

test("blog featured carousel wraps infinitely through cloned edge slides", async () => {
  const [featuredCard, styles] = await Promise.all([
    source("featuredCard"),
    source("styles"),
  ]);

  assert.match(featuredCard, /BLOG_FEATURED_TRANSITION_MS = 420/);
  assert.match(featuredCard, /displayedPosts/);
  assert.match(featuredCard, /posts\[slideCount - 1\]/);
  assert.match(featuredCard, /posts\[0\]/);
  assert.match(featuredCard, /getLoopedTrackIndex/);
  assert.match(
    featuredCard,
    /\(\(\(currentIndex - 1\) % slideCount\) \+ slideCount\) % slideCount/,
  );
  assert.match(featuredCard, /window\.setTimeout\(/);
  assert.match(featuredCard, /BLOG_FEATURED_TRANSITION_MS/);
  assert.match(featuredCard, /trackIndex < 0 \|\| trackIndex > slideCount \+ 1/);
  assert.match(featuredCard, /trackIndex === slideCount \+ 1/);
  assert.match(featuredCard, /onTransitionEnd=\{handleTrackTransitionEnd\}/);
  assert.match(featuredCard, /styles\.blogFeaturedTrackInstant/);
  assert.match(styles, /\.blogFeaturedTrackInstant/);
});

test("blog featured carousel ignores overlapping slide commands while moving", async () => {
  const featuredCard = await source("featuredCard");

  assert.match(featuredCard, /isSlideLockedRef/);
  assert.match(featuredCard, /slideUnlockTimerRef/);
  assert.match(featuredCard, /unlockSlide/);
  assert.match(featuredCard, /moveSlide/);
  assert.match(
    featuredCard,
    /if \(!hasMultipleSlides \|\| isSlideLockedRef\.current\) return;/,
  );
  assert.match(featuredCard, /window\.setTimeout\(/);
  assert.match(featuredCard, /BLOG_FEATURED_TRANSITION_MS/);
});

test("blog featured carousel keeps drag gestures from becoming native link drags", async () => {
  const featuredCard = await source("featuredCard");
  const sectionMarkup = featuredCard.match(
    /<section[\s\S]*?tabIndex=\{0\}[\s\S]*?>/,
  )?.[0];
  const linkMarkup = featuredCard.match(
    /<Link[\s\S]*?tabIndex=\{trackIndex === index \? undefined : -1\}[\s\S]*?>/,
  )?.[0];

  assert.match(featuredCard, /handleDragStart/);
  assert.match(featuredCard, /event\.preventDefault\(\)/);
  assert.doesNotMatch(featuredCard, /setPointerCapture/);
  assert.doesNotMatch(featuredCard, /releasePointerCapture/);
  assert.match(featuredCard, /draggable=\{false\}/);
  assert.match(featuredCard, /onDragStart=\{handleDragStart\}/);
  assert.doesNotMatch(sectionMarkup ?? "", /onPointerDown/);
  assert.match(linkMarkup ?? "", /onPointerDown=\{handlePointerDown\}/);
  assert.match(linkMarkup ?? "", /onPointerUp=\{handlePointerUp\}/);
  assert.match(linkMarkup ?? "", /onPointerCancel=\{handlePointerCancel\}/);
  assert.match(featuredCard, /import \{ useRouter \} from "next\/navigation"/);
  assert.match(featuredCard, /const router = useRouter\(\)/);
  assert.match(featuredCard, /event\.currentTarget\.getAttribute\("href"\)/);
  assert.match(featuredCard, /router\.push\(href\)/);
});

test("blog list prepares notice-style history restore and popular heading separator", async () => {
  const [board, historyBoundary, styles] = await Promise.all([
    source("board"),
    source("historyBoundary"),
    source("styles"),
  ]);

  assert.match(board, /<BlogHistoryBoundary listHref=\{listHref\}>/);
  assert.match(historyBoundary, /consumeBlogListScrollRestore\(listHref\)/);
  assert.match(historyBoundary, /rememberBlogListHistory/);
  assert.match(historyBoundary, /\[data-blog-detail-href\]/);
  assert.doesNotMatch(styles, /\.blogPopularList::before/);
  assert.match(styles, /\.blogPopularHeading::after/);
  assert.match(
    styles,
    /rgba\(30, 41, 59, 0\) 0%[\s\S]*rgba\(30, 41, 59, 0\.2\) 50%[\s\S]*rgba\(30, 41, 59, 0\) 100%/,
  );
  assert.match(styles, /\.blogCategoryButton\[aria-current="page"\]/);
});

test("blog data mirrors admin landing, banner, and popular settings", async () => {
  const [types, posts, board, popularList] = await Promise.all([
    source("types"),
    source("posts"),
    source("board"),
    readFile(
      new URL(
        "../app/(site)/blog/_components/BlogPopularList.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.match(types, /landingRank\?: number/);
  assert.match(types, /bannerRank\?: number/);
  assert.match(types, /popularRank\?: number/);
  assert.doesNotMatch(types, /featured: boolean/);
  assert.match(posts, /landingRank: 1/);
  assert.match(posts, /bannerRank: 1/);
  assert.match(posts, /popularRank: 1/);
  assert.doesNotMatch(posts, /featured:/);
  assert.match(board, /getBannerSlides/);
  assert.match(board, /post\.bannerRank/);
  assert.match(popularList, /post\.popularRank/);
});

test("blog list uses semantic navigation and article lists without changing visual hooks", async () => {
  const [board, card, authorMeta, featuredCard, styles] = await Promise.all([
    source("board"),
    source("card"),
    source("authorMeta"),
    source("featuredCard"),
    source("styles"),
  ]);

  assert.match(board, /<nav[\s\S]*aria-label="블로그 카테고리"/);
  assert.match(board, /<ul className=\{styles\.blogCategoryList\}>/);
  assert.match(board, /<li key=\{category\}>/);
  assert.doesNotMatch(board, /role="group"/);
  assert.match(board, /<ul className=\{styles\.blogOrdinaryGrid\}>/);
  assert.match(card, /<li className=\{styles\.blogCard\}>/);
  assert.match(card, /<article>/);
  assert.match(
    authorMeta,
    /<footer className=\{styles\.blogAuthorMeta\}>/,
  );
  assert.match(authorMeta, /dateTime=\{publishedAtIso\}/);
  assert.match(
    featuredCard,
    /<header className=\{styles\.blogFeaturedContent\}>/,
  );
  assert.match(
    styles,
    /\.blogCategoryList\s*\{[\s\S]*margin: 0;[\s\S]*list-style: none;/,
  );
  assert.match(
    styles,
    /\.blogOrdinaryGrid\s*\{[\s\S]*margin: 0;[\s\S]*list-style: none;/,
  );
});

test("blog category active tab uses a transparent-edge gradient underline", async () => {
  const styles = await source("styles");
  const activeCategoryStyle = styles.match(
    /\.blogCategoryButton\[aria-current="page"\]\s*\{[\s\S]*?\}/,
  )?.[0];

  assert.match(styles, /\.blogCategoryButton\s*\{[\s\S]*position: relative/);
  assert.doesNotMatch(activeCategoryStyle ?? "", /border-bottom-color/);
  assert.match(styles, /\.blogCategoryButton\[aria-current="page"\]::after/);
  assert.match(
    styles,
    /rgba\(48, 186, 195, 0\) 0%[\s\S]*var\(--landing-brand-500\) 50%[\s\S]*rgba\(48, 186, 195, 0\) 100%/,
  );
});

test("blog hero applies the Figma white dim below the fold breakpoint", async () => {
  const styles = await source("styles");

  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*\.page > section:first-child > div:nth-child\(2\)\s*\{[\s\S]*background: rgba\(255, 255, 255, 0\.8\)/,
  );
});

test("blog hero title uses the shared mobile-only line break pattern", async () => {
  const [page, styles] = await Promise.all([source("page"), source("styles")]);

  assert.match(
    page,
    /홍보물 제작\s*<br className=\{styles\.heroMobileBreak\} \/> 디자인 · 인쇄 실무 꿀팁/,
  );
  assert.match(
    styles,
    /@media \(min-width: 640px\)[\s\S]*\.heroMobileBreak\s*\{[\s\S]*display: none;/,
  );
});

test("blog detail page follows portfolio detail route conventions", async () => {
  const [detailPage, posts] = await Promise.all([
    source("detailPage"),
    source("posts"),
  ]);

  assert.match(posts, /slug:/);
  assert.match(posts, /detail:/);
  assert.match(posts, /body:/);
  assert.match(posts, /relatedBlogPosts/);
  assert.match(detailPage, /import type \{ Metadata \} from "next"/);
  assert.match(detailPage, /import Image from "next\/image"/);
  assert.match(detailPage, /import Link from "next\/link"/);
  assert.match(detailPage, /import \{ notFound \} from "next\/navigation"/);
  assert.match(detailPage, /export function generateStaticParams\(\)/);
  assert.match(detailPage, /export async function generateMetadata/);
  assert.match(detailPage, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(
    detailPage,
    /alternates: canonicalUrl \? \{ canonical: canonicalUrl \} : undefined/,
  );
  assert.match(detailPage, /openGraph: \{[\s\S]*type: "article"/);
  assert.match(detailPage, /blogPosts\.map\(\(post\) => \(\{\s*slug: post\.slug/);
  assert.match(detailPage, /notFound\(\)/);
});

test("blog detail page keeps semantic article markup and list restoration", async () => {
  const [detailPage, detailBackLink] = await Promise.all([
    source("detailPage"),
    source("detailBackLink"),
  ]);

  assert.match(
    detailPage,
    /<article[\s\S]*className=\{styles\.blogDetailPage\}[\s\S]*itemScope[\s\S]*itemType="https:\/\/schema\.org\/Article"/,
  );
  assert.match(detailPage, /itemProp="articleSection"/);
  assert.match(
    detailPage,
    /<h1[\s\S]*id="blog-detail-title"[\s\S]*itemProp="headline"/,
  );
  assert.match(
    detailPage,
    /<address[\s\S]*className=\{styles\.blogDetailAuthorLine\}[\s\S]*itemProp="author"[\s\S]*itemScope[\s\S]*itemType="https:\/\/schema\.org\/Organization"/,
  );
  assert.match(detailPage, /<time[\s\S]*dateTime=\{post\.publishedAtIso\}/);
  assert.match(
    detailPage,
    /<section[\s\S]*aria-labelledby="blog-detail-title"[\s\S]*itemProp="articleBody"/,
  );
  assert.match(detailPage, /<BlogDetailBackLink href=\{listHref\} \/>/);
  assert.match(detailBackLink, /consumeBlogListHistory\(href, detailHref\)/);
  assert.match(detailBackLink, /rememberBlogListScrollRestore\(href, scrollY\)/);
  assert.match(detailBackLink, /router\.back\(\)/);
  assert.match(detailPage, /aria-labelledby="more-blog-title"/);
});

test("blog detail page marks related posts as complementary article links", async () => {
  const detailPage = await source("detailPage");

  assert.match(
    detailPage,
    /<aside[\s\S]*aria-labelledby="more-blog-title"[\s\S]*className=\{styles\.moreBlogSection\}/,
  );
  assert.match(detailPage, /<ul className=\{styles\.moreBlogList\}>/);
  assert.match(
    detailPage,
    /<article[\s\S]*aria-labelledby=\{`more-blog-\$\{relatedPost\.id\}-title`\}/,
  );
  assert.match(
    detailPage,
    /<h3[\s\S]*id=\{`more-blog-\$\{relatedPost\.id\}-title`\}/,
  );
  assert.match(detailPage, /<footer className=\{styles\.moreBlogMeta\}>/);
});

test("blog detail styles match the P/T/F/M responsive detail frame", async () => {
  const styles = await source("detailStyles");

  assert.match(styles, /\.blogDetailInner/);
  assert.match(styles, /width: min\(calc\(100% - 40px\), 640px\)/);
  assert.match(styles, /padding: 52px 0 88px/);
  assert.match(styles, /\.blogDetailContent/);
  assert.match(styles, /font-size: 16px/);
  assert.match(styles, /line-height: 24px/);
  assert.match(styles, /\.moreBlogList/);
  assert.match(styles, /grid-template-columns: 200px minmax\(0, 1fr\)/);
  assert.match(styles, /height: 140px/);
  assert.match(styles, /@media \(max-width: 480px\)/);
  assert.match(styles, /height: 240px/);
});
