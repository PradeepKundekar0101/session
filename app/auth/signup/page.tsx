"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp } from "@/lib/actions/auth";
import { SiteHeader, Button, Input, Label } from "@/components/ui";
import { PageLoader } from "@/components/page-loader";

function SignupPageContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const error = searchParams.get("error");
  const defaultRole = roleParam === "mentor" ? "mentor" : "learner";

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl text-white">Create your account</h1>
            <p className="mt-2 text-sm text-neutral-400">
              {defaultRole === "mentor"
                ? "Apply to mentor — sessions start after approval."
                : "Book sessions with experts in minutes."}
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{decodeURIComponent(error)}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/[0.06] bg-surface p-6">
            <form action={signUp} className="space-y-4">
              <div>
                <Label htmlFor="display_name">Your name</Label>
                <Input id="display_name" name="display_name" placeholder="Jane Doe" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="8+ characters" minLength={8} required />
              </div>
              <div>
                <Label htmlFor="role">I want to</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue={defaultRole}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white focus:border-[#BDFF3A]/40 focus:outline-none focus:ring-2 focus:ring-[#BDFF3A]/10 transition-colors"
                >
                  <option value="learner" className="bg-surface">Book sessions (learner)</option>
                  <option value="mentor" className="bg-surface">Offer sessions (mentor)</option>
                </select>
              </div>
              <Button type="submit" className="w-full" size="lg">
                Create account
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-white hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SignupPageContent />
    </Suspense>
  );
}
