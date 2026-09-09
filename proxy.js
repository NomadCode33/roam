import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  postLimiter, authLimiter, commentLimiter,
  translateLimiter, generalLimiter
} from "./lib/ratelimit";

function pickLimiter(pathname) {
  if (pathname === "/api/posts") return postLimiter;
  if (pathname.startsWith("/api/auth")) return authLimiter;
  if (pathname.startsWith("/api/comments")) return commentLimiter;
  if (pathname.startsWith("/api/translate")) return translateLimiter;
  if (pathname.startsWith("/api/")) return generalLimiter;
  return null;
}

export async function proxy(req) {
  const limiter = pickLimiter(req.nextUrl.pathname);

  if (limiter) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, limit, remaining, reset } = await limiter.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again shortly." },
        { status: 429, headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
          } }
      );
    }
    return NextResponse.next();
  }

  // Route protection — ROA-008 Phase E, presence-check only
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const hasSession = req.cookies.getAll().some(
      (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")
    );
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Age-gate redirect-guard — ROA-004 Phase F, step 17
  // Skip this check on /age-gate itself to avoid an infinite redirect loop
  if (
    req.nextUrl.pathname.startsWith("/dashboard") &&
    req.nextUrl.pathname !== "/age-gate"
  ) {
    let response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: userRow } = await supabase
        .from("users")
        .select("date_of_birth, signup_country, tos_accepted_at")
        .eq("id", session.user.id)
        .single();

      const missingAgeGateInfo =
        !userRow?.date_of_birth || !userRow?.signup_country || !userRow?.tos_accepted_at;

      if (missingAgeGateInfo) {
        return NextResponse.redirect(new URL("/age-gate", req.url));
      }
    }

    return response;
  }

  // No-session guard for /age-gate itself — logged-out visitors shouldn't see this form
  if (req.nextUrl.pathname === "/age-gate") {
    const hasSession = req.cookies.getAll().some(
      (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")
    );
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*", "/dashboard/:path*", "/age-gate"] };
//export const config = { matcher: "/api/:path*" };