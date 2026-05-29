import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { meetingAvailableAt } from "@/lib/daily";
import { jsonForbidden, jsonNotFound, jsonOk, jsonUnauthorized } from "@/lib/api/responses";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const paymentParam = searchParams.get("payment");

  const profile = await getProfile();
  if (!profile) {
    return jsonUnauthorized();
  }

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, mentor_profiles!inner(slug, headline, user_id)")
    .eq("id", id)
    .single();

  if (!booking) {
    return jsonNotFound();
  }

  const mentor = booking.mentor_profiles as {
    slug: string;
    headline: string;
    user_id: string;
  };
  const isLearner = booking.learner_id === profile.id;
  const isMentor = mentor.user_id === profile.id;

  if (!isLearner && !isMentor && profile.role !== "admin") {
    return jsonForbidden();
  }

  let clientSecret: string | null = null;
  let piStatus: string | null = null;

  if (
    isLearner &&
    booking.status === "requested" &&
    booking.stripe_payment_intent_id &&
    paymentParam !== "confirmed"
  ) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(
        booking.stripe_payment_intent_id
      );
      piStatus = pi.status;
      const needsAction = [
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
      ].includes(pi.status);
      if (needsAction && pi.client_secret) {
        clientSecret = pi.client_secret;
      }
    } catch {
      // PI retrieval failed
    }
  }

  const paymentAuthorized =
    piStatus === "requires_capture" || paymentParam === "confirmed";

  const canJoin =
    booking.status === "approved" &&
    booking.meeting_url &&
    meetingAvailableAt(new Date(booking.start_at));

  const sessionEnded = new Date(booking.end_at) < new Date();

  return jsonOk({
    booking: {
      id: booking.id,
      start_at: booking.start_at,
      end_at: booking.end_at,
      status: booking.status,
      amount_cents: booking.amount_cents,
      meeting_url: booking.meeting_url,
      approval_deadline: booking.approval_deadline,
      created_at: booking.created_at,
    },
    mentor,
    isLearner,
    isMentor,
    clientSecret,
    paymentAuthorized,
    canJoin,
    sessionEnded,
  });
}
