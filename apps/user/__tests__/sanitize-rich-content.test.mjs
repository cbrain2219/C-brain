import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { register } from "node:module";
import test from "node:test";

const serverOnlyModule = `data:text/javascript,${encodeURIComponent(
  "export {};",
)}`;

register(
  `data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: ${JSON.stringify(serverOnlyModule)}, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts")) {
    const { readFile } = await import("node:fs/promises");
    const { stripTypeScriptTypes } = await import("node:module");
    return {
      format: "module",
      shortCircuit: true,
      source: stripTypeScriptTypes(await readFile(new URL(url), "utf8"), { mode: "transform" }),
    };
  }
  return nextLoad(url, context);
}`)}`,
  import.meta.url,
);

const { sanitizeRichContent } = await import("../lib/sanitizeRichContent.ts");

const scope = "123e4567-e89b-42d3-a456-426614174000";
const imageBase = `https://example.supabase.co/storage/v1/object/public/public-assets/content/blog/${scope}/`;
const imageName = "f47ac10b-58cc-4372-a567-0e02b2c3d479.png";
const allowedImage = `${imageBase}images/${imageName}`;

function sanitize(html) {
  return sanitizeRichContent(html, { allowedImageBaseUrl: imageBase });
}

test("rich-content sanitizer preserves only the editor output allowlist", () => {
  const result = sanitize(
    `<p style="text-align: center; color: red">copy <strong>bold</strong><em>italic</em><u>underlined</u><s>struck</s><br /></p><h2>Two</h2><h3>Three</h3><h4>Four</h4><ul><li>one</li></ul><ol><li>two</li></ol><blockquote>quote</blockquote><pre><code>const x = 1;</code></pre><hr /><a href="https://cbrain.co.kr/path" target="_self">link</a><img src="${allowedImage}" alt="diagram" loading="eager" />`,
  );

  for (const tag of [
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
    "br",
    "hr",
  ]) {
    assert.match(result, new RegExp(`<${tag}(?:\\s|>|/)`));
  }
  assert.match(result, /style="text-align:center"/);
  assert.doesNotMatch(result, /color:/);
  assert.match(
    result,
    /<a href="https:\/\/cbrain\.co\.kr\/path" rel="noopener noreferrer" target="_blank">link<\/a>/,
  );
  assert.match(result, new RegExp(`<img alt="diagram" loading="lazy" src="${allowedImage}" />`));
});

test("rich-content sanitizer removes active content and unsafe attributes", () => {
  const result = sanitize(
    `<script>alert(1)</script><style>body{display:none}</style><iframe src="https://evil.example"></iframe><object data="x"></object><form><input /></form><svg onload="alert(1)"><circle /></svg><math><mi>x</mi></math><p onclick="alert(1)" style="background:url(javascript:alert(1)); text-align:right">safe</p>`,
  );

  assert.equal(result, '<p style="text-align:right">safe</p>');
});

test("rich-content sanitizer fails closed for image scope and URL aliases", () => {
  const siblingScope = "223e4567-e89b-42d3-a456-426614174000";
  const images = [
    `https://example.supabase.co/storage/v1/object/public/public-assets/content/blog/${siblingScope}/images/${imageName}`,
    `${allowedImage}?width=100`,
    `${allowedImage}#fragment`,
    `https://example.supabase.co/storage/v1/object/public/public-assets/content/blog/${scope}/images/other.png`,
    "//example.supabase.co/storage/v1/object/public/public-assets/content/blog/123e4567-e89b-42d3-a456-426614174000/images/f47ac10b-58cc-4372-a567-0e02b2c3d479.png",
    "javascript:alert(1)",
    "https://example.supabase.co/storage/v1/object/public/public-assets/content/blog/123e4567-e89b-42d3-a456-426614174000/images/%2e%2e/f47ac10b-58cc-4372-a567-0e02b2c3d479.png",
    "https://evil.example/image.png",
  ];

  const result = sanitize(
    images.map((src) => `<img src="${src}" alt="blocked" />`).join(""),
  );

  assert.equal(result, "");
});

test("rich-content sanitizer rejects scriptable, encoded, and control-character URLs", () => {
  const result = sanitize(
    `<a href="javascript:alert(1)">bad</a><a href="java&#x0a;script:alert(1)">encoded</a><a href="tel:+82&#x0a;1012345678">bad-tel</a><a href="mailto:user&#x200b;@example.com">bad-mail</a><a href="https://good.example">good</a><img src="${allowedImage.replace("https", "https%0a")}" alt="bad" />`,
  );

  assert.equal(
    result,
    '<a>bad</a><a>encoded</a><a>bad-tel</a><a>bad-mail</a><a href="https://good.example/" rel="noopener noreferrer" target="_blank">good</a>',
  );
});

test("rich-content sanitizer preserves canonical tel and mailto links safely", () => {
  const result = sanitize(
    '<a href="tel:+821012345678">phone</a><a href="mailto:user@example.com">email</a>',
  );

  assert.equal(
    result,
    '<a href="tel:+821012345678" rel="noopener noreferrer" target="_blank">phone</a><a href="mailto:user@example.com" rel="noopener noreferrer" target="_blank">email</a>',
  );
});

test("rich-content sanitizer is idempotent", () => {
  const input = `<p style="text-align: center; color: red" onclick="bad()">copy <a href="https://good.example/path" target="_self">link</a><img src="${allowedImage}" alt="image" loading="eager" /></p>`;

  assert.equal(sanitize(sanitize(input)), sanitize(input));
});

test("rich-content sanitizer rejects the URL and attribute bypass corpus", () => {
  const siblingScope = "223e4567-e89b-42d3-a456-426614174000";
  const maliciousLinks = [
    "tel:+82\u00001012345678",
    "tel:+82\u200b1012345678",
    "tel:%2b821012345678",
    "mailto:user%40example.com",
    "mailto:user\u0000@example.com",
    "mailto:user\u200b@example.com",
    "data:text/html,alert(1)",
    "vbscript:msgbox(1)",
    "javascript:alert(1)",
    "java&#x0a;script:alert(1)",
    "//good.example/path",
    "https://user:password@good.example/path",
    "https://good.example/%2e%2e/escape",
    "https://good.example/%252e%252e/escape",
  ];
  const blockedImages = [
    `${imageBase}images/diagram.png`,
    `${imageBase}images/${imageName}.svg`,
    `${imageBase}images/${imageName}?width=10`,
    `${imageBase}images/${imageName}#fragment`,
    `${imageBase}images/%2e%2e/${imageName}`,
    `${imageBase}images/%252e%252e%252f${imageName}`,
    `${imageBase}images/%2f${imageName}`,
    `https://user:password@example.supabase.co/storage/v1/object/public/public-assets/content/blog/${scope}/images/${imageName}`,
    `https://example.supabase.co/storage/v1/object/public/public-assets/content/blog/${siblingScope}/images/${imageName}`,
    "data:image/png;base64,AAAA",
  ];
  const html = [
    ...maliciousLinks.map((href) => `<a href="${href}">blocked</a>`),
    `<a href="https://good.example/path">allowed</a>`,
    ...blockedImages.map((src) => `<img src="${src}" srcset="${allowedImage} 1x" onerror="bad()" alt="blocked" />`),
    `<img src="${allowedImage}" srcset="https://evil.example/evil.png 1x" onload="bad()" alt="allowed" />`,
    `<p style="text-align:left; background:url(javascript:alert(1)); width:expression(alert(1))" onclick="bad()">safe <strong>nested</p></strong>`,
  ].join("");

  const result = sanitize(html);

  assert.equal((result.match(/<a href=/g) ?? []).length, 1);
  assert.match(result, /https:\/\/good\.example\/path/);
  assert.equal((result.match(/<img /g) ?? []).length, 1);
  assert.match(result, new RegExp(`src="${allowedImage}"`));
  assert.doesNotMatch(result, /srcset|onerror|onload|javascript:|vbscript:|data:|tel:|password|%2e|%25/i);
  assert.match(result, /<p style="text-align:left">safe <strong>nested<\/strong><\/p>/);
});

test("sanitizer implementation is server-only and never broadens its image base", async () => {
  const source = await readFile(
    new URL("../lib/sanitizeRichContent.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /import "server-only"/);
  assert.match(source, /parseAllowedAssetHttpUrl/);
  assert.match(source, /url\.pathname\.startsWith\(imagePrefix\)/);
  assert.match(source, /managedImageFileName/);
  assert.match(source, /source !== url\.toString\(\)/);
  assert.match(source, /disallowedTagsMode: "completelyDiscard"/);
});
