import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dashboardPathForProfile } from "@/lib/auth-email";
import type { Profile, UserRole } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

/** Create profile if the auth trigger did not (prevents login ↔ dashboard redirect loops). */
export async function ensureProfile(user: User): Promise<Profile | null> {
  const existing = await getProfile();
  if (existing) return existing;

  const meta = user.user_metadata ?? {};
  const rawRole = String(meta.role ?? "learner");
  const role: UserRole = ["learner", "mentor", "admin"].includes(rawRole)
    ? (rawRole as UserRole)
    : "learner";
  const displayName =
    String(meta.display_name ?? "") || user.email?.split("@")[0] || "User";

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").insert({
    id: user.id,
    display_name: displayName,
    role,
  });

  if (error && !error.message.includes("duplicate")) {
    console.error("ensureProfile failed:", error.message);
    return null;
  }

  return getProfile();
}

export async function getDashboardPath(): Promise<string> {
  const user = await getSessionUser();
  if (!user) return "/auth/login";
  const profile = (await ensureProfile(user)) ?? (await getProfile());
  if (!profile) return "/dashboard/learner";
  return dashboardPathForProfile(profile);
}

export async function requireProfile(role?: UserRole) {
  const profile = await getProfile();
  if (!profile) {
    throw new Error("Unauthorized");
  }
  if (role && profile.role !== role && profile.role !== "admin") {
    throw new Error("Forbidden");
  }
  return profile;
}
