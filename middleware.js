import { NextResponse } from "next/server";
import {
  postLimiter, authLimiter, commentLimiter,
  translateLimiter, generalLimiter
} from "./lib/ratelimit";

function pickLimiter(pathname) {
  if (pathname.startsWith("/api/posts") && pathname !== "/api/posts")
    return null;
  if (pathname === "/api/posts") return postLimiter;
  if (pathname.startsWith("/api/auth")) return authLimiter;
  if (pathname.startsWith("/api/comments")) return commentLimiter;
  if (pathname.startsWith("/api/translate")) return translateLimiter;
  if (pathname.startsWith("/api/")) return generalLimiter;
  return null;
}

export async function middleware(req) {
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
      (cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
    );
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*", "/dashboard/:path*"] };
//export const config = { matcher: "/api/:path*" };