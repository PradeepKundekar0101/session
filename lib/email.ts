import { Resend } from "resend";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

let resendClient: Resend | null = null;

function getResend() {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    resendClient = new Resend(key);
  }
  return resendClient;
}

async function logEmail(
  bookingId: string | null,
  recipient: string,
  template: string,
  status: string
) {
  try {
    const admin = createAdminClient();
    await admin.from("email_log").insert({
      booking_id: bookingId,
      recipient_email: recipient,
      template,
      status,
    });
  } catch {
    // Non-blocking
  }
}

export async function sendBookingRequestEmail(params: {
  mentorEmail: string;
  mentorName: string;
  learnerName: string;
  startAt: string;
  bookingId: string;
  dashboardUrl: string;
}) {
  const from = process.env.EMAIL_FROM ?? "GetMentor <onboarding@resend.dev>";
  const subject = `New session request from ${params.learnerName}`;
  const html = `
    <p>Hi ${params.mentorName},</p>
    <p><strong>${params.learnerName}</strong> requested a session on <strong>${new Date(params.startAt).toLocaleString()}</strong>.</p>
    <p><a href="${params.dashboardUrl}">Review and approve in your dashboard</a></p>
    <p>You have ${config.approvalWindowHours} hours to respond before the request expires.</p>
  `;

  try {
    await getResend().emails.send({
      from,
      to: params.mentorEmail,
      subject,
      html,
    });
    await logEmail(params.bookingId, params.mentorEmail, "booking_request", "sent");
  } catch {
    await logEmail(params.bookingId, params.mentorEmail, "booking_request", "failed");
  }
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
  const from = process.env.EMAIL_FROM ?? "GetMentor <onboarding@resend.dev>";
  const html = `
    <p>Hi ${params.learnerName},</p>
    <p><strong>${params.mentorName}</strong> approved your session on <strong>${new Date(params.startAt).toLocaleString()}</strong>.</p>
    <p>Your card has been charged. Join the session from your booking page when it's time:</p>
    <p><a href="${params.bookingUrl}">View booking</a></p>
    <p>Meeting link: <a href="${params.meetingUrl}">${params.meetingUrl}</a></p>
  `;

  try {
    await getResend().emails.send({
      from,
      to: params.learnerEmail,
      subject: `Session confirmed with ${params.mentorName}`,
      html,
    });
    await logEmail(params.bookingId, params.learnerEmail, "booking_approved", "sent");
  } catch {
    await logEmail(params.bookingId, params.learnerEmail, "booking_approved", "failed");
  }
}

export async function sendBookingDeniedEmail(params: {
  learnerEmail: string;
  learnerName: string;
  mentorName: string;
  startAt: string;
  bookingId: string;
}) {
  const from = process.env.EMAIL_FROM ?? "GetMentor <onboarding@resend.dev>";
  const html = `
    <p>Hi ${params.learnerName},</p>
    <p><strong>${params.mentorName}</strong> declined your session request for <strong>${new Date(params.startAt).toLocaleString()}</strong>.</p>
    <p>Your card was not charged. You can pick another time slot anytime.</p>
  `;

  try {
    await getResend().emails.send({
      from,
      to: params.learnerEmail,
      subject: "Session request declined",
      html,
    });
    await logEmail(params.bookingId, params.learnerEmail, "booking_denied", "sent");
  } catch {
    await logEmail(params.bookingId, params.learnerEmail, "booking_denied", "failed");
  }
}

export async function sendSessionReminderEmail(params: {
  email: string;
  name: string;
  startAt: string;
  bookingUrl: string;
  bookingId: string;
}) {
  const from = process.env.EMAIL_FROM ?? "GetMentor <onboarding@resend.dev>";
  const html = `
    <p>Hi ${params.name},</p>
    <p>Reminder: your session starts in about 1 hour (${new Date(params.startAt).toLocaleString()}).</p>
    <p><a href="${params.bookingUrl}">Open your booking</a></p>
  `;

  try {
    await getResend().emails.send({
      from,
      to: params.email,
      subject: "Session starting soon",
      html,
    });
    await logEmail(params.bookingId, params.email, "session_reminder", "sent");
  } catch {
    await logEmail(params.bookingId, params.email, "session_reminder", "failed");
  }
}
