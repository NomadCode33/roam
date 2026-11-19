// app/auth/callback/route.js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Only these paths may be reached through ?next=. Exact match, so
// "//evil.example" and "/reset-password/../x" are rejected.
const ALLOWED_NEXT = new Set(['/reset-password'])

function safeNext(value) {
  return value && ALLOWED_NEXT.has(value) ? value : null
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const next = safeNext(searchParams.get('next'))
  // A failed reset link goes where the user can ask for a new one
  const failurePath = next ? '/forgot-password' : '/login'

  // Provider or Supabase reported a failure (for example, Google consent cancelled)
  if (searchParams.get('error') || searchParams.get('error_code')) {
    const target = new URL(failurePath, origin)
    for (const key of ['error', 'error_code']) {
      const value = searchParams.get(key)
      if (value) target.searchParams.set(key, value)
    }
    return NextResponse.redirect(target)
  }

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

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const target = new URL(failurePath, origin)
      target.searchParams.set('error_code', 'exchange_failed')
      return NextResponse.redirect(target)
    }
    cookieStore.delete('roam_check_email')

    if (next) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    if (session?.user) {
      const { data: userRow } = await supabase
        .from('users')
        .select('confirmed_age')
        .eq('id', session.user.id)
        .single()

      const missingAgeGateInfo = !userRow?.confirmed_age

      if (missingAgeGateInfo) {
        return NextResponse.redirect(`${origin}/age-gate`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/`)
}