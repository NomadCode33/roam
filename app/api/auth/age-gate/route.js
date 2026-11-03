// app/api/auth/age-gate/route.js
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { lookupCountryFromIp } from '@/lib/geo';
import { meetsMinimumAge } from '@/lib/age';
import { withLogging } from '@/lib/withLogging';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
    }}}
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { dateOfBirth, tosAccepted } = await req.json();

  if (!tosAccepted) {
    return NextResponse.json(
      { error: 'You must accept the Terms and Privacy Policy.' },
      { status: 400 }
    );
  }

  if (!dateOfBirth) {
    return NextResponse.json({ error: 'Date of birth is required.' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  const { countryCode, isEU } = await lookupCountryFromIp(ip);

  if (!meetsMinimumAge(dateOfBirth, isEU)) {
    const minimumAge = isEU ? 16 : 13;
    return NextResponse.json(
      { error: `You must be at least ${minimumAge} to use Roam.` },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      date_of_birth: dateOfBirth,
      signup_country: countryCode,
      tos_accepted_at: new Date().toISOString(),
      confirmed_age: true,
    })
    .eq('id', user.id)
    .eq('confirmed_age', false)
    .select('id');

  if (error) {
    console.error('age-gate update failed', error);
    return NextResponse.json({ error: 'Could not save. Please try again.' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Age gate already completed.' }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}

export const POST = withLogging(handler);