import { revalidateTag } from "next/cache";

import {
  adminPaymentCorsHeaders,
  adminPaymentOptions,
  authorizeAdminPaymentRequest,
  publicContentDetailTag,
  publicContentListTag,
} from "../../../../../lib";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return adminPaymentOptions(request);
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminPaymentRequest(request);
  if ("response" in authorization) return authorization.response;

  const headers = {
    ...adminPaymentCorsHeaders(request),
    "Cache-Control": "no-store",
  };
  const input: unknown = await request.json().catch(() => null);
  if (
    !input ||
    typeof input !== "object" ||
    !("entity" in input) ||
    (input.entity !== "blog" && input.entity !== "portfolio") ||
    !("slugs" in input) ||
    !Array.isArray(input.slugs) ||
    input.slugs.length > 2 ||
    !input.slugs.every(
      (slug: unknown) =>
        typeof slug === "string" &&
        slug.length > 0 &&
        slug.length <= 512 &&
        slug === slug.trim(),
    )
  ) {
    return Response.json(
      { error: "Invalid content cache request." },
      { status: 400, headers },
    );
  }

  try {
    revalidateTag(publicContentListTag(input.entity), { expire: 0 });
    for (const slug of new Set<string>(input.slugs)) {
      revalidateTag(publicContentDetailTag(input.entity, slug), { expire: 0 });
    }
    return Response.json({ revalidated: true }, { headers });
  } catch {
    return Response.json(
      { error: "Content cache refresh failed." },
      { status: 503, headers },
    );
  }
}
