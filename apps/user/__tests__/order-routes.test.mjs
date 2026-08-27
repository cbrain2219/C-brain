import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import process from "node:process";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const orderModuleUrl = new URL("../app/_content/order.ts", import.meta.url)
  .href;

test("order categories use the requested public path segments", async () => {
  const check = `
    import assert from "node:assert/strict";
    const {
      getOrderCategoryBySlug,
      getOrderCategoryHref,
      getOrderDirectServiceHref,
      orderCategories,
    } = await import(${JSON.stringify(orderModuleUrl)});

    const expected = [
      ["brochure-catalog", "direct", "brochure"],
      ["leaflet-pamphlet", "direct", "leaflet"],
      ["poster-flyer", "direct", "poster"],
      ["banner-display", "direct", "banner"],
      ["business-card-envelope", "direct", "business-card"],
      ["logo", "direct", "logo"],
      ["package-shopping-bag", "quote", "package"],
      ["photo-shoot", "quote", "photo"],
      ["etc", "quote", "custom"],
    ];

    assert.deepEqual(
      orderCategories.map(({ id, kind, slug }) => [id, kind, slug]),
      expected,
    );

    for (const [id, , slug] of expected) {
      assert.equal(getOrderCategoryBySlug(slug)?.id, id);
      assert.equal(getOrderCategoryHref(id), "/order/" + slug);
    }

    assert.equal(getOrderCategoryBySlug("unknown"), undefined);
    assert.equal(getOrderDirectServiceHref("brochure-catalog"), "/order/brochure");
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    },
  );
});
