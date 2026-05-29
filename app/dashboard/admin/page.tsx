"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setMentorStatus } from "@/lib/actions/admin";
import { PageTitle, Card, Badge, Button } from "@/components/ui";
import { PageLoader } from "@/components/page-loader";
import { useApiGet } from "@/lib/hooks/use-api";
import { formatCents } from "@/lib/slots";

type PendingMentor = {
  id: string;
  slug: string;
  headline: string;
  rate_cents: number;
  status: string;
  user_id: string;
};

type BookingRow = {
  id: string;
  start_at: string;
  status: string;
  amount_cents: number;
};

type AdminDashboardResponse = {
  pendingMentors: PendingMentor[];
  bookings: BookingRow[];
  balanceSummary: { available: number; pending: number } | null;
  grossCents: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { data, loading, error } = useApiGet<AdminDashboardResponse>(
    "/api/dashboard/admin"
  );

  useEffect(() => {
    if (!loading && error) {
      router.replace("/dashboard");
    }
  }, [loading, error, router]);

  if (loading || !data) {
    return <PageLoader />;
  }

  const { pendingMentors, bookings, balanceSummary, grossCents } = data;

  return (
    <>
      <PageTitle
        title="Admin"
        subtitle="Approve mentors and monitor platform activity."
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-neutral-400">Captured session volume</p>
          <p className="text-2xl font-medium text-white">{formatCents(grossCents)}</p>
        </Card>
        {balanceSummary ? (
          <>
            <Card>
              <p className="text-sm text-neutral-400">Stripe available</p>
              <p className="text-2xl font-medium text-white">
                {formatCents(balanceSummary.available)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-neutral-400">Stripe pending</p>
              <p className="text-2xl font-medium text-white">
                {formatCents(balanceSummary.pending)}
              </p>
            </Card>
          </>
        ) : null}
      </div>

      <h2 className="font-serif text-xl text-white mb-4">Mentor applications</h2>
      <div className="space-y-4 mb-12">
        {pendingMentors.map((m) => (
          <Card key={m.id} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium text-white">{m.headline}</p>
              <p className="text-sm text-neutral-400">
                /{m.slug} · {formatCents(m.rate_cents)}
              </p>
              <Badge tone={m.status === "pending" ? "warning" : "danger"}>
                {m.status}
              </Badge>
            </div>
            {m.status === "pending" ? (
              <div className="flex gap-2">
                <form action={setMentorStatus}>
                  <input type="hidden" name="mentor_id" value={m.id} />
                  <input type="hidden" name="status" value="approved" />
                  <Button type="submit">Approve</Button>
                </form>
                <form action={setMentorStatus}>
                  <input type="hidden" name="mentor_id" value={m.id} />
                  <input type="hidden" name="status" value="denied" />
                  <Button type="submit" variant="danger">
                    Deny
                  </Button>
                </form>
              </div>
            ) : null}
          </Card>
        ))}
        {!pendingMentors.length ? (
          <p className="text-sm text-neutral-500">No pending applications.</p>
        ) : null}
      </div>

      <h2 className="font-serif text-xl text-white mb-4">Recent bookings</h2>
      <div className="space-y-2">
        {bookings.map((b) => (
          <Card key={b.id} className="flex justify-between text-sm">
            <span className="text-neutral-300">{new Date(b.start_at).toLocaleString()}</span>
            <span className="flex items-center gap-2">
              <Badge>{b.status}</Badge>
              <span className="text-neutral-200">{formatCents(b.amount_cents)}</span>
            </span>
          </Card>
        ))}
      </div>
    </>
  );
}
