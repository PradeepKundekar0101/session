"use client";

import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { SiteHeader } from "@/components/ui";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageLoader } from "@/components/page-loader";
import { useApiGet } from "@/lib/hooks/use-api";
import type { Profile } from "@/lib/types";

type MeResponse = {
  profile: Profile | null;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, loading } = useApiGet<MeResponse>("/api/me");
  const profile = data?.profile;

  if (loading) {
    return (
      <>
        <SiteHeader />
        <PageLoader />
      </>
    );
  }

  return (
    <>
      <SiteHeader>
        {profile?.role === "mentor" ? (
          <>
            <Link href="/dashboard/mentor" className="hover:text-white transition-colors">
              Overview
            </Link>
            <Link href="/dashboard/mentor/availability" className="hover:text-white transition-colors">
              Schedule
            </Link>
            <Link href="/dashboard/mentor/onboarding" className="hover:text-white transition-colors">
              Profile
            </Link>
          </>
        ) : profile?.role === "learner" ? (
          <Link href="/mentors" className="hover:text-white transition-colors">
            Find mentors
          </Link>
        ) : null}
        {profile?.role === "admin" ? (
          <Link href="/dashboard/admin" className="hover:text-white transition-colors">
            Admin
          </Link>
        ) : null}
        <form action={signOut}>
          <FormSubmitButton variant="ghost" size="sm" loadingText="Signing out…">
            Sign out
          </FormSubmitButton>
        </form>
      </SiteHeader>
      <main className="flex-1 bg-background mx-auto max-w-5xl px-6 py-10">{children}</main>
    </>
  );
}
