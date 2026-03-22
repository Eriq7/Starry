/**
 * components/TimelineCard.tsx
 *
 * Full-viewport card for one saved node in the timeline.
 * Occupies exactly 100dvh so CSS scroll-snap gives the "one card per screen" effect.
 *
 * Layout:
 *  - APOD photo as full-bleed background via /api/apod/image/[resolvedDate]
 *  - Dark gradient overlay (bottom-heavy) for text legibility
 *  - Fixed top-left: date + note
 *  - Fixed bottom: keywords, APOD title, copyright
 *  - Bottom-right: Share button (opens ShareModal in parent via onShare callback)
 *
 * Images are lazy-loaded: only loaded when the card is within ±1 viewport
 * of the active card (controlled by IntersectionObserver in TimelineView).
 */

'use client'

import { useRef, useState } from 'react'

export interface TimelineNode {
  id: string
  event_date: string
  resolved_apod_date: string
  note: string | null
  keywords: string[] | null
  apod_title: string | null
  apod_copyright: string | null
  card_image_url: string | null
}

interface TimelineCardProps {
  node: TimelineNode
  /** Whether to actually load the image (controlled by parent for lazy loading) */
  shouldLoad: boolean
  onShare: (node: TimelineNode) => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default function TimelineCard({ node, shouldLoad, onShare }: TimelineCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const imageUrl = `/api/apod/image/${node.resolved_apod_date}`

  return (
    <div
      className="relative w-full snap-start flex-shrink-0 overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Background: APOD photo */}
      {shouldLoad && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={imageUrl}
          alt={node.apod_title ?? 'Astronomy photo'}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.6s ease' }}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
      )}

      {/* Placeholder gradient while image loads */}
      {(!shouldLoad || !imageLoaded) && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 40%, #0d0d2e 0%, #030712 70%, #000 100%)',
          }}
        />
      )}

      {/* Dark gradient overlay — heaviest at bottom for text */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0.92) 100%)',
        }}
      />

      {/* Top overlay — date + note */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-8">
        <p
          className="text-xs uppercase tracking-[0.2em] mb-2"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          {formatDate(node.event_date)}
        </p>
        {node.note && (
          <p
            className="text-xl font-light leading-snug max-w-xs"
            style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
          >
            {node.note}
          </p>
        )}
      </div>

      {/* Bottom overlay — keywords + APOD info + share button */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-safe">
        {/* Keywords */}
        {node.keywords && node.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {node.keywords.map((kw) => (
              <span
                key={kw}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(129,140,248,0.25)',
                  border: '1px solid rgba(129,140,248,0.4)',
                  color: '#c7d2fe',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* APOD title */}
            {node.apod_title && (
              <p
                className="text-sm leading-snug mb-1 line-clamp-2"
                style={{ color: 'rgba(224,228,255,0.85)' }}
              >
                {node.apod_title}
              </p>
            )}
            {/* Copyright */}
            {node.apod_copyright && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Photo: {node.apod_copyright}
              </p>
            )}
          </div>

          {/* Share button */}
          <button
            onClick={() => onShare(node)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium transition-all duration-150 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(79,70,229,0.7), rgba(124,58,237,0.7))',
              border: '1px solid rgba(129,140,248,0.5)',
              color: 'white',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span>✦</span>
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  )
}
