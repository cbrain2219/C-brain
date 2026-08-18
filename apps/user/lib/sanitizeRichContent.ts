import "server-only";

import { parseAllowedAssetHttpUrl } from "@repo/content/asset-url";
import sanitizeHtml from "sanitize-html";

type SanitizeRichContentOptions = {
  allowedImageBaseUrl: string;
};

const allowedTags = [
  "p",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "br",
  "hr",
  "img",
] as const;

// The admin uploader writes immutable UUID-named original images. Keeping
// that contract here prevents a scoped prefix from becoming a broad folder
// allowlist for arbitrary storage objects.
const managedImageFileName =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:png|jpe?g|webp)$/iu;
const encodedPathTraversalOrSeparator = /%(?:2e|2f|5c|25)/iu;
const safeTelHref = /^tel:\+?[1-9][0-9]{1,14}$/u;
const safeMailtoHref =
  /^mailto:[a-z0-9.!#$'*+/^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/iu;

function isAllowedImageSource(source: string | undefined, baseUrl: URL) {
  if (
    !source ||
    encodedPathTraversalOrSeparator.test(source) ||
    source.includes("?") ||
    source.includes("#") ||
    source.startsWith("//")
  ) {
    return false;
  }

  const url = parseAllowedAssetHttpUrl(source);
  const imagePrefix = `${baseUrl.pathname}images/`;

  if (
    !url ||
    source !== url.toString() ||
    url.origin !== baseUrl.origin ||
    !url.pathname.startsWith(imagePrefix) ||
    url.search ||
    url.hash
  ) {
    return false;
  }

  return managedImageFileName.test(url.pathname.slice(imagePrefix.length));
}

function getAllowedImageBaseUrl(value: string) {
  if (value.includes("?") || value.includes("#")) return null;

  const url = parseAllowedAssetHttpUrl(value);

  return url && value === url.toString() && url.pathname.endsWith("/")
    ? url
    : null;
}

function getSafeLinkHref(value: string | undefined) {
  if (
    !value ||
    value.startsWith("//") ||
    encodedPathTraversalOrSeparator.test(value)
  ) {
    return undefined;
  }

  if (safeTelHref.test(value) || safeMailtoHref.test(value)) return value;

  const url = parseAllowedAssetHttpUrl(value);
  if (url) return url.toString();

  return undefined;
}

/**
 * Sanitizes generated WYSIWYG HTML at the public rendering boundary.
 *
 * Images are intentionally tighter than normal links: a rendered image must
 * be a canonical public Storage URL below this exact content record's scope.
 */
export function sanitizeRichContent(
  html: string,
  { allowedImageBaseUrl }: SanitizeRichContentOptions,
) {
  const imageBaseUrl = getAllowedImageBaseUrl(allowedImageBaseUrl);
  if (!imageBaseUrl) return "";

  return sanitizeHtml(html, {
    allowedAttributes: {
      a: ["href", "rel", "target"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      img: ["alt", "loading", "src", "title"],
      p: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href"],
    allowedStyles: {
      "*": {
        "text-align": [/^(?:left|center|right)$/u],
      },
    },
    allowedTags: [...allowedTags],
    allowProtocolRelative: false,
    disallowedTagsMode: "completelyDiscard",
    exclusiveFilter(frame) {
      if (frame.tag === "img") {
        return !isAllowedImageSource(frame.attribs.src, imageBaseUrl);
      }

      return false;
    },
    transformTags: {
      a(_tagName, attributes) {
        const href = getSafeLinkHref(attributes.href);
        const attribs: Record<string, string> = {};

        if (href) {
          attribs.href = href;
          attribs.rel = "noopener noreferrer";
          attribs.target = "_blank";
        }

        return {
          tagName: "a",
          attribs,
        };
      },
      img(_tagName, attributes) {
        return {
          tagName: "img",
          attribs: {
            alt: attributes.alt ?? "",
            loading: "lazy",
            ...(attributes.title ? { title: attributes.title } : {}),
            ...(attributes.src ? { src: attributes.src } : {}),
          },
        };
      },
    },
  });
}
