import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { jsonNotFound, jsonOk, jsonUnauthorized } from "@/lib/api/responses";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return jsonUnauthorized();
  }

  const supabase = await createClient();
  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .single();

  if (!mentor) {
    return jsonNotFound();
  }

  const { data: rules } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("mentor_id", mentor.id)
    .order("weekday");

  return jsonOk({ rules: rules ?? [] });
}
