import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader, Button, Card } from "@/components/ui";
import { formatCents } from "@/lib/slots";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: mentors } = await supabase
    .from("mentor_profiles")
    .select("id, slug, headline, rate_cents, expertise, avatar_url")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(6);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader>
        {user ? (
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/auth/login" className="hover:text-white">
              Sign in
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </>
        )}
      </SiteHeader>

      <main className="flex-1 bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#BDFF3A]/[0.03] via-transparent to-transparent" />
          <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 md:pt-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BDFF3A]/20 bg-[#BDFF3A]/[0.06] px-3 py-1 text-xs font-medium text-[#BDFF3A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#BDFF3A]" />
                Now accepting mentor applications
              </div>
              <h1 className="mt-6 font-serif text-[clamp(2.5rem,5vw,4rem)] leading-[1.08] tracking-tight text-white">
                Learn from people who&apos;ve
                <br className="hidden sm:block" />
                already done the work.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-400">
                Book 1-on-1 video sessions with vetted experts.
                You&apos;re only charged when they approve your request.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/mentors">
                  <Button size="lg">Browse mentors</Button>
                </Link>
                <Link href="/auth/signup?role=mentor">
                  <Button variant="secondary" size="lg">
                    Become a mentor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-white/[0.06] bg-surface py-16">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              How it works
            </p>
            <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] md:grid-cols-4">
              {[
                ["Pick a slot", "Choose an open time on any mentor's calendar.", "01"],
                ["Authorize payment", "We hold your card — nothing charged yet.", "02"],
                ["Mentor approves", "They accept within 24h, then you're charged.", "03"],
                ["Join the session", "Both of you get a private video link.", "04"],
              ].map(([title, body, num]) => (
                <div key={num} className="bg-surface p-6">
                  <span className="text-xs font-bold text-[#BDFF3A]/60">{num}</span>
                  <h3 className="mt-3 font-medium text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured mentors */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl text-white">Featured mentors</h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Experts ready for 1-on-1 sessions
                </p>
              </div>
              <Link
                href="/mentors"
                className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(mentors ?? []).map((m) => (
                <Link key={m.id} href={`/mentors/${m.slug}`}>
                  <Card hover className="h-full">
                    <div className="flex items-start gap-3">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] shrink-0">
                          <span className="text-sm font-medium text-neutral-400">
                            {m.headline.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {m.headline}
                        </h3>
                        <p className="text-sm text-neutral-400 mt-0.5 truncate">
                          {(m.expertise ?? []).slice(0, 2).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.06]">
                      <span className="text-sm font-semibold text-white">
                        {formatCents(m.rate_cents)}
                      </span>
                      <span className="text-xs text-neutral-500 ml-1">/ session</span>
                    </div>
                  </Card>
                </Link>
              ))}
              {!mentors?.length ? (
                <p className="text-neutral-500 col-span-full text-center py-12">
                  No approved mentors yet. Be the first to apply.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-8">
          <div className="mx-auto max-w-6xl px-6 flex items-center justify-between text-xs text-neutral-500">
            <p>GetMentor · Session MVP</p>
            <div className="flex gap-4">
              <Link href="/mentors" className="hover:text-neutral-300">Browse</Link>
              <Link href="/auth/signup?role=mentor" className="hover:text-neutral-300">Become a mentor</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
