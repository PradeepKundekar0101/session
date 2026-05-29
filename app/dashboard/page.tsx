import { redirect } from "next/navigation";
import { getSessionUser, ensureProfile, getProfile } from "@/lib/auth";
import { isEmailVerified, dashboardPathForProfile } from "@/lib/auth-email";

export default async function DashboardIndex() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  if (!isEmailVerified(user)) redirect("/verify-email");

  await ensureProfile(user);
  const profile = await getProfile();
  if (!profile) {
    redirect("/verify-email?error=Could not load your profile. Try again or sign out.");
  }

  redirect(dashboardPathForProfile(profile));
}
