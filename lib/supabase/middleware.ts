import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isEmailVerified(user: {
  email_confirmed_at?: string | null;
}): boolean {
  return Boolean(user.email_confirmed_at);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isSignup = path === "/auth/signup";
  const isVerifyEmail = path === "/verify-email";
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/bookings") ||
    path.startsWith("/api/stripe/connect");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && !isEmailVerified(user) && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/verify-email";
    return NextResponse.redirect(url);
  }

  // Verified on verify-email → go straight to a dashboard sub-route (skip /dashboard hop)
  if (user && isEmailVerified(user) && isVerifyEmail) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/learner";
    return NextResponse.redirect(url);
  }

  // Only bounce away from signup — NOT login (avoids login ↔ dashboard loop)
  if (user && isSignup) {
    const url = request.nextUrl.clone();
    url.pathname = isEmailVerified(user) ? "/dashboard/learner" : "/verify-email";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
