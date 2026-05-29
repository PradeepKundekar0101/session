import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { generateSlots } from "@/lib/slots";
import { jsonNotFound, jsonOk } from "@/lib/api/responses";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!mentor) {
    return jsonNotFound();
  }

  const [{ data: rules }, { data: exceptions }, { data: bookings }] =
    await Promise.all([
      supabase.from("availability_rules").select("*").eq("mentor_id", mentor.id),
      supabase
        .from("availability_exceptions")
        .select("*")
        .eq("mentor_id", mentor.id),
      supabase
        .from("bookings")
        .select("start_at, end_at")
        .eq("mentor_id", mentor.id)
        .in("status", ["requested", "approved"]),
    ]);

  const slots = generateSlots({
    rules: rules ?? [],
    exceptions: exceptions ?? [],
    timezone: mentor.timezone,
    bookedRanges: bookings ?? [],
  });

  const profile = await getProfile();

  return jsonOk({
    mentor,
    slots: slots.map((s) => ({
      startIso: s.startIso,
      endIso: s.endIso,
      label: s.label,
    })),
    profile,
  });
}
