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
  icon: new URL("../components/Icon.tsx", import.meta.url),
  item: new URL(
    "../app/(site)/notice/_components/NoticeItem.tsx",
    import.meta.url,
  ),
  listPage: new URL("../app/(site)/notice/page.tsx", import.meta.url),
};

async function source(name) {
  return readFile(paths[name], "utf8");
}

test("notice data feeds pinned, regular, filtered, and detail views", async () => {
  const data = await source("data");

  assert.match(data, /const noticeFixtures = \[/);
  assert.match(data, /isPinned: true/);
  assert.match(data, /isPinned: false/);
  assert.match(data, /listPublishedPosts\(client, "notice"\)/);
  assert.match(data, /getPublishedPost\(client, "notice", id\)/);
  assert.match(data, /createUserSupabaseClient\(\)/);
  assert.match(data, /activeCategory === "all"/);
  assert.match(data, /Number\(secondPost\.is_pinned\) - Number\(firstPost\.is_pinned\)/);
  assert.match(data, /firstPost\.sort_order - secondPost\.sort_order/);
  assert.match(data, /item\.id === id/);
  assert.doesNotMatch(data, /dangerouslySetInnerHTML/);
});

test("notice loaders keep fixtures for missing env and fail closed on query errors", async () => {
  const data = await source("data");

  assert.match(data, /if \(!client\) return \[\.\.\.noticeFixtures\]/);
  assert.match(data, /if \(!client\) return noticeFixtures\.find/);
  assert.match(data, /console\.error\("Failed to load published notices\./);
  assert.match(data, /console\.error\("Failed to load published notice detail\./);
  assert.match(data, /catch \(error\)/);
  assert.match(data, /return \[\]/);
  assert.match(data, /return undefined/);
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

test("notice detail keeps metadata, 404, structured content, and list return", async () => {
  const [page, article] = await Promise.all([
    source("detailPage"),
    source("detailArticle"),
  ]);

  assert.match(page, /notFound\(\)/);
  assert.match(page, /await getNoticeById\(id\)/);
  assert.match(page, /title: `\$\{notice\.title\} \| 씨브레인`/);
  assert.match(article, /<time dateTime=\{notice\.publishedAt\}>/);
  assert.match(article, /notice\.content\.map/);
  assert.match(article, /block\.type === "paragraph"/);
  assert.match(article, /<NoticeBackButton/);
});
