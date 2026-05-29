"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { approveBooking, denyBooking } from "@/lib/bookings";
import { createBookingRequestCore } from "@/lib/bookings/create-request";

export async function createBookingRequest(formData: FormData) {
  const mentorId = String(formData.get("mentor_id"));
  const startAt = String(formData.get("start_at"));
  const endAt = String(formData.get("end_at"));

  const result = await createBookingRequestCore({ mentorId, startAt, endAt });

  if (!result.ok) {
    if (result.code === "unauthorized") redirect("/auth/login");
    if (result.code === "not_found") redirect("/mentors");
    if (result.code === "conflict") {
      redirect(`/mentors?error=${encodeURIComponent(result.error)}`);
    }
    redirect(`/mentors?error=booking-failed`);
  }

  revalidatePath(`/mentors/${result.mentorSlug}`);
  redirect(`/bookings/${result.bookingId}?payment=authorize&booked=1`);
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
