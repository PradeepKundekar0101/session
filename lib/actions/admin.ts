"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function setMentorStatus(formData: FormData) {
  await requireProfile("admin");
  const mentorId = String(formData.get("mentor_id"));
  const status = String(formData.get("status")) as "approved" | "denied";
  const supabase = await createClient();

  const { error } = await supabase
    .from("mentor_profiles")
    .update({ status })
    .eq("id", mentorId);

  if (error) {
    redirect(
      `/dashboard/admin?error=${encodeURIComponent(error.message)}`
    );
  }
  revalidatePath("/dashboard/admin");
  revalidatePath("/mentors");
  redirect("/dashboard/admin");
}
