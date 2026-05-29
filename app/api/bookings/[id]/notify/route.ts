import { getProfile } from "@/lib/auth";
import { notifyPaymentAuthorized } from "@/lib/bookings/notifications";
import { createClient } from "@/lib/supabase/server";
import { jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/responses";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) {
    return jsonUnauthorized();
  }

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("learner_id, status")
    .eq("id", id)
    .single();

  if (!booking) {
    return jsonForbidden();
  }

  if (booking.learner_id !== profile.id) {
    return jsonForbidden();
  }

  if (booking.status !== "requested") {
    return jsonOk({ notified: false });
  }

  await notifyPaymentAuthorized(id);

  return jsonOk({ notified: true });
}
