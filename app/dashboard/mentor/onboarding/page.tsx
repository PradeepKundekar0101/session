"use client";

import { submitMentorOnboarding, startStripeOnboarding } from "@/lib/actions/mentor";
import { PageTitle, Card, Input, Label, Textarea, Button } from "@/components/ui";
import { ImageUpload } from "@/components/image-upload";
import { PageLoader } from "@/components/page-loader";
import { useApiGet } from "@/lib/hooks/use-api";
import type { MentorProfile } from "@/lib/types";

type OnboardingResponse = {
  mentor: (MentorProfile & {
    avatar_url?: string | null;
    banner_url?: string | null;
  }) | null;
};

export default function MentorOnboardingPage() {
  const { data, loading } = useApiGet<OnboardingResponse>(
    "/api/dashboard/mentor/onboarding"
  );

  if (loading) {
    return <PageLoader />;
  }

  const mentor = data?.mentor ?? null;

  return (
    <>
      <PageTitle
        title="Mentor profile"
        subtitle="Tell learners what you offer. After admin approval, your profile goes live."
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <ImageUpload
            type="avatar"
            currentUrl={mentor?.avatar_url}
            label="Profile photo"
          />
          <div className="flex-1">
            <ImageUpload
              type="banner"
              currentUrl={mentor?.banner_url}
              label="Banner image"
            />
          </div>
        </div>
      </Card>

      <Card>
        <form action={submitMentorOnboarding} className="space-y-4 max-w-lg">
          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              name="headline"
              required
              defaultValue={mentor?.headline}
              placeholder="e.g. Staff engineer · React & system design"
            />
          </div>
          <div>
            <Label htmlFor="slug">Profile URL slug</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={mentor?.slug}
              placeholder="jane-doe"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" required defaultValue={mentor?.bio} />
          </div>
          <div>
            <Label htmlFor="expertise">Expertise (comma-separated)</Label>
            <Input
              id="expertise"
              name="expertise"
              defaultValue={(mentor?.expertise ?? []).join(", ")}
              placeholder="Career, React, Interviews"
            />
          </div>
          <div>
            <Label htmlFor="rate">Rate per session (USD)</Label>
            <Input
              id="rate"
              name="rate"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={mentor ? mentor.rate_cents / 100 : 150}
            />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone (IANA)</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={mentor?.timezone ?? "America/New_York"}
            />
          </div>
          <Button type="submit">Save & submit for review</Button>
        </form>

        {mentor?.stripe_account_id ? (
          <form action={startStripeOnboarding} className="mt-8 pt-8 border-t border-white/[0.06]">
            <p className="text-sm text-neutral-400 mb-3">
              Connect Stripe Express to receive payouts when sessions are approved.
            </p>
            <Button type="submit" variant="secondary">
              Connect Stripe
            </Button>
          </form>
        ) : null}
      </Card>
    </>
  );
}
