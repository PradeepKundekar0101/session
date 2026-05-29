"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader, Button, Card } from "@/components/ui";
import { SlotRequestButton } from "@/components/slot-request-button";
import { PageLoader } from "@/components/page-loader";
import { useApiGet } from "@/lib/hooks/use-api";
import { formatCents } from "@/lib/slots";
import type { Profile } from "@/lib/types";

type Slot = {
  startIso: string;
  endIso: string;
  label: string;
};

type MentorDetail = {
  id: string;
  slug: string;
  headline: string;
  bio: string;
  expertise: string[] | null;
  rate_cents: number;
  avatar_url: string | null;
  banner_url: string | null;
};

type MentorResponse = {
  mentor: MentorDetail;
  slots: Slot[];
  profile: Profile | null;
};

export default function MentorProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data, loading, error } = useApiGet<MentorResponse>(
    slug ? `/api/mentors/${slug}` : null
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader>
          <Link href="/mentors">All mentors</Link>
        </SiteHeader>
        <PageLoader />
      </div>
    );
  }

  if (error || !data?.mentor) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader>
          <Link href="/mentors">All mentors</Link>
        </SiteHeader>
        <main className="mx-auto max-w-6xl px-6 py-16 text-center">
          <p className="text-neutral-400">Mentor not found.</p>
        </main>
      </div>
    );
  }

  const { mentor, slots, profile } = data;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader>
        <Link href="/mentors">All mentors</Link>
      </SiteHeader>

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
          <div className="lg:col-span-2 -mt-12 relative z-10">
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
              {(mentor.expertise ?? []).map((tag) => (
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
                    <SlotRequestButton
                      key={slot.startIso}
                      mentorId={mentor.id}
                      startAt={slot.startIso}
                      endAt={slot.endIso}
                      label={slot.label}
                    />
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
