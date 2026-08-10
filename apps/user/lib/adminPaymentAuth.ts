import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
  type CBrainSupabaseClient,
} from "@repo/supabase";

type AdminPaymentAuthorization =
  | { client: CBrainSupabaseClient; userId: string }
  | { response: Response };

function configuredAdminOrigin() {
  return process.env.ADMIN_APP_URL?.trim() ?? "";
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

function response(status: number, body: Record<string, string>, origin?: string) {
  return Response.json(body, {
    headers: origin ? corsHeaders(origin) : undefined,
    status,
  });
}

function getBearerToken(value: string | null) {
  const match = value?.match(/^Bearer ([^\s,]+)$/);
  return match?.[1] ?? null;
}

/**
 * Authorizes browser requests from the separately hosted admin app.
 *
 * Do not create the service-role client before the publishable-key user check:
 * this boundary is what prevents an arbitrary bearer token from reaching ledger
 * RPCs with service privileges.
 */
export async function authorizeAdminPaymentRequest(
  request: Request,
): Promise<AdminPaymentAuthorization> {
  const adminOrigin = configuredAdminOrigin();
  const origin = request.headers.get("origin");

  if (!adminOrigin || origin !== adminOrigin) {
    return { response: response(403, { error: "Forbidden origin." }) };
  }

  const token = getBearerToken(request.headers.get("authorization"));

  if (!token) {
    return {
      response: response(401, { error: "Authentication required." }, adminOrigin),
    };
  }

  try {
    const publishableClient = createServerSupabaseClient({ getAll: () => [] });
    const { data, error } = await publishableClient.auth.getUser(token);
    const user = data.user;

    if (error || !user) {
      return {
        response: response(401, { error: "Authentication required." }, adminOrigin),
      };
    }

    if (user.app_metadata.role !== "admin") {
      return { response: response(403, { error: "Admin access required." }, adminOrigin) };
    }

    return { client: createAdminSupabaseClient(), userId: user.id };
  } catch {
    return {
      response: response(500, { error: "Payment authorization unavailable." }, adminOrigin),
    };
  }
}

export function adminPaymentOptions(request: Request) {
  const adminOrigin = configuredAdminOrigin();

  if (!adminOrigin || request.headers.get("origin") !== adminOrigin) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, { headers: corsHeaders(adminOrigin), status: 204 });
}

export function adminPaymentCorsHeaders(request: Request) {
  const adminOrigin = configuredAdminOrigin();
  return adminOrigin && request.headers.get("origin") === adminOrigin
    ? corsHeaders(adminOrigin)
    : undefined;
}
