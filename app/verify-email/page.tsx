"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  checkEmailVerified,
  resendVerificationEmail,
  signOut,
} from "@/lib/actions/auth";
import { SiteHeader, Card, PageTitle } from "@/components/ui";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageLoader } from "@/components/page-loader";
import { useApiGet } from "@/lib/hooks/use-api";
import { dashboardPathForProfile } from "@/lib/auth-email";
import type { Profile } from "@/lib/types";

type MeResponse = {
  user: { email: string | undefined; email_confirmed_at: string | null } | null;
  profile: Profile | null;
};

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const error = searchParams.get("error");
  const emailParam = searchParams.get("email");

  const { data, loading } = useApiGet<MeResponse>("/api/me");

  useEffect(() => {
    if (loading || !data) return;

    if (data.user?.email_confirmed_at && data.profile) {
      router.replace(dashboardPathForProfile(data.profile));
      return;
    }

    if (!data.user && !emailParam) {
      router.replace("/auth/login?next=/verify-email");
    }
  }, [data, loading, emailParam, router]);

  if (loading) {
    return (
      <>
        <SiteHeader />
        <PageLoader />
      </>
    );
  }

  const user = data?.user;
  const displayEmail = user?.email ?? emailParam ?? null;

  if (!user && !displayEmail) {
    return null;
  }

  return (
    <>
      <SiteHeader>
        {user ? (
          <form action={signOut}>
            <FormSubmitButton variant="ghost" loadingText="Signing out…">
              Sign out
            </FormSubmitButton>
          </form>
        ) : null}
      </SiteHeader>
      <main className="flex-1 bg-background mx-auto max-w-md px-6 py-16">
        <PageTitle
          title="Verify your email"
          subtitle="We sent a confirmation link to complete your account setup."
        />
        {message ? (
          <p className="mb-4 text-sm text-emerald-400">{message}</p>
        ) : null}
        {error ? (
          <p className="mb-4 text-sm text-red-400">
            {decodeURIComponent(error)}
          </p>
        ) : null}
        <Card className="space-y-4">
          <p className="text-sm text-neutral-300">
            Check <strong className="text-white">{displayEmail}</strong> for a message from GetMentor.
            Click the link in that email, then return here.
          </p>
          <p className="text-xs text-neutral-500">
            Booking and dashboards unlock after you verify.
          </p>
          {user ? (
            <>
              <form action={resendVerificationEmail}>
                <FormSubmitButton variant="secondary" className="w-full" loadingText="Sending…">
                  Resend verification email
                </FormSubmitButton>
              </form>
              <form action={checkEmailVerified}>
                <FormSubmitButton variant="ghost" className="w-full" loadingText="Checking…">
                  I verified — continue
                </FormSubmitButton>
              </form>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#d4ff7a] to-[#BDFF3A] px-4 py-2.5 text-sm font-medium text-black shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-110 transition-all"
            >
              Sign in to continue
            </Link>
          )}
        </Card>
      </main>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
