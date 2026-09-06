import "server-only";
import { sign } from "node:crypto";

const tokenUrl = "https://oauth2.googleapis.com/token";

export async function getVisitorCount(from: string, to: string): Promise<number> {
  const account: unknown = JSON.parse(process.env.GA_SERVICE_ACCOUNT_JSON || "null");
  if (
    !account ||
    typeof account !== "object" ||
    !("client_email" in account) ||
    typeof account.client_email !== "string" ||
    !account.client_email.trim() ||
    !("private_key" in account) ||
    typeof account.private_key !== "string" ||
    !account.private_key.trim()
  ) {
    throw new Error("GA service account is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const unsignedToken = [
    { alg: "RS256", typ: "JWT" },
    {
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: tokenUrl,
      iat: now,
      exp: now + 3600,
    },
  ].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".");
  const signature = sign(
    "RSA-SHA256", Buffer.from(unsignedToken), account.private_key,
  ).toString("base64url");
  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedToken}.${signature}`,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenResponse.ok) throw new Error("GA authentication failed.");
  const token: unknown = await tokenResponse.json();
  if (
    !token ||
    typeof token !== "object" ||
    !("access_token" in token) ||
    typeof token.access_token !== "string" ||
    !token.access_token
  ) {
    throw new Error("Invalid GA authentication response.");
  }

  const response = await fetch(
    "https://analyticsdata.googleapis.com/v1beta/properties/552955082:runReport",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: from, endDate: to }],
        // Count distinct visitors over the whole inclusive range, without daily dimensions.
        metrics: [{ name: "totalUsers" }],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) throw new Error("GA visitor report failed.");
  const report: unknown = await response.json();
  if (!report || typeof report !== "object") {
    throw new Error("Invalid GA visitor report.");
  }
  // GA omits both headers and rows when the period has no collected data.
  if (
    "kind" in report && report.kind === "analyticsData#runReport" &&
    !("metricHeaders" in report) && !("rows" in report) &&
    (!("rowCount" in report) || report.rowCount === 0)
  ) {
    return 0;
  }
  if (
    !("metricHeaders" in report) ||
    !Array.isArray(report.metricHeaders) ||
    report.metricHeaders.length !== 1 ||
    report.metricHeaders[0]?.name !== "totalUsers"
  ) {
    throw new Error("Invalid GA visitor report.");
  }
  if (!("rows" in report)) return 0;
  if (!Array.isArray(report.rows) || report.rows.length > 1) {
    throw new Error("Invalid GA visitor report rows.");
  }
  if (report.rows.length === 0) return 0;

  const value = report.rows[0]?.metricValues?.[0]?.value;
  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value))
  ) {
    throw new Error("Invalid GA visitor count.");
  }
  return Number(value);
}
