import { NextResponse } from 'next/server';

export function emailLimitRefusal(limit) {
  const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
  const response = NextResponse.json(
    {
      error: `Too many attempts for this email. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      code: 'email_rate_limited',
    },
    { status: 429 }
  );
  response.headers.set('Retry-After', String(limit.retryAfterSeconds));
  return response;
}