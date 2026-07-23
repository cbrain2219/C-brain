import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const robotsContentModuleUrl = new URL(
  "../app/_content/robots.ts",
  import.meta.url,
).href;
const appRobotsPath = new URL("../app/robots.ts", import.meta.url);

test("robots helper allows public crawling and points to the sitemap", async () => {
  const check = `
    import assert from "node:assert/strict";
    const {
      createRobotsRules,
      robotsDisallowedPaths,
    } = await import(${JSON.stringify(robotsContentModuleUrl)});

    const robots = createRobotsRules();

    assert.equal(robots.sitemap, "https://example.com/sitemap.xml");
    assert.equal(robots.rules.userAgent, "*");
    assert.equal(robots.rules.allow, "/");
    assert.deepEqual(robots.rules.disallow, [
      "/api/",
      "/order/success",
      "/order/fail",
      "/linkpay/",
    ]);
    assert.deepEqual(robotsDisallowedPaths, robots.rules.disallow);
  `;

  await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", check],
    {
      env: {
        ...process.env,
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        NODE_NO_WARNINGS: "1",
      },
    },
  );
});

test("Next robots route delegates to shared SEO content", async () => {
  const source = await readFile(appRobotsPath, "utf8");

  assert.match(source, /export default function robots/);
  assert.match(source, /createRobotsRules/);
  assert.doesNotMatch(source, /sitemap:\s*["'`]/);
  assert.doesNotMatch(source, /disallow:\s*\[/);
});
