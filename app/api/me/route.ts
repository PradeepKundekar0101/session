import { getProfile, getSessionUser } from "@/lib/auth";
import { jsonOk } from "@/lib/api/responses";

export async function GET() {
  const user = await getSessionUser();
  const profile = user ? await getProfile() : null;

  return jsonOk({
    user: user
      ? {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
        }
      : null,
    profile,
  });
}
