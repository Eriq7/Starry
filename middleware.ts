/**
 * middleware.ts
 *
 * Next.js Edge middleware — runs on every request before the page renders.
 *
 * Two responsibilities:
 *  1. Refresh the Supabase auth session token on every request (required for
 *     @supabase/ssr cookie-based auth in Next.js App Router).
 *  2. Auth-first route protection: unauthenticated users are redirected to
 *     /login for all protected routes, preserving their intended destination
 *     via ?returnTo=<path>.
 *
 * Public routes (no auth required):
 *  - /login
 *  - /auth/* (Magic Link callback)
 *  - /api/* (API routes handle their own auth)
 *  - /gift/[id] (gift reveal — recipient needs no account)
 *
 * Protected routes (auth required): everything else, including /gift/create.
 *
 * Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Forward updated cookies onto both the request and response
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove this call.
  // It keeps the access token alive and populates the session cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — accessible without authentication
  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/') ||
    // Gift reveal pages (/gift/[id]) are public; gift creation (/gift/create) is protected
    (pathname.startsWith('/gift/') && pathname !== '/gift/create')

  if (!user && !isPublic) {
    // Redirect to login, preserving the intended destination
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === '/login') {
    // Already authenticated — send to homepage
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    homeUrl.search = ''
    return NextResponse.redirect(homeUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
