import { getProfile } from "@/lib/auth";
import { createBookingRequestCore } from "@/lib/bookings/create-request";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/responses";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return jsonUnauthorized();
  }

  let body: { mentor_id?: string; start_at?: string; end_at?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const mentorId = String(body.mentor_id ?? "");
  const startAt = String(body.start_at ?? "");
  const endAt = String(body.end_at ?? "");

  if (!mentorId || !startAt || !endAt) {
    return jsonError("Missing booking fields");
  }

  const result = await createBookingRequestCore({ mentorId, startAt, endAt });

  if (!result.ok) {
    const status =
      result.code === "unauthorized"
        ? 401
        : result.code === "conflict"
          ? 409
          : result.code === "not_found"
            ? 404
            : 400;
    return jsonError(result.error, status);
  }

  return jsonOk({
    bookingId: result.bookingId,
    mentorSlug: result.mentorSlug,
    message:
      "Session requested! Authorize your card on the next screen, then wait for the mentor to approve.",
  });
}
