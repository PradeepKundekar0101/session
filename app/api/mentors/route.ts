import { createClient } from "@/lib/supabase/server";
import { jsonOk } from "@/lib/api/responses";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const supabase = await createClient();
  let query = supabase
    .from("mentor_profiles")
    .select("id, slug, headline, bio, expertise, rate_cents, avatar_url, banner_url")
    .eq("status", "approved")
    .order(limit ? "created_at" : "headline", { ascending: !limit });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: mentors } = await query;

  return jsonOk({ mentors: mentors ?? [] });
}
