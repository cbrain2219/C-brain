import { createAdminSupabaseClient } from "@repo/supabase";

import { parseContentViewRequest } from "../../../lib/contentViews";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid view request." },
      { headers: noStoreHeaders, status: 400 },
    );
  }

  const view = parseContentViewRequest(payload);

  if (!view) {
    return Response.json(
      { error: "Invalid view request." },
      { headers: noStoreHeaders, status: 400 },
    );
  }

  try {
    const client = createAdminSupabaseClient();
    const { error } = await client.rpc("increment_content_view", {
      p_content_id: view.contentId,
      p_content_type: view.contentType,
    });

    if (error) throw new Error(error.message);

    return new Response(null, { headers: noStoreHeaders, status: 204 });
  } catch (error) {
    console.error("Failed to record content view.", error);

    return Response.json(
      { error: "Failed to record content view." },
      { headers: noStoreHeaders, status: 500 },
    );
  }
}
