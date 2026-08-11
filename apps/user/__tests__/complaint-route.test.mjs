import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routePath = new URL("../app/api/complaints/route.ts", import.meta.url);

test("failed complaint finalization deletes its complaint before uploaded files", async () => {
  const source = await readFile(routePath, "utf8");
  const fileInfoPosition = source.indexOf("const storedAttachments");
  const insertPosition = source.indexOf("const complaint = await createComplaint");
  const deletePosition = source.indexOf("const { error: deleteError }");
  const removePosition = source.indexOf(".remove(uploadedPaths)");

  assert.ok(fileInfoPosition >= 0);
  assert.ok(insertPosition > fileInfoPosition);
  assert.ok(deletePosition >= 0);
  assert.ok(removePosition > deletePosition);
  assert.match(source, /\.from\("complaints"\)/);
  assert.doesNotMatch(source, /\.from\("inquiries"\)/);
  assert.match(source, /if \(deleteError\) throw deleteError/);
  assert.match(source, /if \(removeError\) throw removeError/);
  assert.match(
    source,
    /if \(complaintId\) \{[\s\S]*?\.from\("complaints"\)[\s\S]*?\n\s+\}\n\n\s+if \(uploadedPaths\.length > 0\)/,
  );
  assert.doesNotMatch(source, /referencedAttachments|orphanPaths/);
});
