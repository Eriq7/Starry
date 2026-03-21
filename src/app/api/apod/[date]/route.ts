/**
 * api/apod/[date]/route.ts
 *
 * APOD metadata endpoint.
 * Returns title, explanation, copyright, and resolvedDate for a given date.
 * Handles video fallback transparently — caller always gets an image date back.
 *
 * Response shape:
 *   { date, resolvedDate, title, explanation, copyright? }
 *
 * Error codes:
 *   400 — invalid date format or before APOD start date
 *   404 — could not find a non-video APOD near the requested date
 *   500 — internal / NASA API failure
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveApod, APOD_START_DATE } from '@/lib/apod'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 })
  }

  if (date < APOD_START_DATE) {
    return NextResponse.json(
      { error: `Date must be on or after ${APOD_START_DATE} (APOD start date).` },
      { status: 400 }
    )
  }

  // Don't allow future dates
  const today = new Date().toISOString().split('T')[0]
  if (date > today) {
    return NextResponse.json({ error: 'Date cannot be in the future.' }, { status: 400 })
  }

  try {
    const apod = await resolveApod(date)

    return NextResponse.json(
      {
        date: apod.date,
        resolvedDate: apod.resolvedDate,
        title: apod.title,
        explanation: apod.explanation,
        copyright: apod.copyright ?? null,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[api/apod/${date}]`, message)
    if (message === 'rate_limited') {
      return NextResponse.json(
        { error: 'NASA is busy — please wait a moment and try again.' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
