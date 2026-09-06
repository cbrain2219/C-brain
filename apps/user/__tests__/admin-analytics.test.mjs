import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { generateKeyPairSync, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("admin analytics verifies access, signs GA requests, and distinguishes zero from failure", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const env = {
    ADMIN_APP_URL: "https://admin.example.com",
    GA_SERVICE_ACCOUNT_JSON: JSON.stringify({
      client_email: "analytics@example.iam.gserviceaccount.com",
      private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
    }),
  };
  let user = { id: "admin-id", app_metadata: { role: "admin" } };
  let report = { metricHeaders: [{ name: "totalUsers" }], rows: [{ metricValues: [{ value: "1234" }] }] };
  let tokenBody = { access_token: "ga-access-token" };
  let tokenStatus = 200;
  let reportStatus = 200;
  let requests = [];
  const fetch = async (url, options) => {
    requests.push({ url, options });
    return url === "https://oauth2.googleapis.com/token"
      ? Response.json(tokenBody, { status: tokenStatus })
      : Response.json(report, { status: reportStatus });
  };
  async function load(path, imports = {}) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const exports = {};
    runInNewContext(outputText, {
      exports, process: { env }, Buffer, URLSearchParams, AbortSignal, Response, fetch,
      require: (name) => name === "server-only" ? {} : imports[name] ?? require(name),
    });
    return exports;
  }
  const auth = await load("../lib/adminPaymentAuth.ts", {
    "@repo/supabase": {
      createServerSupabaseClient: () => ({
        auth: { getUser: async (token) => ({ data: { user: token === "admin-token" ? user : null }, error: null }) },
      }),
      createAdminSupabaseClient: () => ({}),
    },
  });
  const analytics = await load("../lib/googleAnalytics.ts");
  const route = await load("../app/api/admin/analytics/route.ts", {
    "../../../../lib": { ...auth, ...analytics },
  });
  const input = { from: "2026-08-08", to: "2026-09-06" };
  function request(body = input, headers = {}) {
    return new Request("https://www.example.com/api/admin/analytics", {
      method: "POST",
      headers: { origin: env.ADMIN_APP_URL, authorization: "Bearer admin-token", ...headers },
      body: JSON.stringify(body),
    });
  }

  assert.equal(route.OPTIONS(request()).status, 204);
  assert.equal(route.OPTIONS(request(input, { origin: "https://other.example.com" })).status, 403);
  assert.equal((await route.POST(request(input, { origin: "https://other.example.com" }))).status, 403);
  assert.equal((await route.POST(request(input, { authorization: "" }))).status, 401);
  assert.equal((await route.POST(request(input, { authorization: "Bearer invalid" }))).status, 401);
  user = { ...user, app_metadata: { role: "user" } };
  assert.equal((await route.POST(request())).status, 403);
  user = { ...user, app_metadata: { role: "admin" } };
  for (const body of [null, {}, { from: "2026-02-30", to: input.to }, { from: input.to, to: input.from }, { from: "2026-8-8", to: input.to }]) {
    assert.equal((await route.POST(request(body))).status, 400);
  }
  assert.equal(requests.length, 0, "invalid requests must never reach Google");

  const result = await route.POST(request());
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("access-control-allow-origin"), env.ADMIN_APP_URL);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.deepEqual(await result.json(), { visitorCount: 1234 });
  assert.equal(requests.length, 2);
  const tokenRequest = requests[0].options;
  assert.equal(tokenRequest.body.get("grant_type"), "urn:ietf:params:oauth:grant-type:jwt-bearer");
  const [header, claims, signature] = tokenRequest.body.get("assertion").split(".");
  assert.deepEqual(JSON.parse(Buffer.from(header, "base64url")), { alg: "RS256", typ: "JWT" });
  const payload = JSON.parse(Buffer.from(claims, "base64url"));
  assert.equal(payload.iss, "analytics@example.iam.gserviceaccount.com");
  assert.equal(payload.scope, "https://www.googleapis.com/auth/analytics.readonly");
  assert.equal(payload.aud, "https://oauth2.googleapis.com/token");
  assert.equal(payload.exp - payload.iat, 3600);
  assert.ok(Math.abs(Date.now() / 1000 - payload.iat) < 5);
  assert.ok(verify("RSA-SHA256", Buffer.from(`${header}.${claims}`), publicKey, Buffer.from(signature, "base64url")));
  assert.equal(requests[1].url, "https://analyticsdata.googleapis.com/v1beta/properties/552955082:runReport");
  assert.equal(requests[1].options.headers.Authorization, "Bearer ga-access-token");
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    dateRanges: [{ startDate: input.from, endDate: input.to }], metrics: [{ name: "totalUsers" }],
  });
  assert.ok(requests.every(({ options }) => options.signal && options.cache === "no-store"));

  for (const rows of [undefined, [], [{ metricValues: [{ value: "0" }] }]]) {
    report = { metricHeaders: [{ name: "totalUsers" }], ...(rows ? { rows } : {}) };
    assert.deepEqual(await (await route.POST(request({ from: "2024-02-29", to: "2024-02-29" }))).json(), { visitorCount: 0 });
  }
  // Actual GA response for a period before this property collected any data.
  report = { metadata: {}, kind: "analyticsData#runReport" };
  assert.deepEqual(await (await route.POST(request())).json(), { visitorCount: 0 });
  report = { ...report, rowCount: 0 };
  assert.deepEqual(await (await route.POST(request())).json(), { visitorCount: 0 });
  for (const invalidReport of [{}, { kind: "analyticsData#runReport", rowCount: 1 }, { metricHeaders: [{ name: "sessions" }] }, { metricHeaders: [{ name: "totalUsers" }], rows: null }, ...["-1", "NaN", "1.5", "9007199254740992", ""].map((value) => ({ metricHeaders: [{ name: "totalUsers" }], rows: [{ metricValues: [{ value }] }] }))]) {
    report = invalidReport;
    assert.equal((await route.POST(request())).status, 502);
  }
  reportStatus = 403;
  assert.equal((await route.POST(request())).status, 502);
  tokenStatus = 401;
  assert.equal((await route.POST(request())).status, 502);
  tokenStatus = 200;
  tokenBody = {};
  requests = [];
  assert.equal((await route.POST(request())).status, 502);
  assert.equal(requests.length, 1);
  for (const config of ["", "not json", "{}", '{"client_email":"test","private_key":"bad key"}']) {
    env.GA_SERVICE_ACCOUNT_JSON = config;
    requests = [];
    assert.equal((await route.POST(request())).status, 502);
    assert.equal(requests.length, 0);
  }
});
