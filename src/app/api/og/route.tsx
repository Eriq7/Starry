/**
 * app/api/og/route.ts
 *
 * OG image generation for gift landing pages.
 *
 * GET /api/og?date=YYYY-MM-DD&name=Alex
 *
 * Returns a 1200×630 PNG via Next.js ImageResponse.
 * Layout:
 *  - Dark space background (gradient)
 *  - Large APOD image (blurred — mimics the reveal experience)
 *  - Recipient name + "the universe had a gift for you" text
 *  - Starry branding bottom-right
 *
 * Note: ImageResponse uses React JSX with a subset of CSS (Flexbox/no grid).
 * The APOD image is embedded as a background via fetch() since external URLs
 * are allowed in ImageResponse.
 */

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? ''
  const name = searchParams.get('name') ?? 'Someone special'

  // Fetch the APOD image as a data URL to embed in the OG image
  let imageDataUrl: string | null = null
  if (date) {
    try {
      const imageUrl = new URL(`/api/apod/image/${date}`, request.url).toString()
      const res = await fetch(imageUrl)
      if (res.ok) {
        const buffer = await res.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const contentType = res.headers.get('content-type') ?? 'image/jpeg'
        imageDataUrl = `data:${contentType};base64,${base64}`
      }
    } catch {
      // Fall through to gradient-only background
    }
  }

  const formattedDate = date
    ? new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at 30% 40%, #0d0d2e 0%, #030712 60%, #000 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* APOD image blurred background */}
        {imageDataUrl && (
          <img
            src={imageDataUrl}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.35,
              filter: 'blur(12px)',
            }}
          />
        )}

        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(3,7,18,0.85) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            padding: '60px',
            textAlign: 'center',
          }}
        >
          {/* Star */}
          <div style={{ fontSize: '52px', color: '#818cf8' }}>✦</div>

          {/* Recipient name */}
          <div
            style={{
              fontSize: '56px',
              fontWeight: 300,
              color: 'white',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '26px',
              fontWeight: 300,
              color: 'rgba(224,228,255,0.75)',
              maxWidth: '700px',
              lineHeight: 1.4,
            }}
          >
            The universe had a gift for you
          </div>

          {/* Date */}
          {formattedDate && (
            <div
              style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              {formattedDate}
            </div>
          )}
        </div>

        {/* Branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            right: '48px',
            fontSize: '20px',
            color: '#818cf8',
            letterSpacing: '0.2em',
          }}
        >
          ✦ STARRY
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
