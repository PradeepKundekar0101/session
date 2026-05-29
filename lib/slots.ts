import {
  addDays,
  addMinutes,
  getDay,
  isAfter,
  isBefore,
  parseISO,
  setHours,
  setMinutes,
} from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import type { AvailabilityException, AvailabilityRule, TimeSlot } from "@/lib/types";
import { config } from "@/lib/config";

function parseTimeOnDate(date: Date, timeStr: string, tz: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const zoned = toZonedTime(date, tz);
  const withTime = setMinutes(setHours(zoned, h), m ?? 0);
  return fromZonedTime(withTime, tz);
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return isBefore(aStart, bEnd) && isAfter(aEnd, bStart);
}

export function generateSlots(params: {
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  timezone: string;
  bookedRanges: { start_at: string; end_at: string }[];
  durationMinutes?: number;
  lookaheadDays?: number;
}): TimeSlot[] {
  const duration = params.durationMinutes ?? config.sessionDurationMinutes;
  const lookahead = params.lookaheadDays ?? config.slotLookaheadDays;
  const now = new Date();
  const slots: TimeSlot[] = [];
  const minStart = addMinutes(now, 60);

  for (let d = 0; d < lookahead; d++) {
    const day = addDays(now, d);
    const dateKey = formatInTimeZone(day, params.timezone, "yyyy-MM-dd");
    const weekday = getDay(toZonedTime(day, params.timezone));

    const exception = params.exceptions.find((e) => e.exception_date === dateKey);
    let dayRules = params.rules.filter((r) => r.weekday === weekday);

    if (exception) {
      if (!exception.is_available) continue;
      if (exception.start_time && exception.end_time) {
        dayRules = [
          {
            id: "exception",
            mentor_id: "",
            weekday,
            start_time: exception.start_time,
            end_time: exception.end_time,
          },
        ];
      }
    }

    for (const rule of dayRules) {
      const windowStart = parseTimeOnDate(day, rule.start_time, params.timezone);
      const windowEnd = parseTimeOnDate(day, rule.end_time, params.timezone);
      let cursor = windowStart;

      while (addMinutes(cursor, duration) <= windowEnd) {
        const slotEnd = addMinutes(cursor, duration);
        if (isBefore(slotEnd, minStart)) {
          cursor = addMinutes(cursor, duration);
          continue;
        }

        const conflict = params.bookedRanges.some((b) =>
          overlaps(cursor, slotEnd, parseISO(b.start_at), parseISO(b.end_at))
        );

        if (!conflict) {
          slots.push({
            start: cursor,
            end: slotEnd,
            startIso: cursor.toISOString(),
            endIso: slotEnd.toISOString(),
            label: formatInTimeZone(
              cursor,
              params.timezone,
              "EEE, MMM d · h:mm a"
            ),
          });
        }
        cursor = addMinutes(cursor, duration);
      }
    }
  }

  return slots.slice(0, 80);
}

export function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
