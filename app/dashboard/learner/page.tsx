import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { PageTitle, Badge, EmptyState, Button } from "@/components/ui";
import { formatCents } from "@/lib/slots";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  requested: "warning",
  approved: "success",
  denied: "danger",
  expired: "neutral",
  completed: "success",
  cancelled: "neutral",
};

export default async function LearnerDashboard() {
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, status, amount_cents, mentor_profiles(headline, slug, avatar_url)")
    .eq("learner_id", profile!.id)
    .order("start_at", { ascending: false });

  const upcoming = (bookings ?? []).filter((b) =>
    ["requested", "approved"].includes(b.status)
  );
  const past = (bookings ?? []).filter(
    (b) => !["requested", "approved"].includes(b.status)
  );

  return (
    <>
      <PageTitle
        title={`Welcome back, ${profile?.display_name?.split(" ")[0] ?? "there"}`}
        subtitle="Manage your upcoming and past mentoring sessions."
      />

      {/* Upcoming */}
      <section className="mb-12">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500 mb-4">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length ? (
          <div className="space-y-3">
            {upcoming.map((b) => {
              const raw = b.mentor_profiles;
              const mentor = (Array.isArray(raw) ? raw[0] : raw) as
                | { headline: string; slug: string; avatar_url: string | null }
                | null;
              const startDate = new Date(b.start_at);
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="block">
                  <div className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-surface p-4 transition-all hover:border-white/10 hover:bg-surface-elevated">
                    {/* Avatar */}
                    {mentor?.avatar_url ? (
                      <img src={mentor.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] shrink-0">
                        <span className="text-sm font-medium text-neutral-400">
                          {(mentor?.headline ?? "S").charAt(0)}
                        </span>
                      </div>
                    )}
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {mentor?.headline ?? "Session"}
                      </p>
                      <p className="text-sm text-neutral-400 mt-0.5">
                        {startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}
                        {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    {/* Right side */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge>
                      <span className="text-sm font-medium text-neutral-200">
                        {formatCents(b.amount_cents)}
                      </span>
                      <svg className="h-4 w-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No upcoming sessions"
            description="Browse mentors to book your first 1-on-1 session."
            action={
              <Link href="/mentors">
                <Button>Find a mentor</Button>
              </Link>
            }
          />
        )}
      </section>

      {/* Past */}
      {past.length ? (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500 mb-4">
            Past sessions ({past.length})
          </h2>
          <div className="space-y-2">
            {past.map((b) => {
              const raw = b.mentor_profiles;
              const mentor = (Array.isArray(raw) ? raw[0] : raw) as
                | { headline: string; slug: string; avatar_url: string | null }
                | null;
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="block">
                  <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] hover:border-white/[0.08] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-200 truncate">
                        {mentor?.headline ?? "Session"}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {new Date(b.start_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
