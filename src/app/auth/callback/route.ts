/**
 * app/auth/callback/route.ts
 *
 * Magic Link callback handler for Supabase Auth.
 *
 * After the user clicks their Magic Link email, Supabase redirects here with
 * a `code` query param. We exchange it for a session using the @supabase/ssr
 * cookie-based client, which sets the session cookie so the browser picks it
 * up on the subsequent redirect to /explore.
 *
 * Using the cookie-based client (not service role) is critical here — only
 * the anon key client can exchange the code and write the session cookie that
 * the browser will read on the redirect target page.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/explore'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${origin}/explore?auth_error=1`)
    }
  }

  return NextResponse.redirect(`${origin}${next}?auth_return=1`)
}
