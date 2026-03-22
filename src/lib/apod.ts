/**
 * lib/apod.ts
 *
 * Core APOD (Astronomy Picture of the Day) resolution logic.
 * Used by both /api/apod/[date] and the homepage server component.
 *
 * Responsibilities:
 *  - Fetch APOD metadata from NASA's API (with DB caching)
 *  - Handle video fallback: walk ±1 day (prefer earlier) to find an image
 *  - Never overwrite an existing cache entry (immutability rule)
 *
 * APOD start date: 1995-06-16. Dates before this should be blocked at the UI layer.
 */

import { createServiceClient } from './supabase-server'
import { APOD_START_DATE } from './constants'

export { APOD_START_DATE }

/**
 * Returns today's date in YYYY-MM-DD format using US Eastern time.
 * NASA APOD updates at midnight ET, so using UTC can return "tomorrow"
 * between ~8pm–midnight ET, causing a future-date error from NASA.
 */
export function getEasternToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

const APOD_API_BASE = 'https://api.nasa.gov/planetary/apod'
const MAX_FALLBACK_ATTEMPTS = 7

export interface ApodMetadata {
  date: string           // original requested date
  resolvedDate: string   // actual date used (may differ for video fallback)
  title: string
  explanation: string
  imageUrl: string       // raw NASA image URL (not proxied — use /api/apod/image/ in UI)
  copyright?: string
}

interface NasaApodResponse {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  media_type: 'image' | 'video'
  copyright?: string
  thumbnail_url?: string
}

/** Add days to a YYYY-MM-DD date string. Returns YYYY-MM-DD. */
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

/** Fetch raw APOD data from NASA for a single date. No caching.
 *  Retries once on 429 (rate limit) after a 1-second delay.
 */
async function fetchNasaApod(date: string): Promise<NasaApodResponse> {
  const apiKey = process.env.NASA_API_KEY ?? 'DEMO_KEY'
  const url = `${APOD_API_BASE}?api_key=${apiKey}&date=${date}`

  let res = await fetch(url, {
    next: { revalidate: 3600 }, // ISR-style revalidation every hour
  })

  if (res.status === 429) {
    // Wait 1 second then retry once
    await new Promise((r) => setTimeout(r, 1000))
    res = await fetch(url, { next: { revalidate: 3600 } })
  }

  if (res.status === 429) {
    throw new Error('rate_limited')
  }

  if (!res.ok) {
    throw new Error(`NASA API error ${res.status} for date ${date}`)
  }

  return res.json() as Promise<NasaApodResponse>
}

/**
 * Resolve APOD metadata for a given date.
 *
 * Steps:
 *  1. Check Supabase apod_cache
 *  2. If not cached, fetch from NASA
 *  3. If media_type === 'video', walk backward (prefer earlier dates) until image found
 *  4. Cache the result
 *  5. Return resolved metadata including resolvedDate
 */
export async function resolveApod(date: string): Promise<ApodMetadata> {
  const supabase = createServiceClient()

  // 1. Check cache for the original requested date
  const { data: cached } = await supabase
    .from('apod_cache')
    .select('raw_data')
    .eq('date', date)
    .single()

  if (cached?.raw_data) {
    const raw = cached.raw_data as NasaApodResponse & { resolved_date?: string }
    const resolvedDate = raw.resolved_date ?? raw.date
    return buildMetadata(date, resolvedDate, raw)
  }

  // 2. Fetch from NASA
  const original = await fetchNasaApod(date)

  // 3. Handle video fallback
  let resolved = original
  let resolvedDate = date

  if (original.media_type === 'video') {
    // Walk backward first, then forward — prefer earlier dates
    // For each candidate, check DB cache first to avoid burning NASA quota
    const offsets = [-1, -2, -3, -4, 1, 2, 3]
    for (const offset of offsets.slice(0, MAX_FALLBACK_ATTEMPTS)) {
      const candidate = shiftDate(date, offset)
      if (candidate < APOD_START_DATE) continue
      try {
        // Check DB cache before hitting NASA
        const { data: cachedFallback } = await supabase
          .from('apod_cache')
          .select('raw_data')
          .eq('date', candidate)
          .single()

        if (cachedFallback?.raw_data) {
          const raw = cachedFallback.raw_data as NasaApodResponse
          if (raw.media_type === 'image') {
            resolved = raw
            resolvedDate = candidate
            break
          }
          continue
        }

        const fallback = await fetchNasaApod(candidate)
        if (fallback.media_type === 'image') {
          resolved = fallback
          resolvedDate = candidate
          break
        }
      } catch {
        continue
      }
    }

    if (resolved.media_type === 'video') {
      throw new Error(`No image APOD found near ${date} after ${MAX_FALLBACK_ATTEMPTS} attempts`)
    }
  }

  // 4. Cache the original date entry (with resolved_date annotation)
  const cachePayload = { ...resolved, resolved_date: resolvedDate }
  await supabase.from('apod_cache').upsert({
    date,
    raw_data: cachePayload,
  })

  // Also cache the resolved date entry if it differs
  if (resolvedDate !== date) {
    await supabase.from('apod_cache').upsert({
      date: resolvedDate,
      raw_data: resolved,
    })
  }

  return buildMetadata(date, resolvedDate, resolved)
}

function buildMetadata(
  date: string,
  resolvedDate: string,
  raw: NasaApodResponse
): ApodMetadata {
  return {
    date,
    resolvedDate,
    title: raw.title,
    explanation: raw.explanation,
    imageUrl: raw.hdurl ?? raw.url,
    copyright: raw.copyright?.trim(),
  }
}
