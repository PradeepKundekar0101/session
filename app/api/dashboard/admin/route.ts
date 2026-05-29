import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { getStripeBalanceSummary } from "@/lib/stripe";
import { jsonForbidden, jsonOk } from "@/lib/api/responses";

export async function GET() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return jsonForbidden();
  }

  const supabase = await createClient();

  const [{ data: pendingMentors }, { data: bookings }] = await Promise.all([
    supabase
      .from("mentor_profiles")
      .select("id, slug, headline, rate_cents, status, user_id")
      .in("status", ["pending", "denied"])
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("id, start_at, status, amount_cents, stripe_payment_intent_id")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  let balanceSummary: { available: number; pending: number } | null = null;
  try {
    const balance = await getStripeBalanceSummary();
    balanceSummary = {
      available: balance.available.reduce((s, b) => s + b.amount, 0),
      pending: balance.pending.reduce((s, b) => s + b.amount, 0),
    };
  } catch {
    balanceSummary = null;
  }

  const captured = (bookings ?? []).filter((b) =>
    ["approved", "completed"].includes(b.status)
  );
  const grossCents = captured.reduce((s, b) => s + b.amount_cents, 0);

  return jsonOk({
    pendingMentors: pendingMentors ?? [],
    bookings: bookings ?? [],
    balanceSummary,
    grossCents,
  });
}
