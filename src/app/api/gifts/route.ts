/**
 * app/api/gifts/route.ts
 *
 * POST /api/gifts — create a shareable gift link for a friend.
 *
 * Auth required. Accepts JSON body:
 *   { recipientName: string, eventDate: string, message?: string }
 *
 * Flow:
 *  1. Validate auth + body
 *  2. Resolve APOD for the event date
 *  3. Generate a short gift ID (8-char UUID prefix)
 *  4. Insert row into `gifts` table
 *  5. Track gift_created analytics
 *  6. Return { giftId, giftUrl }
 *
 * gifts table columns:
 *   id (text PK), sender_id (uuid FK → auth.users), recipient_name (text),
 *   event_date (date), resolved_apod_date (date), apod_title (text),
 *   apod_copyright (text), message (text), viewed_at (timestamptz),
 *   created_at (timestamptz)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient, createServiceClient } from '@/lib/supabase-server'
import { resolveApod } from '@/lib/apod'

export async function POST(request: NextRequest) {
  // 1. Auth
  const supabaseUser = await createServerComponentClient()
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse body
  let body: { recipientName?: string; eventDate?: string; message?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { recipientName, eventDate, message } = body
  if (!recipientName?.trim() || !eventDate) {
    return NextResponse.json({ error: 'recipientName and eventDate are required' }, { status: 400 })
  }

  // 3. Resolve APOD
  let apod
  try {
    apod = await resolveApod(eventDate)
  } catch (err) {
    console.error('[api/gifts] resolveApod failed:', err)
    return NextResponse.json({ error: 'Could not resolve APOD for this date' }, { status: 422 })
  }

  // 4. Generate short ID and insert
  const giftId = crypto.randomUUID().slice(0, 8)
  const supabase = createServiceClient()

  const { error: insertError } = await supabase.from('gifts').insert({
    id: giftId,
    sender_id: user.id,
    recipient_name: recipientName.trim(),
    event_date: eventDate,
    resolved_apod_date: apod.resolvedDate,
    apod_title: apod.title,
    apod_copyright: apod.copyright ?? null,
    message: message?.trim() ?? null,
  })

  if (insertError) {
    console.error('[api/gifts] insert error:', insertError.message)
    return NextResponse.json({ error: 'Failed to create gift' }, { status: 500 })
  }

  // 5. Track event (fire-and-forget, non-blocking)
  supabase.from('events').insert({
    event_type: 'gift_created',
    user_id: user.id,
    session_id: null,
    metadata: { giftId, eventDate },
  })


  const giftUrl = `/gift/${giftId}`
  return NextResponse.json({ giftId, giftUrl })
}
