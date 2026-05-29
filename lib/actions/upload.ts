"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export async function uploadMentorImage(formData: FormData) {
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile) return { error: "Unauthorized" };

  const file = formData.get("file") as File | null;
  const type = String(formData.get("type")); // "avatar" or "banner"
  if (!file || !file.size) return { error: "No file provided" };

  const maxSize = type === "banner" ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: `File too large (max ${maxSize / 1024 / 1024}MB)` };
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { error: "Only JPG, PNG, or WebP allowed" };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${profile.id}/${type}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("mentor-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("mentor-images").getPublicUrl(path);

  const column = type === "banner" ? "banner_url" : "avatar_url";
  const { error: dbError } = await supabase
    .from("mentor_profiles")
    .update({ [column]: publicUrl })
    .eq("user_id", profile.id);

  if (dbError) return { error: dbError.message };

  if (type === "avatar") {
    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);
  }

  revalidatePath("/dashboard/mentor/onboarding");
  revalidatePath("/mentors");
  return { url: publicUrl };
}
