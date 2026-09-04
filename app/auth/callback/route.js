// app/auth/callback/route.js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      }}}
    )

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (session?.user) {
      const { data: userRow } = await supabase
        .from('users')
        .select('date_of_birth, signup_country, tos_accepted_at')
        .eq('id', session.user.id)
        .single()

      const missingAgeGateInfo =
        !userRow?.date_of_birth || !userRow?.signup_country || !userRow?.tos_accepted_at

      if (missingAgeGateInfo) {
        return NextResponse.redirect(`${origin}/auth/age-gate`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/`)
}