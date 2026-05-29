export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  sessionDurationMinutes: Number(process.env.SESSION_DURATION_MINUTES ?? 60),
  approvalWindowHours: Number(process.env.APPROVAL_WINDOW_HOURS ?? 24),
  slotLookaheadDays: Number(process.env.SLOT_LOOKAHEAD_DAYS ?? 28),
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT ?? 10),
} as const;

export function platformFeeCents(amountCents: number): number {
  return Math.round((amountCents * config.platformFeePercent) / 100);
}
