import { addHours } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { config } from "@/lib/config";
import {
  cancelPaymentIntent,
  capturePaymentIntent,
  createManualCapturePaymentIntent,
} from "@/lib/stripe";
import { createDailyRoom, meetingAvailableAt } from "@/lib/daily";
import {
  sendBookingApprovedEmail,
  sendBookingDeniedEmail,
  sendBookingRequestEmail,
} from "@/lib/email";

export async function expireStaleBookings() {
  const admin = createAdminClient();
  const { data: stale } = await admin
    .from("bookings")
    .select("id, stripe_payment_intent_id")
    .eq("status", "requested")
    .lt("approval_deadline", new Date().toISOString());

  for (const booking of stale ?? []) {
    if (booking.stripe_payment_intent_id) {
      try {
        await cancelPaymentIntent(booking.stripe_payment_intent_id);
      } catch {
        // PI may already be canceled
      }
    }
    await admin
      .from("bookings")
      .update({ status: "expired" })
      .eq("id", booking.id);
  }

  return stale?.length ?? 0;
}

export async function approveBooking(bookingId: string, mentorUserId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, mentor_profiles!inner(user_id, stripe_account_id)")
    .eq("id", bookingId)
    .single();

  if (!booking) throw new Error("Booking not found");
  const mentor = booking.mentor_profiles as {
    user_id: string;
    stripe_account_id: string | null;
  };
  if (mentor.user_id !== mentorUserId) throw new Error("Forbidden");
  if (booking.status !== "requested") throw new Error("Booking is not pending");
  if (new Date(booking.approval_deadline) < new Date()) {
    throw new Error("Approval window expired");
  }
  if (!booking.stripe_payment_intent_id) throw new Error("Missing payment");
  if (!mentor.stripe_account_id) throw new Error("Mentor payouts not configured");

  const pi = await import("@/lib/stripe").then((m) =>
    m.getStripe().paymentIntents.retrieve(booking.stripe_payment_intent_id!)
  );

  if (pi.status === "requires_capture") {
    await capturePaymentIntent(booking.stripe_payment_intent_id);
  } else if (pi.status === "succeeded") {
    // Already captured (edge case from retries or test mode) — proceed
  } else {
    const hint =
      pi.status === "requires_payment_method"
        ? "The learner has not entered their card details yet."
        : pi.status === "requires_confirmation" || pi.status === "requires_action"
          ? "The learner started but hasn't finished card authorization."
          : pi.status === "canceled"
            ? "This payment was already cancelled."
            : `Payment is in an unexpected state (${pi.status}).`;
    throw new Error(hint);
  }

  const room = await createDailyRoom(bookingId);

  const { data: updated } = await admin
    .from("bookings")
    .update({
      status: "approved",
      meeting_url: room.url,
      daily_room_name: room.name,
    })
    .eq("id", bookingId)
    .select("*")
    .single();

  const { data: learnerAuth } = await admin.auth.admin.getUserById(
    booking.learner_id
  );
  const { data: mentorProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", mentor.user_id)
    .single();
  const { data: learnerProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", booking.learner_id)
    .single();

  if (learnerAuth.user?.email) {
    await sendBookingApprovedEmail({
      learnerEmail: learnerAuth.user.email,
      learnerName: learnerProfile?.display_name ?? "there",
      mentorName: mentorProfile?.display_name ?? "your mentor",
      startAt: booking.start_at,
      meetingUrl: room.url,
      bookingUrl: `${config.appUrl}/bookings/${bookingId}`,
      bookingId,
    });
  }

  return updated;
}

export async function denyBooking(bookingId: string, mentorUserId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, mentor_profiles!inner(user_id)")
    .eq("id", bookingId)
    .single();

  if (!booking) throw new Error("Booking not found");
  const mentor = booking.mentor_profiles as { user_id: string };
  if (mentor.user_id !== mentorUserId) throw new Error("Forbidden");
  if (booking.status !== "requested") throw new Error("Booking is not pending");

  if (booking.stripe_payment_intent_id) {
    await cancelPaymentIntent(booking.stripe_payment_intent_id);
  }

  await admin.from("bookings").update({ status: "denied" }).eq("id", bookingId);

  const { data: learnerAuth } = await admin.auth.admin.getUserById(
    booking.learner_id
  );
  const { data: mentorProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", mentor.user_id)
    .single();
  const { data: learnerProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", booking.learner_id)
    .single();

  if (learnerAuth.user?.email) {
    await sendBookingDeniedEmail({
      learnerEmail: learnerAuth.user.email,
      learnerName: learnerProfile?.display_name ?? "there",
      mentorName: mentorProfile?.display_name ?? "the mentor",
      startAt: booking.start_at,
      bookingId,
    });
  }
}

export function approvalDeadline() {
  return addHours(new Date(), config.approvalWindowHours).toISOString();
}

export { meetingAvailableAt };
