// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { lookupCountryFromIp } from '@/lib/geo';
import { meetsMinimumAge } from '@/lib/age';
import { withLogging } from '@/lib/withLogging';
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function fail(status, code, error) {
  return NextResponse.json({ error, code }, { status });
}

// Map a Supabase signUp error to a message we control. Never return error.message.
function classifySignupError(error) {
  const code = error.code;
  const status = error.status;

  if (code === 'signup_disabled') {
    return fail(403, 'signup_disabled', 'Sign-ups are closed right now. Please check back soon.');
  }
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || status === 429) {
    return fail(429, 'rate_limited', 'Too many attempts. Please wait a few minutes and try again.');
  }
  if (code === 'weak_password') {
    return fail(400, 'weak_password', 'Please choose a stronger password.');
  }

  Sentry.captureException(error);

  if (code === 'unexpected_failure' || status >= 500) {
    return fail(503, 'email_send_failed', "We couldn't send the email. Please try again in a few minutes.");
  }
  return fail(400, 'signup_failed', 'We could not create your account. Please try again.');
}

async function handler(req) {
  const body = await req.json();
  const { email, password, dateOfBirth, tosAccepted } = body;

  if (!tosAccepted) {
    return fail(400, 'tos_required', 'You must accept the Terms and Privacy Policy.');
  }

  if (!dateOfBirth) {
    return fail(400, 'dob_required', 'Date of birth is required.');
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

  const { countryCode, isEU } = await lookupCountryFromIp(ip);

  if (!meetsMinimumAge(dateOfBirth, isEU)) {
    const minimumAge = isEU ? 16 : 13;
    return fail(403, 'underage', `You must be at least ${minimumAge} to sign up.`);
  }

  const tosAcceptedAt = new Date().toISOString();

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const origin = req.headers.get('origin') ?? new URL(req.url).origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        date_of_birth: dateOfBirth,
        signup_country: countryCode,
        tos_accepted_at: tosAcceptedAt,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return classifySignupError(error);
  }

  if (!data.user || data.user.identities?.length === 0) {
    return fail(400, 'email_exists', 'That email is already registered.');
  }

  Sentry.setUser({ id: data.user.id });

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      date_of_birth: dateOfBirth,
      signup_country: countryCode,
      tos_accepted_at: tosAcceptedAt,
      confirmed_age: true,
    })
    .eq('id', data.user.id);

  if (updateError) {
    Sentry.captureException(updateError);
    return fail(500, 'profile_update_failed', 'We could not finish creating your account. Please try again.');
  }

  const response = NextResponse.json({ success: true, userId: data.user.id });
  response.cookies.set('roam_check_email', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 3600,
  });
  return response;
}

export const POST = withLogging(handler);