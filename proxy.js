import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  postLimiter, authLimiter, commentLimiter,
  translateLimiter, generalLimiter
} from "./lib/ratelimit";
import { createRequestId, logRequest } from "./lib/logger";
import * as Sentry from "@sentry/nextjs";

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
      const requestId = createRequestId();
      logRequest({
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        status: 429,
        durationMs: 0,
      });

      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again shortly." },
        { status: 429, headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "x-request-id": requestId,
          } }
      );
    }
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard") || pathname === "/age-gate") {
    const response = NextResponse.next();

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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    Sentry.setUser({ id: user.id });

    const { data: userRow } = await supabase
      .from("users")
      .select("confirmed_age")
      .eq("id", user.id)
      .single();

    const completed = Boolean(userRow?.confirmed_age);

    if (pathname.startsWith("/dashboard") && !completed) {
      return NextResponse.redirect(new URL("/age-gate", req.url));
    }

    if (pathname === "/age-gate" && completed) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return response;
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*", "/dashboard/:path*", "/age-gate"] };