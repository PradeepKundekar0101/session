import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isEmailVerified } from "@/lib/auth-email";
import { getDashboardPath } from "@/lib/auth";
import {
  checkEmailVerified,
  resendVerificationEmail,
  signOut,
} from "@/lib/actions/auth";
import { SiteHeader, Button, Card, PageTitle } from "@/components/ui";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; email?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isEmailVerified(user)) {
    redirect(await getDashboardPath());
  }

  const displayEmail = user?.email ?? params.email ?? null;

  if (!user && !displayEmail) {
    redirect("/auth/login?next=/verify-email");
  }

  return (
    <>
      <SiteHeader>
        {user ? (
          <form action={signOut}>
            <Button type="submit" variant="ghost">
              Sign out
            </Button>
          </form>
        ) : null}
      </SiteHeader>
      <main className="flex-1 bg-background mx-auto max-w-md px-6 py-16">
        <PageTitle
          title="Verify your email"
          subtitle="We sent a confirmation link to complete your account setup."
        />
        {params.message ? (
          <p className="mb-4 text-sm text-emerald-400">{params.message}</p>
        ) : null}
        {params.error ? (
          <p className="mb-4 text-sm text-red-400">
            {decodeURIComponent(params.error)}
          </p>
        ) : null}
        <Card className="space-y-4">
          <p className="text-sm text-neutral-300">
            Check <strong className="text-white">{displayEmail}</strong> for a message from GetMentor.
            Click the link in that email, then return here.
          </p>
          <p className="text-xs text-neutral-500">
            Booking and dashboards unlock after you verify.
          </p>
          {user ? (
            <>
              <form action={resendVerificationEmail}>
                <Button type="submit" variant="secondary" className="w-full">
                  Resend verification email
                </Button>
              </form>
              <form action={checkEmailVerified}>
                <Button type="submit" variant="ghost" className="w-full">
                  I verified — continue
                </Button>
              </form>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#d4ff7a] to-[#BDFF3A] px-4 py-2.5 text-sm font-medium text-black shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-110 transition-all"
            >
              Sign in to continue
            </Link>
          )}
        </Card>
      </main>
    </>
  );
}
