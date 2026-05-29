"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { startStripeOnboarding } from "@/lib/actions/mentor";
import { PageTitle, Card, Badge, Button, StatCard, EmptyState } from "@/components/ui";
import { PageLoader } from "@/components/page-loader";
import { useApiGet } from "@/lib/hooks/use-api";
import { formatCents } from "@/lib/slots";
import type { MentorProfile, Profile } from "@/lib/types";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  requested: "warning",
  approved: "success",
  denied: "danger",
  expired: "neutral",
  completed: "success",
  cancelled: "neutral",
};

type BookingRow = {
  id: string;
  start_at: string;
  status: string;
  amount_cents: number;
  learner_id: string;
};

type MentorDashboardResponse = {
  profile: Profile;
  mentor: MentorProfile | null;
  bookings: BookingRow[];
  pending: BookingRow[];
  totalEarned: number;
  completed: BookingRow[];
};

function MentorDashboardContent() {
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding");
  const stripe = searchParams.get("stripe");

  const { data, loading } = useApiGet<MentorDashboardResponse>(
    "/api/dashboard/mentor"
  );

  if (loading || !data) {
    return <PageLoader />;
  }

  const { mentor, bookings, pending, totalEarned, completed } = data;

  return (
    <>
      <PageTitle
        title="Mentor dashboard"
        subtitle="Review requests, manage your schedule, and track earnings."
      />

      {onboarding === "submitted" ? (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-400 font-medium">
            Profile submitted — an admin will review it shortly.
          </p>
        </div>
      ) : null}

      {!mentor ? (
        <EmptyState
          title="Complete your mentor profile"
          description="Set up your expertise, rate, and connect Stripe to start receiving session requests."
          action={
            <Link href="/dashboard/mentor/onboarding">
              <Button>Start onboarding</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4 mb-8">
            <StatCard
              label="Status"
              value={
                <Badge
                  tone={
                    mentor.status === "approved"
                      ? "success"
                      : mentor.status === "denied"
                        ? "danger"
                        : "warning"
                  }
                >
                  {mentor.status}
                </Badge>
              }
            />
            <StatCard label="Rate" value={formatCents(mentor.rate_cents)} detail="per session" />
            <StatCard label="Pending" value={String(pending.length)} detail="awaiting response" />
            <StatCard label="Earned" value={formatCents(totalEarned)} detail={`${completed.length} sessions`} />
          </div>

          {!mentor.stripe_account_id ? (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-amber-400">Connect Stripe</p>
                <p className="text-xs text-amber-400/70 mt-0.5">Required to receive payouts when sessions are approved.</p>
              </div>
              <Link href="/dashboard/mentor/onboarding">
                <Button variant="secondary" size="sm">Setup</Button>
              </Link>
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-3">
              <form action={startStripeOnboarding}>
                <Button type="submit" variant="ghost" size="sm">
                  {stripe === "return" ? "✓ Stripe connected" : "Manage payouts"}
                </Button>
              </form>
              {mentor.status === "approved" ? (
                <Link href={`/mentors/${mentor.slug}`} className="text-sm text-neutral-400 hover:text-white transition-colors">
                  View public profile →
                </Link>
              ) : null}
            </div>
          )}

          <section className="mb-10">
            <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500 mb-4">
              Action required ({pending.length})
            </h2>
            {pending.length ? (
              <div className="space-y-3">
                {pending.map((b) => {
                  const startDate = new Date(b.start_at);
                  return (
                    <Link key={b.id} href={`/bookings/${b.id}`} className="block">
                      <div className="group flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 transition-all hover:bg-amber-500/10">
                        <div className="flex items-center gap-3">
                          <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                          <div>
                            <p className="text-sm font-medium text-white">
                              New session request
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              {" · "}
                              {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                              {" · "}
                              {formatCents(b.amount_cents)}
                            </p>
                          </div>
                        </div>
                        <svg className="h-4 w-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 py-4">
                No pending requests. New bookings will appear here.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500 mb-4">
              All sessions
            </h2>
            <div className="space-y-2">
              {bookings.map((b) => {
                const startDate = new Date(b.start_at);
                return (
                  <Link key={b.id} href={`/bookings/${b.id}`} className="block">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-surface px-4 py-3 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-neutral-300">
                          {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" · "}
                          {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-500">{formatCents(b.amount_cents)}</span>
                        <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {!bookings.length ? (
                <p className="text-sm text-neutral-500 py-4">No sessions yet.</p>
              ) : null}
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default function MentorDashboard() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MentorDashboardContent />
    </Suspense>
  );
}
