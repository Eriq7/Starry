/**
 * api/cards/[nodeId]/route.ts
 *
 * Private card image proxy route.
 *
 * Because the "cards" Storage bucket is private, card images cannot be
 * served via a public URL. This route authenticates the caller, verifies
 * they own the requested node, downloads the card PNG from Storage, and
 * streams it back — mirroring the same pattern used by /api/apod/image/[date].
 *
 * Flow:
 *  1. Authenticate caller via session cookie (createServerComponentClient)
 *  2. Look up the node in the DB (service role), confirm node.user_id === caller
 *  3. Check node has a card_image_url (storage path)
 *  4. Download {nodeId}.png from the "cards" Storage bucket
 *  5. Stream PNG back with Cache-Control: private, max-age=86400
 *
 * Error responses:
 *  401 — not logged in, or node belongs to another user
 *  404 — node not found, or no card uploaded yet
 *  500 — Storage download failed unexpectedly
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient, createServiceClient } from '@/lib/supabase-server'

const CARDS_BUCKET = 'cards'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  const { nodeId } = await params

  // 1. Authenticate caller
  const supabaseUser = await createServerComponentClient()
  const {
    data: { user },
    error: authError,
  } = await supabaseUser.auth.getUser()

  if (authError || !user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 2. Fetch node and verify ownership
  const supabase = createServiceClient()
  const { data: node, error: nodeError } = await supabase
    .from('nodes')
    .select('id, user_id, card_image_url')
    .eq('id', nodeId)
    .single()

  if (nodeError || !node) {
    return new NextResponse('Not found', { status: 404 })
  }

  if (node.user_id !== user.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 3. Must have a card
  if (!node.card_image_url) {
    return new NextResponse('No card available', { status: 404 })
  }

  // 4. Download from Storage (card_image_url stores the storage path, e.g. "{nodeId}.png")
  const storagePath = node.card_image_url
  const { data: blob, error: downloadError } = await supabase.storage
    .from(CARDS_BUCKET)
    .download(storagePath)

  if (downloadError || !blob) {
    console.error(`[api/cards/${nodeId}] download error:`, downloadError?.message)
    return new NextResponse('Failed to load card', { status: 500 })
  }

  // 5. Stream back
  const buffer = new Uint8Array(await blob.arrayBuffer())
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=86400',
    },
  })
}
