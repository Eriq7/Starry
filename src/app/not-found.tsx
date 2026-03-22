/**
 * app/not-found.tsx
 *
 * Custom 404 page for Starry.
 * Shown when Next.js can't match a route.
 */

import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#030712' }}
    >
      <p className="text-6xl mb-6" style={{ color: 'rgba(129,140,248,0.3)' }}>✦</p>
      <h1 className="font-cinzel text-2xl text-white mb-2">Lost in space</h1>
      <p className="text-sm mb-8 max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
        This corner of the universe doesn't exist. Let's navigate back to known coordinates.
      </p>
      <Link
        href="/"
        className="px-7 py-3.5 rounded-full text-sm font-medium transition-all hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: 'white',
          boxShadow: '0 0 28px rgba(99,102,241,0.25)',
        }}
      >
        Return to Starry
      </Link>
    </div>
  )
}
