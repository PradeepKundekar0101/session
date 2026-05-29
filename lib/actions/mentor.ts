"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { slugify } from "@/lib/slots";
import {
  createAccountLink,
  createConnectAccount,
} from "@/lib/stripe";

export async function submitMentorOnboarding(formData: FormData) {
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile) redirect("/auth/login");

  const headline = String(formData.get("headline"));
  const bio = String(formData.get("bio"));
  const expertiseRaw = String(formData.get("expertise"));
  const rateDollars = Number(formData.get("rate"));
  const timezone = String(formData.get("timezone") ?? "UTC");
  const slug = slugify(String(formData.get("slug") || headline || profile.display_name));

  if (!headline || !bio || !rateDollars || rateDollars < 1) {
    redirect("/dashboard/mentor/onboarding?error=missing-fields");
  }

  const rate_cents = Math.round(rateDollars * 100);
  const expertise = expertiseRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await supabase
    .from("profiles")
    .update({ role: "mentor" })
    .eq("id", profile.id);

  const { data: existing } = await supabase
    .from("mentor_profiles")
    .select("id, stripe_account_id")
    .eq("user_id", profile.id)
    .maybeSingle();

  let stripeAccountId = existing?.stripe_account_id ?? null;
  if (!stripeAccountId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const account = await createConnectAccount(user!.email!);
    stripeAccountId = account.id;
  }

  if (existing) {
    await supabase
      .from("mentor_profiles")
      .update({
        slug,
        headline,
        bio,
        expertise,
        rate_cents,
        timezone,
        status: "pending",
        stripe_account_id: stripeAccountId,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("mentor_profiles").insert({
      user_id: profile.id,
      slug,
      headline,
      bio,
      expertise,
      rate_cents,
      timezone,
      status: "pending",
      stripe_account_id: stripeAccountId,
    });
  }

  revalidatePath("/dashboard");
  redirect("/dashboard/mentor?onboarding=submitted");
}

export async function startStripeOnboarding() {
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile) redirect("/auth/login");

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("stripe_account_id")
    .eq("user_id", profile.id)
    .single();

  if (!mentor?.stripe_account_id) {
    redirect("/dashboard/mentor/onboarding");
  }

  const link = await createAccountLink(
    mentor.stripe_account_id,
    "/dashboard/mentor"
  );
  redirect(link.url);
}

export async function saveAvailability(formData: FormData) {
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile) redirect("/auth/login");

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .single();

  if (!mentor) redirect("/dashboard/mentor/onboarding");

  await supabase.from("availability_rules").delete().eq("mentor_id", mentor.id);

  const rows: {
    mentor_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
  }[] = [];

  for (let weekday = 0; weekday < 7; weekday++) {
    if (formData.get(`enabled_${weekday}`) !== "on") continue;
    const start_time = String(formData.get(`start_${weekday}`));
    const end_time = String(formData.get(`end_${weekday}`));
    if (start_time && end_time) {
      rows.push({ mentor_id: mentor.id, weekday, start_time, end_time });
    }
  }

  if (rows.length) {
    const { error } = await supabase.from("availability_rules").insert(rows);
    if (error) {
      redirect(
        `/dashboard/mentor/availability?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  revalidatePath("/dashboard/mentor/availability");
  redirect("/dashboard/mentor/availability?saved=1");
}
