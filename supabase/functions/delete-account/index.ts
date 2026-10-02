import { createClient } from "npm:@supabase/supabase-js@2.45.4";

/**
 * delete-account — deletes the signed-in Alias, for good (the app's Account settings → Delete my
 * Alias; the App Store requires it for any app that creates accounts).
 *
 *   POST /delete-account   (Authorization: Bearer <the Alias's access token>)
 *   200 { deleted: true }
 *   401 not signed in · 500 something failed (nothing, or only photos, deleted: safe to retry)
 *
 * Only ever the caller: who to delete comes from their token, never from the request, so nobody
 * can delete anyone else. Their photos go first (`avatars/<id>/`: storage has no
 * cascade, and a photo left behind would keep its public link); if that fails it stops, before the
 * account. Then the auth user, and every table holding their data follows by `ON DELETE CASCADE`
 * (profiles → tanafas_sessions, badges_earned, push_tokens, username_changes). The anonymous
 * community pings (activity_pings) carry no user id and stay.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** The owner-folder buckets (CLAUDE.md: `{bucket}/{user_id}/{filename}`). */
const BUCKETS = ["avatars"];

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Removes every file in `bucket/<userId>/`, a page at a time. Throws if any step fails. */
async function emptyFolder(bucket: string, userId: string): Promise<void> {
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
    if (error) throw new Error(`list ${bucket}: ${error.message}`);
    const paths = (data ?? []).filter((f) => f.id).map((f) => `${userId}/${f.name}`);
    if (!paths.length) return;
    const { error: removeError } = await admin.storage.from(bucket).remove(paths);
    if (removeError) throw new Error(`remove ${bucket}: ${removeError.message}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const { data: userData, error: userError } = token
    ? await admin.auth.getUser(token)
    : { data: { user: null }, error: null };
  const user = userData?.user;
  if (userError || !user) return json(401, { error: "not_signed_in" });

  try {
    for (const bucket of BUCKETS) await emptyFolder(bucket, user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`delete user: ${error.message}`);
  } catch (e) {
    // The id only: no name or email in the logs.
    console.error(`delete-account ${user.id}: ${e instanceof Error ? e.message : String(e)}`);
    return json(500, { error: "delete_failed" });
  }
  return json(200, { deleted: true });
});
