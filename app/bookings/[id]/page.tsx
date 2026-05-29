"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { formatCents } from "@/lib/slots";
import { BookingPayment } from "@/components/booking-payment";
import { MentorBookingActions } from "@/components/mentor-actions";
import { completeBookingForm } from "@/lib/actions/booking";
import { BrandLogo } from "@/components/logo-icon";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageLoader } from "@/components/page-loader";
import { useApiGet } from "@/lib/hooks/use-api";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  requested: { label: "Awaiting action", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  approved: { label: "Confirmed", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  denied: { label: "Declined", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  expired: { label: "Expired", color: "text-neutral-400", bg: "bg-white/[0.04] border-white/[0.08]" },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  cancelled: { label: "Cancelled", color: "text-neutral-400", bg: "bg-white/[0.04] border-white/[0.08]" },
};

type BookingResponse = {
  booking: {
    id: string;
    start_at: string;
    end_at: string;
    status: string;
    amount_cents: number;
    meeting_url: string | null;
    approval_deadline: string;
    created_at: string;
  };
  mentor: { slug: string; headline: string; user_id: string };
  isLearner: boolean;
  isMentor: boolean;
  clientSecret: string | null;
  paymentAuthorized: boolean;
  canJoin: boolean;
  sessionEnded: boolean;
};

function BookingPageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const payment = searchParams.get("payment");
  const booked = searchParams.get("booked");
  const errorParam = searchParams.get("error");

  const apiUrl = id
    ? `/api/bookings/${id}${payment ? `?payment=${payment}` : ""}`
    : null;
  const { data, loading, error } = useApiGet<BookingResponse>(apiUrl);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-white/[0.06] bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link href="/">
              <BrandLogo />
            </Link>
          </div>
        </header>
        <PageLoader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-white/[0.06] bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link href="/">
              <BrandLogo />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-6 pt-12 pb-24 text-center">
          <p className="text-neutral-400">{error ?? "Booking not found."}</p>
        </main>
      </div>
    );
  }

  const {
    booking,
    mentor,
    isLearner,
    isMentor,
    clientSecret,
    paymentAuthorized,
    canJoin,
    sessionEnded,
  } = data;

  const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.cancelled;

  const startDate = new Date(booking.start_at);
  const endDate = new Date(booking.end_at);
  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = `${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/[0.06] bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/">
            <BrandLogo />
          </Link>
          <Link
            href={isMentor ? "/dashboard/mentor" : "/dashboard/learner"}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-12 pb-24">
        {booked === "1" ? (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
            <p className="text-sm font-medium text-emerald-300">
              Session booked — waiting for mentor approval
            </p>
            <p className="mt-1 text-sm text-emerald-400/80">
              Authorize your card below. You&apos;ll only be charged if the mentor
              approves within 24 hours.
            </p>
          </div>
        ) : null}
        {errorParam ? (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{decodeURIComponent(errorParam)}</p>
          </div>
        ) : null}

        <div className={`rounded-xl border px-5 py-4 mb-8 ${statusCfg.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${booking.status === "approved" || booking.status === "completed" ? "bg-emerald-500" : booking.status === "requested" ? "bg-amber-500 animate-pulse" : "bg-neutral-500"}`} />
              <span className={`text-sm font-semibold ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            <span className="text-lg font-semibold text-white">
              {formatCents(booking.amount_cents)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-surface overflow-hidden">
          <div className="p-6 pb-5 border-b border-white/[0.06]">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
              Session with
            </p>
            <h1 className="font-serif text-2xl text-white mb-4">{mentor.headline}</h1>
            <div className="flex flex-col gap-1 text-sm text-neutral-300">
              <p className="font-medium text-white">{dateStr}</p>
              <p>{timeStr}</p>
            </div>
          </div>

          {booking.status === "requested" && isLearner ? (
            <div className="p-6 border-b border-white/[0.06]">
              {clientSecret ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15">
                      <span className="text-amber-400 text-xs font-bold">1</span>
                    </div>
                    <h2 className="font-medium text-white">
                      Authorize your card
                    </h2>
                  </div>
                  <p className="text-sm text-neutral-400 mb-5 ml-9">
                    A hold of {formatCents(booking.amount_cents)} will be placed. You&apos;re
                    only charged if the mentor approves.
                  </p>
                  <div className="ml-9">
                    <BookingPayment clientSecret={clientSecret} bookingId={id} />
                  </div>
                </>
              ) : paymentAuthorized ? (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 shrink-0">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">Payment authorized</p>
                    <p className="text-sm text-neutral-400 mt-0.5">
                      Your card is on hold. Waiting for {mentor.headline} to approve — you&apos;ll be notified by email.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] shrink-0">
                    <span className="text-neutral-400 text-xs">?</span>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">
                      Unable to load payment form. Please refresh the page or contact support.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {booking.status === "requested" && isMentor ? (
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="font-medium text-white mb-1">Your action required</h2>
              <p className="text-sm text-neutral-400 mb-5">
                Approve to capture the learner&apos;s payment ({formatCents(booking.amount_cents)}) and create a video room. Decline to release the hold.
              </p>
              <MentorBookingActions bookingId={id} />
              <p className="mt-4 text-xs text-neutral-500">
                Respond by {new Date(booking.approval_deadline).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} or it auto-expires.
              </p>
            </div>
          ) : null}

          {canJoin ? (
            <div className="p-6 border-b border-white/[0.06]">
              <a
                href={booking.meeting_url!}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#d4ff7a] to-[#BDFF3A] px-6 py-4 text-black font-medium text-base shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-110 transition-all"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Join video session
              </a>
            </div>
          ) : booking.status === "approved" && booking.meeting_url && !sessionEnded ? (
            <div className="p-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
                <div className="h-3 w-3 rounded-full bg-neutral-600" />
                <p className="text-sm text-neutral-400">
                  Video room opens 15 minutes before the session starts.
                </p>
              </div>
            </div>
          ) : null}

          {booking.status === "approved" && sessionEnded && (isLearner || isMentor) ? (
            <div className="p-6 border-b border-white/[0.06]">
              <form action={completeBookingForm}>
                <input type="hidden" name="booking_id" value={id} />
                <FormSubmitButton
                  variant="secondary"
                  className="w-full"
                  loadingText="Completing…"
                >
                  Mark session as completed
                </FormSubmitButton>
              </form>
            </div>
          ) : null}

          <div className="px-6 py-4 bg-white/[0.02]">
            <p className="text-xs text-neutral-500">
              Booking ID: {id.slice(0, 8)}… · Created {new Date(booking.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BookingPageContent />
    </Suspense>
  );
}
