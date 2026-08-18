import {
  getPublishedPost,
  listPublishedPosts,
  type PublicPostRecord,
} from "@repo/supabase";
import { cache } from "react";

import { createPublicUserSupabaseClient } from "../../../../lib/supabase";
import { noticeCategories } from "../_constants/noticeCategories";
import type {
  NoticeCategoryValue,
  NoticeContentBlock,
  NoticeDetail,
  NoticePageData,
  NoticeSummary,
} from "../_types/notice";

type NoticeRow = PublicPostRecord;
type PublishedNoticeCategory = Exclude<NoticeCategoryValue, "all">;

const noticeCategoryByType: Record<string, PublishedNoticeCategory> = {
  공지: "notice",
  이벤트: "event",
  "서비스 변경": "service",
  "수상 · 소식": "news",
  "휴무 안내": "holiday",
};

export function resolveNoticeCategory(
  category: string | undefined,
): NoticeCategoryValue {
  return noticeCategories.some((item) => item.value === category) && category
    ? (category as NoticeCategoryValue)
    : "all";
}

export function mapNoticeCategory(type: string): PublishedNoticeCategory {
  const normalizedType = type.trim().replace(/\s+/g, " ");
  return noticeCategoryByType[normalizedType] ?? "notice";
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#(\d+);/g, (entity, code) => {
      const codePoint = Number(code);
      return Number.isSafeInteger(codePoint) &&
        codePoint >= 0 &&
        codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity;
    })
    .replace(/&#x([\da-f]+);/gi, (entity, code) => {
      const codePoint = Number.parseInt(code, 16);
      return Number.isSafeInteger(codePoint) &&
        codePoint >= 0 &&
        codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity;
    })
    .replace(/&([a-z]+);/gi, (entity, name) => namedEntities[name] ?? entity);
}

function stripUnsafeElements(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?(?:<\/script>|$)/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?(?:<\/style>|$)/gi, " ");
}

function htmlToPlainText(value: string) {
  return stripUnsafeElements(decodeHtmlEntities(value))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:blockquote|div|h[1-6]|li|p)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function markdownLineToPlainText(value: string) {
  return stripUnsafeElements(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function markdownToNoticeContent(value: string): NoticeContentBlock[] {
  const blocks: NoticeContentBlock[] = [];
  const safeContent = stripUnsafeElements(decodeHtmlEntities(value));
  let paragraphLines: string[] = [];
  let orderedItems: { details: string[]; title: string }[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join(" ").trim();
    if (text) blocks.push({ text, type: "paragraph" });
    paragraphLines = [];
  };
  const flushOrderedList = () => {
    if (orderedItems.length > 0) {
      blocks.push({ items: orderedItems, type: "ordered-list" });
    }
    orderedItems = [];
  };

  for (const rawLine of safeContent.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushOrderedList();
      continue;
    }

    const orderedItem = line.match(/^\d+[.)]\s+(.+)$/);
    if (orderedItem) {
      flushParagraph();
      orderedItems.push({
        details: [],
        title: markdownLineToPlainText(orderedItem[1] ?? ""),
      });
      continue;
    }

    const detailItem = line.match(/^[-+]\s+(.+)$/);
    const currentOrderedItem = orderedItems.at(-1);
    if (detailItem && currentOrderedItem) {
      currentOrderedItem.details.push(
        markdownLineToPlainText(detailItem[1] ?? ""),
      );
      continue;
    }

    flushOrderedList();
    paragraphLines.push(
      markdownLineToPlainText(
        line.replace(/^#{1,6}\s+/, "").replace(/^>\s?/, ""),
      ),
    );
  }

  flushParagraph();
  flushOrderedList();
  return blocks;
}

function toNoticeContent(row: NoticeRow): NoticeContentBlock[] {
  if (row.content_mode === "markdown") {
    return markdownToNoticeContent(row.content);
  }

  return htmlToPlainText(row.content)
    .split(/\n+/)
    .filter(Boolean)
    .map((text) => ({ text, type: "paragraph" }));
}

function getNoticeExcerpt(row: NoticeRow) {
  const excerpt = htmlToPlainText(row.excerpt ?? "");
  if (excerpt) return excerpt.replace(/\n+/g, " ");

  const firstBlock = toNoticeContent(row)[0];
  if (!firstBlock) return "";
  if (firstBlock.type === "paragraph") return firstBlock.text;

  return firstBlock.items[0]?.title ?? "";
}

function mapNoticeSummary(row: NoticeRow): NoticeSummary {
  return {
    author: "씨브레인",
    category: mapNoticeCategory(row.type),
    excerpt: getNoticeExcerpt(row),
    id: row.slug,
    isPinned: row.pinned,
    publishedAt: row.published_at,
    title: row.title,
  };
}

export function mapNoticeRows(
  rows: readonly NoticeRow[],
  activeCategory: NoticeCategoryValue,
): NoticePageData {
  const notices = rows
    .filter((row) => row.kind === "notice" && row.status === "published")
    .map(mapNoticeSummary);
  const filteredNotices =
    activeCategory === "all"
      ? notices
      : notices.filter((notice) => notice.category === activeCategory);

  return {
    categories: noticeCategories,
    notices: filteredNotices,
    totalCount: notices.length,
  };
}

export function mapNoticeDetail(row: NoticeRow): NoticeDetail {
  return {
    ...mapNoticeSummary(row),
    content: toNoticeContent(row),
    managedContent: {
      content: row.content,
      contentAssetScope: row.content_asset_scope,
      contentAuthoringMode: row.content_authoring_mode,
      contentMode: row.content_mode,
      entity: "notice",
      title: row.title,
    },
  };
}

function emptyNoticePageData(): NoticePageData {
  return {
    categories: noticeCategories,
    notices: [],
    totalCount: 0,
  };
}

async function loadNoticePageData(activeCategory: NoticeCategoryValue) {
  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return emptyNoticePageData();

    const rows = await listPublishedPosts(client, "notice");
    return mapNoticeRows(rows, activeCategory);
  } catch (error) {
    console.error("Failed to load published notices.", error);
    return emptyNoticePageData();
  }
}

async function loadNoticeById(id: string) {
  try {
    const client = createPublicUserSupabaseClient();
    if (!client) return undefined;

    const row = await getPublishedPost(client, "notice", id);
    return row ? mapNoticeDetail(row) : undefined;
  } catch (error) {
    console.error("Failed to load published notice.", error);
    return undefined;
  }
}

export const getNoticePageData = cache(loadNoticePageData);
export const getNoticeById = cache(loadNoticeById);
