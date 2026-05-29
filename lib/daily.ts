import { config } from "@/lib/config";

type DailyRoom = {
  url: string;
  name: string;
};

export async function createDailyRoom(bookingId: string): Promise<DailyRoom> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    throw new Error("DAILY_API_KEY is not set");
  }

  const roomName = `session-${bookingId.slice(0, 8)}-${Date.now()}`;
  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "public",
      properties: {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
        enable_chat: true,
        enable_knocking: true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Daily room creation failed: ${err}`);
  }

  const data = (await res.json()) as { url: string; name: string };
  return { url: data.url, name: data.name };
}

export function meetingAvailableAt(startAt: Date): boolean {
  const openMs = 15 * 60 * 1000;
  return Date.now() >= startAt.getTime() - openMs;
}

export function formatMeetingWindow(startAt: string) {
  const start = new Date(startAt);
  const open = new Date(start.getTime() - 15 * 60 * 1000);
  return {
    opensAt: open.toISOString(),
    startsAt: start.toISOString(),
    appUrl: config.appUrl,
  };
}
