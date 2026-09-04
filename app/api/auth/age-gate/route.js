import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { lookupCountryFromIp } from '@/lib/geo';
import { meetsMinimumAge } from '@/lib/age';

export async function POST(req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
    }}}
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
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

  const tosAcceptedAt = new Date().toISOString();

  const { error } = await supabase
    .from('users')
    .update({
      date_of_birth: dateOfBirth,
      signup_country: countryCode,
      tos_accepted_at: tosAcceptedAt,
    })
    .eq('id', session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}