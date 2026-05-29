import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { jsonOk, jsonUnauthorized } from "@/lib/api/responses";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return jsonUnauthorized();
  }

  const supabase = await createClient();
  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();

  return jsonOk({ mentor });
}
