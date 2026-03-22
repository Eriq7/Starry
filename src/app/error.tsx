/**
 * app/error.tsx
 *
 * App-level error boundary (Next.js App Router).
 * Catches unhandled errors in server and client components below the root layout.
 *
 * Shows a minimal space-themed error UI with a retry button.
 * Must be a Client Component ('use client') per Next.js requirements.
 */

'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[error boundary]', error)
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#030712' }}
    >
      <p className="text-5xl mb-6 animate-star-pulse">✦</p>
      <h1 className="font-cinzel text-2xl text-white mb-3">Something went wrong</h1>
      <p className="text-sm mb-8 max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
        The cosmos is unpredictable. Try again — it usually works the second time.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-full text-sm transition-all hover:scale-105"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
