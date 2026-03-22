/**
 * app/gift/[id]/not-found.tsx
 *
 * Custom 404 for gift pages — shown when a gift ID doesn't exist in the DB.
 * Triggered by calling notFound() in gift/[id]/page.tsx when the DB returns null.
 */

import Link from 'next/link'

export default function GiftNotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#030712' }}
    >
      <p className="text-5xl mb-6">🎁</p>
      <h1 className="text-2xl font-light text-white mb-2">Gift not found</h1>
      <p className="text-sm mb-8 max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
        This gift link may have expired or the URL is incorrect. Ask the sender to resend it.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/explore"
          className="px-6 py-3.5 rounded-full text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
          }}
        >
          Explore your universe
        </Link>
        <Link
          href="/"
          className="px-5 py-3 rounded-full text-sm transition-all"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Home
        </Link>
      </div>
    </div>
  )
}
