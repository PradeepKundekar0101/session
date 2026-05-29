"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/spinner";

type SlotRequestButtonProps = {
  mentorId: string;
  startAt: string;
  endAt: string;
  label: string;
  disabled?: boolean;
};

export function SlotRequestButton({
  mentorId,
  startAt,
  endAt,
  label,
  disabled,
}: SlotRequestButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending || disabled) return;
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: mentorId,
          start_at: startAt,
          end_at: endAt,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Booking failed");
        setPending(false);
        return;
      }

      router.push(
        `/bookings/${body.bookingId}?payment=authorize&booked=1`
      );
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || disabled}
        aria-busy={pending}
        className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-neutral-200 transition-all hover:bg-white/[0.08] hover:border-white/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <span className="flex shrink-0 items-center gap-2 text-neutral-500">
          {pending ? (
            <>
              <Spinner className="h-3.5 w-3.5" />
              Booking…
            </>
          ) : (
            "Request →"
          )}
        </span>
      </button>
      {error ? <p className="px-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
