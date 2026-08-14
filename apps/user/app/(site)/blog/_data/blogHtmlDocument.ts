import createDOMPurify, { type WindowLike } from "dompurify";
import { JSDOM } from "jsdom";
import postcss, { type AtRule, type Declaration, type Plugin } from "postcss";
import prefixSelector from "postcss-prefix-selector";

import type {
  JsonLdData,
  JsonLdValue,
} from "../../../_content/structured-data";

export const BLOG_HTML_SCOPE_ATTRIBUTE = "data-blog-html-document";
export const BLOG_HTML_SCOPE_SELECTOR = `[${BLOG_HTML_SCOPE_ATTRIBUTE}]`;

type BlogHtmlOpenGraphMetadata = {
  author?: string;
  description?: string;
  image?: string;
  locale?: string;
  modifiedTime?: string;
  publishedTime?: string;
  section?: string;
  siteName?: string;
  title?: string;
  type?: "article" | "website";
  url?: string;
};

type BlogHtmlTwitterMetadata = {
  card?: "summary" | "summary_large_image";
  description?: string;
  image?: string;
  title?: string;
};

export type BlogHtmlHeadMetadata = {
  author?: string;
  canonical?: string;
  description?: string;
  keywords?: readonly string[];
  openGraph: BlogHtmlOpenGraphMetadata;
  robots?: string;
  title?: string;
  twitter: BlogHtmlTwitterMetadata;
};

export type BlogHtmlDocument = {
  bodyHtml: string;
  css: string;
  jsonLd: readonly JsonLdData[];
  metadata: BlogHtmlHeadMetadata;
};

const unsafeCssValuePattern =
  /(?:expression\s*\(|(?:java|vb)script\s*:|-moz-binding\s*:|behavior\s*:)/i;
const documentWideAtRules = new Set([
  "counter-style",
  "font-face",
  "import",
  "namespace",
  "page",
  "property",
]);

function getContent(element: Element | null) {
  const value = element?.getAttribute("content")?.trim();

  return value || undefined;
}

function getMetaByName(document: Document, name: string) {
  return getContent(document.querySelector(`meta[name="${name}"]`));
}

function getMetaByProperty(document: Document, property: string) {
  return getContent(document.querySelector(`meta[property="${property}"]`));
}

function getCanonical(document: Document) {
  const href = document
    .querySelector('link[rel~="canonical"]')
    ?.getAttribute("href")
    ?.trim();

  return href || undefined;
}

function getKeywords(document: Document) {
  const value = getMetaByName(document, "keywords");

  if (!value) return undefined;

  const keywords = value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return keywords.length > 0 ? keywords : undefined;
}

function getOpenGraphType(document: Document) {
  const value = getMetaByProperty(document, "og:type");

  return value === "article" || value === "website" ? value : undefined;
}

function getTwitterCard(document: Document) {
  const value = getMetaByName(document, "twitter:card");

  return value === "summary" || value === "summary_large_image"
    ? value
    : undefined;
}

function extractMetadata(document: Document): BlogHtmlHeadMetadata {
  const title = document.querySelector("head > title")?.textContent?.trim();

  return {
    author: getMetaByName(document, "author"),
    canonical: getCanonical(document),
    description: getMetaByName(document, "description"),
    keywords: getKeywords(document),
    openGraph: {
      author: getMetaByProperty(document, "article:author"),
      description: getMetaByProperty(document, "og:description"),
      image: getMetaByProperty(document, "og:image"),
      locale: getMetaByProperty(document, "og:locale"),
      modifiedTime: getMetaByProperty(document, "article:modified_time"),
      publishedTime: getMetaByProperty(document, "article:published_time"),
      section: getMetaByProperty(document, "article:section"),
      siteName: getMetaByProperty(document, "og:site_name"),
      title: getMetaByProperty(document, "og:title"),
      type: getOpenGraphType(document),
      url: getMetaByProperty(document, "og:url"),
    },
    robots: getMetaByName(document, "robots"),
    title: title || undefined,
    twitter: {
      card: getTwitterCard(document),
      description: getMetaByName(document, "twitter:description"),
      image: getMetaByName(document, "twitter:image"),
      title: getMetaByName(document, "twitter:title"),
    },
  };
}

function isJsonLdValue(value: unknown): value is JsonLdValue {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonLdValue);
  }

  return typeof value === "object" && Object.values(value).every(isJsonLdValue);
}

function isJsonLdData(value: unknown): value is JsonLdData {
  return (
    value !== null &&
    !Array.isArray(value) &&
    typeof value === "object" &&
    isJsonLdValue(value)
  );
}

function extractJsonLd(document: Document) {
  return [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((script) => {
      try {
        const value: unknown = JSON.parse(script.textContent ?? "");

        return isJsonLdData(value) ? value : undefined;
      } catch {
        return undefined;
      }
    })
    .filter((value): value is JsonLdData => value !== undefined);
}

function removeDocumentWideAtRule(atRule: AtRule) {
  if (documentWideAtRules.has(atRule.name.toLowerCase())) {
    atRule.remove();
  }
}

function removeUnsafeDeclaration(declaration: Declaration) {
  if (unsafeCssValuePattern.test(`${declaration.prop}:${declaration.value}`)) {
    declaration.remove();
  }
}

const isolateBlogCssPlugin: Plugin = {
  AtRule: removeDocumentWideAtRule,
  Declaration: removeUnsafeDeclaration,
  postcssPlugin: "cbrain-isolate-blog-html-css",
};

function scopeCss(css: string) {
  if (!css.trim()) return "";

  try {
    return postcss([
      isolateBlogCssPlugin,
      prefixSelector({ prefix: BLOG_HTML_SCOPE_SELECTOR }),
    ]).process(css, { from: undefined }).css;
  } catch {
    return "";
  }
}

function extractCss(document: Document) {
  return scopeCss(
    [...document.querySelectorAll("style")]
      .map((style) => style.textContent ?? "")
      .join("\n"),
  );
}

function sanitizeBodyHtml(document: Document, window: WindowLike) {
  const purifier = createDOMPurify(window);

  purifier.addHook("afterSanitizeAttributes", (node) => {
    if (node instanceof window.Element && node.tagName === "A") {
      const target = node.getAttribute("target");

      if (target === "_blank") {
        node.setAttribute("rel", "noopener noreferrer");
      }
    }
  });

  const bodyHtml = purifier.sanitize(document.body.innerHTML, {
    ADD_ATTR: [
      "datetime",
      "itemid",
      "itemprop",
      "itemref",
      "itemscope",
      "itemtype",
      "target",
    ],
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORBID_ATTR: ["srcdoc"],
    FORBID_TAGS: [
      "base",
      "embed",
      "iframe",
      "link",
      "meta",
      "object",
      "script",
      "style",
    ],
    USE_PROFILES: { html: true },
  });

  purifier.removeAllHooks();

  return String(bodyHtml);
}

export function parseBlogHtmlDocument(source: string): BlogHtmlDocument {
  const dom = new JSDOM(source);

  try {
    const { document } = dom.window;
    const window = dom.window as unknown as WindowLike;

    return {
      bodyHtml: sanitizeBodyHtml(document, window),
      css: extractCss(document),
      jsonLd: extractJsonLd(document),
      metadata: extractMetadata(document),
    };
  } finally {
    dom.window.close();
  }
}
