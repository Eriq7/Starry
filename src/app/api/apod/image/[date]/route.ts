/**
 * api/apod/image/[date]/route.ts
 *
 * APOD image proxy + cache route.
 *
 * Flow:
 *  1. Check Supabase Storage for apod/{date}.jpg
 *  2. If cached: stream it back directly (never redirect — keeps images same-origin for Canvas)
 *  3. If not cached:
 *     a. Resolve APOD metadata to get raw NASA image URL
 *     b. Fetch NASA image
 *     c. Resize to 1080×1080 cover crop with sharp
 *     d. Upload to Supabase Storage as apod/{date}.jpg (immutable — never overwrite)
 *     e. Stream resized image back
 *
 * Immutability: once apod/{date}.jpg is in Storage, it is never overwritten.
 * Always stream through this route (not redirect) so Canvas sees same-origin URLs.
 */

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createServiceClient } from '@/lib/supabase-server'
import { resolveApod, APOD_START_DATE } from '@/lib/apod'

const STORAGE_BUCKET = 'apod'
const IMAGE_SIZE = 1080

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new NextResponse('Invalid date format', { status: 400 })
  }

  if (date < APOD_START_DATE) {
    return new NextResponse('Date before APOD start', { status: 400 })
  }

  const supabase = createServiceClient()
  const storagePath = `${date}.jpg`

  // 1. Check Storage cache
  const { data: existing } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(storagePath)

  if (existing) {
    const buffer = new Uint8Array(await existing.arrayBuffer())
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  // 2. Resolve metadata to get the NASA image URL
  let imageUrl: string
  try {
    const apod = await resolveApod(date)
    imageUrl = apod.imageUrl
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Resolve failed'
    console.error(`[api/apod/image/${date}] resolve error:`, message)
    return new NextResponse(message, { status: 500 })
  }

  // 3. Fetch NASA image
  let nasaBuffer: Buffer
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`NASA image fetch failed: ${res.status}`)
    nasaBuffer = Buffer.from(await res.arrayBuffer())
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fetch failed'
    console.error(`[api/apod/image/${date}] fetch error:`, message)
    return new NextResponse(message, { status: 502 })
  }

  // 4. Resize to 1080×1080 cover crop
  let resized: Buffer
  try {
    resized = await sharp(nasaBuffer)
      .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 88, progressive: true })
      .toBuffer()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Resize failed'
    console.error(`[api/apod/image/${date}] sharp error:`, message)
    return new NextResponse(message, { status: 500 })
  }

  // 5. Upload to Storage (immutable — only if not already present, use upsert = false)
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, resized, {
      contentType: 'image/jpeg',
      upsert: false, // never overwrite
    })

  if (uploadError && !uploadError.message.includes('already exists')) {
    // Log but don't fail — we still have the resized buffer to return
    console.warn(`[api/apod/image/${date}] Storage upload warning:`, uploadError.message)
  }

  // 6. Stream resized image back
  return new NextResponse(new Uint8Array(resized), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
