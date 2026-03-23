/**
 * app/api/meteors/route.ts
 *
 * POST /api/meteors — submit an anonymous meteor wish message (auth required).
 * GET  /api/meteors — fetch recent visible meteor messages (public).
 *
 * POST body: { message: string, displayName: string, category: 'wish'|'reflection'|'warmth', eventDate?: string }
 * GET params: limit (default 30, max 50), before (ISO timestamp cursor for pagination)
 *
 * Uses service client for insert (same pattern as api/gifts/route.ts).
 * Profanity filter blocks inappropriate content with 400.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient, createServiceClient } from '@/lib/supabase-server'
import { containsProfanity } from '@/lib/profanity'

const VALID_CATEGORIES = ['wish', 'reflection', 'warmth'] as const
type Category = typeof VALID_CATEGORIES[number]

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabaseUser = await createServerComponentClient()
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse body
  let body: { message?: string; displayName?: string; category?: string; eventDate?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, displayName, category, eventDate } = body

  // 3. Validate fields
  if (!message?.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }
  if (message.trim().length > 50) {
    return NextResponse.json({ error: 'message must be 50 characters or fewer' }, { status: 400 })
  }
  if (!displayName?.trim()) {
    return NextResponse.json({ error: 'displayName is required' }, { status: 400 })
  }
  if (displayName.trim().length > 15) {
    return NextResponse.json({ error: 'displayName must be 15 characters or fewer' }, { status: 400 })
  }
  if (!category || !VALID_CATEGORIES.includes(category as Category)) {
    return NextResponse.json({ error: 'category must be one of: wish, reflection, warmth' }, { status: 400 })
  }

  // 4. Profanity filter
  if (containsProfanity(message) || containsProfanity(displayName)) {
    return NextResponse.json({ error: 'Message contains inappropriate content' }, { status: 400 })
  }

  // 5. Insert via service client (bypasses RLS so we can write with user_id)
  const supabase = createServiceClient()
  const { data, error: insertError } = await supabase.from('meteors').insert({
    user_id: user.id,
    display_name: displayName.trim(),
    message: message.trim(),
    category: category as Category,
    event_date: eventDate ?? null,
  }).select('id').single()

  if (insertError) {
    console.error('[api/meteors] insert error:', insertError.message)
    return NextResponse.json({ error: 'Failed to send meteor' }, { status: 500 })
  }

  // 6. Track analytics event (fire-and-forget)
  supabase.from('events').insert({
    event_type: 'meteor_sent',
    user_id: user.id,
    session_id: null,
    metadata: { meteorId: data.id, category, eventDate: eventDate ?? null },
  })

  return NextResponse.json({ id: data.id, success: true })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limitParam = parseInt(searchParams.get('limit') ?? '30', 10)
  const limit = Math.min(Math.max(1, isNaN(limitParam) ? 30 : limitParam), 50)
  const before = searchParams.get('before') // ISO timestamp cursor

  // Public read — use anon client (RLS policy allows SELECT where is_hidden = false)
  const supabaseUser = await createServerComponentClient()
  let query = supabaseUser
    .from('meteors')
    .select('id, display_name, message, category, created_at')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) {
    console.error('[api/meteors GET] query error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch meteors' }, { status: 500 })
  }

  const meteors = (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    message: row.message,
    category: row.category,
    createdAt: row.created_at,
  }))

  return NextResponse.json({ meteors })
}
