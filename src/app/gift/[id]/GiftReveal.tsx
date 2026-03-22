/**
 * app/gift/[id]/GiftReveal.tsx
 *
 * Client component for the gift reveal interaction.
 *
 * Initial state: APOD photo blurred (filter: blur(20px)) with a "tap to reveal" CTA.
 * On tap: animates to blur(0) and reveals APOD title, date, and sender's message.
 *
 * Analytics:
 *  - gift_viewed: tracked on mount
 *  - gift_converted: tracked when user clicks the CTA to /explore
 *
 * The viewed_at timestamp is updated server-side via a PATCH to /api/gifts/[id]/view
 * on first view.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

interface GiftRevealProps {
  giftId: string
  recipientName: string
  eventDate: string
  resolvedApodDate: string
  apodTitle: string
  apodCopyright?: string | null
  message?: string | null
  isFirstView: boolean
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default function GiftReveal({
  giftId,
  recipientName,
  eventDate,
  resolvedApodDate,
  apodTitle,
  apodCopyright,
  message,
  isFirstView,
}: GiftRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    // Track view
    trackEvent('gift_viewed', { giftId })

    // Update viewed_at on first view (fire-and-forget)
    if (isFirstView) {
      fetch(`/api/gifts/${giftId}/view`, { method: 'PATCH' }).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const imageUrl = `/api/apod/image/${resolvedApodDate}`

  return (
    <div className="relative w-full" style={{ minHeight: '100dvh', background: '#030712' }}>
      {/* Background: APOD photo */}
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={apodTitle}
          className="w-full h-full object-cover"
          style={{
            filter: revealed ? 'blur(0px)' : 'blur(20px)',
            transform: revealed ? 'scale(1)' : 'scale(1.05)',
            transition: 'filter 1.2s ease, transform 1.4s ease',
            opacity: imageLoaded ? 1 : 0,
          }}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: revealed
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0.92) 100%)'
            : 'rgba(0,0,0,0.6)',
          transition: 'background 1s ease',
        }}
      />

      {/* Gradient placeholder while image loads */}
      {!imageLoaded && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 40%, #0d0d2e 0%, #030712 70%, #000 100%)',
          }}
        />
      )}

      {/* Content */}
      <div
        className="relative z-10 flex flex-col min-h-screen"
        style={{ minHeight: '100dvh' }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-8 pb-4">
          <span className="font-cinzel text-lg tracking-widest" style={{ color: '#818cf8' }}>
            ✦ STARRY
          </span>
        </header>

        {/* Main — vertically centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          {!revealed ? (
            /* Pre-reveal state */
            <div
              className="flex flex-col items-center gap-6"
              style={{
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.6s ease',
              }}
            >
              <div>
                <p className="text-sm uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  A gift for
                </p>
                <h1 className="font-cinzel text-3xl sm:text-4xl text-white mb-2">{recipientName}</h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {formatDate(eventDate)}
                </p>
              </div>

              {message && (
                <p
                  className="text-base italic max-w-xs leading-relaxed"
                  style={{ color: 'rgba(224,228,255,0.7)' }}
                >
                  "{message}"
                </p>
              )}

              <button
                onClick={() => setRevealed(true)}
                className="mt-2 px-8 py-4 rounded-full text-sm font-medium tracking-wide transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white',
                  boxShadow: '0 0 32px rgba(99,102,241,0.4)',
                }}
              >
                Reveal your universe ✦
              </button>
            </div>
          ) : (
            /* Post-reveal state */
            <div
              className="flex flex-col items-center gap-4"
              style={{
                opacity: revealed ? 1 : 0,
                transition: 'opacity 0.8s ease 0.6s',
              }}
            >
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {formatDate(eventDate)}
              </p>
              <h2
                className="text-2xl font-light text-white max-w-sm leading-snug"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
              >
                {apodTitle}
              </h2>
              {apodCopyright && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Photo: {apodCopyright}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer CTA — always visible after reveal */}
        {revealed && (
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 pb-10">
            <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
              What did the universe look like on your important days?
            </p>
            <Link
              href="/explore"
              onClick={() => trackEvent('gift_converted', { giftId })}
              className="px-7 py-3.5 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{
                background: 'rgba(129,140,248,0.15)',
                border: '1px solid rgba(129,140,248,0.4)',
                color: '#c7d2fe',
              }}
            >
              Create your own timeline →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
