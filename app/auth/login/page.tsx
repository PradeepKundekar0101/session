import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { SiteHeader, Button, Input, Label } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;

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

          {params.error ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{decodeURIComponent(params.error)}</p>
            </div>
          ) : null}
          {params.message ? (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-sm text-emerald-400">{params.message}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/[0.06] bg-surface p-6">
            <form action={signIn} className="space-y-4">
              <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Sign in
              </Button>
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
