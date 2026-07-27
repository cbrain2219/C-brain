import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paths = {
  board: new URL(
    "../app/(site)/notice/_components/NoticeBoard.tsx",
    import.meta.url,
  ),
  data: new URL("../app/(site)/notice/_data/notices.ts", import.meta.url),
  detailArticle: new URL(
    "../app/(site)/notice/[id]/_components/NoticeDetailArticle.tsx",
    import.meta.url,
  ),
  detailPage: new URL("../app/(site)/notice/[id]/page.tsx", import.meta.url),
  detailStyles: new URL(
    "../app/(site)/notice/[id]/page.module.css",
    import.meta.url,
  ),
  icon: new URL("../components/Icon.tsx", import.meta.url),
  item: new URL(
    "../app/(site)/notice/_components/NoticeItem.tsx",
    import.meta.url,
  ),
  listPage: new URL("../app/(site)/notice/page.tsx", import.meta.url),
  listStyles: new URL(
    "../app/(site)/notice/page.module.css",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(paths[name], "utf8");
}

test("notice data feeds pinned, regular, filtered, and detail views", async () => {
  const data = await source("data");
  const fixtureBlock = data.slice(
    data.indexOf("const noticeFixtures = ["),
    data.indexOf("] satisfies NoticeSummary[];"),
  );

  assert.match(data, /const noticeFixtures = \[/);
  assert.equal(fixtureBlock.match(/\bid: "/g)?.length, 15);
  assert.match(data, /isPinned: true/);
  assert.match(data, /isPinned: false/);
  assert.match(data, /activeCategory === "all"/);
  assert.match(data, /item\.id === id/);
  assert.match(data, /\.\.\.sharedDetailContent/);
  assert.doesNotMatch(data, /dangerouslySetInnerHTML/);
});

test("notice list and detail stay fixture-only", async () => {
  const data = await source("data");

  assert.doesNotMatch(data, /@repo\/supabase/);
  assert.doesNotMatch(data, /createUserSupabaseClient/);
  assert.doesNotMatch(data, /listPublishedPosts/);
  assert.doesNotMatch(data, /getPublishedPost/);
  assert.match(data, /export function getNoticePageData/);
  assert.match(data, /totalCount: noticeFixtures\.length/);
  assert.match(data, /export function getNoticeById/);
});

test("notice list keeps category, pinned, detail-link, and shared-icon contracts", async () => {
  const [listPage, board, item, icon] = await Promise.all([
    source("listPage"),
    source("board"),
    source("item"),
    source("icon"),
  ]);

  assert.match(listPage, /resolveNoticeCategory\(category\)/);
  assert.match(listPage, /getNoticePageData\(activeCategory\)/);
  assert.match(board, /notice\.isPinned/);
  assert.match(board, /!notice\.isPinned/);
  assert.match(board, /aria-current=\{isActive \? "page" : undefined\}/);
  assert.match(item, /\?from=\$\{activeCategory\}/);
  assert.match(item, /<Icon[^>]*name="pin"[^>]*\/>/s);
  assert.doesNotMatch(item, /function PinIcon/);
  assert.match(icon, /\| "pin"/);
  assert.match(icon, /pin: PinIcon/);
});

test("notice active category underline stays visible while overlapping the rail", async () => {
  const styles = await source("listStyles");
  const categoryRailStyle = styles.match(/\.categoryRail\s*\{[\s\S]*?\}/)?.[0];

  assert.match(
    categoryRailStyle ?? "",
    /background:\s*linear-gradient\(var\(--landing-gray-100\), var\(--landing-gray-100\)\)[\s\S]*center bottom\s*\/\s*100% 1px no-repeat;/,
  );
  assert.doesNotMatch(styles, /\.categoryRail::before/);
  assert.doesNotMatch(styles, /\.categoryRail::after/);
  assert.match(styles, /\.categoryLink:first-child\s*\{[\s\S]*?margin-left:\s*20px;/);
  assert.match(styles, /\.categoryLink:last-child\s*\{[\s\S]*?margin-right:\s*20px;/);
  assert.doesNotMatch(styles, /\.categoryLink\s*\{[\s\S]*?border-bottom:/);

  assert.match(
    styles,
    /\.categoryLinkActive::after\s*\{[\s\S]*?bottom:\s*0;/,
  );
});

test("notice detail keeps metadata, 404, structured content, and list return", async () => {
  const [page, article, detailStyles] = await Promise.all([
    source("detailPage"),
    source("detailArticle"),
    source("detailStyles"),
  ]);

  assert.match(page, /notFound\(\)/);
  assert.match(page, /await getNoticeById\(id\)/);
  assert.match(page, /title: `\$\{notice\.title\} \| 씨브레인`/);
  assert.match(article, /<strong>작성자<\/strong>/);
  assert.match(article, /className=\{styles\.author\}/);
  assert.match(detailStyles, /\.metaGroup\s*\{[\s\S]*gap: 8px;/);
  assert.match(detailStyles, /\.author\s*\{[\s\S]*gap: 4px;/);
  assert.match(article, /<time dateTime=\{notice\.publishedAt\}>/);
  assert.match(article, /notice\.content\.map/);
  assert.match(article, /block\.type === "paragraph"/);
  assert.match(article, /<NoticeBackButton/);
});
