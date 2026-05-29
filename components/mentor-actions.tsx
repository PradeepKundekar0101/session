"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mentorApproveBooking, mentorDenyBooking } from "@/lib/actions/booking";

export function MentorBookingActions({ bookingId }: { bookingId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  function handleAction(action: "approve" | "deny") {
    setError(null);
    setSuccess(null);
    start(async () => {
      const res =
        action === "approve"
          ? await mentorApproveBooking(bookingId)
          : await mentorDenyBooking(bookingId);

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(
          action === "approve"
            ? "Approved — learner charged, video room created."
            : "Declined — payment hold released."
        );
        router.refresh();
      }
    });
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
        <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <p className="text-sm font-medium text-emerald-300">{success}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          disabled={pending}
          onClick={() => handleAction("approve")}
          className="flex-1 rounded-xl bg-gradient-to-b from-[#d4ff7a] to-[#BDFF3A] px-5 py-3 text-sm font-medium text-black shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Processing…" : "Approve & capture payment"}
        </button>
        <button
          disabled={pending}
          onClick={() => handleAction("deny")}
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Decline
        </button>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
