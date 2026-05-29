import { createAdminClient } from "@/lib/supabase/admin";
import { config } from "@/lib/config";
import { getStripe } from "@/lib/stripe";
import {
  sendBookingApprovedEmail,
  sendBookingApprovedMentorEmail,
  sendBookingDeniedEmail,
  sendBookingRequestMentorEmail,
  sendBookingRequestedLearnerEmail,
  sendPaymentAuthorizedLearnerEmail,
} from "@/lib/email";

type BookingParty = {
  bookingId: string;
  startAt: string;
  endAt: string;
  amountCents: number;
  learnerId: string;
  mentorUserId: string;
  learnerEmail: string | null;
  learnerName: string;
  mentorEmail: string | null;
  mentorName: string;
};

async function loadBookingParties(bookingId: string): Promise<BookingParty | null> {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, start_at, end_at, amount_cents, learner_id, mentor_profiles!inner(user_id)")
    .eq("id", bookingId)
    .single();

  if (!booking) return null;

  const rawMentor = booking.mentor_profiles;
  const mentor = (Array.isArray(rawMentor) ? rawMentor[0] : rawMentor) as {
    user_id: string;
  };
  if (!mentor?.user_id) return null;
  const [{ data: learnerAuth }, { data: mentorAuth }, { data: learnerProfile }, { data: mentorProfile }] =
    await Promise.all([
      admin.auth.admin.getUserById(booking.learner_id),
      admin.auth.admin.getUserById(mentor.user_id),
      admin.from("profiles").select("display_name").eq("id", booking.learner_id).single(),
      admin.from("profiles").select("display_name").eq("id", mentor.user_id).single(),
    ]);

  return {
    bookingId,
    startAt: booking.start_at,
    endAt: booking.end_at,
    amountCents: booking.amount_cents,
    learnerId: booking.learner_id,
    mentorUserId: mentor.user_id,
    learnerEmail: learnerAuth.user?.email ?? null,
    learnerName: learnerProfile?.display_name ?? "there",
    mentorEmail: mentorAuth.user?.email ?? null,
    mentorName: mentorProfile?.display_name ?? "your mentor",
  };
}

function bookingUrl(bookingId: string) {
  return `${config.appUrl}/bookings/${bookingId}`;
}

/** Learner booked a slot — send confirmation with link to authorize payment. */
export async function notifyBookingCreated(bookingId: string) {
  const parties = await loadBookingParties(bookingId);
  if (!parties?.learnerEmail) return;

  await sendBookingRequestedLearnerEmail({
    learnerEmail: parties.learnerEmail,
    learnerName: parties.learnerName,
    mentorName: parties.mentorName,
    startAt: parties.startAt,
    bookingId,
    bookingUrl: bookingUrl(bookingId),
    amountCents: parties.amountCents,
  });
}

/** Card authorized — notify mentor to approve and confirm with learner. */
export async function notifyPaymentAuthorized(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("stripe_payment_intent_id, status")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.status !== "requested" || !booking.stripe_payment_intent_id) {
    return;
  }

  const pi = await getStripe().paymentIntents.retrieve(booking.stripe_payment_intent_id);
  if (pi.status !== "requires_capture" && pi.status !== "succeeded") {
    return;
  }

  const parties = await loadBookingParties(bookingId);
  if (!parties) return;

  if (parties.learnerEmail) {
    await sendPaymentAuthorizedLearnerEmail({
      learnerEmail: parties.learnerEmail,
      learnerName: parties.learnerName,
      mentorName: parties.mentorName,
      startAt: parties.startAt,
      bookingId,
      bookingUrl: bookingUrl(bookingId),
    });
  }

  if (parties.mentorEmail) {
    await sendBookingRequestMentorEmail({
      mentorEmail: parties.mentorEmail,
      mentorName: parties.mentorName,
      learnerName: parties.learnerName,
      startAt: parties.startAt,
      bookingId,
      bookingUrl: bookingUrl(bookingId),
      amountCents: parties.amountCents,
    });
  }
}

/** Session approved — notify both parties with meeting link. */
export async function notifyBookingApproved(
  bookingId: string,
  meetingUrl: string
) {
  const parties = await loadBookingParties(bookingId);
  if (!parties) return;

  const url = bookingUrl(bookingId);

  if (parties.learnerEmail) {
    await sendBookingApprovedEmail({
      learnerEmail: parties.learnerEmail,
      learnerName: parties.learnerName,
      mentorName: parties.mentorName,
      startAt: parties.startAt,
      meetingUrl,
      bookingUrl: url,
      bookingId,
    });
  }

  if (parties.mentorEmail) {
    await sendBookingApprovedMentorEmail({
      mentorEmail: parties.mentorEmail,
      mentorName: parties.mentorName,
      learnerName: parties.learnerName,
      startAt: parties.startAt,
      meetingUrl,
      bookingUrl: url,
      bookingId,
    });
  }
}

/** Session denied — notify learner. */
export async function notifyBookingDenied(bookingId: string) {
  const parties = await loadBookingParties(bookingId);
  if (!parties?.learnerEmail) return;

  await sendBookingDeniedEmail({
    learnerEmail: parties.learnerEmail,
    learnerName: parties.learnerName,
    mentorName: parties.mentorName,
    startAt: parties.startAt,
    bookingId,
    mentorsUrl: `${config.appUrl}/mentors`,
  });
}
