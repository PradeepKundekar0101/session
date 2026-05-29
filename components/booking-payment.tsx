"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function PaymentForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings/${bookingId}?payment=confirmed`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment authorization failed");
      setLoading(false);
      return;
    }

    await fetch(`/api/bookings/${bookingId}/notify`, { method: "POST" });

    setDone(true);
    setLoading(false);
    window.location.href = `/bookings/${bookingId}?payment=confirmed`;
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
        <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <p className="text-sm font-medium text-emerald-300">
          Card authorized. Waiting for mentor approval.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-white/[0.08] p-4 bg-white/[0.02]">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>
      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-xl bg-gradient-to-b from-[#d4ff7a] to-[#BDFF3A] px-5 py-3.5 text-sm font-medium text-black shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Authorizing…
          </span>
        ) : (
          "Authorize payment hold"
        )}
      </button>
      <p className="text-center text-xs text-neutral-500">
        Your card is held, not charged, until the mentor confirms.
      </p>
    </form>
  );
}

export function BookingPayment({
  clientSecret,
  bookingId,
}: {
  clientSecret: string;
  bookingId: string;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            borderRadius: "10px",
            colorPrimary: "#BDFF3A",
            colorBackground: "#141414",
            colorText: "#f5f5f5",
            fontFamily: "system-ui, -apple-system, sans-serif",
          },
        },
      }}
    >
      <PaymentForm bookingId={bookingId} />
    </Elements>
  );
}
