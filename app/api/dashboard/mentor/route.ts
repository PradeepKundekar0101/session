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

  const { data: bookings } = mentor
    ? await supabase
        .from("bookings")
        .select("id, start_at, status, amount_cents, learner_id")
        .eq("mentor_id", mentor.id)
        .order("start_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const pending = (bookings ?? []).filter((b) => b.status === "requested");
  const approved = (bookings ?? []).filter((b) => b.status === "approved");
  const completed = (bookings ?? []).filter((b) => b.status === "completed");
  const totalEarned = completed.reduce((s, b) => s + b.amount_cents, 0);

  return jsonOk({
    profile,
    mentor,
    bookings: bookings ?? [],
    pending,
    approved,
    completed,
    totalEarned,
  });
}
