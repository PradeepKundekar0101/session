import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { approvalDeadline } from "@/lib/bookings";
import { createManualCapturePaymentIntent } from "@/lib/stripe";
import { sendBookingRequestEmail } from "@/lib/email";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateBookingInput = {
  mentorId: string;
  startAt: string;
  endAt: string;
};

export type CreateBookingResult =
  | { ok: true; bookingId: string; mentorSlug: string }
  | { ok: false; error: string; code: "unauthorized" | "not_found" | "conflict" | "failed" };

export async function createBookingRequestCore(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile) {
    return { ok: false, error: "Sign in to book a session.", code: "unauthorized" };
  }

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("id", input.mentorId)
    .eq("status", "approved")
    .single();

  if (!mentor) {
    return { ok: false, error: "Mentor not found.", code: "not_found" };
  }
  if (!mentor.stripe_account_id) {
    return {
      ok: false,
      error: "This mentor hasn't finished payout setup yet.",
      code: "failed",
    };
  }

  const { data: conflict } = await supabase
    .from("bookings")
    .select("id")
    .eq("mentor_id", input.mentorId)
    .in("status", ["requested", "approved"])
    .eq("start_at", input.startAt)
    .maybeSingle();

  if (conflict) {
    return {
      ok: false,
      error: "That slot was just taken. Pick another time.",
      code: "conflict",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      learner_id: profile.id,
      mentor_id: input.mentorId,
      start_at: input.startAt,
      end_at: input.endAt,
      amount_cents: mentor.rate_cents,
      status: "requested",
      approval_deadline: approvalDeadline(),
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    return { ok: false, error: "Could not create booking. Try again.", code: "failed" };
  }

  try {
    const pi = await createManualCapturePaymentIntent({
      amountCents: mentor.rate_cents,
      mentorStripeAccountId: mentor.stripe_account_id,
      learnerEmail: user!.email!,
      bookingId: booking.id,
    });

    await supabase
      .from("bookings")
      .update({ stripe_payment_intent_id: pi.id })
      .eq("id", booking.id);
  } catch {
    await supabase.from("bookings").delete().eq("id", booking.id);
    return {
      ok: false,
      error: "Payment setup failed. Please try again.",
      code: "failed",
    };
  }

  const admin = createAdminClient();
  const { data: mentorAuth } = await admin.auth.admin.getUserById(mentor.user_id);
  const { data: mentorProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", mentor.user_id)
    .single();

  if (mentorAuth.user?.email) {
    await sendBookingRequestEmail({
      mentorEmail: mentorAuth.user.email,
      mentorName: mentorProfile?.display_name ?? "Mentor",
      learnerName: profile.display_name ?? "A learner",
      startAt: input.startAt,
      bookingId: booking.id,
      dashboardUrl: `${config.appUrl}/dashboard/mentor`,
    });
  }

  return { ok: true, bookingId: booking.id, mentorSlug: mentor.slug };
}
