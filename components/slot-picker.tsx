"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui";
import { SlotRequestButton } from "@/components/slot-request-button";

type Slot = {
  startIso: string;
  endIso: string;
  label: string;
};

function slotSearchText(slot: Slot): string {
  const d = new Date(slot.startIso);
  const parts = [
    slot.label,
    d.toLocaleDateString("en-US", { weekday: "long" }),
    d.toLocaleDateString("en-US", { weekday: "short" }),
    d.toLocaleDateString("en-US", { month: "long" }),
    d.toLocaleDateString("en-US", { month: "short" }),
    d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }),
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
  ];
  return parts.join(" ").toLowerCase();
}

function filterSlots(slots: Slot[], query: string): Slot[] {
  const q = query.trim().toLowerCase();
  if (!q) return slots;
  return slots.filter((slot) => slotSearchText(slot).includes(q));
}

type SlotPickerProps = {
  mentorId: string;
  slots: Slot[];
};

export function SlotPicker({ mentorId, slots }: SlotPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterSlots(slots, query), [slots, query]);

  return (
    <div className="mt-6 space-y-3">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by day or time…"
          className="pl-10"
          aria-label="Search available slots"
        />
      </div>

      <p className="text-xs text-neutral-500">
        {query.trim()
          ? `${filtered.length} of ${slots.length} slots`
          : `${slots.length} open slots`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-sm text-neutral-400">No slots match &ldquo;{query}&rdquo;</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-2 text-sm font-medium text-[#BDFF3A] hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
          {filtered.map((slot) => (
            <SlotRequestButton
              key={slot.startIso}
              mentorId={mentorId}
              startAt={slot.startIso}
              endAt={slot.endIso}
              label={slot.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}
