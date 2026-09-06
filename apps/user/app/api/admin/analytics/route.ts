import {
  adminPaymentCorsHeaders,
  adminPaymentOptions,
  authorizeAdminPaymentRequest,
  getVisitorCount,
} from "../../../../lib";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return adminPaymentOptions(request);
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminPaymentRequest(request);
  if ("response" in authorization) return authorization.response;

  const headers = { ...adminPaymentCorsHeaders(request), "Cache-Control": "no-store" };
  const input: unknown = await request.json().catch(() => null);
  if (
    !input ||
    typeof input !== "object" ||
    !("from" in input) || !isDate(input.from) ||
    !("to" in input) || !isDate(input.to) ||
    input.from > input.to
  ) {
    return Response.json({ error: "Invalid date range." }, { status: 400, headers });
  }

  try {
    const visitorCount = await getVisitorCount(input.from, input.to);
    return Response.json({ visitorCount }, { headers });
  } catch {
    return Response.json(
      { error: "방문자 수를 불러오지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502, headers },
    );
  }
}
