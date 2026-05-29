import { NextResponse } from "next/server";
import { expireStaleBookings } from "@/lib/bookings";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await expireStaleBookings();
  return NextResponse.json({ expired: count });
}
