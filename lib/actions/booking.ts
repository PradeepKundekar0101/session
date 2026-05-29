"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { approvalDeadline } from "@/lib/bookings";
import { approveBooking, denyBooking } from "@/lib/bookings";
import { createManualCapturePaymentIntent } from "@/lib/stripe";
import { sendBookingRequestEmail } from "@/lib/email";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createBookingRequest(formData: FormData) {
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile) redirect("/auth/login");

  const mentorId = String(formData.get("mentor_id"));
  const startAt = String(formData.get("start_at"));
  const endAt = String(formData.get("end_at"));

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("id", mentorId)
    .eq("status", "approved")
    .single();

  if (!mentor) redirect("/mentors");
  if (!mentor.stripe_account_id) {
    redirect("/mentors?error=mentor-payouts");
  }

  const { data: conflict } = await supabase
    .from("bookings")
    .select("id")
    .eq("mentor_id", mentorId)
    .in("status", ["requested", "approved"])
    .eq("start_at", startAt)
    .maybeSingle();

  if (conflict) redirect("/mentors?error=slot-taken");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      learner_id: profile.id,
      mentor_id: mentorId,
      start_at: startAt,
      end_at: endAt,
      amount_cents: mentor.rate_cents,
      status: "requested",
      approval_deadline: approvalDeadline(),
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    redirect("/mentors?error=booking-failed");
  }

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
      startAt,
      bookingId: booking.id,
      dashboardUrl: `${config.appUrl}/dashboard/mentor`,
    });
  }

  revalidatePath(`/mentors/${mentor.slug}`);
  redirect(`/bookings/${booking.id}?payment=authorize`);
}

export async function mentorApproveBooking(bookingId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Unauthorized" };
  try {
    await approveBooking(bookingId, profile.id);
    revalidatePath("/dashboard/mentor");
    revalidatePath(`/bookings/${bookingId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Approval failed" };
  }
}

export async function mentorDenyBooking(bookingId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Unauthorized" };
  try {
    await denyBooking(bookingId, profile.id);
    revalidatePath("/dashboard/mentor");
    revalidatePath(`/bookings/${bookingId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not deny" };
  }
}

export async function completeBookingForm(formData: FormData) {
  const bookingId = String(formData.get("booking_id"));
  const result = await completeBooking(bookingId);
  if (result.error) {
    redirect(`/bookings/${bookingId}?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/bookings/${bookingId}`);
}

export async function completeBooking(bookingId: string) {
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile) return { error: "Unauthorized" };

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, mentor_profiles!inner(user_id)")
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "Not found" };
  const mentor = booking.mentor_profiles as { user_id: string };
  const isParty =
    booking.learner_id === profile.id ||
    mentor.user_id === profile.id ||
    profile.role === "admin";

  if (!isParty) return { error: "Forbidden" };
  if (booking.status !== "approved") return { error: "Invalid status" };
  if (new Date(booking.end_at) > new Date()) {
    return { error: "Session has not ended yet" };
  }

  await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", bookingId);

  revalidatePath(`/bookings/${bookingId}`);
  return { success: true };
}
