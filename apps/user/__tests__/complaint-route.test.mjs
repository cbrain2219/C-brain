import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routePath = new URL("../app/api/complaints/route.ts", import.meta.url);

test("failed complaint finalization deletes its inquiry before uploaded files", async () => {
  const source = await readFile(routePath, "utf8");
  const deletePosition = source.indexOf("const { error: deleteError }");
  const removePosition = source.indexOf(".remove(uploadedPaths)");

  assert.ok(deletePosition >= 0);
  assert.ok(removePosition > deletePosition);
  assert.match(source, /if \(deleteError\) throw deleteError/);
  assert.match(source, /if \(removeError\) throw removeError/);
  assert.doesNotMatch(source, /referencedAttachments|orphanPaths/);
});
