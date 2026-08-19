import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paths = {
  board: new URL(
    "../app/(site)/notice/_components/NoticeBoard.tsx",
    import.meta.url,
  ),
  categories: new URL(
    "../app/(site)/notice/_constants/noticeCategories.ts",
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

async function importNoticeMappers() {
  const [categoriesSource, dataSource] = await Promise.all([
    source("categories"),
    source("data"),
  ]);
  const stripImports = (value) =>
    value.replace(/import[\s\S]*?from "[^"]+";\n/g, "");
  const runnableSource = `
const cache = (loader) => loader;
const createPublicUserSupabaseClient = () => null;
const getPublishedPost = async () => null;
const listPublishedPosts = async () => [];
${stripImports(categoriesSource)}
${stripImports(dataSource)}
`;
  const ts = await import("typescript");
  const { outputText } = ts.transpileModule(runnableSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}

function noticeRow(overrides = {}) {
  return {
    content: "공지 본문입니다.",
    content_mode: "markdown",
    created_at: "2026-08-01T00:00:00.000Z",
    excerpt: "공지 요약입니다.",
    featured: false,
    id: "post-id",
    kind: "notice",
    pinned: false,
    published_at: "2026-08-02T00:00:00.000Z",
    seo_description: null,
    show_as_banner: false,
    show_on_landing: false,
    slug: "notice-slug",
    sort_order: 1,
    status: "published",
    thumbnail_alt: null,
    thumbnail_path: null,
    title: "공지 제목",
    type: "공지",
    view_count: 0,
    ...overrides,
  };
}

test("notice data feeds pinned, regular, filtered, and detail views", async () => {
  const {
    getNoticeById,
    getNoticePageData,
    mapNoticeDetail,
    mapNoticeRows,
  } = await importNoticeMappers();
  const rows = [
    noticeRow({ id: "1", pinned: true, slug: "first", type: "공지" }),
    noticeRow({ id: "2", slug: "second", type: "이벤트" }),
    noticeRow({ id: "3", slug: "third", type: "휴무 안내" }),
    noticeRow({ id: "4", slug: "fourth", type: "서비스 변경" }),
    noticeRow({ id: "5", slug: "fifth", type: "수상 · 소식" }),
    noticeRow({ id: "6", slug: "sixth", type: "새 분류" }),
  ];
  const pageData = mapNoticeRows(rows, "all");

  assert.deepEqual(
    pageData.notices.map(({ id }) => id),
    ["first", "second", "third", "fourth", "fifth", "sixth"],
  );
  assert.deepEqual(
    pageData.notices.map(({ category }) => category),
    ["notice", "event", "holiday", "service", "news", "notice"],
  );
  assert.equal(pageData.notices[0].isPinned, true);
  assert.equal(pageData.totalCount, 6);
  assert.deepEqual(
    mapNoticeRows(rows, "event").notices.map(({ id }) => id),
    ["second"],
  );

  const markdownDetail = mapNoticeDetail(
    noticeRow({
      content:
        "안내 문단입니다.\n\n1. 첫 번째 안내\n   - 세부 내용 A\n   - 세부 내용 B\n2. 두 번째 안내\n   - 세부 내용 C",
    }),
  );
  assert.deepEqual(markdownDetail.content, [
    { text: "안내 문단입니다.", type: "paragraph" },
    {
      items: [
        { title: "첫 번째 안내", details: ["세부 내용 A", "세부 내용 B"] },
        { title: "두 번째 안내", details: ["세부 내용 C"] },
      ],
      type: "ordered-list",
    },
  ]);

  const htmlDetail = mapNoticeDetail(
    noticeRow({
      content:
        "<p>안전한 공지입니다.</p><script>window.stolen=true</script><style>body{display:none}</style>&lt;script&gt;encodedStolen=true&lt;/script&gt;",
      content_mode: "html",
    }),
  );
  const htmlText = JSON.stringify(htmlDetail.content);
  assert.match(htmlText, /안전한 공지입니다/);
  assert.doesNotMatch(htmlText, /script|style|stolen|display|encoded|<|>/i);
  assert.equal((await getNoticePageData("all")).totalCount, 0);
  assert.equal(await getNoticeById("notice-slug"), undefined);
});

test("notice list and detail load published Supabase rows", async () => {
  const data = await source("data");

  assert.match(data, /@repo\/supabase/);
  assert.match(data, /createPublicUserSupabaseClient/);
  assert.match(data, /listPublishedPosts\(client, "notice"\)/);
  assert.match(data, /getPublishedPost\(client, "notice", id\)/);
  assert.match(data, /export const getNoticePageData/);
  assert.match(data, /export const getNoticeById/);
  assert.match(data, /mapNoticeCategory/);
  assert.doesNotMatch(data, /const noticeFixtures/);
  assert.doesNotMatch(data, /dangerouslySetInnerHTML/);
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
    /background:\s*linear-gradient\(var\(--landing-gray-100\), var\(--landing-gray-100\)\)[\s\S]*center bottom\s*\/\s*calc\(100% - 40px\) 1px no-repeat;/,
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

test("notice section uses the requested responsive header-to-board gap", async () => {
  const styles = await source("listStyles");
  const sectionInnerStyle = styles.match(/\.sectionInner\s*\{[\s\S]*?\}/)?.[0];

  assert.match(sectionInnerStyle ?? "", /gap:\s*32px;/);
  assert.match(
    styles,
    /@media \(min-width: 1081px\) \{[\s\S]*?\.sectionInner\s*\{[^}]*gap:\s*52px;/,
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
  assert.match(article, /import \{ RawHtmlDocumentFrame \}/);
  assert.match(article, /notice\.managedContent\.contentMode === "html"/);
  assert.match(
    article,
    /notice\.managedContent\.contentAuthoringMode === "raw_html"/,
  );
  assert.match(
    article,
    /<RawHtmlDocumentFrame html=\{rawHtmlSource\} title=\{notice\.title\} \/>/,
  );
  assert.match(article, /<ManagedContent/);
  assert.match(article, /notice\.content\.map/);
  assert.match(article, /block\.type === "paragraph"/);
  assert.match(article, /<NoticeBackButton/);
});
