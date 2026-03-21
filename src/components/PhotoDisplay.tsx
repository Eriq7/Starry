/**
 * components/PhotoDisplay.tsx
 *
 * Full-screen (or full-width) display of an APOD photo.
 * Images are always loaded from /api/apod/image/[date] (same-origin proxy).
 *
 * Shows a loading skeleton while the image fetches.
 * Emits `photo_loaded` analytics event once the image is visible.
 */

'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface PhotoDisplayProps {
  resolvedDate: string
  title: string
  copyright?: string
  date: string
}

export default function PhotoDisplay({
  resolvedDate,
  title,
  copyright,
  date,
}: PhotoDisplayProps) {
  const [loaded, setLoaded] = useState(false)

  const formattedDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  function handleLoad() {
    setLoaded(true)
    trackEvent('photo_loaded', { date, resolvedDate })
  }

  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto rounded-2xl overflow-hidden">
      {/* Loading skeleton */}
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ background: 'linear-gradient(135deg, #0d0d2e, #1a1a3e)' }}
        />
      )}

      {/* APOD Photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/apod/image/${resolvedDate}`}
        alt={title}
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        crossOrigin="anonymous"
      />

      {/* Bottom overlay */}
      {loaded && (
        <div
          className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
          }}
        >
          <p className="text-xs text-white/50 mb-1">{formattedDate}</p>
          <p className="text-sm text-white font-medium leading-snug">{title}</p>
          {copyright && (
            <p className="text-xs text-white/40 mt-1">© {copyright}</p>
          )}
        </div>
      )}
    </div>
  )
}
