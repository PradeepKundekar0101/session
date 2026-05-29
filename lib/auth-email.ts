import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types";

export function isEmailVerified(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}

export function dashboardPathForProfile(profile: Profile): string {
  if (profile.role === "admin") return "/dashboard/admin";
  if (profile.role === "mentor") return "/dashboard/mentor";
  return "/dashboard/learner";
}

/** Where to send the user right after sign-up or sign-in. */
export function redirectAfterAuth(user: User, next?: string) {
  if (!isEmailVerified(user)) {
    redirect("/verify-email");
  }
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("/auth") ? next : null;
  // Role-based home is resolved on /dashboard; use learner as default entry.
  redirect(safeNext ?? "/dashboard/learner");
}
