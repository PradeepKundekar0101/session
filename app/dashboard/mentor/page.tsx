import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { startStripeOnboarding } from "@/lib/actions/mentor";
import { PageTitle, Card, Badge, Button, StatCard, EmptyState } from "@/components/ui";
import { formatCents } from "@/lib/slots";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  requested: "warning",
  approved: "success",
  denied: "danger",
  expired: "neutral",
  completed: "success",
  cancelled: "neutral",
};

export default async function MentorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string; stripe?: string }>;
}) {
  const params = await searchParams;
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("user_id", profile!.id)
    .maybeSingle();

  const { data: bookings } = mentor
    ? await supabase
        .from("bookings")
        .select("id, start_at, status, amount_cents, learner_id")
        .eq("mentor_id", mentor.id)
        .order("start_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const pending = (bookings ?? []).filter((b) => b.status === "requested");
  const approved = (bookings ?? []).filter((b) => b.status === "approved");
  const completed = (bookings ?? []).filter((b) => b.status === "completed");
  const totalEarned = completed.reduce((s, b) => s + b.amount_cents, 0);

  return (
    <>
      <PageTitle
        title="Mentor dashboard"
        subtitle="Review requests, manage your schedule, and track earnings."
      />

      {params.onboarding === "submitted" ? (
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
          {/* Stats */}
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

          {/* Alerts */}
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
                  {params.stripe === "return" ? "✓ Stripe connected" : "Manage payouts"}
                </Button>
              </form>
              {mentor.status === "approved" ? (
                <Link href={`/mentors/${mentor.slug}`} className="text-sm text-neutral-400 hover:text-white transition-colors">
                  View public profile →
                </Link>
              ) : null}
            </div>
          )}

          {/* Pending requests */}
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

          {/* All sessions */}
          <section>
            <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500 mb-4">
              All sessions
            </h2>
            <div className="space-y-2">
              {(bookings ?? []).map((b) => {
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
              {!(bookings ?? []).length ? (
                <p className="text-sm text-neutral-500 py-4">No sessions yet.</p>
              ) : null}
            </div>
          </section>
        </>
      )}
    </>
  );
}
