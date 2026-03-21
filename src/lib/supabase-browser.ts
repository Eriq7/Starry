/**
 * lib/supabase-browser.ts
 *
 * Browser-side Supabase client using @supabase/ssr.
 * Uses createBrowserClient which stores the auth session in cookies (not
 * localStorage), so the session is automatically shared with server components
 * and route handlers on the same origin.
 *
 * For server-side operations (API routes, server components), use supabase-server.ts.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseBrowser(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
