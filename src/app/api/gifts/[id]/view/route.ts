/**
 * app/api/gifts/[id]/view/route.ts
 *
 * PATCH /api/gifts/[id]/view
 *
 * Called by GiftReveal on first view to record the viewed_at timestamp.
 * No auth required — the gift landing page is public.
 * Only sets viewed_at if it's currently NULL (idempotent).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Missing gift id' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Only update if not already viewed
  await supabase
    .from('gifts')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', id)
    .is('viewed_at', null)

  return NextResponse.json({ ok: true })
}
