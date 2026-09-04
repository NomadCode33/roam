import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { lookupCountryFromIp } from '@/lib/geo';
import { meetsMinimumAge } from '@/lib/age';

// service-role client — bypasses RLS, server-side only, never expose this key to the client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.json();
  const { email, password, dateOfBirth, tosAccepted } = body;

  if (!tosAccepted) {
    return NextResponse.json(
      { error: 'You must accept the Terms and Privacy Policy.' },
      { status: 400 }
    );
  }

  if (!dateOfBirth) {
    return NextResponse.json(
      { error: 'Date of birth is required.' },
      { status: 400 }
    );
  }

  // real client IP — Vercel populates this on the incoming request, not available client-side
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

  const { countryCode, isEU } = await lookupCountryFromIp(ip);

  if (!meetsMinimumAge(dateOfBirth, isEU)) {
    const minimumAge = isEU ? 16 : 13;
    return NextResponse.json(
      { error: `You must be at least ${minimumAge} to sign up.` },
      { status: 403 }
    );
  }

  const tosAcceptedAt = new Date().toISOString(); // server-generated, never trust a client timestamp

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      date_of_birth: dateOfBirth,
      signup_country: countryCode,
      tos_accepted_at: tosAcceptedAt,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // write the three columns onto public.users directly, don't rely solely on metadata
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      date_of_birth: dateOfBirth,
      signup_country: countryCode,
      tos_accepted_at: tosAcceptedAt,
    })
    .eq('id', data.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: data.user.id });
}