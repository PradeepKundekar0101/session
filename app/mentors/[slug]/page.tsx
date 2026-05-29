import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBookingRequest } from "@/lib/actions/booking";
import { SiteHeader, Button, Card } from "@/components/ui";
import { formatCents, generateSlots } from "@/lib/slots";
import { getProfile } from "@/lib/auth";

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!mentor) notFound();

  const [{ data: rules }, { data: exceptions }, { data: bookings }] =
    await Promise.all([
      supabase.from("availability_rules").select("*").eq("mentor_id", mentor.id),
      supabase
        .from("availability_exceptions")
        .select("*")
        .eq("mentor_id", mentor.id),
      supabase
        .from("bookings")
        .select("start_at, end_at")
        .eq("mentor_id", mentor.id)
        .in("status", ["requested", "approved"]),
    ]);

  const slots = generateSlots({
    rules: rules ?? [],
    exceptions: exceptions ?? [],
    timezone: mentor.timezone,
    bookedRanges: bookings ?? [],
  });

  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader>
        <Link href="/mentors">All mentors</Link>
      </SiteHeader>

      {/* Banner */}
      <div className="relative h-48 w-full bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] overflow-hidden">
        {mentor.banner_url ? (
          <img
            src={mentor.banner_url}
            alt=""
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#BDFF3A]/[0.08] via-surface to-background" />
        )}
      </div>

      <main className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Left: Profile info */}
          <div className="lg:col-span-2 -mt-12 relative z-10">
            {/* Avatar */}
            <div className="mb-4">
              {mentor.avatar_url ? (
                <img
                  src={mentor.avatar_url}
                  alt={mentor.headline}
                  className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-surface-elevated shadow-sm">
                  <span className="text-2xl font-serif text-neutral-400">
                    {mentor.headline.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <h1 className="font-serif text-3xl tracking-tight text-white">
              {mentor.headline}
            </h1>
            <p className="mt-3 text-neutral-400 leading-relaxed">{mentor.bio}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {(mentor.expertise ?? []).map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#BDFF3A]/[0.08] border border-[#BDFF3A]/20 px-3 py-1 text-xs font-medium text-[#BDFF3A]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-6 text-2xl font-medium text-white">
              {formatCents(mentor.rate_cents)}{" "}
              <span className="text-base font-normal text-neutral-500">/ session</span>
            </p>
          </div>

          {/* Right: Booking */}
          <div className="lg:col-span-3 pt-6 lg:pt-4">
            <Card>
              <h2 className="font-medium text-lg text-white">Request a session</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Pick a time — payment is authorized (not charged) until the mentor
                approves within 24 hours.
              </p>

              {!profile ? (
                <div className="mt-6">
                  <Link href={`/auth/login?next=/mentors/${slug}`}>
                    <Button>Sign in to book</Button>
                  </Link>
                </div>
              ) : slots.length === 0 ? (
                <p className="mt-6 text-sm text-neutral-500">
                  No open slots in the next few weeks.
                </p>
              ) : (
                <div className="mt-6 space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                  {slots.map((slot) => (
                    <form
                      key={slot.startIso}
                      action={createBookingRequest}
                      className="block"
                    >
                      <input type="hidden" name="mentor_id" value={mentor.id} />
                      <input type="hidden" name="start_at" value={slot.startIso} />
                      <input type="hidden" name="end_at" value={slot.endIso} />
                      <Button
                        type="submit"
                        variant="secondary"
                        className="w-full justify-between"
                      >
                        <span>{slot.label}</span>
                        <span className="text-neutral-500">Request →</span>
                      </Button>
                    </form>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
