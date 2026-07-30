import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL("../app/page.module.css", import.meta.url);

function cssBlock(source, startIndex) {
  const openBrace = source.indexOf("{", startIndex);
  assert.notEqual(openBrace, -1);

  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    } else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBrace + 1, index);
      }
    }
  }

  assert.fail("CSS block should close");
}

test("landing section inner gaps use 32px through the 1080px breakpoint", async () => {
  const source = await readFile(stylesPath, "utf8");
  const compactMediaStart = source.lastIndexOf("@media (max-width: 1080px)");

  assert.notEqual(compactMediaStart, -1);
  assert.match(
    source.slice(0, compactMediaStart),
    /\.reviewInner\s*\{\s*gap:\s*52px;[\s\S]*\.blogInner\s*\{\s*gap:\s*52px;/,
  );

  const compactMedia = cssBlock(source, compactMediaStart);
  assert.match(
    compactMedia,
    /\.reviewInner,[\s\S]*\.blogInner\s*\{\s*gap:\s*32px;/,
  );
});
