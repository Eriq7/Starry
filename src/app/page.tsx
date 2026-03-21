/**
 * app/page.tsx
 *
 * Homepage — "Today's Universe" (server-side rendered).
 *
 * Displays today's APOD as a full-screen background with a minimal overlay.
 * Primary CTA drives users to /explore to input their own important dates.
 *
 * SSR means the photo is visible in link previews and search results.
 * If NASA's API is unavailable, we degrade gracefully with a fallback background.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { resolveApod } from '@/lib/apod'

export const metadata: Metadata = {
  title: 'Starry — Your Universe, Your Moments',
}

// Revalidate every 12 hours — APOD only updates daily
export const revalidate = 43200

async function getTodayApod() {
  try {
    const today = new Date().toISOString().split('T')[0]
    return await resolveApod(today)
  } catch {
    return null
  }
}

export default async function HomePage() {
  const apod = await getTodayApod()
  const today = new Date().toISOString().split('T')[0]

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background: today's APOD or deep space fallback */}
      {apod ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/apod/image/${apod.resolvedDate}`}
            alt={apod.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/80" />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, #0d0d2e 0%, #030712 60%, #000 100%)',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-8 pb-4">
          <span
            className="text-xl font-light tracking-widest"
            style={{ color: '#818cf8' }}
          >
            ✦ STARRY
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              My Stars
            </Link>
            <Link
              href="/profile"
              className="text-white/50 hover:text-white/80 transition-colors"
              aria-label="Settings"
            >
              ⚙️
            </Link>
          </div>
        </header>

        {/* Main content — vertically centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50 mb-4">
            {formattedDate}
          </p>

          {apod ? (
            <>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4 max-w-2xl leading-tight">
                {apod.title}
              </h1>
              {apod.copyright && (
                <p className="text-xs text-white/40 mb-8">Photo by {apod.copyright}</p>
              )}
            </>
          ) : (
            <h1 className="text-3xl sm:text-4xl font-light text-white mb-8 max-w-xl leading-tight">
              The universe is infinite.
              <br />
              Your moments are not.
            </h1>
          )}

          <p className="text-base sm:text-lg text-white/70 max-w-sm mb-10 leading-relaxed">
            What did the universe look like on your most important day?
          </p>

          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-medium tracking-wide transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white',
              boxShadow: '0 0 32px rgba(99,102,241,0.35)',
            }}
          >
            Explore my universe
          </Link>
        </div>

        {/* Footer */}
        <footer className="relative z-10 flex items-center justify-between px-6 pb-8 pt-4">
          <span className="text-xs text-white/30">
            NASA Astronomy Picture of the Day
          </span>
          {apod && (
            <Link
              href={`/explore?date=${today}`}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Save today →
            </Link>
          )}
        </footer>
      </div>
    </main>
  )
}
