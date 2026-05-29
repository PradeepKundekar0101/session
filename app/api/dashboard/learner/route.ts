import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { jsonOk, jsonUnauthorized } from "@/lib/api/responses";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return jsonUnauthorized();
  }

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, start_at, end_at, status, amount_cents, mentor_profiles(headline, slug, avatar_url)"
    )
    .eq("learner_id", profile.id)
    .order("start_at", { ascending: false });

  const upcoming = (bookings ?? []).filter((b) =>
    ["requested", "approved"].includes(b.status)
  );
  const past = (bookings ?? []).filter(
    (b) => !["requested", "approved"].includes(b.status)
  );

  return jsonOk({ profile, upcoming, past });
}
