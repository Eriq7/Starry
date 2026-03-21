/**
 * lib/supabase-server.ts
 *
 * Server-side Supabase clients for Next.js App Router.
 *
 * Two exports:
 *  - createServerComponentClient(): cookie-based client for server components and
 *    route handlers. Reads and writes the user's auth session from request cookies,
 *    enabling session persistence across page loads and the server/client boundary.
 *    Use this for auth checks and user-scoped queries.
 *
 *  - createServiceClient(): service role client that bypasses Row Level Security.
 *    Use only for Storage uploads and server-side writes that must not be blocked
 *    by row policies (e.g. apod_cache writes, card uploads).
 *
 * IMPORTANT: Never import this file in client components — the service role key
 * must never reach the browser. Only import from API routes and server components.
 */

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Cookie-based Supabase client for server components and route handlers.
 * Automatically reads the user's session from request cookies set by @supabase/ssr.
 */
export async function createServerComponentClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component — cookies are read-only here.
          // The middleware handles token refresh so this is safe to ignore.
        }
      },
    },
  })
}

/**
 * Service role Supabase client — bypasses RLS.
 * Use for: Storage uploads (apod bucket, cards bucket), apod_cache writes.
 * Never expose to the browser.
 */
export function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })
}
