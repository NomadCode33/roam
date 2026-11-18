// app/api/auth/resend/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withLogging } from '@/lib/withLogging';
import { checkEmailLimit } from '@/lib/email-ratelimit';
import { emailLimitRefusal } from '@/lib/email-limit-response';
import * as Sentry from '@sentry/nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const SUCCESS_MESSAGE =
  'If that address has an unconfirmed account, a new confirmation link is on its way. It can take a minute, so check your spam folder too.';

function fail(status, code, error) {
  return NextResponse.json({ error, code }, { status });
}

async function handler(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return fail(400, 'invalid_request', 'Something went wrong. Please try again.');
  }

  const email = body?.email;
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return fail(400, 'invalid_email', 'Please enter a valid email address.');
  }

  const limit = await checkEmailLimit(email);
  if (!limit.allowed) {
    return emailLimitRefusal(limit);
  }

  const origin = req.headers.get('origin') ?? new URL(req.url).origin;

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    const { code, status } = error;
    const rateLimited =
      code === 'over_email_send_rate_limit' ||
      code === 'over_request_rate_limit' ||
      status === 429;

    if (code === 'unexpected_failure' || status >= 500) {
      Sentry.captureException(error);
      return fail(503, 'email_send_failed', "We couldn't send the email. Please try again in a few minutes.");
    }
    if (!rateLimited) {
      Sentry.captureException(error);
    }
  }

  return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
}

export const POST = withLogging(handler);