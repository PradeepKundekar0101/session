import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader, Card } from "@/components/ui";
import { formatCents } from "@/lib/slots";

export default async function MentorsPage() {
  const supabase = await createClient();
  const { data: mentors } = await supabase
    .from("mentor_profiles")
    .select("slug, headline, bio, expertise, rate_cents, avatar_url")
    .eq("status", "approved")
    .order("headline");

  return (
    <>
      <SiteHeader>
        <Link href="/dashboard" className="hover:text-white transition-colors">
          Dashboard
        </Link>
      </SiteHeader>
      <main className="flex-1 bg-background mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-4xl tracking-tight text-white">
            Find a mentor
          </h1>
          <p className="mt-2 text-neutral-400">
            {mentors?.length ?? 0} experts ready for 1-on-1 sessions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(mentors ?? []).map((m) => (
            <Link key={m.slug} href={`/mentors/${m.slug}`}>
              <Card hover className="h-full">
                <div className="flex items-start gap-3 mb-3">
                  {m.avatar_url ? (
                    <img
                      src={m.avatar_url}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] shrink-0">
                      <span className="text-lg font-serif text-neutral-500">
                        {m.headline.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-medium text-white leading-snug">
                      {m.headline}
                    </h2>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {formatCents(m.rate_cents)}
                      <span className="font-normal text-neutral-500 ml-1">/ session</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                  {m.bio}
                </p>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap gap-1.5">
                  {(m.expertise ?? []).slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs text-neutral-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {(m.expertise ?? []).length > 3 ? (
                    <span className="text-xs text-neutral-500 self-center ml-1">
                      +{(m.expertise ?? []).length - 3}
                    </span>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {!mentors?.length ? (
          <div className="text-center py-20">
            <p className="text-neutral-400">No approved mentors yet.</p>
            <Link href="/auth/signup?role=mentor" className="mt-2 inline-block text-sm font-medium text-[#BDFF3A] hover:underline">
              Apply to be the first →
            </Link>
          </div>
        ) : null}
      </main>
    </>
  );
}
