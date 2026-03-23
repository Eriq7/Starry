/**
 * app/api/meteors/count/route.ts
 *
 * GET /api/meteors/count — returns cumulative total count of all visible meteor messages.
 *
 * Public endpoint. Cached for 5 minutes (s-maxage=300) to avoid hammering the DB.
 * Used on the homepage to display "✦ {count} wishes have been sent into the sky".
 * Counts messages, not users — one user with 10 wishes = 10.
 */

import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerComponentClient()

  const { count, error } = await supabase
    .from('meteors')
    .select('*', { count: 'exact', head: true })
    .eq('is_hidden', false)

  if (error) {
    console.error('[api/meteors/count] error:', error.message)
    return NextResponse.json({ count: 0 }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    })
  }

  return NextResponse.json({ count: count ?? 0 }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
  })
}
