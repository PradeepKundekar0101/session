"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { redirectAfterAuth } from "@/lib/auth-email";
import { ensureProfile, getDashboardPath } from "@/lib/auth";

const emailRedirectTo = `${config.appUrl}/auth/callback`;

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const displayName = String(formData.get("display_name"));
  const role = String(formData.get("role") ?? "learner");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, role },
      emailRedirectTo,
    },
  });

  if (error) {
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.user) {
    redirect("/auth/signup?error=Could not create account");
  }

  // Try to establish a session so the user stays logged in.
  if (!data.session) {
    await supabase.auth.signInWithPassword({ email, password });
  }

  await ensureProfile(data.user);
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const next = String(formData.get("next") ?? "/dashboard");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  await ensureProfile(data.user);
  redirectAfterAuth(data.user, next);
}

export async function checkEmailVerified() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");
  if (user.email_confirmed_at) {
    await ensureProfile(user);
    redirect(await getDashboardPath());
  }
  redirect("/verify-email?error=Email not verified yet — check your inbox");
}

export async function resendVerificationEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/auth/login");
  }

  if (user.email_confirmed_at) {
    redirect("/dashboard");
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
    options: { emailRedirectTo },
  });

  if (error) {
    redirect(`/verify-email?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/verify-email?message=Verification email sent");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
