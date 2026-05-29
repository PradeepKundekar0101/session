import { Resend } from "resend";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[email] RESEND_API_KEY is not set — skipping send");
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

function emailFrom() {
  return process.env.EMAIL_FROM ?? "GetMentor <onboarding@resend.dev>";
}

function formatSessionTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function logEmail(
  bookingId: string | null,
  recipient: string,
  template: string,
  status: "sent" | "failed" | "skipped"
) {
  try {
    const admin = createAdminClient();
    await admin.from("email_log").insert({
      booking_id: bookingId,
      recipient_email: recipient,
      template,
      status,
    });
  } catch (err) {
    console.error("[email] failed to log email:", err);
  }
}

async function hasEmailBeenSent(
  bookingId: string,
  template: string,
  recipient: string
) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("email_log")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("template", template)
    .eq("recipient_email", recipient)
    .eq("status", "sent")
    .maybeSingle();
  return Boolean(data);
}

async function sendEmail(params: {
  bookingId: string;
  to: string;
  template: string;
  subject: string;
  html: string;
}) {
  if (await hasEmailBeenSent(params.bookingId, params.template, params.to)) {
    await logEmail(params.bookingId, params.to, params.template, "skipped");
    return;
  }

  const resend = getResend();
  if (!resend) {
    await logEmail(params.bookingId, params.to, params.template, "failed");
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: emailFrom(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error(`[email] ${params.template} to ${params.to}:`, error);
      await logEmail(params.bookingId, params.to, params.template, "failed");
      return;
    }
    await logEmail(params.bookingId, params.to, params.template, "sent");
  } catch (err) {
    console.error(`[email] ${params.template} to ${params.to}:`, err);
    await logEmail(params.bookingId, params.to, params.template, "failed");
  }
}

export async function sendBookingRequestedLearnerEmail(params: {
  learnerEmail: string;
  learnerName: string;
  mentorName: string;
  startAt: string;
  bookingId: string;
  bookingUrl: string;
  amountCents: number;
}) {
  const time = formatSessionTime(params.startAt);
  const amount = `$${(params.amountCents / 100).toFixed(2)}`;

  await sendEmail({
    bookingId: params.bookingId,
    to: params.learnerEmail,
    template: "booking_requested_learner",
    subject: `Session request submitted — ${params.mentorName}`,
    html: `
      <p>Hi ${params.learnerName},</p>
      <p>Your session request with <strong>${params.mentorName}</strong> for <strong>${time}</strong> (${amount}) has been submitted.</p>
      <p><strong>Next step:</strong> authorize your card on the booking page. You won't be charged unless the mentor approves within ${config.approvalWindowHours} hours.</p>
      <p><a href="${params.bookingUrl}">Complete payment authorization →</a></p>
    `,
  });
}

export async function sendBookingRequestMentorEmail(params: {
  mentorEmail: string;
  mentorName: string;
  learnerName: string;
  startAt: string;
  bookingId: string;
  bookingUrl: string;
  amountCents: number;
}) {
  const time = formatSessionTime(params.startAt);
  const amount = `$${(params.amountCents / 100).toFixed(2)}`;

  await sendEmail({
    bookingId: params.bookingId,
    to: params.mentorEmail,
    template: "booking_request_mentor",
    subject: `New session request from ${params.learnerName}`,
    html: `
      <p>Hi ${params.mentorName},</p>
      <p><strong>${params.learnerName}</strong> requested a session on <strong>${time}</strong> (${amount}). Their card is authorized and ready for you to approve.</p>
      <p><a href="${params.bookingUrl}">Review and approve →</a></p>
      <p>Respond within ${config.approvalWindowHours} hours or the request expires automatically.</p>
    `,
  });
}

export async function sendPaymentAuthorizedLearnerEmail(params: {
  learnerEmail: string;
  learnerName: string;
  mentorName: string;
  startAt: string;
  bookingId: string;
  bookingUrl: string;
}) {
  const time = formatSessionTime(params.startAt);

  await sendEmail({
    bookingId: params.bookingId,
    to: params.learnerEmail,
    template: "payment_authorized_learner",
    subject: `Payment authorized — waiting for ${params.mentorName}`,
    html: `
      <p>Hi ${params.learnerName},</p>
      <p>Your card is authorized for the session with <strong>${params.mentorName}</strong> on <strong>${time}</strong>.</p>
      <p>You'll only be charged if they approve. We'll email you as soon as they respond.</p>
      <p><a href="${params.bookingUrl}">View booking →</a></p>
    `,
  });
}

export async function sendBookingApprovedEmail(params: {
  learnerEmail: string;
  learnerName: string;
  mentorName: string;
  startAt: string;
  meetingUrl: string;
  bookingUrl: string;
  bookingId: string;
}) {
  const time = formatSessionTime(params.startAt);

  await sendEmail({
    bookingId: params.bookingId,
    to: params.learnerEmail,
    template: "booking_approved_learner",
    subject: `Session confirmed with ${params.mentorName}`,
    html: `
      <p>Hi ${params.learnerName},</p>
      <p><strong>${params.mentorName}</strong> approved your session on <strong>${time}</strong>.</p>
      <p>Your card has been charged. Join from your booking page when it's time:</p>
      <p><a href="${params.bookingUrl}">View booking →</a></p>
      <p>Meeting link: <a href="${params.meetingUrl}">${params.meetingUrl}</a></p>
    `,
  });
}

export async function sendBookingApprovedMentorEmail(params: {
  mentorEmail: string;
  mentorName: string;
  learnerName: string;
  startAt: string;
  meetingUrl: string;
  bookingUrl: string;
  bookingId: string;
}) {
  const time = formatSessionTime(params.startAt);

  await sendEmail({
    bookingId: params.bookingId,
    to: params.mentorEmail,
    template: "booking_approved_mentor",
    subject: `Session confirmed with ${params.learnerName}`,
    html: `
      <p>Hi ${params.mentorName},</p>
      <p>You approved the session with <strong>${params.learnerName}</strong> on <strong>${time}</strong>. Payment has been captured.</p>
      <p>Join from your booking page when it's time:</p>
      <p><a href="${params.bookingUrl}">View booking →</a></p>
      <p>Meeting link: <a href="${params.meetingUrl}">${params.meetingUrl}</a></p>
    `,
  });
}

export async function sendBookingDeniedEmail(params: {
  learnerEmail: string;
  learnerName: string;
  mentorName: string;
  startAt: string;
  bookingId: string;
  mentorsUrl: string;
}) {
  const time = formatSessionTime(params.startAt);

  await sendEmail({
    bookingId: params.bookingId,
    to: params.learnerEmail,
    template: "booking_denied_learner",
    subject: "Session request declined",
    html: `
      <p>Hi ${params.learnerName},</p>
      <p><strong>${params.mentorName}</strong> declined your session request for <strong>${time}</strong>.</p>
      <p>Your card was not charged. You can pick another time slot anytime.</p>
      <p><a href="${params.mentorsUrl}">Browse mentors →</a></p>
    `,
  });
}

export async function sendSessionReminderEmail(params: {
  email: string;
  name: string;
  startAt: string;
  bookingUrl: string;
  bookingId: string;
}) {
  const time = formatSessionTime(params.startAt);

  await sendEmail({
    bookingId: params.bookingId,
    to: params.email,
    template: "session_reminder",
    subject: "Session starting soon",
    html: `
      <p>Hi ${params.name},</p>
      <p>Reminder: your session starts in about 1 hour (${time}).</p>
      <p><a href="${params.bookingUrl}">Open your booking →</a></p>
    `,
  });
}

// Backward-compatible alias used by older imports
export const sendBookingRequestEmail = sendBookingRequestMentorEmail;
