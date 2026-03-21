/**
 * app/api/nodes/route.ts
 *
 * POST /api/nodes — saves a moment node after the user authenticates.
 *
 * Accepts multipart FormData:
 *   - draft: JSON string matching the Draft interface (date, resolvedDate, note, keywords…)
 *   - card:  PNG image file — the generated share card from the browser Canvas
 *
 * Flow:
 *  1. Authenticate the caller via session cookie (cookie-based Supabase client)
 *  2. Insert a row into the nodes table (service role client, bypasses RLS)
 *  3. Upload the card PNG to Supabase Storage at cards/{node_id}.png
 *  4. Update the node with the storage path as card_image_url (e.g. "{node_id}.png")
 *  5. Return { nodeId, cardUrl } where cardUrl is the /api/cards/{nodeId} proxy URL
 *
 * Storage bucket: "cards" — must exist in your Supabase project.
 * The bucket is private; card images are served via /api/cards/[nodeId] which
 * authenticates the caller and streams the image from Storage.
 *
 * If the upload fails, the node is still created (cardUrl will be null in response).
 * The node can always be identified by its nodeId for future card regeneration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient, createServiceClient } from '@/lib/supabase-server'
import type { Draft } from '@/lib/draft'

const CARDS_BUCKET = 'cards'

export async function POST(request: NextRequest) {
  // 1. Authenticate via session cookie
  const supabaseUser = await createServerComponentClient()
  const {
    data: { user },
    error: authError,
  } = await supabaseUser.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse FormData
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const draftJson = form.get('draft') as string | null
  const cardFile = form.get('card') as File | null

  if (!draftJson || !cardFile) {
    return NextResponse.json({ error: 'Missing draft or card' }, { status: 400 })
  }

  let draft: Draft
  try {
    draft = JSON.parse(draftJson) as Draft
  } catch {
    return NextResponse.json({ error: 'Invalid draft JSON' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // 3. Insert node row
  const { data: node, error: insertError } = await supabase
    .from('nodes')
    .insert({
      user_id: user.id,
      event_date: draft.date,
      resolved_apod_date: draft.resolvedDate,
      note: draft.note || null,
      keywords: draft.keywords,
      apod_title: draft.apodTitle,
      apod_copyright: draft.apodCopyright ?? null,
    })
    .select('id')
    .single()

  if (insertError || !node) {
    console.error('[api/nodes] insert error:', insertError?.message)
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to create node' },
      { status: 500 }
    )
  }

  // 4. Upload card PNG to Storage
  const cardBuffer = Buffer.from(await cardFile.arrayBuffer())
  const storagePath = `${node.id}.png`

  const { error: uploadError } = await supabase.storage
    .from(CARDS_BUCKET)
    .upload(storagePath, cardBuffer, {
      contentType: 'image/png',
      upsert: false, // Immutable — never overwrite
    })

  if (uploadError) {
    console.error('[api/nodes] upload error:', uploadError.message)
    // Node was created; return partial success — card can be regenerated later
    return NextResponse.json({ nodeId: node.id, cardUrl: null })
  }

  // 5. Store the storage path on the node; serve via /api/cards/[nodeId] proxy
  await supabase.from('nodes').update({ card_image_url: storagePath }).eq('id', node.id)

  const cardUrl = `/api/cards/${node.id}`
  return NextResponse.json({ nodeId: node.id, cardUrl })
}
