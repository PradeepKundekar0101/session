"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/page-loader";
import { useApiGet } from "@/lib/hooks/use-api";
import { dashboardPathForProfile } from "@/lib/auth-email";
import type { Profile } from "@/lib/types";

type MeResponse = {
  user: { email_confirmed_at: string | null } | null;
  profile: Profile | null;
};

export default function DashboardIndex() {
  const router = useRouter();
  const { data, loading, error } = useApiGet<MeResponse>("/api/me");

  useEffect(() => {
    if (loading) return;

    if (error || !data?.user) {
      router.replace("/auth/login");
      return;
    }

    if (!data.user.email_confirmed_at) {
      router.replace("/verify-email");
      return;
    }

    if (!data.profile) {
      router.replace("/verify-email?error=Could not load your profile. Try again or sign out.");
      return;
    }

    router.replace(dashboardPathForProfile(data.profile));
  }, [data, loading, error, router]);

  return <PageLoader label="Redirecting…" />;
}
