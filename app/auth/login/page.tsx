"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/actions/auth";
import { SiteHeader, Input, Label } from "@/components/ui";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageLoader } from "@/components/page-loader";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Sign in to book sessions or manage your dashboard.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{decodeURIComponent(error)}</p>
            </div>
          ) : null}
          {message ? (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-sm text-emerald-400">{message}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/[0.06] bg-surface p-6">
            <form action={signIn} className="space-y-4">
              <input type="hidden" name="next" value={next} />
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required />
              </div>
              <FormSubmitButton className="w-full" size="lg" loadingText="Signing in…">
                Sign in
              </FormSubmitButton>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-400">
            New here?{" "}
            <Link href="/auth/signup" className="font-medium text-white hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginPageContent />
    </Suspense>
  );
}
